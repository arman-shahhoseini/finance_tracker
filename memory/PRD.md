# سیستم حساب‌رسی شخصی - Personal Finance Management System

## مستندات پروژه (PRD)
**تاریخ ایجاد:** ۱۴۰۳/۱۱/۱۰

---

## مشخصات اصلی پروژه

### هدف
ساخت یک اپلیکیشن حساب‌رسی شخصی برای کاربران ایرانی با پشتیبانی کامل از:
- زبان فارسی (RTL)
- تقویم شمسی
- واحد پول ریال/تومان

### کاربران هدف
- کاربران ایرانی برای مدیریت مالی شخصی
- استفاده روزمره بدون نیاز به احراز هویت

---

## تکنولوژی‌ها

| لایه | تکنولوژی |
|------|----------|
| Frontend | React.js + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | MongoDB |
| Charts | Chart.js / react-chartjs-2 |
| Calendar | jdatetime (Jalali) |
| Icons | Lucide React |

---

## قابلیت‌های پیاده‌سازی شده ✅

### ۱. داشبورد
- [x] نمایش موجودی کل
- [x] درآمد ماه جاری
- [x] هزینه ماه جاری
- [x] تعداد چک‌های در انتظار
- [x] نمودار روند ماهانه (۶ ماه اخیر)
- [x] نمودار توزیع هزینه‌ها بر اساس دسته‌بندی
- [x] نمایش لیست حساب‌های بانکی

### ۲. مدیریت حساب‌های بانکی
- [x] افزودن حساب (نام بانک، نام حساب، شماره حساب، شبا)
- [x] ویرایش حساب
- [x] حذف حساب
- [x] انتخاب رنگ برای هر حساب
- [x] محاسبه خودکار موجودی
- [x] نمایش مجموع دارایی‌ها

### ۳. مدیریت تراکنش‌ها
- [x] ثبت درآمد/هزینه
- [x] انتخاب حساب
- [x] دسته‌بندی (خوراک، حمل‌ونقل، اجاره، قبوض، ...)
- [x] تاریخ شمسی
- [x] توضیحات
- [x] ویرایش و حذف تراکنش
- [x] فیلتر بر اساس حساب، نوع، دسته‌بندی

### ۴. مدیریت چک‌های بانکی
- [x] ثبت چک دریافتی/پرداختی
- [x] تاریخ سررسید شمسی
- [x] وضعیت: در انتظار، پاس شده، برگشتی
- [x] تغییر سریع وضعیت
- [x] هشدار چک‌های در انتظار
- [x] فیلتر بر اساس نوع و وضعیت

### ۵. گزارش‌گیری
- [x] نمودار خطی روند ۶ ماهه
- [x] نمودار دایره‌ای توزیع هزینه‌ها
- [x] نمودار مقایسه درآمد و هزینه
- [x] نمایش بیشترین هزینه‌ها با درصد
- [x] کارت‌های خلاصه آماری

### ۶. بومی‌سازی
- [x] RTL کامل
- [x] فونت Vazirmatn
- [x] تاریخ شمسی
- [x] نمایش ریال/تومان
- [x] فرمت عددی فارسی

---

## API Endpoints

| Method | Endpoint | توضیح |
|--------|----------|-------|
| GET | /api/health | بررسی سلامت سرور |
| GET | /api/accounts | دریافت همه حساب‌ها |
| POST | /api/accounts | ایجاد حساب جدید |
| PUT | /api/accounts/{id} | ویرایش حساب |
| DELETE | /api/accounts/{id} | حذف حساب |
| GET | /api/transactions | دریافت تراکنش‌ها |
| POST | /api/transactions | ثبت تراکنش |
| PUT | /api/transactions/{id} | ویرایش تراکنش |
| DELETE | /api/transactions/{id} | حذف تراکنش |
| GET | /api/checks | دریافت چک‌ها |
| POST | /api/checks | ثبت چک |
| PUT | /api/checks/{id} | ویرایش چک |
| DELETE | /api/checks/{id} | حذف چک |
| GET | /api/categories | دسته‌بندی‌های پیش‌فرض |
| GET | /api/dashboard/stats | آمار داشبورد |
| GET | /api/dashboard/chart-data | داده نمودارها |

---

## ساختار دیتابیس

### Accounts Collection
```json
{
  "bank_name": "string",
  "account_name": "string",
  "account_number": "string (optional)",
  "sheba": "string (optional)",
  "initial_balance": "number",
  "color": "string",
  "created_at": "datetime",
  "created_at_jalali": "string"
}
```

### Transactions Collection
```json
{
  "account_id": "string",
  "type": "income | expense",
  "amount": "number",
  "category": "string",
  "description": "string",
  "date_jalali": "string",
  "date": "datetime",
  "created_at": "datetime"
}
```

### Checks Collection
```json
{
  "account_id": "string",
  "amount": "number",
  "due_date_jalali": "string",
  "due_date": "datetime",
  "type": "received | paid",
  "status": "pending | passed | bounced",
  "description": "string",
  "created_at": "datetime"
}
```

---

## Backlog (قابلیت‌های آینده)

### P0 - اولویت بالا
- [ ] خروجی Excel/CSV
- [ ] بکاپ‌گیری دیتابیس

### P1 - اولویت متوسط
- [ ] احراز هویت کاربر
- [ ] چند کاربره
- [ ] یادآور چک‌های نزدیک سررسید

### P2 - اولویت پایین
- [ ] نسخه موبایل (PWA)
- [ ] API REST کامل‌تر
- [ ] رمزگذاری دیتابیس
- [ ] تم تیره

---

## نتایج تست
- Backend: ✅ ۱۰۰% (۱۱/۱۱ تست)
- Frontend: ✅ ۱۰۰% (تمام UI و تعاملات)
- Overall: ✅ ۱۰۰%

---

## نحوه اجرا

```bash
# Backend
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend
cd /app/frontend
yarn install
yarn start
```

---

*تاریخ آخرین بروزرسانی: ۱۴۰۳/۱۱/۱۰*
