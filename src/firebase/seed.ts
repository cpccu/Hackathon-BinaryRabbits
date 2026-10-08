import { collection, writeBatch, doc, getDocs, Timestamp, getFirestore } from 'firebase/firestore';

export async function seedDatabase(db: ReturnType<typeof getFirestore>) {
  const batch = writeBatch(db);
  let count = 0;

  // Helper for dates
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowPlus2 = new Date(now); tomorrowPlus2.setDate(tomorrowPlus2.getDate() + 2);
  const tomorrowPlus3 = new Date(now); tomorrowPlus3.setDate(tomorrowPlus3.getDate() + 3);
  const tomorrowPlus5 = new Date(now); tomorrowPlus5.setDate(tomorrowPlus5.getDate() + 5);
  const tomorrowPlus7 = new Date(now); tomorrowPlus7.setDate(tomorrowPlus7.getDate() + 7);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const threeDaysAgo = new Date(now); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Check if data exists
  const eventsSnap = await getDocs(collection(db, 'events'));
  if (!eventsSnap.empty) {
    console.log('Database already contains events. Skipping seed to prevent duplicates.');
    return 0;
  }

  // Clubs
  const clubs = [
    { id: 'club1', name: 'CPCCU - Computer Programming Club, City University', description: '[DEMO] Computer Programming Club', category: 'technology' },
    { id: 'club2', name: 'Robotics Club CU - Robotics & Innovation', description: '[DEMO] Robotics & Innovation', category: 'technology' },
    { id: 'club3', name: 'Debate Club CU - Debate & Public Speaking', description: '[DEMO] Debate & Public Speaking', category: 'cultural' },
    { id: 'club4', name: 'Cultural Club CU - Arts & Cultural Activities', description: '[DEMO] Arts & Cultural Activities', category: 'cultural' },
    { id: 'club5', name: 'Sports Club CU - Sports & Athletics', description: '[DEMO] Sports & Athletics', category: 'sports' }
  ];

  clubs.forEach(c => {
    const ref = doc(db, 'clubs', c.id);
    batch.set(ref, {
      name: c.name,
      description: c.description,
      category: c.category,
      createdAt: Timestamp.now()
    });
    count++;
  });

  // Events
  const events = [
    { id: 'evt1', title: '[DEMO] CPCCU Programming Contest', clubId: 'club1', clubName: 'CPCCU', category: 'contest', location: 'Lab 302', startTime: tomorrow, endTime: tomorrow, capacity: 50, status: 'published' },
    { id: 'evt2', title: '[DEMO] Debate Workshop', clubId: 'club3', clubName: 'Debate Club', category: 'workshop', location: 'Auditorium', startTime: tomorrowPlus2, endTime: tomorrowPlus2, capacity: 30, status: 'published' },
    { id: 'evt3', title: '[DEMO] Music Festival', clubId: 'club4', clubName: 'Cultural Club', category: 'cultural', location: 'Open Air Stage', startTime: tomorrowPlus5, endTime: tomorrowPlus5, capacity: 200, status: 'published' },
    { id: 'evt4', title: '[DEMO] Career Guidance Seminar', clubId: 'club1', clubName: 'CPCCU', category: 'seminar', location: 'Seminar Hall', startTime: tomorrowPlus7, endTime: tomorrowPlus7, capacity: 100, status: 'published' },
    { id: 'evt5', title: '[DEMO] Robotics Workshop', clubId: 'club2', clubName: 'Robotics Club', category: 'workshop', location: 'Lab 405', startTime: tomorrowPlus3, endTime: tomorrowPlus3, capacity: 25, status: 'published' }
  ];

  events.forEach(e => {
    const ref = doc(db, 'events', e.id);
    batch.set(ref, {
      title: e.title,
      clubId: e.clubId,
      clubName: e.clubName,
      category: e.category,
      location: e.location,
      startTime: Timestamp.fromDate(e.startTime),
      endTime: Timestamp.fromDate(e.endTime),
      capacity: e.capacity,
      status: e.status,
      registeredCount: 0,
      createdAt: Timestamp.now(),
      createdBy: 'admin_demo'
    });
    count++;
  });

  // Courses
  const courses = [
    { id: 'CSE211', courseCode: 'CSE 211', title: 'Data Structures', departmentId: 'CSE', systemType: 'bi-semester', levelTerm: '2/1' },
    { id: 'CSE212', courseCode: 'CSE 212', title: 'Digital Logic Design', departmentId: 'CSE', systemType: 'bi-semester', levelTerm: '2/1' },
    { id: 'CSE213', courseCode: 'CSE 213', title: 'Computer Organization', departmentId: 'CSE', systemType: 'bi-semester', levelTerm: '2/2' },
    { id: 'CSE221', courseCode: 'CSE 221', title: 'Object Oriented Programming', departmentId: 'CSE', systemType: 'bi-semester', levelTerm: '2/2' },
    { id: 'CSE222', courseCode: 'CSE 222', title: 'Database Systems', departmentId: 'CSE', systemType: 'bi-semester', levelTerm: '2/2' }
  ];

  courses.forEach(c => {
    const ref = doc(db, 'courses', c.id);
    batch.set(ref, { ...c, createdAt: Timestamp.now() });
    count++;
  });

  // Resources & PYQ Metadata
  const resources = [
    { id: 'res1', title: '[DEMO] CSE 211 Midterm Spring 2026 PYQ', courseId: 'CSE211', category: 'pyq', isVerified: true, uploaderId: 'admin_demo', url: 'https://example.com/demo.pdf', upvotes: 5, pyqMeta: { sessionYear: 2026, sessionName: 'Spring', examType: 'Midterm' } },
    { id: 'res2', title: '[DEMO] CSE 211 Final Fall 2025 PYQ', courseId: 'CSE211', category: 'pyq', isVerified: true, uploaderId: 'admin_demo', url: 'https://example.com/demo.pdf', upvotes: 3, pyqMeta: { sessionYear: 2025, sessionName: 'Fall', examType: 'Final' } },
    { id: 'res3', title: '[DEMO] Data Structures Lecture Slides - Chapter 1', courseId: 'CSE211', category: 'slide', isVerified: true, uploaderId: 'admin_demo', url: 'https://example.com/demo.pdf', upvotes: 8 },
    { id: 'res4', title: '[DEMO] Student Notes - Graph Theory Summary', courseId: 'CSE211', category: 'note', isVerified: false, uploaderId: 'student_demo', url: 'https://example.com/demo.pdf', upvotes: 12 },
    { id: 'res5', title: '[DEMO] Lab Manual - Binary Trees', courseId: 'CSE211', category: 'lab', isVerified: false, uploaderId: 'admin_demo', url: 'https://example.com/demo.pdf', upvotes: 2 }
  ];

  resources.forEach(r => {
    const { pyqMeta, ...resData } = r;
    const ref = doc(db, 'resources', r.id);
    batch.set(ref, { ...resData, createdAt: Timestamp.now() });
    count++;

    if (pyqMeta) {
      const metaRef = doc(db, 'pyqMetadata', `meta_${r.id}`);
      batch.set(metaRef, {
        resourceId: r.id,
        courseId: r.courseId,
        ...pyqMeta
      });
      count++;
    }
  });

  // Bus Routes
  const routes = [
    { id: 'routeA', name: 'Route A: Campus → Mirpur → Dhanmondi → Gulshan', stops: ['Main Campus Gate 1', 'Mirpur 10', 'Mirpur 2', 'Dhanmondi 27', 'Gulshan 1'] },
    { id: 'routeB', name: 'Route B: Campus → Uttara → Airport', stops: ['Main Campus Gate 2', 'Uttara Sector 3', 'Uttara Sector 10', 'Airport Road'] },
    { id: 'routeC', name: 'Route C: Campus → Savar → Ashulia', stops: ['Main Campus Gate 1', 'Savar Bus Stand', 'Hemayetpur', 'Ashulia'] }
  ];

  routes.forEach(r => {
    const ref = doc(db, 'busRoutes', r.id);
    batch.set(ref, { ...r, createdAt: Timestamp.now() });
    count++;
  });

  // Bus Schedules
  const schedules = [
    { routeId: 'routeA', direction: 'to_campus', time: '07:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeA', direction: 'to_campus', time: '07:30', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeA', direction: 'to_campus', time: '08:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeA', direction: 'to_campus', time: '08:30', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeA', direction: 'from_campus', time: '14:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeA', direction: 'from_campus', time: '15:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeA', direction: 'from_campus', time: '16:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeA', direction: 'from_campus', time: '17:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeA', direction: 'from_campus', time: '17:30', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    
    { routeId: 'routeB', direction: 'to_campus', time: '07:15', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeB', direction: 'to_campus', time: '07:45', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeB', direction: 'to_campus', time: '08:15', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeB', direction: 'from_campus', time: '14:30', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeB', direction: 'from_campus', time: '15:30', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeB', direction: 'from_campus', time: '16:30', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeB', direction: 'from_campus', time: '17:15', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },

    { routeId: 'routeC', direction: 'to_campus', time: '07:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeC', direction: 'to_campus', time: '08:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeC', direction: 'from_campus', time: '15:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] },
    { routeId: 'routeC', direction: 'from_campus', time: '17:00', operatingDays: ['monday','tuesday','wednesday','thursday','friday'] }
  ];

  schedules.forEach((s, idx) => {
    const ref = doc(db, 'busSchedules', `sched_${idx}`);
    batch.set(ref, { ...s, createdAt: Timestamp.now() });
    count++;
  });

  // Campus Policies
  const policies = [
    { id: 'pol1', title: 'Exam Hall Rules', content: '[DEMO] Students must carry their valid university ID card and admit card. Electronic devices are strictly prohibited. Arrive at least 15 minutes before the exam starts.' },
    { id: 'pol2', title: 'Admit Card', content: '[DEMO] Admit cards can be printed from the student portal after clearing all dues. A hard copy is mandatory for final exams.' },
    { id: 'pol3', title: 'Course Drop', content: '[DEMO] Courses can be dropped without penalty within the first two weeks of the semester. Late drops will result in a W grade on the transcript.' },
    { id: 'pol4', title: 'Retake Policy', content: '[DEMO] Students may retake a course to improve their grade. The highest grade achieved will be recorded on the final transcript.' },
    { id: 'pol5', title: 'Tuition Fees', content: '[DEMO] Tuition fees must be paid by the 15th of the first month of the semester. Late payments incur a 5% penalty per week.' },
    { id: 'pol6', title: 'Waiver Requirements', content: '[DEMO] Merit-based waivers require maintaining a minimum CGPA of 3.80. Waivers are reviewed on a per-semester basis.' },
    { id: 'pol7', title: 'Code of Conduct', content: '[DEMO] Students are expected to maintain professional behavior on campus. Any form of harassment or bullying will result in disciplinary action.' }
  ];

  policies.forEach(p => {
    const ref = doc(db, 'campusPolicies', p.id);
    batch.set(ref, { ...p, createdAt: Timestamp.now() });
    count++;
  });

  // Urgent Notices
  const notices = [
    { id: 'not1', title: '[DEMO] CRITICAL: CSE-221 class moved to Room 402 today', type: 'critical', activeUntil: Timestamp.fromDate(tomorrow), createdAt: Timestamp.now(), createdBy: 'admin_demo' },
    { id: 'not2', title: '[DEMO] INFO: Bus Route A schedule changed - extra departure at 5:30 PM', type: 'info', activeUntil: Timestamp.fromDate(tomorrowPlus7), createdAt: Timestamp.now(), createdBy: 'admin_demo' }
  ];

  notices.forEach(n => {
    const ref = doc(db, 'urgentNotices', n.id);
    batch.set(ref, n);
    count++;
  });

  // Lost & Found Items
  const lostFoundItems = [
    { id: 'lf1', type: 'lost', title: '[DEMO] Lost: Black Backpack', itemType: 'bags', location: 'Building A lobby', date: yesterday, status: 'open', userId: 'student1' },
    { id: 'lf2', type: 'lost', title: '[DEMO] Lost: Student ID Card', itemType: 'id_card', location: 'Library', date: threeDaysAgo, status: 'open', userId: 'student2' },
    { id: 'lf3', type: 'found', title: '[DEMO] Found: Blue Water Bottle', itemType: 'personal_accessories', location: 'Cafeteria', date: twoDaysAgo, status: 'open', userId: 'student3' },
    { id: 'lf4', type: 'found', title: '[DEMO] Found: Earphones', itemType: 'electronics', location: 'Lab 302', date: yesterday, status: 'open', userId: 'student4' }
  ];

  lostFoundItems.forEach(lf => {
    const ref = doc(db, 'lostFoundItems', lf.id);
    batch.set(ref, {
      ...lf,
      date: Timestamp.fromDate(lf.date),
      createdAt: Timestamp.now()
    });
    count++;
  });

  // Complaints
  const complaints = [
    { id: 'comp1', trackingCode: 'CU-2026-0001', category: 'transport', title: '[DEMO] Transport: Bus arrived 30 minutes late', status: 'submitted', studentId: 'student1', isAnonymous: false, createdAt: yesterday },
    { id: 'comp2', trackingCode: 'CU-2026-0002', category: 'facility', title: '[DEMO] Facility: AC not working in Lab 302', status: 'under_review', studentId: 'student2', isAnonymous: false, createdAt: twoDaysAgo },
    { id: 'comp3', trackingCode: 'CU-2026-0003', category: 'academic', title: '[DEMO] Academic: Marks not updated', status: 'action_taken', studentId: 'student3', isAnonymous: false, createdAt: threeDaysAgo },
    { id: 'comp4', trackingCode: 'CU-2026-0004', category: 'administration', title: '[DEMO] Administration: Library hours should be extended', status: 'resolved', studentId: 'student4', isAnonymous: false, createdAt: tomorrowPlus7 }
  ];

  complaints.forEach(c => {
    const ref = doc(db, 'complaints', c.id);
    batch.set(ref, {
      ...c,
      createdAt: Timestamp.fromDate(c.createdAt),
      statusHistory: [
        { status: 'submitted', timestamp: Timestamp.fromDate(c.createdAt), note: 'Initial submission' }
      ]
    });
    count++;
  });

  await batch.commit();
  return count;
}
