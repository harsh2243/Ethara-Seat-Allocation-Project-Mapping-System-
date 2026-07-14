import React, { useEffect, useState } from 'react';
import { 
  getDashboardSummary, 
  getProjectUtilization, 
  getFloorUtilization,
  allocateSeat,
  getAvailableSeats,
  getEmployees
} from '../api';
import { 
  Users, 
  Armchair, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  TrendingUp,
  MapPin,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function Dashboard({ user, setActiveTab, setQuickAllocationEmployee }) {
  const [summary, setSummary] = useState(null);
  const [projectsData, setProjectsData] = useState([]);
  const [floorsData, setFloorsData] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, projRes, floorRes] = await Promise.all([
        getDashboardSummary(),
        getProjectUtilization(),
        getFloorUtilization()
      ]);

      setSummary(sumRes.data);
      setProjectsData(projRes.data);
      setFloorsData(floorRes.data);
      
      const pendingRes = await getEmployees({ allocation_status: 'Pending', limit: 5 });
      setPendingEmployees(pendingRes.data.employees);

      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickAllocate = (employee) => {
    setQuickAllocationEmployee(employee);
    setActiveTab('seats'); // Switch to Seat Map tab
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400">Loading Ethara Workspace Metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-6 border-red-500/20 text-center space-y-4 my-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-xl font-semibold text-red-400">Dashboard Error</h3>
        <p className="text-slate-300">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Predefined chart colors
  const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6', '#14B8A6', '#F43F5E'];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl -z-10"></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Workspace Hub <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-slate-400 mt-1">Real-time seat allocation, project alignments, and team density metrics.</p>
        </div>
        <button 
          onClick={() => setActiveTab('ai')}
          className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.02]"
        >
          Ask AI Assistant
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Employees */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Active Employees</p>
            <h3 className="text-2xl font-bold text-white">{summary?.totalEmployees.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2: Occupied Seats */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Occupied Seats</p>
            <h3 className="text-2xl font-bold text-white">{summary?.occupiedSeats.toLocaleString()}</h3>
            <p className="text-xs text-indigo-400 font-medium">
              {((summary?.occupiedSeats / summary?.totalSeats) * 100).toFixed(1)}% utilization
            </p>
          </div>
          <div className="p-3 bg-red-600/20 text-red-400 rounded-xl">
            <Armchair className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3: Available Seats */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Available Seats</p>
            <h3 className="text-2xl font-bold text-emerald-400">{summary?.availableSeats.toLocaleString()}</h3>
            <p className="text-xs text-emerald-500 font-medium pulse-soft">Ready for booking</p>
          </div>
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4: Reserved Seats */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Reserved Seats</p>
            <h3 className="text-2xl font-bold text-purple-400">{summary?.reservedSeats.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl">
            <Armchair className="h-6 w-6 text-purple-400" />
          </div>
        </div>

        {/* Metric 5: Pending Allocation */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Pending Seat</p>
            <h3 className="text-2xl font-bold text-amber-500">{summary?.pendingAllocationCount.toLocaleString()}</h3>
            <p className="text-xs text-amber-500 font-medium">New joiners</p>
          </div>
          <div className="p-3 bg-amber-600/20 text-amber-500 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Utilization Chart */}
        <div className={`glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 ${
          user.system_role === 'Employee' ? 'lg:col-span-3' : 'lg:col-span-2'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              Project Occupancy Distribution
            </h3>
            <span className="text-xs text-slate-400">Total assigned seats</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectsData.slice(0, 10)}>
                <XAxis 
                  dataKey="name" 
                  stroke="#94A3B8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ background: '#151D30', borderColor: '#1F293D', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={25}>
                  {projectsData.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Joiners Sidebar */}
        {user.system_role !== 'Employee' && (
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-400" />
              Pending Joiners ({summary?.pendingAllocationCount})
            </h3>
            <p className="text-xs text-slate-400">Recently onboarded employees awaiting physical seat allocations.</p>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {pendingEmployees.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No employees pending allocation.
                </div>
              ) : (
                pendingEmployees.map(emp => (
                  <div key={emp._id} className="glass-card p-3.5 rounded-xl border border-slate-800/60 flex items-center justify-between hover:border-slate-700 transition">
                    <div className="space-y-0.5 max-w-[70%]">
                      <h4 className="text-sm font-semibold text-white truncate">{emp.name}</h4>
                      <p className="text-xs text-indigo-400 truncate">{emp.project_id?.name || 'No Project'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{emp.email}</p>
                    </div>
                    <button 
                      onClick={() => handleQuickAllocate(emp)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                    >
                      Allocate
                    </button>
                  </div>
                ))
              )}
            </div>
            {pendingEmployees.length > 0 && (
              <button 
                onClick={() => setActiveTab('employees')}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition font-medium mt-2 block"
              >
                View all directory
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floor Utilization Grid */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-400" />
          Floor-wise Capacity & Occupancy Rates
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Occupancy Rate</th>
                <th className="py-3 px-4">Occupied Seats</th>
                <th className="py-3 px-4">Available Seats</th>
                <th className="py-3 px-4">Reserved Seats</th>
                <th className="py-3 px-4">Maintenance</th>
                <th className="py-3 px-4 text-right">Total Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {floorsData.map((floor) => (
                <tr key={floor.floor} className="hover:bg-slate-900/40 transition">
                  <td className="py-4 px-4 font-semibold text-white">Floor {floor.floor}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(floor.occupancyRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-slate-200">{floor.occupancyRate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-300 font-medium">{floor.occupied}</td>
                  <td className="py-4 px-4 text-emerald-400 font-medium">{floor.available}</td>
                  <td className="py-4 px-4 text-purple-400 font-medium">{floor.reserved}</td>
                  <td className="py-4 px-4 text-amber-500 font-medium">{floor.maintenance}</td>
                  <td className="py-4 px-4 text-right font-medium text-slate-400">{floor.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
