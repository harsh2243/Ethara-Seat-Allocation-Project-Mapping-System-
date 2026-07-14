const Employee = require('../models/Employee');
const SeatAllocation = require('../models/SeatAllocation');
const Seat = require('../models/Seat');

// Create employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, department, role, joining_date, status, project_id, employee_code } = req.body;
    
    if (!name || !email || !department || !role || !joining_date) {
      return res.status(400).json({ message: 'Required fields: name, email, department, role, joining_date' });
    }

    // Check duplicate email
    const emailExists = await Employee.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Generate or validate employee code
    let code = employee_code;
    if (!code) {
      const count = await Employee.countDocuments();
      code = `EMP${String(count + 1).padStart(4, '0')}`;
    } else {
      const codeExists = await Employee.findOne({ employee_code: code });
      if (codeExists) {
        return res.status(400).json({ message: 'Employee code already exists' });
      }
    }

    const newEmployee = new Employee({
      employee_code: code,
      name,
      email,
      department,
      role,
      joining_date,
      status: status || 'Active',
      project_id: project_id || null
    });

    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List employees with search, filters, and pagination
exports.listEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const projectId = req.query.project_id || '';
    const status = req.query.status || '';
    const allocationStatus = req.query.allocation_status || ''; // 'Allocated', 'Pending'

    const query = {};

    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employee_code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ];
    }

    if (projectId) {
      query.project_id = projectId;
    }

    if (status) {
      query.status = status;
    }

    // Fetch matching employee IDs first if filtering by allocation status
    if (allocationStatus) {
      const activeAllocations = await SeatAllocation.find({ allocation_status: 'Active' });
      const allocatedEmployeeIds = activeAllocations.map(alloc => alloc.employee_id.toString());

      if (allocationStatus === 'Allocated') {
        query._id = { $in: allocatedEmployeeIds };
      } else if (allocationStatus === 'Pending') {
        query._id = { $nin: allocatedEmployeeIds };
      }
    }

    // Execute paginated query
    const skip = (page - 1) * limit;
    const employees = await Employee.find(query)
      .populate('project_id')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(query);

    // For each employee, look up their active seat allocation details
    const employeeList = [];
    for (let emp of employees) {
      const allocation = await SeatAllocation.findOne({ 
        employee_id: emp._id, 
        allocation_status: 'Active' 
      }).populate('seat_id');

      employeeList.push({
        ...emp.toObject(),
        seat: allocation ? allocation.seat_id : null,
        allocation: allocation || null
      });
    }

    res.json({
      employees: employeeList,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single employee details
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id).populate('project_id');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const allocation = await SeatAllocation.findOne({
      employee_id: employee._id,
      allocation_status: 'Active'
    }).populate('seat_id');

    res.json({
      ...employee.toObject(),
      seat: allocation ? allocation.seat_id : null,
      allocation: allocation || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check email uniqueness if email is being updated
    if (updates.email) {
      const emailExists = await Employee.findOne({ email: updates.email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use by another employee' });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(id, updates, { new: true }).populate('project_id');
    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // If status is updated to Inactive, release seat if allocated
    if (updates.status === 'Inactive') {
      const activeAllocation = await SeatAllocation.findOne({ employee_id: id, allocation_status: 'Active' });
      if (activeAllocation) {
        activeAllocation.allocation_status = 'Released';
        activeAllocation.released_date = new Date();
        await activeAllocation.save();

        await Seat.findByIdAndUpdate(activeAllocation.seat_id, { status: 'Available' });
      }
    }

    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate employee
exports.deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Release allocated seat if any
    const activeAllocation = await SeatAllocation.findOne({ employee_id: id, allocation_status: 'Active' });
    if (activeAllocation) {
      activeAllocation.allocation_status = 'Released';
      activeAllocation.released_date = new Date();
      await activeAllocation.save();

      await Seat.findByIdAndUpdate(activeAllocation.seat_id, { status: 'Available' });
    }

    res.json({ message: 'Employee deactivated and seat released successfully', employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
