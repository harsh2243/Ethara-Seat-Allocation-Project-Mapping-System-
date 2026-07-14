import React, { useState, useEffect } from 'react';
import { getSeats, getAvailableSeats, allocateSeat, releaseSeat, getEmployees, updateSeatStatus } from '../api';
import { Armchair, Compass, ArrowRight, UserCheck, CheckCircle2, ShieldAlert, Sparkles, X, ChevronRight } from 'lucide-react';

export default function SeatMap({ user, quickAllocationEmployee, setQuickAllocationEmployee }) {
  const [selectedFloor, setSelectedFloor] = useState(2);
  const [selectedZone, setSelectedZone] = useState('B');
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Proximity recommendations
  const [recommendations, setRecommendations] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  // Manual Allocation State
  const [selectedSeatForAction, setSelectedSeatForAction] = useState(null);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const floors = [1, 2, 3, 4, 5];
  const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

  // Fetch seats for selected floor and zone
  const fetchSeats = async () => {
    try {
      setLoading(true);
      const res = await getSeats({ floor: selectedFloor, zone: selectedZone });
      setSeats(res.data);
    } catch (err) {
      console.error('Failed to fetch seats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch proximity recommendations for quick allocation employee
  const fetchRecommendations = async () => {
    if (!quickAllocationEmployee) {
      setRecommendations(null);
      return;
    }
    try {
      setRecLoading(true);
      const res = await getAvailableSeats({ 
        employee_id: quickAllocationEmployee._id,
        project_id: quickAllocationEmployee.project_id?._id || quickAllocationEmployee.project_id
      });
      setRecommendations(res.data);
    } catch (err) {
      console.error('Failed to fetch seat recommendations:', err);
    } finally {
      setRecLoading(false);
    }
  };

  // Fetch unallocated employees for manual allocation dropdown
  const fetchPendingEmployees = async () => {
    try {
      const res = await getEmployees({ allocation_status: 'Pending', limit: 100 });
      setPendingEmployees(res.data.employees);
      if (res.data.employees.length > 0) {
        setSelectedEmployeeId(res.data.employees[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, [selectedFloor, selectedZone]);

  useEffect(() => {
    fetchRecommendations();
  }, [quickAllocationEmployee]);

  const handleSeatClick = (seat) => {
    setSelectedSeatForAction(seat);
    setActionError('');
    setActionSuccess('');

    if (seat.status === 'Available') {
      if (quickAllocationEmployee) {
        // Automatically allocate if we are in quick-allocate mode
        performAllocation(quickAllocationEmployee._id, seat._id);
      } else {
        // Otherwise, open manual allocation dialog
        fetchPendingEmployees();
      }
    }
  };

  const performAllocation = async (employeeId, seatId) => {
    try {
      setActionError('');
      setActionSuccess('');
      const res = await allocateSeat(employeeId, seatId);
      setActionSuccess('Seat allocated successfully!');
      setQuickAllocationEmployee(null); // Clear active allocate context
      
      // Refresh seat visualizer
      fetchSeats();
      
      // Close action modal after a brief delay
      setTimeout(() => {
        setSelectedSeatForAction(null);
      }, 1000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Allocation failed');
    }
  };

  const performRelease = async (seatId) => {
    if (window.confirm('Are you sure you want to release this seat? The employee will be returned to unallocated status.')) {
      try {
        setActionError('');
        setActionSuccess('');
        await releaseSeat({ seat_id: seatId });
        setActionSuccess('Seat released successfully!');
        
        // Refresh seats list
        fetchSeats();

        setTimeout(() => {
          setSelectedSeatForAction(null);
        }, 1000);
      } catch (err) {
        setActionError(err.response?.data?.message || 'Release failed');
      }
    }
  };

  const applyRecommendation = (seat) => {
    setSelectedFloor(seat.floor);
    setSelectedZone(seat.zone);
    // Auto trigger allocation
    performAllocation(quickAllocationEmployee._id, seat._id);
  };

  // Group seats by Bay
  const bays = {};
  seats.forEach(seat => {
    if (!bays[seat.bay]) {
      bays[seat.bay] = [];
    }
    bays[seat.bay].push(seat);
  });

  // Sort seats in each bay numerically
  Object.keys(bays).forEach(bKey => {
    bays[bKey].sort((a, b) => {
      return a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true });
    });
  });

  return (
    <div className="space-y-6">
      {/* Quick Allocation Banner */}
      {quickAllocationEmployee && (
        <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Sparkles className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h3 className="font-bold text-white">Interactive Placement Assistant</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Allocating seat for <span className="font-semibold text-amber-400">{quickAllocationEmployee.name}</span> ({quickAllocationEmployee.employee_code}) · Project: <span className="font-semibold text-indigo-400">{quickAllocationEmployee.project_id?.name || 'Unassigned'}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setQuickAllocationEmployee(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel Allocation
            </button>
          </div>
        </div>
      )}

      {/* Grid Layout: Proximity Suggestions + Map Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Recommendation sidebar if allocating, else standard Navigation */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5 lg:col-span-1">
          {quickAllocationEmployee && recommendations ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Compass className="h-4 w-4" /> Team Proximity
              </h3>
              
              {recLoading ? (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="text-xs text-slate-500 mt-2">Computing closest seats...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.preferredLocation && (
                    <div className="text-xs bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20 text-indigo-300">
                      Primary team cluster found on <span className="font-bold text-white">Floor {recommendations.preferredLocation.floor}, Zone {recommendations.preferredLocation.zone}</span>.
                    </div>
                  )}

                  {/* Recommended Seating */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-2">Recommended Seats (Same Zone)</h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {recommendations.recommended?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">Preferred zone is fully occupied.</p>
                      ) : (
                        recommendations.recommended?.slice(0, 10).map(seat => (
                          <button 
                            key={seat._id}
                            onClick={() => applyRecommendation(seat)}
                            className="w-full text-left p-2.5 glass-card border-emerald-500/20 hover:border-emerald-500/50 rounded-lg flex items-center justify-between text-xs transition"
                          >
                            <div>
                              <span className="font-semibold text-emerald-400">Flr {seat.floor}, Z-{seat.zone}</span>
                              <div className="text-[10px] text-slate-400">Bay {seat.bay} · Seat {seat.seat_number}</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-emerald-500" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Alternatives */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-2">Alternate Zones / Floors</h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {recommendations.alternative?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">No alternative seats available.</p>
                      ) : (
                        recommendations.alternative?.slice(0, 15).map(seat => (
                          <button 
                            key={seat._id}
                            onClick={() => applyRecommendation(seat)}
                            className="w-full text-left p-2.5 glass-card border-slate-700/60 hover:border-indigo-500/40 rounded-lg flex items-center justify-between text-xs transition"
                          >
                            <div>
                              <span className="font-semibold text-slate-200">Flr {seat.floor}, Z-{seat.zone}</span>
                              <div className="text-[10px] text-slate-400">Bay {seat.bay} · Seat {seat.seat_number}</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Navigate Floor Map</h3>
              <p className="text-xs text-slate-500">Select a floor and zone to visualize seat arrangements and occupancies.</p>

              {/* Floor Selection */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-semibold block">Select Floor</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {floors.map(f => (
                    <button
                      key={f}
                      onClick={() => setSelectedFloor(f)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        selectedFloor === f 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone Selection */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-semibold block">Select Zone</label>
                <div className="grid grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {zones.map(z => (
                    <button
                      key={z}
                      onClick={() => setSelectedZone(z)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        selectedZone === z 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      Zone {z}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Map Visualizer */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header & Legend */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Floor {selectedFloor} · Zone {selectedZone} Layout</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click a seat square to perform seat allocation or release actions.</p>
            </div>
            
            {/* Status Legend */}
            <div className="flex flex-wrap gap-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/50 rounded"></span>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-red-500/25 border border-red-500/50 rounded"></span>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-purple-500/25 border border-purple-500/50 rounded"></span>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-500/25 border border-amber-500/50 rounded"></span>
                <span>Maintenance</span>
              </div>
            </div>
          </div>

          {/* Seat Grid Map */}
          {loading ? (
            <div className="text-center py-24 glass-panel rounded-2xl border border-slate-800">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-slate-400 mt-4 text-sm">Rendering floor coordinates...</p>
            </div>
          ) : Object.keys(bays).length === 0 ? (
            <div className="text-center py-24 glass-panel rounded-2xl border border-slate-800 text-slate-500 text-sm">
              No seats configured for Floor {selectedFloor}, Zone {selectedZone}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.keys(bays).sort().map(bayKey => (
                <div key={bayKey} className="glass-panel p-4.5 rounded-xl border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider">Bay {bayKey}</h4>
                  
                  {/* Grid of seats */}
                  <div className="grid grid-cols-5 gap-2.5">
                    {bays[bayKey].map(seat => {
                      // Seat color-coding based on status
                      let colorClass = 'bg-slate-900 border-slate-800 hover:bg-slate-800';
                      if (seat.status === 'Available') {
                        colorClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20';
                      } else if (seat.status === 'Occupied') {
                        colorClass = 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25';
                      } else if (seat.status === 'Reserved') {
                        colorClass = 'bg-purple-500/15 border-purple-500/30 text-purple-400 hover:bg-purple-500/25';
                      } else if (seat.status === 'Maintenance') {
                        colorClass = 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25';
                      }

                      // Check if seat is Amit's special seat to style it slightly different
                      const isSpecial = seat.floor === 2 && seat.zone === 'B' && seat.bay === '4' && seat.seat_number === 'B4-23';

                      return (
                        <button
                          key={seat._id}
                          onClick={() => handleSeatClick(seat)}
                          title={`Seat: ${seat.seat_number} | Status: ${seat.status}${seat.employee ? ` | Allocated: ${seat.employee.name}` : ''}`}
                          className={`group aspect-square rounded-lg border text-xs font-semibold flex flex-col items-center justify-center relative transition select-none ${colorClass} ${
                            isSpecial ? 'ring-2 ring-indigo-500/60' : ''
                          }`}
                        >
                          <span>{seat.seat_number.split('-')[1] || seat.seat_number}</span>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-950 border border-slate-850 rounded-lg text-[10px] text-slate-300 opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition z-40 shadow-xl space-y-0.5">
                            <div className="font-bold text-white border-b border-slate-900 pb-1 flex justify-between">
                              <span>Seat {seat.seat_number}</span>
                              <span className="text-[8px] uppercase tracking-wider">{seat.status}</span>
                            </div>
                            <div className="pt-1">Floor {seat.floor} · Zone {seat.zone} · Bay {seat.bay}</div>
                            {seat.employee && (
                              <>
                                <div className="font-medium text-amber-400 mt-1 truncate">Emp: {seat.employee.name}</div>
                                <div className="text-slate-500 truncate">Proj: {seat.employee.project_id?.name || 'Unassigned'}</div>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Dialog Modal */}
      {selectedSeatForAction && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setSelectedSeatForAction(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Armchair className="h-5 w-5 text-indigo-400" />
                Manage Seat {selectedSeatForAction.seat_number}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Floor {selectedSeatForAction.floor} · Zone {selectedSeatForAction.zone} · Bay {selectedSeatForAction.bay}</p>
            </div>

            <div className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" /> {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4" /> {actionSuccess}
                </div>
              )}

              {/* Action 1: Seat is Occupied -> Show release options */}
              {selectedSeatForAction.status === 'Occupied' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1 text-xs">
                    <div className="text-slate-500 font-semibold uppercase tracking-wider">Occupied By</div>
                    <div className="font-bold text-white text-sm">{selectedSeatForAction.employee?.name || 'Unknown Employee'}</div>
                    <div className="text-slate-400">{selectedSeatForAction.employee?.email}</div>
                    <div className="text-indigo-400 font-medium">Project: {selectedSeatForAction.employee?.project_id?.name || 'Unassigned'}</div>
                  </div>

                  {user.system_role !== 'Employee' ? (
                    <button 
                      onClick={() => performRelease(selectedSeatForAction._id)}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition"
                    >
                      Release Seat & Make Available
                    </button>
                  ) : (
                    <p className="text-[10px] text-slate-500 text-center italic mt-2">Only HR and Admin roles can release seat allocations.</p>
                  )}
                </div>
              )}

              {/* Action 2: Seat is Available -> Allocate to employee */}
              {selectedSeatForAction.status === 'Available' && (
                <div className="space-y-4">
                  {user.system_role === 'Employee' ? (
                    <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-center text-xs text-indigo-400 font-semibold">
                      This seat is Available. Log in as HR or Admin to perform seat allocations.
                    </div>
                  ) : quickAllocationEmployee ? (
                    <div className="space-y-3">
                      <div className="bg-indigo-950/20 border border-indigo-900 p-4 rounded-xl text-xs space-y-1 text-slate-300">
                        Confirming placement for:
                        <div className="font-bold text-white text-sm">{quickAllocationEmployee.name}</div>
                        <div>Project: {quickAllocationEmployee.project_id?.name || 'Unassigned'}</div>
                      </div>
                      <button 
                        onClick={() => performAllocation(quickAllocationEmployee._id, selectedSeatForAction._id)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition"
                      >
                        Confirm Allocation
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-400 font-semibold mb-1">Select Pending Employee</div>
                      {pendingEmployees.length === 0 ? (
                        <p className="text-xs text-amber-500 italic py-2">No unallocated active employees found.</p>
                      ) : (
                        <select 
                          value={selectedEmployeeId}
                          onChange={(e) => setSelectedEmployeeId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                        >
                          {pendingEmployees.map(emp => (
                            <option key={emp._id} value={emp._id}>
                              {emp.name} ({emp.employee_code} - {emp.project_id?.name || 'No Project'})
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <button 
                        onClick={() => performAllocation(selectedEmployeeId, selectedSeatForAction._id)}
                        disabled={pendingEmployees.length === 0}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition disabled:opacity-50"
                      >
                        Allocate Selected Employee
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action 3: Seat is Reserved or Maintenance */}
              {(selectedSeatForAction.status === 'Reserved' || selectedSeatForAction.status === 'Maintenance') && (
                <div className="space-y-3 text-center py-4">
                  <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto" />
                  <p className="text-xs text-slate-300">
                    This seat is marked as <span className="font-bold text-white">{selectedSeatForAction.status}</span> and cannot be allocated.
                  </p>
                  {user.system_role !== 'Admin' && (
                    <p className="text-[10px] text-slate-500">
                      Log in as an Administrator to modify asset coordinates.
                    </p>
                  )}
                </div>
              )}

              {/* Admin Asset Controls Toggle */}
              {user.system_role === 'Admin' && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admin Status Controls</div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Available', 'Reserved', 'Maintenance'].map((st) => (
                      <button
                        key={st}
                        onClick={async () => {
                          try {
                            setActionError('');
                            setActionSuccess('');
                            await updateSeatStatus(selectedSeatForAction._id, st);
                            setActionSuccess(`Seat status updated to ${st}`);
                            fetchSeats();
                            setTimeout(() => {
                              setSelectedSeatForAction(null);
                            }, 1000);
                          } catch (err) {
                            setActionError(err.response?.data?.message || 'Failed to update seat status');
                          }
                        }}
                        disabled={selectedSeatForAction.status === 'Occupied'}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition ${
                          selectedSeatForAction.status === st
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        } disabled:opacity-30`}
                      >
                        Set {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
