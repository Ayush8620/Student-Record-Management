import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getCountFromServer, getDoc, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { useModal } from '../../context/ModalContext';

export default function TeacherDashboard() {
  const { currentUser } = useAuth();
  const { showConfirm, showAlert } = useModal();
  const [stats, setStats] = useState({ assignedClasses: 0, totalLectures: 0 });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [recentMarks, setRecentMarks] = useState([]);
  const [studentMap, setStudentMap] = useState({});
  const [studentClassMap, setStudentClassMap] = useState({});

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
          const classMap = {};
          studentsSnap.docs.forEach(d => {
            const student = d.data();
            map[d.id] = student.name;
            classMap[d.id] = student.classId || 'Unknown Class';
          });
          setStudentMap(map);
          setStudentClassMap(classMap);

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
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Faculty Portal</h2>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">Classroom management and academic tracking.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 bg-white border border-outline-variant/30 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-sm transition-colors font-medium text-sm">
             <span className="material-symbols-outlined text-[18px]">calendar_month</span>
             Schedule
          </button>
        </div>
      </div>

      {profile && (
        <div className="surface-card p-6 mb-8 flex justify-between items-center group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg border border-primary/20 bg-gradient-to-br from-primary-container to-primary/30">
              {profile.name?.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Welcome Back,</p>
              <h2 className="text-2xl font-extrabold text-on-surface font-headline">{profile.name}</h2>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-tertiary-fixed/40 text-on-tertiary-fixed border border-tertiary/20 text-[11px] px-3 py-1 rounded-full font-extrabold uppercase tracking-widest">
              {profile.department} Department
            </span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="surface-card p-6 flex flex-col group hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-primary-container text-transparent bg-clip-text">Lectures Marked</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl" style={{fontVariationSettings: "'FILL' 1"}}>history_edu</span>
            </div>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-on-surface font-headline">{loading ? "..." : stats.totalLectures}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 flex flex-col group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-primary-container text-transparent bg-clip-text">Assigned Classes</h3>
             <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined">class</span>
             </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <span className="text-outline text-sm">Loading...</span>
            ) : profile?.assignedClasses?.length > 0 ? (
              profile.assignedClasses.map((c, i) => (
                <span key={i} className="bg-surface-container px-2.5 py-1 rounded-md text-xs font-bold text-on-surface-variant border border-outline-variant/20">{c}</span>
              ))
            ) : (
              <span className="text-outline text-sm italic">None assigned</span>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 flex flex-col group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-primary-container text-transparent bg-clip-text">Assigned Subjects</h3>
             <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined">menu_book</span>
             </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <span className="text-outline text-sm">Loading...</span>
            ) : profile?.subjects?.length > 0 ? (
              profile.subjects.map((s, i) => (
                <span key={i} className="bg-surface-container px-2.5 py-1 rounded-md text-xs font-bold text-on-surface-variant border border-outline-variant/20">{s}</span>
              ))
            ) : (
              <span className="text-outline text-sm italic">None assigned</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="surface-card flex flex-col">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center">
            <h3 className="text-xs uppercase tracking-wider font-bold text-on-surface-variant">Recent Attendance</h3>
            {recentAttendance.length > 0 && (
              <button 
                onClick={() => handleClearAll('attendance')}
                className="text-xs text-error hover:text-error-container hover:bg-error-container/20 font-bold px-3 py-1.5 rounded-md transition-colors"
                title="Clear all recorded attendance logs"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="p-0 flex-1 flex flex-col">
            {recentAttendance.length > 0 ? (
              <div className="divide-y divide-outline-variant/10">
                {recentAttendance.map((a, i) => (
                  <div key={a.id} className="flex justify-between items-center p-4 hover:bg-surface-container-lowest/80 transition-colors group">
                    <div>
                      <p className="font-bold text-on-surface text-sm mb-0.5">{studentMap[a.studentId] || 'Unknown Student'}</p>
                      <p className="text-[11px] font-medium text-outline uppercase">{a.subjectId} &bull; Lec {a.lectureNumber} &bull; {a.classId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-full border ${
                        a.status === 'present' ? 'bg-green-50 text-green-700 border-green-200' :
                        a.status === 'absent' ? 'bg-error-container/20 text-error border-error-container' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {a.status}
                      </span>
                      <button 
                        onClick={() => handleDeleteLog(a.id, 'attendance')}
                        className="text-outline hover:text-error hover:bg-error-container/50 rounded-md transition-all p-1.5 opacity-0 group-hover:opacity-100"
                        title="Delete Log"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                 <span className="material-symbols-outlined text-outline text-4xl mb-3">event_busy</span>
                 <p className="text-on-surface-variant font-medium text-sm">No recent attendance marked.</p>
              </div>
            )}
          </div>
        </div>

        <div className="surface-card flex flex-col">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center">
            <h3 className="text-xs uppercase tracking-wider font-bold text-on-surface-variant">Recent Grades Uploaded</h3>
            {recentMarks.length > 0 && (
              <button 
                onClick={() => handleClearAll('marks')}
                className="text-xs text-error hover:text-error-container hover:bg-error-container/20 font-bold px-3 py-1.5 rounded-md transition-colors"
                title="Clear all recorded marks logs"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="p-0 flex-1 flex flex-col">
            {recentMarks.length > 0 ? (
              <div className="divide-y divide-outline-variant/10">
                {recentMarks.map(m => (
                  <div key={m.id} className="flex justify-between items-center p-4 hover:bg-surface-container-lowest/80 transition-colors group">
                    <div>
                      <p className="font-bold text-on-surface text-sm mb-0.5">{studentMap[m.studentId] || 'Unknown Student'}</p>
                      <p className="text-[11px] font-medium text-outline uppercase">
                        {m.subjectId} &bull; {(m.classId || studentClassMap[m.studentId] || 'Unknown Class')} &bull; {m.examType.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-on-surface">
                           {m.marksObtained} <span className="text-[11px] text-outline font-semibold">/ {m.maxMarks}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteLog(m.id, 'marks')}
                        className="text-outline hover:text-error hover:bg-error-container/50 rounded-md transition-all p-1.5 opacity-0 group-hover:opacity-100"
                        title="Delete Log"
                      >
                         <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                 <span className="material-symbols-outlined text-outline text-4xl mb-3">assignment_turned_in</span>
                 <p className="text-on-surface-variant font-medium text-sm">No recent marks uploaded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
