const mongoose = require('mongoose');
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const Seat = require('../models/Seat');
const SeatAllocation = require('../models/SeatAllocation');
const connectDB = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Names arrays for generating employees
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
  'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
  'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Sharma', 'Khan', 'Singh', 'Ali'
];

const departments = ['Engineering', 'Product', 'HR', 'Admin', 'Growth', 'Operations', 'Finance', 'Design'];
const roles = ['Software Engineer', 'Senior Engineer', 'Product Manager', 'HR Generalist', 'Operations Manager', 'Designer', 'QA Lead', 'Finance Analyst'];

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Pre-calculating bcrypt hashes for demo passwords...');
    const salt = await bcrypt.genSalt(10);
    const defaultHash = await bcrypt.hash('ethara123', salt);
    const adminHash = await bcrypt.hash('admin123', salt);
    const hrHash = await bcrypt.hash('hr123', salt);
    const amitHash = await bcrypt.hash('amit123', salt);
    console.log('✔ Password hashes pre-calculated.');

    console.log('Clearing existing database collections...');
    await Project.deleteMany({});
    await Employee.deleteMany({});
    await Seat.deleteMany({});
    await SeatAllocation.deleteMany({});

    console.log('Generating Projects...');
    const projectNames = ['Indigo', 'Indreed', 'Mydreed', 'Preed', 'Serfy', 'Oreed', 'bedegreed', 'Opreed', 'Serry', 'Kaary', 'Mered', 'Talos'];
    const projectDocs = projectNames.map(name => ({
      name,
      description: `Description for Project ${name}`,
      manager_name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      status: 'Active'
    }));
    const createdProjects = await Project.insertMany(projectDocs);
    const projectMap = {};
    createdProjects.forEach(proj => {
      projectMap[proj.name] = proj;
    });
    console.log(`Successfully created ${createdProjects.length} projects.`);

    console.log('Generating 5,500 Seats...');
    const seatDocs = [];
    const floors = [1, 2, 3, 4, 5];
    const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    const bays = ['1', '2', '3', '4', '5'];

    for (const f of floors) {
      for (const z of zones) {
        for (const b of bays) {
          for (let sNum = 1; sNum <= 20; sNum++) {
            seatDocs.push({
              floor: f,
              zone: z,
              bay: b,
              seat_number: `B${b}-${sNum}`,
              status: 'Available'
            });
          }
          if (f === 2 && z === 'B' && b === '4') {
            for (let sNum = 21; sNum <= 25; sNum++) {
              seatDocs.push({
                floor: f,
                zone: z,
                bay: b,
                seat_number: `B${b}-${sNum}`,
                status: 'Available'
              });
            }
          }
        }
      }
    }

    console.log(`Prepared ${seatDocs.length} seat documents. Inserting...`);
    const createdSeats = await Seat.insertMany(seatDocs);
    console.log(`Successfully created ${createdSeats.length} seats.`);

    const seatMap = {};
    createdSeats.forEach(seat => {
      const key = `${seat.floor}-${seat.zone}-${seat.bay}-${seat.seat_number}`;
      seatMap[key] = seat;
    });

    console.log('Generating 5,000 Employees...');
    const employeeDocs = [];

    // 1. Seed special Administrator
    employeeDocs.push({
      employee_code: 'EMP0000',
      name: 'David Miller',
      email: 'admin@ethara.ai',
      department: 'Admin',
      role: 'System Administrator',
      joining_date: new Date('2024-01-01'),
      status: 'Active',
      project_id: null,
      password: adminHash,
      system_role: 'Admin'
    });

    // 2. Seed special HR Manager
    employeeDocs.push({
      employee_code: 'EMP0000-HR',
      name: 'Sarah Jenkins',
      email: 'hr@ethara.ai',
      department: 'HR',
      role: 'HR Manager',
      joining_date: new Date('2024-01-10'),
      status: 'Active',
      project_id: null,
      password: hrHash,
      system_role: 'HR'
    });
    
    // 3. Seed employee Amit (Amit Patel), assigned to Project Talos
    const amitCode = 'EMP0001';
    employeeDocs.push({
      employee_code: amitCode,
      name: 'Amit Patel',
      email: 'amit@ethara.ai',
      department: 'Engineering',
      role: 'Software Engineer',
      joining_date: new Date('2025-01-15'),
      status: 'Active',
      project_id: projectMap['Talos']._id,
      password: amitHash,
      system_role: 'Employee'
    });

    // 4. Generate the rest up to 5000
    let empIndex = 2;
    for (let fName of firstNames) {
      for (let lName of lastNames) {
        if (empIndex > 5000) break;

        // Skip Amit's name to avoid conflict
        if (fName === 'Amit' || (fName === 'James' && lName === 'Smith' && empIndex === 2)) {
          // skipped
        }

        const name = `${fName} ${lName}`;
        const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${empIndex}@ethara.ai`;
        const code = `EMP${String(empIndex).padStart(4, '0')}`;
        const dept = departments[Math.floor(Math.random() * departments.length)];
        const role = roles[Math.floor(Math.random() * roles.length)];
        
        const randomProjectName = projectNames[Math.floor(Math.random() * projectNames.length)];
        const project = projectMap[randomProjectName];

        employeeDocs.push({
          employee_code: code,
          name,
          email,
          department: dept,
          role,
          joining_date: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 3600 * 1000)),
          status: 'Active',
          project_id: project._id,
          password: defaultHash,
          system_role: 'Employee'
        });

        empIndex++;
      }
      if (empIndex > 5000) break;
    }

    console.log(`Inserting ${employeeDocs.length} employee documents...`);
    const createdEmployees = await Employee.insertMany(employeeDocs);
    console.log(`Successfully created ${createdEmployees.length} employees.`);

    console.log('Allocating Seats and Setting Statuses...');
    
    // Total employees generated: ~4953 (4950 general + 3 special)
    // We allocate 4800 of them
    const amitEmployee = createdEmployees.find(emp => emp.employee_code === amitCode);
    const amitSeatKey = '2-B-4-B4-23';
    const amitSeat = seatMap[amitSeatKey];
    
    if (!amitSeat) {
      throw new Error('Amit seat B4-23 on Floor 2, Zone B was not generated properly!');
    }

    const allocations = [];

    // Allocate Amit
    allocations.push({
      employee_id: amitEmployee._id,
      seat_id: amitSeat._id,
      project_id: amitEmployee.project_id,
      allocation_status: 'Active',
      allocation_date: new Date()
    });
    
    amitSeat.status = 'Occupied';

    // Filter out Admin & HR since they usually don't sit in project bays (or keep them pending)
    // Filter seats to not double book Amit
    const availableSeats = createdSeats.filter(s => s._id.toString() !== amitSeat._id.toString());
    availableSeats.sort(() => Math.random() - 0.5);

    // Filter employees to allocate (excluding Admin, HR, and Amit)
    const employeesToAllocate = createdEmployees.filter(
      emp => emp.system_role === 'Employee' && emp.employee_code !== amitCode
    ).slice(0, 4799); // We want 4800 total allocations including Amit

    const employeesPending = createdEmployees.filter(
      emp => !allocations.some(a => a.employee_id.toString() === emp._id.toString()) && 
             !employeesToAllocate.some(e => e._id.toString() === emp._id.toString())
    );

    console.log(`Allocating ${employeesToAllocate.length} employees to seats...`);
    let seatIndex = 0;

    for (let i = 0; i < employeesToAllocate.length; i++) {
      const emp = employeesToAllocate[i];
      const seat = availableSeats[seatIndex];
      
      seat.status = 'Occupied';
      allocations.push({
        employee_id: emp._id,
        seat_id: seat._id,
        project_id: emp.project_id,
        allocation_status: 'Active',
        allocation_date: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 3600 * 1000))
      });

      seatIndex++;
    }

    // Set 150 reserved, 10 maintenance
    let reservedCount = 0;
    let maintenanceCount = 0;

    for (let i = seatIndex; i < availableSeats.length; i++) {
      const seat = availableSeats[i];
      if (reservedCount < 150) {
        seat.status = 'Reserved';
        reservedCount++;
      } else if (maintenanceCount < 10) {
        seat.status = 'Maintenance';
        maintenanceCount++;
      } else {
        seat.status = 'Available';
      }
    }

    console.log('Bulk updating seat statuses in MongoDB...');
    const seatBulkOperations = createdSeats.map(seat => ({
      updateOne: {
        filter: { _id: seat._id },
        update: { status: seat.status }
      }
    }));
    await Seat.bulkWrite(seatBulkOperations);

    console.log(`Bulk inserting ${allocations.length} seat allocations...`);
    await SeatAllocation.insertMany(allocations);

    console.log('\n--- SEEDING COMPLETED SUCCESSFULY WITH AUTH INTEGRATION ---');
    console.log(`Total Projects: ${createdProjects.length}`);
    console.log(`Total Employees: ${createdEmployees.length}`);
    console.log(`- Allocated: ${allocations.length}`);
    console.log(`- Pending Allocation: ${employeesPending.length}`);
    console.log(`Total Seats: ${createdSeats.length}`);
    console.log(`- Occupied Seats: ${createdSeats.filter(s => s.status === 'Occupied').length}`);
    console.log(`- Available Seats: ${createdSeats.filter(s => s.status === 'Available').length}`);
    console.log(`- Reserved Seats: ${createdSeats.filter(s => s.status === 'Reserved').length}`);
    console.log(`- Maintenance Seats: ${createdSeats.filter(s => s.status === 'Maintenance').length}`);
    console.log('\n--- PRESET USER CREDENTIALS FOR TESTING ---');
    console.log(`1. Admin:  admin@ethara.ai / admin123`);
    console.log(`2. HR:     hr@ethara.ai / hr123`);
    console.log(`3. Staff:  amit@ethara.ai / amit123`);
    console.log(`4. Generic Employee: email of any other employee / ethara123`);
    console.log('------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
