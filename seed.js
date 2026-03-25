import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_PASSWORD = 'password123';

const seedData = async () => {
  console.log("Starting enhanced database seeding...");

  try {
    // 1. Departments
    console.log("Seeding departments...");
    const departments = ['CSE', 'IT', 'ECE', 'ME'];
    for (const dept of departments) {
      await setDoc(doc(db, 'departments', dept), { name: dept });
    }

    // 2. Classes
    console.log("Seeding classes...");
    const classes = [
      { id: 'CSE_4_A', department: 'CSE', semester: 4, section: 'A' },
      { id: 'CSE_4_B', department: 'CSE', semester: 4, section: 'B' },
      { id: 'IT_2_A', department: 'IT', semester: 2, section: 'A' }
    ];
    for (const cls of classes) {
      await setDoc(doc(db, 'classes', cls.id), cls);
    }

    // 3. Sessions
    console.log("Seeding sessions...");
    await setDoc(doc(db, 'sessions', '2025-2026'), {
      name: '2025-2026',
      startYear: 2025,
      endYear: 2026,
      isActive: true
    });

    // 4. Announcements
    console.log("Seeding announcements...");
    await setDoc(doc(db, 'announcements', 'notice_1'), {
      title: "Mid Semester Exam Notice",
      message: "Mid semester exams start from April 12.",
      createdAt: new Date().toISOString(),
      createdBy: "Admin User",
      targetRole: "all"
    });
    
    await setDoc(doc(db, 'announcements', 'notice_2'), {
      title: "Assignment Deadline",
      message: "Submit DBMS assignment before April 5.",
      createdAt: new Date().toISOString(),
      createdBy: "Rohit Sharma",
      targetRole: "student"
    });

    // 5. Users
    console.log("Seeding users...");
    const usersToCreate = [
      { name: "Admin User", email: "admin@erp.com", role: "admin" },
      { name: "Rohit Sharma", email: "rohit@erp.com", role: "teacher", department: "CSE", subjects: ["DBMS", "CN"], assignedClasses: ["CSE_4_A"] },
      { name: "Priya Singh", email: "priya@erp.com", role: "teacher", department: "CSE", subjects: ["OS", "AI"], assignedClasses: ["CSE_4_A"] },
      { name: "Ayush Yadav", email: "ayush@erp.com", role: "student", department: "CSE", semester: 4, classId: "CSE_4_A", rollNumber: "CSE401" },
      { name: "Rahul Verma", email: "rahul@erp.com", role: "student", department: "CSE", semester: 4, classId: "CSE_4_A", rollNumber: "CSE402" }
    ];

    const uids = {};

    for (const userData of usersToCreate) {
      let uid;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, DEFAULT_PASSWORD);
        uid = userCredential.user.uid;
        console.log(`Created Auth user: ${userData.email}`);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          console.log(`User ${userData.email} exists. Signing in to fetch UID...`);
          const signin = await signInWithEmailAndPassword(auth, userData.email, DEFAULT_PASSWORD);
          uid = signin.user.uid;
        } else {
          throw err;
        }
      }
      
      uids[userData.name] = uid;

      const baseUserData = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: new Date().toISOString()
      };
      if (userData.department) baseUserData.department = userData.department;
      if (userData.semester) baseUserData.semester = userData.semester;
      if (userData.classId) baseUserData.classId = userData.classId;
      if (userData.subjects) baseUserData.subjects = userData.subjects;
      if (userData.assignedClasses) baseUserData.assignedClasses = userData.assignedClasses;

      await setDoc(doc(db, 'users', uid), baseUserData);

      if (userData.role === 'student') {
        await setDoc(doc(db, 'students', uid), {
          name: userData.name,
          rollNumber: userData.rollNumber,
          department: userData.department,
          semester: userData.semester,
          classId: userData.classId,
          uid: uid
        });
      } else if (userData.role === 'teacher') {
        await setDoc(doc(db, 'teachers', uid), {
          name: userData.name,
          department: userData.department,
          subjects: userData.subjects || [],
          assignedClasses: userData.assignedClasses || [],
          uid: uid
        });
      }
    }

    // 6. Subjects
    console.log("Seeding subjects...");
    const subjects = [
      { name: 'DBMS', code: 'CS401', department: 'CSE', semester: 4, assignedTeacherId: uids['Rohit Sharma'] || '' },
      { name: 'OS', code: 'CS402', department: 'CSE', semester: 4, assignedTeacherId: uids['Priya Singh'] || '' },
      { name: 'CN', code: 'CS403', department: 'CSE', semester: 4, assignedTeacherId: uids['Rohit Sharma'] || '' },
      { name: 'AI', code: 'CS404', department: 'CSE', semester: 4, assignedTeacherId: uids['Priya Singh'] || '' },
      { name: 'TOC', code: 'CS405', department: 'CSE', semester: 4, assignedTeacherId: '' }
    ];

    for (const sub of subjects) {
      await setDoc(doc(db, 'subjects', sub.name), sub);
    }

    // 7. Attendance (Flattened structure used by our React App)
    console.log("Seeding attendance...");
    if (uids['Ayush Yadav'] && uids['Rahul Verma'] && uids['Rohit Sharma']) {
      const attendanceRecords = [
        // Lecture 1
        { classId: 'CSE_4_A', subjectId: 'DBMS', date: '2026-03-25', lectureNumber: 1, studentId: uids['Ayush Yadav'], status: 'present', teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        { classId: 'CSE_4_A', subjectId: 'DBMS', date: '2026-03-25', lectureNumber: 1, studentId: uids['Rahul Verma'], status: 'absent', teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        // Lecture 2
        { classId: 'CSE_4_A', subjectId: 'DBMS', date: '2026-03-25', lectureNumber: 2, studentId: uids['Ayush Yadav'], status: 'present', teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        { classId: 'CSE_4_A', subjectId: 'DBMS', date: '2026-03-25', lectureNumber: 2, studentId: uids['Rahul Verma'], status: 'present', teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() }
      ];

      for (const record of attendanceRecords) {
        await addDoc(collection(db, 'attendance'), record);
      }
    }

    // 8. Marks (Flattened structure used by our React App)
    console.log("Seeding marks...");
    if (uids['Ayush Yadav'] && uids['Rahul Verma'] && uids['Rohit Sharma']) {
      const marksRecords = [
        { subjectId: 'DBMS', examType: 'sessional_1', studentId: uids['Ayush Yadav'], marksObtained: 18, maxMarks: 30, teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        { subjectId: 'DBMS', examType: 'sessional_1', studentId: uids['Rahul Verma'], marksObtained: 20, maxMarks: 30, teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        { subjectId: 'DBMS', examType: 'sessional_2', studentId: uids['Ayush Yadav'], marksObtained: 22, maxMarks: 30, teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        { subjectId: 'DBMS', examType: 'sessional_2', studentId: uids['Rahul Verma'], marksObtained: 19, maxMarks: 30, teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        { subjectId: 'DBMS', examType: 'remedial', studentId: uids['Ayush Yadav'], marksObtained: 24, maxMarks: 30, teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        { subjectId: 'DBMS', examType: 'remedial', studentId: uids['Rahul Verma'], marksObtained: 21, maxMarks: 30, teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        { subjectId: 'DBMS', examType: 'assignment', studentId: uids['Ayush Yadav'], marksObtained: 8, maxMarks: 10, teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() },
        { subjectId: 'DBMS', examType: 'assignment', studentId: uids['Rahul Verma'], marksObtained: 7, maxMarks: 10, teacherId: uids['Rohit Sharma'], timestamp: new Date().toISOString() }
      ];

      for (const record of marksRecords) {
        await addDoc(collection(db, 'marks'), record);
      }
    }

    console.log("Enhanced database seeding completed successfully!");
    process.exit(0);

  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
};

seedData();
