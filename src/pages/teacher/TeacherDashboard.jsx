import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getCountFromServer, getDoc, doc, getDocs, limit, orderBy } from 'firebase/firestore';

export default function TeacherDashboard() {
  const { currentUser } = useAuth();
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
  }, [currentUser]);

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-500 text-sm font-medium">Assigned Classes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.assignedClasses}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-500 text-sm font-medium">Lectures Marked</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
             {loading ? "..." : stats.totalLectures}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Recent Attendance Logs</h3>
          </div>
          <div className="p-4">
            {recentAttendance.length > 0 ? (
              <div className="space-y-3">
                {recentAttendance.map(a => (
                  <div key={a.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{studentMap[a.studentId] || 'Unknown Student'}</p>
                      <p className="text-xs text-gray-500">{a.subjectId} - Lecture {a.lectureNumber} - {a.classId}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        a.status === 'present' ? 'bg-green-100 text-green-800' :
                        a.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {a.status.toUpperCase()}
                      </span>
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
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Recent Marks Uploaded</h3>
          </div>
          <div className="p-4">
            {recentMarks.length > 0 ? (
              <div className="space-y-3">
                {recentMarks.map(m => (
                  <div key={m.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{studentMap[m.studentId] || 'Unknown Student'}</p>
                      <p className="text-xs text-gray-500">{m.subjectId} - {m.examType.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{m.marksObtained} <span className="text-xs text-gray-500 font-normal">/ {m.maxMarks}</span></p>
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
