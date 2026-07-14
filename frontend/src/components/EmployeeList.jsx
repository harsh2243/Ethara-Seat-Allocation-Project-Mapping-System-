import React, { useState, useEffect } from 'react';
import { getEmployees, getProjects, createEmployee, updateEmployee, deactivateEmployee } from '../api';
import { Search, Plus, Trash2, Edit2, ShieldAlert, Sparkles, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function EmployeeList({ user, quickAllocationEmployee, setQuickAllocationEmployee, setActiveTab }) {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [allocFilter, setAllocFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    role: 'Software Engineer',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'Active',
    project_id: '',
    employee_code: ''
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        project_id: projectFilter,
        status: statusFilter,
        allocation_status: allocFilter
      };
      const res = await getEmployees(params);
      setEmployees(res.data.employees);
      setTotalPages(res.data.totalPages);
      setTotalEmployees(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Reset page to 1 when filters or search change
    setPage(1);
  }, [search, projectFilter, statusFilter, allocFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [page, search, projectFilter, statusFilter, allocFilter]);

  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this employee? This will automatically release their allocated seat.')) {
      try {
        await deactivateEmployee(id);
        fetchEmployees();
      } catch (err) {
        alert(err.response?.data?.message || 'Deactivation failed');
      }
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      department: 'Engineering',
      role: 'Software Engineer',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      project_id: projects[0]?._id || '',
      employee_code: ''
    });
    setFormError('');
    setFormSuccess('');
    setModalType('create');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      joining_date: emp.joining_date ? emp.joining_date.split('T')[0] : '',
      status: emp.status,
      project_id: emp.project_id?._id || '',
      employee_code: emp.employee_code
    });
    setFormError('');
    setFormSuccess('');
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      if (modalType === 'create') {
        await createEmployee(formData);
        setFormSuccess('Employee created successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchEmployees();
        }, 1000);
      } else {
        await updateEmployee(selectedEmployee._id, formData);
        setFormSuccess('Employee updated successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchEmployees();
        }, 1000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed');
    }
  };

  const triggerAllocate = (emp) => {
    setQuickAllocationEmployee(emp);
    setActiveTab('seats');
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Employee Directory</h2>
          <p className="text-xs text-slate-400 mt-1">Manage corporate personnel records and mapping scopes ({totalEmployees.toLocaleString()} employees)</p>
        </div>
        {user.system_role !== 'Employee' && (
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition duration-200"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-900/20 p-4 rounded-xl border border-slate-800/80">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search name, code, email, role..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Project Filter */}
        <div className="relative">
          <select 
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Projects</option>
            {projects.map(proj => (
              <option key={proj._id} value={proj._id}>{proj.name}</option>
            ))}
          </select>
        </div>

        {/* Allocation Status Filter */}
        <div>
          <select 
            value={allocFilter}
            onChange={(e) => setAllocFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Allocations</option>
            <option value="Allocated">Seated</option>
            <option value="Pending">Pending Seat</option>
          </select>
        </div>

        {/* Employment Status Filter */}
        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-slate-400 mt-4 text-sm">Searching records...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            No employees found matching the current search parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">ID Code</th>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Project</th>
                  <th className="py-3.5 px-6">Department & Role</th>
                  <th className="py-3.5 px-6">Seat Location</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-900/30 transition">
                    <td className="py-4.5 px-6 font-mono text-xs text-indigo-400">{emp.employee_code}</td>
                    <td className="py-4.5 px-6">
                      <div className="font-semibold text-white">{emp.name}</div>
                      <div className="text-xs text-slate-500">{emp.email}</div>
                    </td>
                    <td className="py-4.5 px-6">
                      {emp.project_id ? (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                          {emp.project_id.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="text-slate-300">{emp.department}</div>
                      <div className="text-xs text-slate-500">{emp.role}</div>
                    </td>
                    <td className="py-4.5 px-6">
                      {emp.seat ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          Flr {emp.seat.floor}, Z-{emp.seat.zone}, S-{emp.seat.seat_number}
                        </div>
                      ) : emp.status === 'Active' ? (
                        user.system_role !== 'Employee' ? (
                          <button 
                            onClick={() => triggerAllocate(emp)}
                            className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 font-bold"
                          >
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                            Allocate Seat
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs italic font-medium">
                            <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
                            Pending Seat
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        emp.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      {user.system_role !== 'Employee' ? (
                        <div className="flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                            title="Edit employee"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {emp.status === 'Active' && (
                            <button 
                              onClick={() => handleDeactivate(emp._id)}
                              className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition"
                              title="Deactivate employee"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-slate-900/60 p-4 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Showing page <span className="font-semibold text-slate-200">{page}</span> of <span className="font-semibold text-slate-200">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 rounded-lg text-slate-400 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 rounded-lg text-slate-400 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-6 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                {modalType === 'create' ? 'Onboard New Employee' : 'Edit Employee Profile'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Complete all details. Standard unique indices apply.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" /> {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-semibold">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Employee Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Employee Code</label>
                  <input 
                    type="text" 
                    placeholder="EMP0000 (optional)" 
                    value={formData.employee_code}
                    onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                    disabled={modalType === 'edit'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="John Doe" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="john.doe@ethara.ai" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department</label>
                  <select 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="HR">HR</option>
                    <option value="Admin">Admin</option>
                    <option value="Growth">Growth</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Design">Design</option>
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Job Role</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Software Engineer" 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Joining Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Joining Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.joining_date}
                    onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {/* Project Assignment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Project Assignment</label>
                  <select 
                    value={formData.project_id}
                    onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="">Unassigned</option>
                    {projects.map(proj => (
                      <option key={proj._id} value={proj._id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status (Only visible on Edit) */}
              {modalType === 'edit' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Employment Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-850">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
