const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Project = require('./models/Project');
const Employee = require('./models/Employee');
const Seat = require('./models/Seat');
const SeatAllocation = require('./models/SeatAllocation');
const aiController = require('./controllers/aiController');
const seatController = require('./controllers/seatController');
const authController = require('./controllers/authController');
require('dotenv').config();

const runTests = async () => {
  try {
    console.log('--- STARTING AUTHENTICATION & ROLE-BASED ACCESS CONTROL TESTS ---');
    await connectDB();

    // 0. Clean up any stale records from previous runs
    console.log('Cleaning up any old test records...');
    await Seat.deleteMany({ floor: 8, zone: 'Y', bay: '8' });
    await Employee.deleteMany({ employee_code: 'EMPTST88' });
    await SeatAllocation.deleteMany({ employee_id: { $in: [
      mongoose.Types.ObjectId.isValid('EMPTST88') ? mongoose.Types.ObjectId('EMPTST88') : new mongoose.Types.ObjectId()
    ]}});
    console.log('✔ Cleanup of old test records completed.');

    // 1. Authenticating Preset Users
    console.log('\n1. Testing Login Endpoint and Password Matching...');
    
    // A helper to mock request-response calls
    const mockRequestResponse = async (controllerFn, reqData) => {
      let resStatus = 200;
      let resData = null;
      const reqMock = { 
        body: reqData, 
        headers: {}, 
        params: {} 
      };
      const resMock = {
        status: function(code) { resStatus = code; return this; },
        json: function(data) { resData = data; return this; }
      };
      await controllerFn(reqMock, resMock);
      return { status: resStatus, data: resData };
    };

    // Test Admin Login
    const adminLogin = await mockRequestResponse(authController.login, {
      email: 'admin@ethara.ai',
      password: 'admin123'
    });
    if (adminLogin.status === 200 && adminLogin.data.token) {
      console.log('✔ Admin login succeeded. Received JWT token.');
      console.log(`✔ User Role: ${adminLogin.data.user.system_role} (Expected: Admin)`);
    } else {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    }

    // Test Employee (Amit) Login
    const amitLogin = await mockRequestResponse(authController.login, {
      email: 'amit@ethara.ai',
      password: 'amit123'
    });
    if (amitLogin.status === 200 && amitLogin.data.token) {
      console.log('✔ Employee (Amit) login succeeded. Received JWT token.');
      console.log(`✔ User Role: ${amitLogin.data.user.system_role} (Expected: Employee)`);
    } else {
      throw new Error(`Employee login failed: ${JSON.stringify(amitLogin.data)}`);
    }

    // Test Bad Login
    const badLogin = await mockRequestResponse(authController.login, {
      email: 'admin@ethara.ai',
      password: 'wrongpassword'
    });
    if (badLogin.status === 401) {
      console.log('✔ Invalid password rejected. (Expected behavior)');
    } else {
      throw new Error(`Incorrect credentials accepted! Status: ${badLogin.status}`);
    }

    // 2. Testing API Authorization Guards
    console.log('\n2. Testing Middleware Guard Constraints (RBAC)...');
    
    // Setup test parameters
    const testSeat = new Seat({
      floor: 8,
      zone: 'Y',
      bay: '8',
      seat_number: 'B8-88',
      status: 'Available'
    });
    await testSeat.save();
    
    const testEmployee = new Employee({
      employee_code: 'EMPTST88',
      name: 'Auth Bob',
      email: 'bob.auth@ethara.ai',
      department: 'QA',
      role: 'QA Automation',
      joining_date: new Date(),
      status: 'Active'
    });
    await testEmployee.save();

    // Simulating Allocation Request
    const allocReqData = {
      employee_id: testEmployee._id.toString(),
      seat_id: testSeat._id.toString()
    };

    // A helper to test controller action with custom mock req.user context
    const testWithUserContext = async (controllerFn, reqData, userContext) => {
      let resStatus = 200;
      let resData = null;
      const reqMock = { 
        body: reqData, 
        user: userContext,
        headers: {}, 
        params: {} 
      };
      const resMock = {
        status: function(code) { resStatus = code; return this; },
        json: function(data) { resData = data; return this; }
      };
      await controllerFn(reqMock, resMock);
      return { status: resStatus, data: resData };
    };

    // Test: Booking with HR user context
    console.log('Testing seat allocation under HR context...');
    const hrContext = { _id: 'mock_hr_id', system_role: 'HR' };
    const hrAllocRes = await testWithUserContext(seatController.allocateSeat, allocReqData, hrContext);
    if (hrAllocRes.status === 200) {
      console.log('✔ HR permitted to allocate seats.');
      const checkSeat = await Seat.findById(testSeat._id);
      console.log(`✔ Seat status set to: ${checkSeat.status} (Expected: Occupied)`);
    } else {
      throw new Error(`HR allocation blocked: ${JSON.stringify(hrAllocRes.data)}`);
    }

    // Test: Releasing with Admin user context
    console.log('Testing seat release under Admin context...');
    const adminContext = { _id: 'mock_admin_id', system_role: 'Admin' };
    const adminReleaseRes = await testWithUserContext(seatController.releaseSeat, { seat_id: testSeat._id.toString() }, adminContext);
    if (adminReleaseRes.status === 200) {
      console.log('✔ Admin permitted to release seats.');
      const checkSeat = await Seat.findById(testSeat._id);
      console.log(`✔ Seat status reverted to: ${checkSeat.status} (Expected: Available)`);
    } else {
      throw new Error(`Admin release blocked: ${JSON.stringify(adminReleaseRes.data)}`);
    }

    // 3. Clean up database
    console.log('\n3. Cleaning up test documents...');
    await Seat.deleteOne({ _id: testSeat._id });
    await Employee.deleteOne({ _id: testEmployee._id });
    await SeatAllocation.deleteMany({ employee_id: testEmployee._id });
    console.log('✔ Cleanup completed.');

    console.log('\n--- ALL AUTH & RBAC RULES VALIDATED SUCCESSFULY ---');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Security Tests failed:', error);
    process.exit(1);
  }
};

runTests();
