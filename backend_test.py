#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class PersonalFinanceAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_account_id = None
        self.created_transaction_id = None
        self.created_check_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, ensure_ascii=False)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, ensure_ascii=False, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_get_categories(self):
        """Test categories endpoint"""
        return self.run_test("Get Categories", "GET", "api/categories", 200)

    def test_create_account(self):
        """Test creating a bank account with Persian name"""
        account_data = {
            "bank_name": "بانک ملت",
            "account_name": "حساب اصلی",
            "account_number": "1234567890",
            "sheba": "IR123456789012345678901234",
            "initial_balance": 5000000,  # 500,000 Toman
            "color": "#0F766E"
        }
        success, response = self.run_test("Create Account", "POST", "api/accounts", 200, account_data)
        if success and 'id' in response:
            self.created_account_id = response['id']
        return success, response

    def test_get_accounts(self):
        """Test getting all accounts"""
        return self.run_test("Get Accounts", "GET", "api/accounts", 200)

    def test_create_income_transaction(self):
        """Test creating income transaction with Jalali date"""
        if not self.created_account_id:
            print("❌ Cannot test transaction - no account created")
            return False, {}
        
        transaction_data = {
            "account_id": self.created_account_id,
            "type": "income",
            "amount": 2000000,  # 200,000 Toman
            "category": "حقوق",
            "description": "حقوق ماهانه",
            "date_jalali": "1403/08/15"
        }
        success, response = self.run_test("Create Income Transaction", "POST", "api/transactions", 200, transaction_data)
        if success and 'id' in response:
            self.created_transaction_id = response['id']
        return success, response

    def test_create_expense_transaction(self):
        """Test creating expense transaction"""
        if not self.created_account_id:
            print("❌ Cannot test transaction - no account created")
            return False, {}
        
        transaction_data = {
            "account_id": self.created_account_id,
            "type": "expense",
            "amount": 500000,  # 50,000 Toman
            "category": "خوراک",
            "description": "خرید مواد غذایی",
            "date_jalali": "1403/08/16"
        }
        return self.run_test("Create Expense Transaction", "POST", "api/transactions", 200, transaction_data)

    def test_get_transactions(self):
        """Test getting all transactions"""
        return self.run_test("Get Transactions", "GET", "api/transactions", 200)

    def test_create_check(self):
        """Test creating a check"""
        if not self.created_account_id:
            print("❌ Cannot test check - no account created")
            return False, {}
        
        check_data = {
            "account_id": self.created_account_id,
            "amount": 1000000,  # 100,000 Toman
            "due_date_jalali": "1403/09/01",
            "type": "received",
            "status": "pending",
            "description": "چک دریافتی از مشتری"
        }
        success, response = self.run_test("Create Check", "POST", "api/checks", 201, check_data)
        if success and 'id' in response:
            self.created_check_id = response['id']
        return success, response

    def test_get_checks(self):
        """Test getting all checks"""
        return self.run_test("Get Checks", "GET", "api/checks", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test("Dashboard Stats", "GET", "api/dashboard/stats", 200)

    def test_dashboard_chart_data(self):
        """Test dashboard chart data endpoint"""
        return self.run_test("Dashboard Chart Data", "GET", "api/dashboard/chart-data", 200)

def main():
    print("🚀 Starting Personal Finance API Tests...")
    print("=" * 60)
    
    tester = PersonalFinanceAPITester()
    
    # Test sequence
    tests = [
        tester.test_health_check,
        tester.test_get_categories,
        tester.test_create_account,
        tester.test_get_accounts,
        tester.test_create_income_transaction,
        tester.test_create_expense_transaction,
        tester.test_get_transactions,
        tester.test_create_check,
        tester.test_get_checks,
        tester.test_dashboard_stats,
        tester.test_dashboard_chart_data,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())