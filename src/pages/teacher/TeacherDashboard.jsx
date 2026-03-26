import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getCountFromServer, getDoc, doc, getDocs, limit, orderBy, deleteDoc } from 'firebase/firestore';
import { useModal } from '../../context/ModalContext';
import { Trash2 } from 'lucide-react';

export default function TeacherDashboard() {
  const { currentUser } = useAuth();
  const { showConfirm, showAlert } = useModal();
  const [stats, setStats] = useState({ assignedClasses: 0, totalLectures: 0 });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [recentMarks, setRecentMarks] = useState([]);
  const [studentMap, setStudentMap] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);
          const classesCount = userData.assignedClasses ? userData.assignedClasses.length : 0;
          
          const lecturesQ = query(collection(db, "attendance"), where("teacherId", "==", currentUser.uid));
          const lecturesSnap = await getCountFromServer(lecturesQ);
          
          setStats({
            assignedClasses: classesCount,
            totalLectures: lecturesSnap.data().count
          });

          // Fetch student name mapping
          const studentsQ = query(collection(db, "users"), where("role", "==", "student"));
          const studentsSnap = await getDocs(studentsQ);
          const map = {};
          studentsSnap.docs.forEach(d => map[d.id] = d.data().name);
          setStudentMap(map);

          // Fetch recent attendance
          const attQ = query(collection(db, "attendance"), where("teacherId", "==", currentUser.uid));
          const attSnap = await getDocs(attQ);
          const attData = attSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          attData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setRecentAttendance(attData.slice(0, 5));

          // Fetch recent marks
          const marksQ = query(collection(db, "marks"), where("teacherId", "==", currentUser.uid));
          const marksSnap = await getDocs(marksQ);
          const marksData = marksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          marksData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setRecentMarks(marksData.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching teacher stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    fetchStats();
  }, [currentUser]);

  const handleClearAll = (type) => {
    const typeLabel = type === 'attendance' ? 'Attendance Logs' : 'Marks Logs';
    showConfirm(`Are you sure you want to clear ALL your ${typeLabel}? This action cannot be undone.`, async () => {
      try {
        const q = query(collection(db, type), where("teacherId", "==", currentUser.uid));
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(d => deleteDoc(doc(db, type, d.id)));
        await Promise.all(deletePromises);
        
        showAlert(`All ${typeLabel} cleared successfully.`, "success");
        if (type === 'attendance') {
           setRecentAttendance([]);
           setStats(prev => ({ ...prev, totalLectures: 0 }));
        }
        if (type === 'marks') {
           setRecentMarks([]);
        }
      } catch (error) {
        console.error(`Error clearing ${type}:`, error);
        showAlert(`Failed to clear ${typeLabel}.`, "error");
      }
    });
  };

  const handleDeleteLog = (id, type) => {
    showConfirm("Are you sure you want to delete this log entry?", async () => {
      try {
        await deleteDoc(doc(db, type, id));
        if (type === 'attendance') {
          setRecentAttendance(prev => prev.filter(item => item.id !== id));
          setStats(prev => ({ ...prev, totalLectures: Math.max(0, prev.totalLectures - 1) }));
        } else {
          setRecentMarks(prev => prev.filter(item => item.id !== id));
        }
        showAlert("Log entry deleted.", "success");
      } catch (error) {
        console.error("Error deleting log:", error);
        showAlert("Failed to delete log entry.", "error");
      }
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Teacher Overview</h1>
      {profile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Welcome Back,</p>
            <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
          </div>
          <div className="text-right">
            <span className="bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              {profile.department} Department
            </span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
          <h3 className="text-gray-500 text-sm font-medium">Lectures Marked</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
             {loading ? "..." : stats.totalLectures}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-3">Assigned Classes</h3>
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <span className="text-gray-400 text-sm">Loading...</span>
            ) : profile?.assignedClasses?.length > 0 ? (
              profile.assignedClasses.map((c, i) => (
                <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-semibold border border-indigo-100">{c}</span>
              ))
            ) : (
              <span className="text-gray-400 text-sm italic">None assigned</span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-3">Assigned Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <span className="text-gray-400 text-sm">Loading...</span>
            ) : profile?.subjects?.length > 0 ? (
              profile.subjects.map((s, i) => (
                <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md text-xs font-semibold border border-emerald-100">{s}</span>
              ))
            ) : (
              <span className="text-gray-400 text-sm italic">None assigned</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Recent Attendance Logs</h3>
            {recentAttendance.length > 0 && (
              <button 
                onClick={() => handleClearAll('attendance')}
                className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                title="Clear all recorded attendance logs"
              >
                Clear All Logs
              </button>
            )}
          </div>
          <div className="p-4">
            {recentAttendance.length > 0 ? (
              <div className="space-y-3">
                {recentAttendance.map(a => (
                  <div key={a.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg group">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{studentMap[a.studentId] || 'Unknown Student'}</p>
                      <p className="text-xs text-gray-500">{a.subjectId} - Lecture {a.lectureNumber} - {a.classId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        a.status === 'present' ? 'bg-green-100 text-green-800' :
                        a.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {a.status.toUpperCase()}
                      </span>
                      <button 
                        onClick={() => handleDeleteLog(a.id, 'attendance')}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        title="Delete Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent attendance found.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Recent Marks Uploaded</h3>
            {recentMarks.length > 0 && (
              <button 
                onClick={() => handleClearAll('marks')}
                className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                title="Clear all recorded marks logs"
              >
                Clear All Logs
              </button>
            )}
          </div>
          <div className="p-4">
            {recentMarks.length > 0 ? (
              <div className="space-y-3">
                {recentMarks.map(m => (
                  <div key={m.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg group">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{studentMap[m.studentId] || 'Unknown Student'}</p>
                      <p className="text-xs text-gray-500">{m.subjectId} - {m.examType.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{m.marksObtained} <span className="text-xs text-gray-500 font-normal">/ {m.maxMarks}</span></p>
                      </div>
                      <button 
                        onClick={() => handleDeleteLog(m.id, 'marks')}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        title="Delete Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent marks found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
