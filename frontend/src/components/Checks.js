import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Edit2, 
  Trash2, 
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { formatToman, formatJalaliDate, getCurrentJalaliDate } from '../utils/format';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_CONFIG = {
  pending: { label: 'در انتظار', icon: Clock, color: 'orange', badge: 'badge-pending' },
  passed: { label: 'پاس شده', icon: CheckCircle, color: 'green', badge: 'badge-passed' },
  bounced: { label: 'برگشتی', icon: XCircle, color: 'red', badge: 'badge-bounced' }
};

function Checks({ accounts, onRefresh }) {
  const [checks, setChecks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCheck, setEditingCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    account_id: '',
    type: '',
    status: ''
  });
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    due_date_jalali: getCurrentJalaliDate(),
    type: 'received',
    status: 'pending',
    description: ''
  });

  useEffect(() => {
    fetchChecks();
  }, [filters]);

  const fetchChecks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.account_id) params.append('account_id', filters.account_id);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);

      const res = await fetch(`${API_URL}/api/checks?${params}`);
      const data = await res.json();
      setChecks(data);
    } catch (err) {
      console.error('Error fetching checks:', err);
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingCheck(null);
    setFormData({
      account_id: accounts[0]?.id || '',
      amount: '',
      due_date_jalali: getCurrentJalaliDate(),
      type: 'received',
      status: 'pending',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (check) => {
    setEditingCheck(check);
    setFormData({
      account_id: check.account_id,
      amount: check.amount,
      due_date_jalali: check.due_date_jalali,
      type: check.type,
      status: check.status,
      description: check.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        account_id: formData.account_id,
        amount: parseInt(formData.amount),
        due_date_jalali: formData.due_date_jalali,
        type: formData.type,
        status: formData.status,
        description: formData.description || null
      };

      const url = editingCheck 
        ? `${API_URL}/api/checks/${editingCheck.id}`
        : `${API_URL}/api/checks`;
      
      const method = editingCheck ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchChecks();
        onRefresh();
      }
    } catch (err) {
      console.error('Error saving check:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (checkId) => {
    if (!window.confirm('آیا از حذف این چک اطمینان دارید؟')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/checks/${checkId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchChecks();
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting check:', err);
    }
  };

  const handleStatusChange = async (checkId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/checks/${checkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchChecks();
      }
    } catch (err) {
      console.error('Error updating check status:', err);
    }
  };

  // Separate pending checks for alert
  const pendingChecks = checks.filter(c => c.status === 'pending');

  return (
    <div data-testid="checks-page">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">چک‌های بانکی</h1>
          <p className="page-subtitle">مدیریت چک‌های دریافتی و پرداختی</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={openCreateModal}
          disabled={accounts.length === 0}
          data-testid="add-check-btn"
        >
          <Plus size={18} />
          ثبت چک
        </button>
      </div>

      {/* Pending Checks Alert */}
      {pendingChecks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3" data-testid="pending-alert">
          <AlertTriangle size={24} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-800">چک‌های در انتظار</h3>
            <p className="text-sm text-orange-700">
              شما {pendingChecks.length} چک در انتظار دارید. وضعیت آن‌ها را بررسی کنید.
            </p>
          </div>
        </div>
      )}

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
          data-testid="check-filter-account"
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
          data-testid="check-filter-type"
        >
          <option value="">همه انواع</option>
          <option value="received">دریافتی</option>
          <option value="paid">پرداختی</option>
        </select>
        <select
          className="filter-select"
          value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}
          data-testid="check-filter-status"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="pending">در انتظار</option>
          <option value="passed">پاس شده</option>
          <option value="bounced">برگشتی</option>
        </select>
      </div>

      {/* Checks List */}
      {accounts.length === 0 ? (
        <div className="empty-state" data-testid="no-accounts-for-checks">
          <div className="empty-state-icon">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-medium text-stone-700 mb-2">ابتدا حساب ایجاد کنید</h3>
          <p className="text-stone-500">برای ثبت چک باید ابتدا یک حساب بانکی ایجاد کنید</p>
        </div>
      ) : checks.length === 0 ? (
        <div className="empty-state" data-testid="empty-checks">
          <div className="empty-state-icon">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-medium text-stone-700 mb-2">چکی وجود ندارد</h3>
          <p className="text-stone-500 mb-4">اولین چک خود را ثبت کنید</p>
          <button 
            className="btn btn-primary"
            onClick={openCreateModal}
            data-testid="add-first-check-btn"
          >
            <Plus size={18} />
            ثبت چک
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table" data-testid="checks-table">
            <thead>
              <tr>
                <th>نوع</th>
                <th>مبلغ</th>
                <th>حساب</th>
                <th>تاریخ سررسید</th>
                <th>وضعیت</th>
                <th>توضیحات</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => {
                const statusConfig = STATUS_CONFIG[check.status];
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={check.id} data-testid={`check-row-${check.id}`}>
                    <td>
                      <span className={`badge ${check.type === 'received' ? 'badge-income' : 'badge-expense'}`}>
                        {check.type === 'received' ? 'دریافتی' : 'پرداختی'}
                      </span>
                    </td>
                    <td className="font-semibold currency">
                      {formatToman(check.amount)}
                    </td>
                    <td>
                      <span className="text-stone-600">{check.account_name || 'نامشخص'}</span>
                    </td>
                    <td className="text-stone-500">{formatJalaliDate(check.due_date_jalali)}</td>
                    <td>
                      <div className="relative group">
                        <span className={`badge ${statusConfig.badge} cursor-pointer`}>
                          <StatusIcon size={14} className="ml-1" />
                          {statusConfig.label}
                        </span>
                        {/* Status dropdown on hover */}
                        <div className="absolute top-full right-0 mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <button
                              key={key}
                              className={`w-full px-4 py-2 text-right text-sm hover:bg-stone-50 first:rounded-t-lg last:rounded-b-lg ${
                                check.status === key ? 'font-semibold' : ''
                              }`}
                              onClick={() => handleStatusChange(check.id, key)}
                              data-testid={`status-${key}-${check.id}`}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="text-stone-500 max-w-[200px] truncate">{check.description || '-'}</td>
                    <td>
                      <div className="actions">
                        <button 
                          className="btn-ghost p-2 rounded-lg"
                          onClick={() => openEditModal(check)}
                          data-testid={`edit-check-${check.id}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-ghost p-2 rounded-lg text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(check.id)}
                          data-testid={`delete-check-${check.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} data-testid="check-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCheck ? 'ویرایش چک' : 'ثبت چک جدید'}
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
                  data-testid="check-account-select"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.account_name} - {acc.bank_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">نوع چک *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                      formData.type === 'received' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-stone-200 text-stone-500'
                    }`}
                    onClick={() => setFormData({...formData, type: 'received'})}
                    data-testid="check-type-received-btn"
                  >
                    دریافتی
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                      formData.type === 'paid' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-stone-200 text-stone-500'
                    }`}
                    onClick={() => setFormData({...formData, type: 'paid'})}
                    data-testid="check-type-paid-btn"
                  >
                    پرداختی
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
                  data-testid="check-amount-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">تاریخ سررسید (شمسی) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.due_date_jalali}
                  onChange={e => setFormData({...formData, due_date_jalali: e.target.value})}
                  placeholder="1403/01/01"
                  required
                  data-testid="check-date-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">وضعیت *</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  required
                  data-testid="check-status-select"
                >
                  <option value="pending">در انتظار</option>
                  <option value="passed">پاس شده</option>
                  <option value="bounced">برگشتی</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">توضیحات</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="توضیحات اختیاری..."
                  rows="2"
                  data-testid="check-description-input"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={loading}
                  data-testid="save-check-btn"
                >
                  {loading ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  data-testid="cancel-check-btn"
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

export default Checks;
