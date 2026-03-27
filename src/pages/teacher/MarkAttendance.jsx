import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, addDoc, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

export default function MarkAttendance() {
  const { currentUser } = useAuth();
  const { showAlert } = useModal();

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lectureNumber, setLectureNumber] = useState('1');

  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const assignedClasses = userData.assignedClasses || [];
          const assignedSubjects = userData.subjects || [];

          setClasses(assignedClasses.map(c => ({ id: c, name: c })));
          setSubjects(assignedSubjects.map(s => ({ id: s, name: s })));
        }
      } catch (error) {
        console.error("Error fetching teacher dropdowns", error);
      }
    };
    fetchDropdowns();
  }, [currentUser]);

  const handleFetchStudents = async () => {
    if (!selectedClass) return showAlert("Select a class first", "error");
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      const allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const studentList = allStudents.filter(s => s.classId === selectedClass);
      
      if (studentList.length === 0) {
         showAlert("No students found in this class.", "info");
      }
      setStudents(studentList);

      // Initialize attendance data (default present)
      const initialData = {};
      studentList.forEach(s => {
        initialData[s.id] = 'present';
      });
      setAttendanceData(initialData);

    } catch (error) {
      console.error(error);
      showAlert("Failed to fetch students", "error");
    } finally {
      setLoading(false);
    }
  };

  const setStudentAttendance = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllStatus = (status) => {
    const newData = {};
    students.forEach(s => { newData[s.id] = status; });
    setAttendanceData(newData);
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !date || !lectureNumber) {
      return showAlert("Fill all details", "error");
    }
    setSubmitting(true);
    try {
      const batchPromises = Object.keys(attendanceData).map(studentId => {
        return addDoc(collection(db, 'attendance'), {
          studentId,
          classId: selectedClass,
          subjectId: selectedSubject,
          date,
          lectureNumber: parseInt(lectureNumber),
          status: attendanceData[studentId],
          teacherId: currentUser.uid,
          timestamp: new Date().toISOString()
        });
      });
      await Promise.all(batchPromises);
      showAlert("Attendance marked successfully", "success");
      setStudents([]); // Reset screen
    } catch (error) {
      console.error(error);
      showAlert("Failed to mark attendance", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Log Attendance</h2>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">Record presence, unexcused absences, and truancy.</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 mb-8 group">
        <div className="flex items-center gap-2 mb-6">
           <span className="material-symbols-outlined text-primary">rule_settings</span>
           <h3 className="text-lg font-bold text-on-surface font-headline">Session Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none appearance-none cursor-pointer">
              <option value="" disabled>Select Class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Subject</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none appearance-none cursor-pointer">
              <option value="" disabled>Select Subject...</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Lecture No.</label>
            <input type="number" min="1" max="10" value={lectureNumber} onChange={e => setLectureNumber(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" />
          </div>
        </div>

        <div className="flex justify-end border-t border-outline-variant/10 pt-5 mt-2">
          <button
            onClick={handleFetchStudents}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm font-bold text-sm transition-all active:scale-[0.98] ${loading ? "bg-surface-container text-outline cursor-not-allowed" : "bg-inverse-surface text-inverse-on-surface hover:bg-on-surface hover:shadow-md"}`}
          >
            {loading ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">group</span>} 
            {loading ? "Loading Roster..." : "Load Roster"}
          </button>
        </div>
      </div>

      {/* Attendance List */}
      {students.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
          <div className="p-4 flex-col gap-4 sm:flex-row px-6 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-start sm:items-center bg-gradient-to-r from-primary-container/30 to-transparent">
            <div>
              <h2 className="text-lg font-bold text-on-surface font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">checklist</span>
                Attendance Roster
              </h2>
              <p className="text-xs font-medium text-on-surface-variant mt-0.5">{students.length} students loaded</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-surface bg-opacity-50 p-1 rounded-lg border border-outline-variant/20 w-full sm:w-auto">
                <button onClick={() => markAllStatus('present')} className="flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-md hover:bg-green-100 text-green-700 transition-colors">
                  All Present
                </button>
                <div className="w-px h-4 bg-outline-variant/30"></div>
                <button onClick={() => markAllStatus('absent')} className="flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-md hover:bg-red-100 text-red-700 transition-colors">
                  All Absent
                </button>
              </div>

              <button 
                disabled={submitting} 
                onClick={handleSubmit} 
                className={`w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm font-bold text-sm transition-all active:scale-[0.98] ${submitting ? "bg-primary/50 text-white cursor-not-allowed" : "bg-primary hover:bg-primary-container text-on-primary shadow-primary/20"}`}
              >
                {submitting ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>} 
                {submitting ? "Saving..." : "Submit Register"}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto text-on-surface">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider font-bold border-b border-outline-variant/20">
                  <th className="p-4 pl-6 w-16">No.</th>
                  <th className="p-4 min-w-[200px]">Student Name</th>
                  <th className="p-4 pr-6 text-right sm:text-center">Mark Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {students.map((student, idx) => (
                  <tr key={student.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/80 transition-colors">
                    <td className="p-4 pl-6 font-bold text-outline">{idx + 1}</td>
                    <td className="p-4 border-r border-outline-variant/5">
                       <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-primary-fixed/30 text-primary-fixed-variant flex items-center justify-center font-bold text-xs shrink-0">
                           {student.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                           <p className="font-bold text-on-surface leading-tight">{student.name}</p>
                           <p className="text-xs text-outline font-medium mt-0.5">{student.rollNumber || 'No Roll'}</p>
                         </div>
                       </div>
                    </td>
                    <td className="p-4 pr-6 flex justify-end sm:justify-center">
                      <div className="flex items-center rounded-lg border border-outline-variant/30 p-1 bg-surface-container text-xs font-bold overflow-hidden shadow-sm">
                        <button
                          onClick={() => setStudentAttendance(student.id, 'present')}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition-all ${
                            attendanceData[student.id] === 'present' 
                              ? 'bg-green-100 text-green-800 shadow-sm ring-1 ring-green-200' 
                              : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                          }`}
                        >
                           {attendanceData[student.id] === 'present' && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                           Present
                        </button>
                        <button
                          onClick={() => setStudentAttendance(student.id, 'absent')}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition-all ${
                            attendanceData[student.id] === 'absent' 
                              ? 'bg-red-100 text-red-800 shadow-sm ring-1 ring-red-200' 
                              : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                          }`}
                        >
                           {attendanceData[student.id] === 'absent' && <span className="material-symbols-outlined text-[14px]">cancel</span>}
                           Absent
                        </button>
                        <button
                          onClick={() => setStudentAttendance(student.id, 'bunk')}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition-all ${
                            attendanceData[student.id] === 'bunk' 
                              ? 'bg-yellow-100 text-yellow-800 shadow-sm ring-1 ring-yellow-200' 
                              : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                          }`}
                        >
                           {attendanceData[student.id] === 'bunk' && <span className="material-symbols-outlined text-[14px]">directions_run</span>}
                           Bunk
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
