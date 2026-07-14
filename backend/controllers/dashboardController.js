const Seat = require('../models/Seat');
const Employee = require('../models/Employee');
const SeatAllocation = require('../models/SeatAllocation');
const Project = require('../models/Project');

// Get general summary metrics
exports.getSummary = async (req, res) => {
  try {
    // 1. Get counts from Seat collection
    const seatCounts = await Seat.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      Available: 0,
      Occupied: 0,
      Reserved: 0,
      Maintenance: 0
    };
    seatCounts.forEach(c => {
      if (counts.hasOwnProperty(c._id)) {
        counts[c._id] = c.count;
      }
    });

    const totalSeats = await Seat.countDocuments();
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });

    // 2. Count pending allocations (Active employees without an active SeatAllocation)
    const activeAllocations = await SeatAllocation.find({ allocation_status: 'Active' }).distinct('employee_id');
    const pendingAllocCount = await Employee.countDocuments({
      status: 'Active',
      _id: { $nin: activeAllocations }
    });

    res.json({
      totalEmployees,
      totalSeats,
      occupiedSeats: counts.Occupied,
      availableSeats: counts.Available,
      reservedSeats: counts.Reserved,
      maintenanceSeats: counts.Maintenance,
      pendingAllocationCount: pendingAllocCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get project-wise seat utilization
exports.getProjectUtilization = async (req, res) => {
  try {
    const projectStats = await SeatAllocation.aggregate([
      { $match: { allocation_status: 'Active' } },
      {
        $group: {
          _id: '$project_id',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      { $unwind: '$project' },
      {
        $project: {
          _id: 1,
          name: '$project.name',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Also find projects that have 0 allocations to display them with 0 count
    const allProjects = await Project.find({ status: 'Active' });
    const result = allProjects.map(proj => {
      const stat = projectStats.find(s => s._id.toString() === proj._id.toString());
      return {
        project_id: proj._id,
        name: proj.name,
        count: stat ? stat.count : 0
      };
    });

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get floor-wise seat occupancy
exports.getFloorUtilization = async (req, res) => {
  try {
    const floorStats = await Seat.aggregate([
      {
        $group: {
          _id: '$floor',
          total: { $sum: 1 },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] } },
          available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } },
          reserved: { $sum: { $cond: [{ $eq: ['$status', 'Reserved'] }, 1, 0] } },
          maintenance: { $sum: { $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = floorStats.map(stat => {
      const occupiedRate = stat.total > 0 ? (stat.occupied / stat.total) * 100 : 0;
      return {
        floor: stat._id,
        total: stat.total,
        occupied: stat.occupied,
        available: stat.available,
        reserved: stat.reserved,
        maintenance: stat.maintenance,
        occupancyRate: parseFloat(occupiedRate.toFixed(2))
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
