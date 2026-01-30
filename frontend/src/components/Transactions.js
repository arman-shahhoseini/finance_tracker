import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowLeftRight, 
  Edit2, 
  Trash2, 
  X,
  TrendingUp,
  TrendingDown,
  Filter
} from 'lucide-react';
import { formatToman, formatJalaliDate, getCurrentJalaliDate } from '../utils/format';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function Transactions({ accounts, categories, onRefresh }) {
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    account_id: '',
    type: '',
    category: ''
  });
  const [formData, setFormData] = useState({
    account_id: '',
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date_jalali: getCurrentJalaliDate()
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.account_id) params.append('account_id', filters.account_id);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);

      const res = await fetch(`${API_URL}/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingTransaction(null);
    setFormData({
      account_id: accounts[0]?.id || '',
      type: 'expense',
      amount: '',
      category: categories[0] || '',
      description: '',
      date_jalali: getCurrentJalaliDate()
    });
    setShowModal(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      account_id: transaction.account_id,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description || '',
      date_jalali: transaction.date_jalali
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        account_id: formData.account_id,
        type: formData.type,
        amount: parseInt(formData.amount),
        category: formData.category,
        description: formData.description || null,
        date_jalali: formData.date_jalali
      };

      const url = editingTransaction 
        ? `${API_URL}/api/transactions/${editingTransaction.id}`
        : `${API_URL}/api/transactions`;
      
      const method = editingTransaction ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchTransactions();
        onRefresh();
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('آیا از حذف این تراکنش اطمینان دارید؟')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/transactions/${transactionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchTransactions();
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  return (
    <div data-testid="transactions-page">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">تراکنش‌ها</h1>
          <p className="page-subtitle">ثبت و مدیریت درآمدها و هزینه‌ها</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={openCreateModal}
          disabled={accounts.length === 0}
          data-testid="add-transaction-btn"
        >
          <Plus size={18} />
          ثبت تراکنش
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="flex items-center gap-2 text-stone-500">
          <Filter size={18} />
          <span className="text-sm">فیلتر:</span>
        </div>
        <select
          className="filter-select"
          value={filters.account_id}
          onChange={e => setFilters({...filters, account_id: e.target.value})}
          data-testid="filter-account"
        >
          <option value="">همه حساب‌ها</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.account_name}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filters.type}
          onChange={e => setFilters({...filters, type: e.target.value})}
          data-testid="filter-type"
        >
          <option value="">همه انواع</option>
          <option value="income">درآمد</option>
          <option value="expense">هزینه</option>
        </select>
        <select
          className="filter-select"
          value={filters.category}
          onChange={e => setFilters({...filters, category: e.target.value})}
          data-testid="filter-category"
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Transactions List */}
      {accounts.length === 0 ? (
        <div className="empty-state" data-testid="no-accounts-warning">
          <div className="empty-state-icon">
            <ArrowLeftRight size={32} />
          </div>
          <h3 className="text-lg font-medium text-stone-700 mb-2">ابتدا حساب ایجاد کنید</h3>
          <p className="text-stone-500">برای ثبت تراکنش باید ابتدا یک حساب بانکی ایجاد کنید</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state" data-testid="empty-transactions">
          <div className="empty-state-icon">
            <ArrowLeftRight size={32} />
          </div>
          <h3 className="text-lg font-medium text-stone-700 mb-2">تراکنشی وجود ندارد</h3>
          <p className="text-stone-500 mb-4">اولین تراکنش خود را ثبت کنید</p>
          <button 
            className="btn btn-primary"
            onClick={openCreateModal}
            data-testid="add-first-transaction-btn"
          >
            <Plus size={18} />
            ثبت تراکنش
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table" data-testid="transactions-table">
            <thead>
              <tr>
                <th>نوع</th>
                <th>مبلغ</th>
                <th>دسته‌بندی</th>
                <th>حساب</th>
                <th>تاریخ</th>
                <th>توضیحات</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} data-testid={`transaction-row-${txn.id}`}>
                  <td>
                    <span className={`badge ${txn.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                      {txn.type === 'income' ? (
                        <><TrendingUp size={14} className="ml-1" /> درآمد</>
                      ) : (
                        <><TrendingDown size={14} className="ml-1" /> هزینه</>
                      )}
                    </span>
                  </td>
                  <td className={`font-semibold currency ${txn.type === 'income' ? 'currency-income' : 'currency-expense'}`}>
                    {formatToman(txn.amount)}
                  </td>
                  <td>{txn.category}</td>
                  <td>
                    <span className="text-stone-600">{txn.account_name || 'نامشخص'}</span>
                  </td>
                  <td className="text-stone-500">{formatJalaliDate(txn.date_jalali)}</td>
                  <td className="text-stone-500 max-w-[200px] truncate">{txn.description || '-'}</td>
                  <td>
                    <div className="actions">
                      <button 
                        className="btn-ghost p-2 rounded-lg"
                        onClick={() => openEditModal(txn)}
                        data-testid={`edit-transaction-${txn.id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-ghost p-2 rounded-lg text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(txn.id)}
                        data-testid={`delete-transaction-${txn.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} data-testid="transaction-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTransaction ? 'ویرایش تراکنش' : 'ثبت تراکنش جدید'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">حساب *</label>
                <select
                  className="form-input"
                  value={formData.account_id}
                  onChange={e => setFormData({...formData, account_id: e.target.value})}
                  required
                  data-testid="transaction-account-select"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.account_name} - {acc.bank_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">نوع تراکنش *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      formData.type === 'income' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-stone-200 text-stone-500'
                    }`}
                    onClick={() => setFormData({...formData, type: 'income'})}
                    data-testid="type-income-btn"
                  >
                    <TrendingUp size={18} />
                    درآمد
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      formData.type === 'expense' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-stone-200 text-stone-500'
                    }`}
                    onClick={() => setFormData({...formData, type: 'expense'})}
                    data-testid="type-expense-btn"
                  >
                    <TrendingDown size={18} />
                    هزینه
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">مبلغ (ریال) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="0"
                  min="1"
                  required
                  data-testid="transaction-amount-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">دسته‌بندی *</label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  required
                  data-testid="transaction-category-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">تاریخ (شمسی) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.date_jalali}
                  onChange={e => setFormData({...formData, date_jalali: e.target.value})}
                  placeholder="1403/01/01"
                  required
                  data-testid="transaction-date-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">توضیحات</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="توضیحات اختیاری..."
                  rows="2"
                  data-testid="transaction-description-input"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={loading}
                  data-testid="save-transaction-btn"
                >
                  {loading ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  data-testid="cancel-transaction-btn"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
