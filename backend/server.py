from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime, timezone
import os
from pymongo import MongoClient
from bson import ObjectId
import jdatetime

app = FastAPI(title="Personal Finance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "personal_finance")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
accounts_col = db["accounts"]
transactions_col = db["transactions"]
checks_col = db["checks"]

# Helper functions
def to_jalali(dt: datetime) -> str:
    jd = jdatetime.datetime.fromgregorian(datetime=dt)
    return jd.strftime("%Y/%m/%d")

def from_jalali(jalali_str: str) -> datetime:
    parts = jalali_str.split("/")
    jd = jdatetime.datetime(int(parts[0]), int(parts[1]), int(parts[2]))
    return jd.togregorian()

def serialize_doc(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

# Pydantic Models
class AccountCreate(BaseModel):
    bank_name: str
    account_name: str
    account_number: Optional[str] = None
    sheba: Optional[str] = None
    initial_balance: int = 0
    color: str = "#0F766E"

class AccountUpdate(BaseModel):
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    sheba: Optional[str] = None
    color: Optional[str] = None

class TransactionCreate(BaseModel):
    account_id: str
    type: Literal["income", "expense"]
    amount: int
    category: str
    description: Optional[str] = None
    date_jalali: str

class TransactionUpdate(BaseModel):
    account_id: Optional[str] = None
    type: Optional[Literal["income", "expense"]] = None
    amount: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date_jalali: Optional[str] = None

class CheckCreate(BaseModel):
    account_id: str
    amount: int
    due_date_jalali: str
    type: Literal["received", "paid"]
    status: Literal["pending", "passed", "bounced"] = "pending"
    description: Optional[str] = None

class CheckUpdate(BaseModel):
    account_id: Optional[str] = None
    amount: Optional[int] = None
    due_date_jalali: Optional[str] = None
    type: Optional[Literal["received", "paid"]] = None
    status: Optional[Literal["pending", "passed", "bounced"]] = None
    description: Optional[str] = None

# Categories
DEFAULT_CATEGORIES = [
    "خوراک", "حمل‌ونقل", "اجاره", "قبوض", "پوشاک", "سلامت",
    "تفریح", "آموزش", "حقوق", "فروش", "هدیه", "سایر"
]

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Account Endpoints
@app.get("/api/accounts")
def get_accounts():
    accounts = list(accounts_col.find())
    result = []
    for acc in accounts:
        acc_data = serialize_doc(acc)
        # Calculate balance from transactions
        balance = acc.get("initial_balance", 0)
        txns = list(transactions_col.find({"account_id": acc_data["id"]}))
        for txn in txns:
            if txn["type"] == "income":
                balance += txn["amount"]
            else:
                balance -= txn["amount"]
        acc_data["balance"] = balance
        result.append(acc_data)
    return result

@app.post("/api/accounts")
def create_account(account: AccountCreate):
    doc = account.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["created_at_jalali"] = to_jalali(doc["created_at"])
    result = accounts_col.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc["balance"] = doc["initial_balance"]
    del doc["_id"]
    return doc

@app.get("/api/accounts/{account_id}")
def get_account(account_id: str):
    acc = accounts_col.find_one({"_id": ObjectId(account_id)})
    if not acc:
        raise HTTPException(status_code=404, detail="حساب یافت نشد")
    return serialize_doc(acc)

@app.put("/api/accounts/{account_id}")
def update_account(account_id: str, account: AccountUpdate):
    update_data = {k: v for k, v in account.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="داده‌ای برای بروزرسانی ارسال نشده")
    result = accounts_col.update_one({"_id": ObjectId(account_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="حساب یافت نشد")
    return {"message": "حساب با موفقیت بروزرسانی شد"}

@app.delete("/api/accounts/{account_id}")
def delete_account(account_id: str):
    # Delete related transactions and checks
    transactions_col.delete_many({"account_id": account_id})
    checks_col.delete_many({"account_id": account_id})
    result = accounts_col.delete_one({"_id": ObjectId(account_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="حساب یافت نشد")
    return {"message": "حساب با موفقیت حذف شد"}

# Transaction Endpoints
@app.get("/api/transactions")
def get_transactions(
    account_id: Optional[str] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {}
    if account_id:
        query["account_id"] = account_id
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    
    transactions = list(transactions_col.find(query).sort("date", -1))
    result = []
    for txn in transactions:
        txn_data = serialize_doc(txn)
        # Get account info
        acc = accounts_col.find_one({"_id": ObjectId(txn_data["account_id"])})
        if acc:
            txn_data["account_name"] = acc.get("account_name", "نامشخص")
            txn_data["bank_name"] = acc.get("bank_name", "نامشخص")
        result.append(txn_data)
    return result

@app.post("/api/transactions")
def create_transaction(transaction: TransactionCreate):
    # Verify account exists
    acc = accounts_col.find_one({"_id": ObjectId(transaction.account_id)})
    if not acc:
        raise HTTPException(status_code=404, detail="حساب یافت نشد")
    
    doc = transaction.model_dump()
    doc["date"] = from_jalali(transaction.date_jalali)
    doc["created_at"] = datetime.now(timezone.utc)
    result = transactions_col.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    doc["date"] = doc["date"].isoformat()
    doc["created_at"] = doc["created_at"].isoformat()
    return doc

@app.put("/api/transactions/{transaction_id}")
def update_transaction(transaction_id: str, transaction: TransactionUpdate):
    update_data = {k: v for k, v in transaction.model_dump().items() if v is not None}
    if "date_jalali" in update_data:
        update_data["date"] = from_jalali(update_data["date_jalali"])
    if not update_data:
        raise HTTPException(status_code=400, detail="داده‌ای برای بروزرسانی ارسال نشده")
    result = transactions_col.update_one({"_id": ObjectId(transaction_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="تراکنش یافت نشد")
    return {"message": "تراکنش با موفقیت بروزرسانی شد"}

@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: str):
    result = transactions_col.delete_one({"_id": ObjectId(transaction_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="تراکنش یافت نشد")
    return {"message": "تراکنش با موفقیت حذف شد"}

# Check Endpoints
@app.get("/api/checks")
def get_checks(
    account_id: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None
):
    query = {}
    if account_id:
        query["account_id"] = account_id
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    
    checks = list(checks_col.find(query).sort("due_date", 1))
    result = []
    for check in checks:
        check_data = serialize_doc(check)
        # Get account info
        acc = accounts_col.find_one({"_id": ObjectId(check_data["account_id"])})
        if acc:
            check_data["account_name"] = acc.get("account_name", "نامشخص")
            check_data["bank_name"] = acc.get("bank_name", "نامشخص")
        result.append(check_data)
    return result

@app.post("/api/checks")
def create_check(check: CheckCreate):
    # Verify account exists
    acc = accounts_col.find_one({"_id": ObjectId(check.account_id)})
    if not acc:
        raise HTTPException(status_code=404, detail="حساب یافت نشد")
    
    doc = check.model_dump()
    doc["due_date"] = from_jalali(check.due_date_jalali)
    doc["created_at"] = datetime.now(timezone.utc)
    result = checks_col.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    doc["due_date"] = doc["due_date"].isoformat()
    doc["created_at"] = doc["created_at"].isoformat()
    return doc

@app.put("/api/checks/{check_id}")
def update_check(check_id: str, check: CheckUpdate):
    update_data = {k: v for k, v in check.model_dump().items() if v is not None}
    if "due_date_jalali" in update_data:
        update_data["due_date"] = from_jalali(update_data["due_date_jalali"])
    if not update_data:
        raise HTTPException(status_code=400, detail="داده‌ای برای بروزرسانی ارسال نشده")
    result = checks_col.update_one({"_id": ObjectId(check_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="چک یافت نشد")
    return {"message": "چک با موفقیت بروزرسانی شد"}

@app.delete("/api/checks/{check_id}")
def delete_check(check_id: str):
    result = checks_col.delete_one({"_id": ObjectId(check_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="چک یافت نشد")
    return {"message": "چک با موفقیت حذف شد"}

# Categories Endpoint
@app.get("/api/categories")
def get_categories():
    return DEFAULT_CATEGORIES

# Dashboard/Stats Endpoints
@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    # Get current Jalali month
    now = datetime.now(timezone.utc)
    jnow = jdatetime.datetime.fromgregorian(datetime=now)
    current_month_start = jdatetime.datetime(jnow.year, jnow.month, 1)
    current_month_start_gregorian = current_month_start.togregorian()
    
    # Total balance
    accounts = list(accounts_col.find())
    total_balance = 0
    for acc in accounts:
        balance = acc.get("initial_balance", 0)
        txns = list(transactions_col.find({"account_id": str(acc["_id"])}))
        for txn in txns:
            if txn["type"] == "income":
                balance += txn["amount"]
            else:
                balance -= txn["amount"]
        total_balance += balance
    
    # Monthly income/expense
    monthly_income = 0
    monthly_expense = 0
    all_txns = list(transactions_col.find({"date": {"$gte": current_month_start_gregorian}}))
    for txn in all_txns:
        if txn["type"] == "income":
            monthly_income += txn["amount"]
        else:
            monthly_expense += txn["amount"]
    
    # Pending checks count
    pending_checks = checks_col.count_documents({"status": "pending"})
    
    return {
        "total_balance": total_balance,
        "monthly_income": monthly_income,
        "monthly_expense": monthly_expense,
        "pending_checks": pending_checks,
        "accounts_count": len(accounts),
        "current_month_jalali": jnow.strftime("%B %Y")
    }

@app.get("/api/dashboard/chart-data")
def get_chart_data():
    now = datetime.now(timezone.utc)
    jnow = jdatetime.datetime.fromgregorian(datetime=now)
    
    # Last 6 months data
    months_data = []
    for i in range(5, -1, -1):
        month = jnow.month - i
        year = jnow.year
        if month <= 0:
            month += 12
            year -= 1
        
        month_start = jdatetime.datetime(year, month, 1)
        if month == 12:
            month_end = jdatetime.datetime(year + 1, 1, 1)
        else:
            month_end = jdatetime.datetime(year, month + 1, 1)
        
        start_gregorian = month_start.togregorian()
        end_gregorian = month_end.togregorian()
        
        txns = list(transactions_col.find({
            "date": {"$gte": start_gregorian, "$lt": end_gregorian}
        }))
        
        income = sum(t["amount"] for t in txns if t["type"] == "income")
        expense = sum(t["amount"] for t in txns if t["type"] == "expense")
        
        months_data.append({
            "month": month_start.strftime("%B"),
            "income": income,
            "expense": expense
        })
    
    # Category distribution
    all_expense_txns = list(transactions_col.find({"type": "expense"}))
    category_totals = {}
    for txn in all_expense_txns:
        cat = txn.get("category", "سایر")
        category_totals[cat] = category_totals.get(cat, 0) + txn["amount"]
    
    categories = [{"name": k, "value": v} for k, v in category_totals.items()]
    categories.sort(key=lambda x: x["value"], reverse=True)
    
    return {
        "monthly_trend": months_data,
        "category_distribution": categories[:8]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
