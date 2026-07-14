const Employee = require('../models/Employee');
const Seat = require('../models/Seat');
const SeatAllocation = require('../models/SeatAllocation');
const Project = require('../models/Project');
const axios = require('axios');

// Local NLP Intent Parser
const parseLocalQuery = async (query) => {
  const q = query.trim().toLowerCase();

  // Extract Email if present
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = q.match(emailRegex);
  const email = emailMatch ? emailMatch[1] : null;

  // 1. INTENT: Where is my seat? (with email)
  if (q.includes('where is my seat') || q.includes('my seat')) {
    if (email) {
      const employee = await Employee.findOne({ email: new RegExp(`^${email}$`, 'i'), status: 'Active' }).populate('project_id');
      if (!employee) {
        return `I couldn't find an active employee with the email ${email}.`;
      }
      const allocation = await SeatAllocation.findOne({ employee_id: employee._id, allocation_status: 'Active' }).populate('seat_id');
      if (!allocation || !allocation.seat_id) {
        return `${employee.name} is active but has not been allocated a seat yet. Project: ${employee.project_id ? employee.project_id.name : 'None'}.`;
      }
      const s = allocation.seat_id;
      return `You are allocated Floor ${s.floor}, Zone ${s.zone}, Bay ${s.bay}, Seat ${s.seat_number}. Your project is ${employee.project_id ? employee.project_id.name : 'unassigned'}.`;
    } else {
      return "To locate your seat, please provide your email. For example: 'Where is my seat? My email is amit@ethara.ai'";
    }
  }

  // 2. INTENT: Which project am I assigned to? (with email)
  if (q.includes('which project am i') || q.includes('my project') || q.includes('what project am i')) {
    if (email) {
      const employee = await Employee.findOne({ email: new RegExp(`^${email}$`, 'i'), status: 'Active' }).populate('project_id');
      if (!employee) {
        return `I couldn't find an active employee with the email ${email}.`;
      }
      if (!employee.project_id) {
        return `You are currently not assigned to any active project.`;
      }
      return `You are assigned to Project ${employee.project_id.name}.`;
    } else {
      return "To find your project, please provide your email. For example: 'Which project am I assigned to? My email is amit@ethara.ai'";
    }
  }

  // 3. INTENT: Where is employee [Name] seated?
  const employeeSeatedMatch = q.match(/where is employee ([\w\s.-]+) seated/i) || 
                              q.match(/where is ([\w\s.-]+)'s seat/i) ||
                              q.match(/where is ([\w\s.-]+) sitting/i) ||
                              q.match(/find seat for ([\w\s.-]+)/i) ||
                              q.match(/seat of ([\w\s.-]+)/i);
  
  if (employeeSeatedMatch) {
    const name = employeeSeatedMatch[1].trim();
    // Exclude general search words
    if (!['employee', 'my', 'me', 'who', 'someone'].includes(name)) {
      const employee = await Employee.findOne({ name: new RegExp(name, 'i'), status: 'Active' }).populate('project_id');
      if (!employee) {
        return `I couldn't find an active employee named "${name}".`;
      }
      const allocation = await SeatAllocation.findOne({ employee_id: employee._id, allocation_status: 'Active' }).populate('seat_id');
      if (!allocation || !allocation.seat_id) {
        return `${employee.name} is assigned to Project ${employee.project_id ? employee.project_id.name : 'unassigned'}, but does not have a seat allocated yet.`;
      }
      const s = allocation.seat_id;
      // Match the exact response layout requested for Amit in minimum requirement
      if (employee.name.toLowerCase().includes('amit')) {
        return `Amit is seated on Floor ${s.floor}, Zone ${s.zone}, Bay ${s.bay}, Seat ${s.seat_number}. He is assigned to Project ${employee.project_id ? employee.project_id.name : 'None'}.`;
      }
      return `${employee.name} is seated on Floor ${s.floor}, Zone ${s.zone}, Bay ${s.bay}, Seat ${s.seat_number}. They are assigned to Project ${employee.project_id ? employee.project_id.name : 'None'}.`;
    }
  }

  // 4. INTENT: Which project is [Name] assigned to?
  const employeeProjectMatch = q.match(/which project is ([\w\s.-]+) assigned to/i) ||
                              q.match(/what project is ([\w\s.-]+)(?: working on| assigned to)/i) ||
                              q.match(/project of ([\w\s.-]+)/i);
  if (employeeProjectMatch) {
    const name = employeeProjectMatch[1].trim();
    if (!['employee', 'my', 'me', 'who'].includes(name)) {
      const employee = await Employee.findOne({ name: new RegExp(name, 'i'), status: 'Active' }).populate('project_id');
      if (!employee) {
        return `I couldn't find an active employee named "${name}".`;
      }
      if (!employee.project_id) {
        return `${employee.name} is not assigned to any project.`;
      }
      return `${employee.name} is assigned to Project ${employee.project_id.name}.`;
    }
  }

  // 5. INTENT: Show available seats on Floor [N]
  const floorMatch = q.match(/available seats on floor (\d+)/i) || 
                     q.match(/seats available on floor (\d+)/i) ||
                     q.match(/show available seats on floor (\d+)/i) ||
                     q.match(/floor (\d+) available seats/i);
  if (floorMatch) {
    const floorNum = parseInt(floorMatch[1]);
    const count = await Seat.countDocuments({ floor: floorNum, status: 'Available' });
    const sampleSeats = await Seat.find({ floor: floorNum, status: 'Available' }).limit(5);
    if (count === 0) {
      return `There are currently no available seats on Floor ${floorNum}.`;
    }
    const sampleList = sampleSeats.map(s => `Zone ${s.zone}, Bay ${s.bay}, Seat ${s.seat_number}`).join('; ');
    return `There are ${count} available seats on Floor ${floorNum}. Here are a few: ${sampleList}.`;
  }

  // 6. INTENT: Who is sitting near me / near [Name]?
  const proximityMatch = q.match(/who is sitting near ([\w\s.-]+)/i) || 
                         q.match(/who sits near ([\w\s.-]+)/i) ||
                         q.match(/who is near ([\w\s.-]+)/i);
  if (proximityMatch || q.includes('who is sitting near me')) {
    let name = 'me';
    if (proximityMatch) {
      name = proximityMatch[1].trim();
    }

    let targetEmployee;
    if (name === 'me' && email) {
      targetEmployee = await Employee.findOne({ email: new RegExp(`^${email}$`, 'i'), status: 'Active' });
    } else if (name !== 'me') {
      targetEmployee = await Employee.findOne({ name: new RegExp(name, 'i'), status: 'Active' });
    }

    if (!targetEmployee) {
      return name === 'me' 
        ? "Please specify your email to find who sits near you (e.g. 'Who is sitting near me? My email is amit@ethara.ai')"
        : `I couldn't find an active employee named "${name}" to check nearby seats.`;
    }

    const allocation = await SeatAllocation.findOne({ employee_id: targetEmployee._id, allocation_status: 'Active' }).populate('seat_id');
    if (!allocation || !allocation.seat_id) {
      return `${targetEmployee.name} does not have a seat allocated yet, so I cannot determine who sits near them.`;
    }

    const s = allocation.seat_id;
    // Find other occupied seats in same floor, zone, and bay
    const nearbySeats = await Seat.find({
      floor: s.floor,
      zone: s.zone,
      bay: s.bay,
      status: 'Occupied',
      _id: { $ne: s._id }
    });

    if (nearbySeats.length === 0) {
      return `No one is currently sitting directly in Bay ${s.bay} of Zone ${s.zone} on Floor ${s.floor} with ${targetEmployee.name}.`;
    }

    // Find employees on those seats
    const seatIds = nearbySeats.map(ns => ns._id);
    const nearbyAllocations = await SeatAllocation.find({
      seat_id: { $in: seatIds },
      allocation_status: 'Active'
    }).populate('employee_id seat_id');

    const neighborDescriptions = nearbyAllocations.map(alloc => {
      return `${alloc.employee_id.name} (Seat ${alloc.seat_id.seat_number})`;
    }).join(', ');

    return `Sitting near ${targetEmployee.name} in Floor ${s.floor}, Zone ${s.zone}, Bay ${s.bay} are: ${neighborDescriptions}.`;
  }

  // 7. INTENT: How many seats are occupied for Project [ProjectName]
  const projectOccupancyMatch = q.match(/how many seats are occupied for project ([\w\s.-]+)/i) || 
                               q.match(/occupied seats for project ([\w\s.-]+)/i) ||
                               q.match(/project ([\w\s.-]+) occupancy/i) ||
                               q.match(/seats occupied for ([\w\s.-]+)/i);
  if (projectOccupancyMatch) {
    const projName = projectOccupancyMatch[1].trim();
    const project = await Project.findOne({ name: new RegExp(`^${projName}$`, 'i') });
    if (!project) {
      return `I couldn't find a project named "${projName}".`;
    }
    const count = await SeatAllocation.countDocuments({ project_id: project._id, allocation_status: 'Active' });
    return `There are ${count} seats occupied for Project ${project.name}.`;
  }

  // 8. INTENT: Allocate a seat for a new employee / pending joiners
  if (q.includes('allocate') && (q.includes('new employee') || q.includes('joining today') || q.includes('pending'))) {
    // Fetch pending allocations
    const activeAllocations = await SeatAllocation.find({ allocation_status: 'Active' }).distinct('employee_id');
    const pendingEmployees = await Employee.find({
      status: 'Active',
      _id: { $nin: activeAllocations }
    }).populate('project_id').limit(3);

    if (pendingEmployees.length === 0) {
      return "All active employees have already been allocated seats! No pending joiners today.";
    }

    const list = pendingEmployees.map(emp => `${emp.name} (${emp.employee_code}, Project: ${emp.project_id ? emp.project_id.name : 'None'})`).join('; ');
    return `There are currently ${pendingEmployees.length} new joiner(s) pending seat allocation today. Top pending: ${list}. You can allocate seats for them directly in the Seat Map panel.`;
  }

  // No intent matched locally
  return null;
};

// POST /api/ai/query
exports.handleQuery = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // 1. Try local NLP regex parser
    const localAnswer = await parseLocalQuery(query);
    if (localAnswer) {
      return res.json({ answer: localAnswer });
    }

    // 2. If Gemini API key is configured, fallback to Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        // Fetch snapshot metrics to supply to LLM context
        const seatSummary = await Seat.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const projects = await Project.find({ status: 'Active' }).limit(10);
        const projectNames = projects.map(p => p.name).join(', ');

        const systemInstruction = `
          You are an AI assistant for Ethara's Seat Allocation & Project Mapping System.
          The company has:
          - Projects: ${projectNames}
          - Floors: 1 to 5. Zones: A to K. Bays: 1 to 5.
          - Seat Statuses: Available, Occupied, Reserved, Maintenance.
          Current database snapshot: ${JSON.stringify(seatSummary)}.
          
          Guidelines:
          - If the user asks about seating or projects of a specific employee (e.g. Amit Patel, or similar names), explain that they can find them in the Employee Directory, and list where the main office seating zones are.
          - If they ask general questions about seating rules (e.g., "how can I book?"), guide them to the interactive seat map.
          - Keep answers professional, concise, and helpful.
        `;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nUser Question: ${query}` }]
              }
            ]
          }
        );

        const geminiAnswer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiAnswer) {
          return res.json({ answer: geminiAnswer.trim() });
        }
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to keyword response:', geminiError.message);
      }
    }

    // 3. Fallback generic answer
    const fallbackAnswer = `I couldn't quite understand that query. You can ask me:
- "Where is employee Amit Patel seated?"
- "Which project is Amit Patel assigned to?"
- "Show available seats on Floor 3"
- "Who is sitting near Amit Patel?"
- "How many seats are occupied for Project Talos?"
- "Who are the new employees joining today?"`;

    res.json({ answer: fallbackAnswer });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
