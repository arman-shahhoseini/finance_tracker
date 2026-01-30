import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  Calendar,
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
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { formatToman, englishToPersian, getJalaliMonthName } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const API_URL = process.env.REACT_APP_BACKEND_URL;

function Reports({ accounts }) {
  const [chartData, setChartData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('monthly');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chartRes, txnRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/chart-data`),
        fetch(`${API_URL}/api/transactions`)
      ]);
      const chartDataRes = await chartRes.json();
      const txnData = await txnRes.json();
      setChartData(chartDataRes);
      setTransactions(txnData);
    } catch (err) {
      console.error('Error fetching report data:', err);
    }
    setLoading(false);
  };

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Monthly trend chart
  const monthlyTrendData = {
    labels: chartData?.monthly_trend?.map(m => m.month) || [],
    datasets: [
      {
        label: 'درآمد',
        data: chartData?.monthly_trend?.map(m => m.income / 10) || [],
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'هزینه',
        data: chartData?.monthly_trend?.map(m => m.expense / 10) || [],
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
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

  // Category distribution
  const categoryColors = [
    '#0F766E', '#EA580C', '#7C3AED', '#2563EB', 
    '#059669', '#DC2626', '#D97706', '#6366F1'
  ];

  const categoryPieData = {
    labels: chartData?.category_distribution?.map(c => c.name) || [],
    datasets: [
      {
        data: chartData?.category_distribution?.map(c => c.value / 10) || [],
        backgroundColor: categoryColors,
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const pieChartOptions = {
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

  // Income vs Expense comparison
  const comparisonData = {
    labels: ['درآمد', 'هزینه'],
    datasets: [
      {
        data: [totalIncome / 10, totalExpense / 10],
        backgroundColor: ['#059669', '#DC2626'],
        borderWidth: 0,
        borderRadius: 8,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        titleFont: { family: 'Vazirmatn' },
        bodyFont: { family: 'Vazirmatn' },
        callbacks: {
          label: (context) => formatToman(context.raw * 10),
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#E7E5E4' },
        ticks: {
          font: { family: 'Vazirmatn' },
          callback: (value) => `${englishToPersian(value.toLocaleString())}`,
        },
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: 'Vazirmatn' } },
      },
    },
  };

  // Top expenses by category
  const topCategories = chartData?.category_distribution?.slice(0, 5) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div data-testid="reports-page">
      <div className="page-header">
        <h1 className="page-title">گزارش‌ها</h1>
        <p className="page-subtitle">تحلیل وضعیت مالی شما</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card" data-testid="total-income-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <span className="text-stone-500">کل درآمد</span>
          </div>
          <p className="text-2xl font-bold currency currency-income">{formatToman(totalIncome)}</p>
        </div>

        <div className="card" data-testid="total-expense-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <span className="text-stone-500">کل هزینه</span>
          </div>
          <p className="text-2xl font-bold currency currency-expense">{formatToman(totalExpense)}</p>
        </div>

        <div className="card" data-testid="balance-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-primary" />
            </div>
            <span className="text-stone-500">تراز</span>
          </div>
          <p className={`text-2xl font-bold currency ${totalIncome - totalExpense >= 0 ? 'currency-income' : 'currency-expense'}`}>
            {formatToman(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend */}
        <div className="chart-container" data-testid="trend-chart">
          <div className="flex items-center justify-between mb-4">
            <h3 className="chart-title flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              روند ۶ ماهه اخیر (تومان)
            </h3>
          </div>
          <div style={{ height: '280px' }}>
            <Line data={monthlyTrendData} options={lineChartOptions} />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="chart-container" data-testid="category-pie-chart">
          <h3 className="chart-title flex items-center gap-2">
            <PieChart size={18} className="text-primary" />
            توزیع هزینه‌ها بر اساس دسته‌بندی
          </h3>
          <div style={{ height: '280px' }}>
            {chartData?.category_distribution?.length > 0 ? (
              <Pie data={categoryPieData} options={pieChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400">
                هنوز هزینه‌ای ثبت نشده است
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense */}
        <div className="chart-container" data-testid="comparison-chart">
          <h3 className="chart-title">مقایسه درآمد و هزینه (تومان)</h3>
          <div style={{ height: '200px' }}>
            <Bar data={comparisonData} options={barChartOptions} />
          </div>
        </div>

        {/* Top Categories */}
        <div className="chart-container" data-testid="top-categories">
          <h3 className="chart-title">بیشترین هزینه‌ها</h3>
          {topCategories.length > 0 ? (
            <div className="space-y-3 mt-4">
              {topCategories.map((cat, index) => {
                const percentage = totalExpense > 0 
                  ? Math.round((cat.value / totalExpense) * 100) 
                  : 0;
                return (
                  <div key={cat.name} data-testid={`category-item-${index}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-sm text-stone-500">
                        {formatToman(cat.value)} ({englishToPersian(String(percentage))}%)
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: categoryColors[index % categoryColors.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-stone-400">
              هنوز هزینه‌ای ثبت نشده است
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
