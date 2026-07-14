const Seat = require('../models/Seat');
const Employee = require('../models/Employee');
const SeatAllocation = require('../models/SeatAllocation');
const Project = require('../models/Project');

// Create seat
exports.createSeat = async (req, res) => {
  try {
    const { floor, zone, bay, seat_number, status } = req.body;
    if (!floor || !zone || !bay || !seat_number) {
      return res.status(400).json({ message: 'Floor, zone, bay, and seat number are required' });
    }

    const existingSeat = await Seat.findOne({ floor, zone, bay, seat_number });
    if (existingSeat) {
      return res.status(400).json({ message: 'Seat already exists at this location' });
    }

    const newSeat = new Seat({ floor, zone, bay, seat_number, status: status || 'Available' });
    await newSeat.save();
    res.status(201).json(newSeat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List seats with paging and filters
exports.listSeats = async (req, res) => {
  try {
    const floor = req.query.floor;
    const zone = req.query.zone;
    const bay = req.query.bay;
    const status = req.query.status;
    
    const query = {};
    if (floor) query.floor = parseInt(floor);
    if (zone) query.zone = zone;
    if (bay) query.bay = bay;
    if (status) query.status = status;

    // If visualizing a specific zone, return all seats in that zone (no pagination)
    if (floor && zone) {
      const seats = await Seat.find(query).sort({ bay: 1, seat_number: 1 });
      
      // Populate allocations for these seats
      const seatsWithAllocations = [];
      for (let seat of seats) {
        const allocation = await SeatAllocation.findOne({
          seat_id: seat._id,
          allocation_status: 'Active'
        }).populate({
          path: 'employee_id',
          populate: { path: 'project_id' }
        });

        seatsWithAllocations.push({
          ...seat.toObject(),
          allocation: allocation || null,
          employee: allocation ? allocation.employee_id : null
        });
      }
      return res.json(seatsWithAllocations);
    }

    // Otherwise, apply pagination to avoid crashing on 5,500 items
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const seats = await Seat.find(query).sort({ floor: 1, zone: 1, bay: 1, seat_number: 1 }).skip(skip).limit(limit);
    const total = await Seat.countDocuments(query);

    const seatsWithAllocations = [];
    for (let seat of seats) {
      const allocation = await SeatAllocation.findOne({
        seat_id: seat._id,
        allocation_status: 'Active'
      }).populate('employee_id');

      seatsWithAllocations.push({
        ...seat.toObject(),
        allocation: allocation || null,
        employee: allocation ? allocation.employee_id : null
      });
    }

    res.json({
      seats: seatsWithAllocations,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Suggest and list available seats based on project team proximity
exports.listAvailableSeats = async (req, res) => {
  try {
    const { project_id, employee_id } = req.query;

    let targetProjectId = project_id;
    if (!targetProjectId && employee_id) {
      const employee = await Employee.findById(employee_id);
      if (employee && employee.project_id) {
        targetProjectId = employee.project_id.toString();
      }
    }

    // Find all available seats
    const availableSeats = await Seat.find({ status: 'Available' });

    if (!targetProjectId) {
      // No project provided, just return available seats ordered by floor/zone
      return res.json({
        recommended: availableSeats.slice(0, 50),
        alternative: [],
        message: 'No project context. Returning general available seats.'
      });
    }

    // Proximity suggestion algorithm:
    // 1. Find where existing active employees for this project are seated
    const projectAllocations = await SeatAllocation.find({
      project_id: targetProjectId,
      allocation_status: 'Active'
    }).populate('seat_id');

    if (projectAllocations.length === 0) {
      return res.json({
        recommended: availableSeats.slice(0, 50),
        alternative: [],
        message: 'No active seat allocations for this project. Returning general available seats.'
      });
    }

    // Count density by floor and zone
    const density = {}; // format: { "floor-zone": count }
    projectAllocations.forEach(alloc => {
      if (alloc.seat_id) {
        const key = `${alloc.seat_id.floor}-${alloc.seat_id.zone}`;
        density[key] = (density[key] || 0) + 1;
      }
    });

    // Sort combinations by density descending
    const sortedClusteredZones = Object.keys(density).sort((a, b) => density[b] - density[a]);
    const topClusteredKey = sortedClusteredZones[0]; // e.g., "2-B"
    const [topFloor, topZone] = topClusteredKey.split('-');
    const preferredFloor = parseInt(topFloor);
    const preferredZone = topZone;

    // Categorize available seats into tiers
    const tier1 = []; // Same floor, same zone
    const tier2 = []; // Same floor, different zone
    const tier3 = []; // Different floor

    availableSeats.forEach(seat => {
      if (seat.floor === preferredFloor && seat.zone === preferredZone) {
        tier1.push(seat);
      } else if (seat.floor === preferredFloor) {
        tier2.push(seat);
      } else {
        tier3.push(seat);
      }
    });

    // Sort tier lists logically
    const sortByLocation = (a, b) => {
      if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
      if (a.bay !== b.bay) return a.bay.localeCompare(b.bay);
      return a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true });
    };

    tier1.sort(sortByLocation);
    tier2.sort(sortByLocation);
    tier3.sort(sortByLocation);

    res.json({
      preferredLocation: { floor: preferredFloor, zone: preferredZone },
      recommended: tier1, // Tier 1: Prioritized proximity seats
      alternative: [...tier2, ...tier3], // Tiers 2 & 3: Suggestions if preferred zone is full
      totalAvailable: availableSeats.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Allocate seat to employee
exports.allocateSeat = async (req, res) => {
  try {
    const { employee_id, seat_id } = req.body;

    if (!employee_id || !seat_id) {
      return res.status(400).json({ message: 'Employee ID and Seat ID are required' });
    }

    // 1. Verify employee exists and is active
    const employee = await Employee.findById(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    if (employee.status !== 'Active') {
      return res.status(400).json({ message: 'Cannot allocate seat to an inactive employee' });
    }

    // 2. Verify seat exists and is available
    const seat = await Seat.findById(seat_id);
    if (!seat) {
      return res.status(404).json({ message: 'Seat not found' });
    }
    if (seat.status !== 'Available') {
      return res.status(400).json({ message: `Seat is currently ${seat.status}. Only Available seats can be allocated.` });
    }

    // 3. Verify employee does not already have an active seat allocation
    const existingEmployeeAlloc = await SeatAllocation.findOne({
      employee_id,
      allocation_status: 'Active'
    });
    if (existingEmployeeAlloc) {
      return res.status(400).json({ message: 'Employee already has an active seat allocation. Release it first.' });
    }

    // 4. Verify seat does not already have an active employee allocation
    const existingSeatAlloc = await SeatAllocation.findOne({
      seat_id,
      allocation_status: 'Active'
    });
    if (existingSeatAlloc) {
      return res.status(400).json({ message: 'Seat is already allocated to another active employee.' });
    }

    // Check project mapping - fallback if employee has no project
    let projectId = employee.project_id;
    if (!projectId) {
      // Find a default active project or throw error
      const defaultProj = await Project.findOne({ status: 'Active' });
      if (!defaultProj) {
        return res.status(400).json({ message: 'Employee must be assigned to an active project before seat allocation' });
      }
      projectId = defaultProj._id;
      employee.project_id = projectId;
      await employee.save();
    }

    // 5. Update seat status to Occupied
    seat.status = 'Occupied';
    await seat.save();

    // 6. Create SeatAllocation record
    const allocation = new SeatAllocation({
      employee_id,
      seat_id,
      project_id: projectId,
      allocation_status: 'Active',
      allocation_date: new Date()
    });
    await allocation.save();

    res.json({
      message: 'Seat allocated successfully',
      allocation,
      seat,
      employee
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Release seat
exports.releaseSeat = async (req, res) => {
  try {
    const { seat_id, employee_id } = req.body;

    if (!seat_id && !employee_id) {
      return res.status(400).json({ message: 'Either seat_id or employee_id is required to release a seat' });
    }

    const searchCriteria = { allocation_status: 'Active' };
    if (seat_id) searchCriteria.seat_id = seat_id;
    if (employee_id) searchCriteria.employee_id = employee_id;

    // Find the active allocation
    const allocation = await SeatAllocation.findOne(searchCriteria);
    if (!allocation) {
      // Self-healing check: if seat is Occupied but no allocation exists, release it
      if (seat_id) {
        const seat = await Seat.findById(seat_id);
        if (seat && seat.status === 'Occupied') {
          seat.status = 'Available';
          await seat.save();
          return res.json({ message: 'Seat was occupied but had no active allocation. Seat status reset to Available.' });
        }
      }
      return res.status(404).json({ message: 'No active seat allocation found' });
    }

    // Release allocation
    allocation.allocation_status = 'Released';
    allocation.released_date = new Date();
    await allocation.save();

    // Reset seat status
    const seat = await Seat.findById(allocation.seat_id);
    if (seat) {
      seat.status = 'Available';
      await seat.save();
    }

    res.json({
      message: 'Seat released successfully',
      allocation,
      seat
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update seat status (Admin only control)
exports.updateSeat = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updatedSeat = await Seat.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedSeat) {
      return res.status(404).json({ message: 'Seat not found' });
    }

    res.json(updatedSeat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
