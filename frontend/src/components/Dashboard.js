import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  FileText,
  Building2,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatToman, englishToPersian } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_URL = process.env.REACT_APP_BACKEND_URL;

function Dashboard({ accounts }) {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`),
        fetch(`${API_URL}/api/dashboard/chart-data`)
      ]);
      const statsData = await statsRes.json();
      const chartDataRes = await chartRes.json();
      setStats(statsData);
      setChartData(chartDataRes);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
    setLoading(false);
  };

  const barChartData = {
    labels: chartData?.monthly_trend?.map(m => m.month) || [],
    datasets: [
      {
        label: 'درآمد',
        data: chartData?.monthly_trend?.map(m => m.income / 10) || [],
        backgroundColor: 'rgba(5, 150, 105, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'هزینه',
        data: chartData?.monthly_trend?.map(m => m.expense / 10) || [],
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        rtl: true,
        labels: {
          font: { family: 'Vazirmatn' },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        rtl: true,
        titleFont: { family: 'Vazirmatn' },
        bodyFont: { family: 'Vazirmatn' },
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatToman(context.raw * 10)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Vazirmatn' } },
      },
      y: {
        grid: { color: '#E7E5E4' },
        ticks: {
          font: { family: 'Vazirmatn' },
          callback: (value) => `${englishToPersian(value.toLocaleString())}`,
        },
      },
    },
  };

  const categoryColors = [
    '#0F766E', '#EA580C', '#7C3AED', '#2563EB', 
    '#059669', '#DC2626', '#D97706', '#6366F1'
  ];

  const doughnutData = {
    labels: chartData?.category_distribution?.map(c => c.name) || [],
    datasets: [
      {
        data: chartData?.category_distribution?.map(c => c.value / 10) || [],
        backgroundColor: categoryColors,
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'left',
        rtl: true,
        labels: {
          font: { family: 'Vazirmatn', size: 12 },
          usePointStyle: true,
          padding: 12,
        },
      },
      tooltip: {
        rtl: true,
        titleFont: { family: 'Vazirmatn' },
        bodyFont: { family: 'Vazirmatn' },
        callbacks: {
          label: (context) => `${context.label}: ${formatToman(context.raw * 10)}`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">داشبورد</h1>
        <p className="page-subtitle">خلاصه وضعیت مالی شما</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" data-testid="total-balance-card">
          <div className="stat-icon" style={{ background: 'rgba(15, 118, 110, 0.1)' }}>
            <Wallet size={24} color="#0F766E" />
          </div>
          <p className="stat-label">موجودی کل</p>
          <p className="stat-value currency">{formatToman(stats?.total_balance || 0)}</p>
        </div>

        <div className="stat-card" data-testid="monthly-income-card">
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)' }}>
            <TrendingUp size={24} color="#059669" />
          </div>
          <p className="stat-label">درآمد این ماه</p>
          <p className="stat-value currency currency-income">{formatToman(stats?.monthly_income || 0)}</p>
        </div>

        <div className="stat-card" data-testid="monthly-expense-card">
          <div className="stat-icon" style={{ background: 'rgba(220, 38, 38, 0.1)' }}>
            <TrendingDown size={24} color="#DC2626" />
          </div>
          <p className="stat-label">هزینه این ماه</p>
          <p className="stat-value currency currency-expense">{formatToman(stats?.monthly_expense || 0)}</p>
        </div>

        <div className="stat-card" data-testid="pending-checks-card">
          <div className="stat-icon" style={{ background: 'rgba(234, 88, 12, 0.1)' }}>
            <FileText size={24} color="#EA580C" />
          </div>
          <p className="stat-label">چک‌های در انتظار</p>
          <p className="stat-value">{englishToPersian(String(stats?.pending_checks || 0))}</p>
        </div>
      </div>

      {/* Accounts Overview */}
      {accounts.length > 0 && (
        <div className="card mb-6" data-testid="accounts-overview">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-primary" />
            حساب‌های بانکی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.slice(0, 6).map((account) => (
              <div 
                key={account.id} 
                className="p-4 bg-stone-50 rounded-lg border border-stone-200"
                data-testid={`account-card-${account.id}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ background: account.color || '#0F766E' }}
                  />
                  <span className="font-medium">{account.account_name}</span>
                </div>
                <p className="text-sm text-stone-500">{account.bank_name}</p>
                <p className="text-lg font-bold mt-2 currency">
                  {formatToman(account.balance || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container" data-testid="monthly-chart">
          <h3 className="chart-title">روند درآمد و هزینه (تومان)</h3>
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        <div className="chart-container" data-testid="category-chart">
          <h3 className="chart-title">توزیع هزینه‌ها بر اساس دسته‌بندی</h3>
          <div style={{ height: '300px' }}>
            {chartData?.category_distribution?.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400">
                هنوز هزینه‌ای ثبت نشده است
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
