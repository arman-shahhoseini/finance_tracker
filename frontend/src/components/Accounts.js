import React, { useState } from 'react';
import { 
  Plus, 
  Building2, 
  Edit2, 
  Trash2, 
  X,
  CreditCard
} from 'lucide-react';
import { formatToman } from '../utils/format';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BANK_COLORS = [
  { name: 'سبز تیره', value: '#0F766E' },
  { name: 'نارنجی', value: '#EA580C' },
  { name: 'بنفش', value: '#7C3AED' },
  { name: 'آبی', value: '#2563EB' },
  { name: 'سبز', value: '#059669' },
  { name: 'قرمز', value: '#DC2626' },
  { name: 'زرد', value: '#D97706' },
  { name: 'صورتی', value: '#DB2777' },
];

function Accounts({ accounts, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    sheba: '',
    initial_balance: '',
    color: '#0F766E'
  });
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData({
      bank_name: '',
      account_name: '',
      account_number: '',
      sheba: '',
      initial_balance: '',
      color: '#0F766E'
    });
    setShowModal(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_name: account.account_name,
      account_number: account.account_number || '',
      sheba: account.sheba || '',
      initial_balance: '',
      color: account.color || '#0F766E'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        bank_name: formData.bank_name,
        account_name: formData.account_name,
        account_number: formData.account_number || null,
        sheba: formData.sheba || null,
        color: formData.color
      };

      if (!editingAccount) {
        payload.initial_balance = parseInt(formData.initial_balance) || 0;
      }

      const url = editingAccount 
        ? `${API_URL}/api/accounts/${editingAccount.id}`
        : `${API_URL}/api/accounts`;
      
      const method = editingAccount ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Error saving account:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('آیا از حذف این حساب اطمینان دارید؟ تمام تراکنش‌ها و چک‌های مرتبط نیز حذف خواهند شد.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/accounts/${accountId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div data-testid="accounts-page">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">حساب‌های بانکی</h1>
          <p className="page-subtitle">مدیریت حساب‌های بانکی شما</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={openCreateModal}
          data-testid="add-account-btn"
        >
          <Plus size={18} />
          افزودن حساب
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="card mb-6" data-testid="total-balance-summary">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard size={28} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-stone-500">مجموع دارایی‌ها</p>
            <p className="text-2xl font-bold currency">{formatToman(totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="empty-state" data-testid="empty-accounts">
          <div className="empty-state-icon">
            <Building2 size={32} />
          </div>
          <h3 className="text-lg font-medium text-stone-700 mb-2">حسابی وجود ندارد</h3>
          <p className="text-stone-500 mb-4">اولین حساب بانکی خود را اضافه کنید</p>
          <button 
            className="btn btn-primary"
            onClick={openCreateModal}
            data-testid="add-first-account-btn"
          >
            <Plus size={18} />
            افزودن حساب
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div 
              key={account.id} 
              className="card hover:border-primary/30 transition-all"
              data-testid={`account-item-${account.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${account.color}20` }}
                  >
                    <Building2 size={24} style={{ color: account.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{account.account_name}</h3>
                    <p className="text-sm text-stone-500">{account.bank_name}</p>
                  </div>
                </div>
                <div className="actions">
                  <button 
                    className="btn-ghost p-2 rounded-lg"
                    onClick={() => openEditModal(account)}
                    data-testid={`edit-account-${account.id}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="btn-ghost p-2 rounded-lg text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(account.id)}
                    data-testid={`delete-account-${account.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {account.account_number && (
                <p className="text-sm text-stone-400 mb-1">
                  شماره حساب: {account.account_number}
                </p>
              )}
              {account.sheba && (
                <p className="text-sm text-stone-400 mb-3">
                  شبا: {account.sheba}
                </p>
              )}

              <div className="pt-4 border-t border-stone-100">
                <p className="text-sm text-stone-500">موجودی</p>
                <p className="text-xl font-bold currency" style={{ color: account.balance >= 0 ? '#059669' : '#DC2626' }}>
                  {formatToman(account.balance || 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} data-testid="account-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAccount ? 'ویرایش حساب' : 'افزودن حساب جدید'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">نام بانک *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.bank_name}
                  onChange={e => setFormData({...formData, bank_name: e.target.value})}
                  placeholder="مثال: بانک ملت"
                  required
                  data-testid="account-bank-name-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">نام حساب *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.account_name}
                  onChange={e => setFormData({...formData, account_name: e.target.value})}
                  placeholder="مثال: حساب اصلی"
                  required
                  data-testid="account-name-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">شماره حساب (اختیاری)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.account_number}
                  onChange={e => setFormData({...formData, account_number: e.target.value})}
                  placeholder="شماره حساب"
                  data-testid="account-number-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">شماره شبا (اختیاری)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.sheba}
                  onChange={e => setFormData({...formData, sheba: e.target.value})}
                  placeholder="IR..."
                  data-testid="account-sheba-input"
                />
              </div>

              {!editingAccount && (
                <div className="form-group">
                  <label className="form-label">موجودی اولیه (ریال)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.initial_balance}
                    onChange={e => setFormData({...formData, initial_balance: e.target.value})}
                    placeholder="0"
                    min="0"
                    data-testid="account-balance-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">رنگ حساب</label>
                <div className="flex flex-wrap gap-2">
                  {BANK_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color.value ? 'border-stone-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ background: color.value }}
                      onClick={() => setFormData({...formData, color: color.value})}
                      title={color.name}
                      data-testid={`color-${color.value}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={loading}
                  data-testid="save-account-btn"
                >
                  {loading ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  data-testid="cancel-account-btn"
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

export default Accounts;
