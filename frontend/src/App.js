import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  ArrowLeftRight, 
  FileText, 
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Checks from './components/Checks';
import Reports from './components/Reports';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/accounts`);
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'داشبورد' },
    { path: '/accounts', icon: Building2, label: 'حساب‌ها' },
    { path: '/transactions', icon: ArrowLeftRight, label: 'تراکنش‌ها' },
    { path: '/checks', icon: FileText, label: 'چک‌ها' },
    { path: '/reports', icon: BarChart3, label: 'گزارش‌ها' },
  ];

  return (
    <Router>
      <div className="app-container">
        {/* Mobile Header */}
        <header className="mobile-header">
          <button 
            data-testid="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="menu-toggle"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="mobile-title">حساب‌رسی شخصی</h1>
        </header>

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h1 className="sidebar-title">حساب‌رسی شخصی</h1>
            <p className="sidebar-subtitle">مدیریت مالی هوشمند</p>
          </div>
          
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label}`}
                className={({ isActive }) => 
                  `nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={<Dashboard accounts={accounts} />} 
            />
            <Route 
              path="/accounts" 
              element={
                <Accounts 
                  accounts={accounts} 
                  onRefresh={fetchAccounts} 
                />
              } 
            />
            <Route 
              path="/transactions" 
              element={
                <Transactions 
                  accounts={accounts}
                  categories={categories}
                  onRefresh={fetchAccounts}
                />
              } 
            />
            <Route 
              path="/checks" 
              element={
                <Checks 
                  accounts={accounts}
                  onRefresh={fetchAccounts}
                />
              } 
            />
            <Route 
              path="/reports" 
              element={<Reports accounts={accounts} />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
