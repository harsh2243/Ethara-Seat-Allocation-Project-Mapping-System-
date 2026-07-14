import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SeatMap from './components/SeatMap';
import EmployeeList from './components/EmployeeList';
import AIAssistant from './components/AIAssistant';
import Login from './components/Login';
import { 
  LayoutDashboard, 
  Map, 
  Users, 
  Sparkles,
  Bot,
  Activity,
  LogOut,
  ShieldAlert,
  UserCheck,
  ShieldCheck,
  User
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('ethara_token'));
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quickAllocationEmployee, setQuickAllocationEmployee] = useState(null);

  // Check login state on load
  useEffect(() => {
    const storedUser = localStorage.getItem('ethara_user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    } else {
      localStorage.removeItem('ethara_token');
      localStorage.removeItem('ethara_user');
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('ethara_token', newToken);
    localStorage.setItem('ethara_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('ethara_token');
    localStorage.removeItem('ethara_user');
    setToken(null);
    setUser(null);
    setQuickAllocationEmployee(null);
    setActiveTab('dashboard');
  };

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigation Items conditional configurations
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'seats', label: 'Seat Allocator', icon: Map },
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'ai', label: 'AI Workspace Chat', icon: Sparkles }
  ];

  // Helper for role badge styling
  const getRoleIcon = (role) => {
    if (role === 'Admin') return <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />;
    if (role === 'HR') return <UserCheck className="h-4.5 w-4.5 text-cyan-400" />;
    return <User className="h-4.5 w-4.5 text-emerald-400" />;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B0F19] border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-none text-base">Ethara Space</h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Workspace Hub</span>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-4 mx-4 my-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 rounded-xl shrink-0">
              {getRoleIcon(user.system_role)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
              <p className="text-[10px] text-indigo-400 truncate">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
              user.system_role === 'Admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
              user.system_role === 'HR' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {user.system_role} Mode
            </span>
            <button 
              onClick={handleLogout}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition duration-150 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Connected Indicator */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Bot className="h-4.5 w-4.5 text-indigo-400" />
            <span>Workspace Server</span>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Panel (Responsive Mobile Navigation) */}
        <header className="md:hidden flex justify-between items-center bg-[#0B0F19] px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Ethara Space</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    className={`p-2 rounded-lg transition ${
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </button>
                );
              })}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Main Content Pane */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                user={user}
                setActiveTab={setActiveTab} 
                setQuickAllocationEmployee={setQuickAllocationEmployee} 
              />
            )}
            {activeTab === 'seats' && (
              <SeatMap 
                user={user}
                quickAllocationEmployee={quickAllocationEmployee}
                setQuickAllocationEmployee={setQuickAllocationEmployee}
              />
            )}
            {activeTab === 'employees' && (
              <EmployeeList 
                user={user}
                quickAllocationEmployee={quickAllocationEmployee}
                setQuickAllocationEmployee={setQuickAllocationEmployee}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'ai' && (
              <AIAssistant />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
