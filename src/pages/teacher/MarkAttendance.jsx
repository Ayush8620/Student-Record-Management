import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, addDoc, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Check, X, Search } from 'lucide-react';
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

  const handleToggleAttendance = (studentId) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : (prev[studentId] === 'absent' ? 'Bunk' : 'present')
    }));
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
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Mark Attendance</h1>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full border border-gray-300 rounded-md p-2">
            <option value="">Select Class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full border border-gray-300 rounded-md p-2">
            <option value="">Select Subject...</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Number</label>
          <input type="number" min="1" max="10" value={lectureNumber} onChange={e => setLectureNumber(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div className="lg:col-span-4 flex justify-end">
          <button
            onClick={handleFetchStudents}
            disabled={loading}
            className="bg-gray-800 text-white px-6 py-2 rounded-md hover:bg-gray-900 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />} Load Students
          </button>
        </div>
      </div>

      {/* Attendance List */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Student List</h2>
            <button disabled={submitting} onClick={handleSubmit} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm font-medium flex items-center gap-2">
              {submitting && <Loader2 className="animate-spin w-4 h-4" />} Submit Attendance
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-medium w-16">Roll</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {students.map((student, idx) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-500">{idx + 1}</td>
                    <td className="p-4 font-medium text-gray-900">{student.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${attendanceData[student.id] === 'present' ? 'bg-green-100 text-green-800' :
                          attendanceData[student.id] === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {attendanceData[student.id].toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleAttendance(student.id)}
                        className="text-gray-500 hover:text-primary-600 bg-gray-100 hover:bg-primary-50 px-3 py-1 rounded-md transition-colors"
                      >
                        Toggle
                      </button>
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
