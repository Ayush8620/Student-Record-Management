import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverPoint, setHoverPoint] = useState({ x: 0, y: 0, active: false });
  const profileCardRef = useRef(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch profile
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }

        // Fetch subjects for this student's class
        const subSnap = await getDocs(collection(db, "subjects"));
        const subList = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSubjects(subList);

        // Fetch attendance
        const attQuery = query(collection(db, 'attendance'), where('studentId', '==', currentUser.uid));
        const attSnap = await getDocs(attQuery);
        setAttendance(attSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch marks
        const marksQuery = query(collection(db, 'marks'), where('studentId', '==', currentUser.uid));
        const marksSnap = await getDocs(marksQuery);
        setMarks(marksSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchStudentData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center min-h-[50vh]">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin mb-4">sync</span>
        <p className="text-on-surface-variant font-medium text-sm border focus:ring-primary/20 rounded-lg p-3 outline-none">Loading dashboard...</p>
      </div>
    );
  }

  // Analytics Computation
  const totalLectures = attendance.length;
  const presentLectures = attendance.filter(a => a.status === 'present').length;
  const overallAttendance = totalLectures > 0 ? ((presentLectures / totalLectures) * 100).toFixed(1) : 0;

  // Best of sessionals logic
  const sessionals = marks.filter(m => m.examType === 'sessional_1' || m.examType === 'sessional_2' || m.examType === 'remedial');
  const sessionalAverage = sessionals.length > 0
    ? (sessionals.reduce((sum, m) => sum + (m.marksObtained / m.maxMarks) * 100, 0) / sessionals.length).toFixed(1)
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Welcome back, {profile?.name}! 👋</h1>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">Here's your academic summary for this semester.</p>
        </div>
      </div>

      {/* Profile Card & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          ref={profileCardRef}
          onMouseEnter={() => setHoverPoint((p) => ({ ...p, active: true }))}
          onMouseLeave={() => setHoverPoint((p) => ({ ...p, active: false }))}
          onMouseMove={(event) => {
            const rect = profileCardRef.current?.getBoundingClientRect();
            if (!rect) return;
            setHoverPoint({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              active: true,
            });
          }}
          className="col-span-1 lg:col-span-2 bg-gradient-to-br from-primary to-primary-container rounded-2xl shadow-sm p-8 text-on-primary relative overflow-hidden group border border-primary/20"
        >
          <div
            className="absolute rounded-full bg-white/30 blur-3xl pointer-events-none"
            style={{
              width: '140px',
              height: '140px',
              transform: `translate(calc(${hoverPoint.x}px - 50%), calc(${hoverPoint.y}px - 50%))`,
              opacity: hoverPoint.active ? 0.9 : 0,
            }}
          ></div>
          <div className="absolute -right-2 -top-2 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-black/30 rounded-full blur-3xl opacity-80 group-hover:opacity-100 transition-opacity"></div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-on-primary/80 text-xs font-bold uppercase tracking-widest mb-1">Student Profile</p>
                <h2 className="text-3xl font-extrabold font-headline leading-tight">{profile?.name}</h2>
              </div>
              <div className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-sm">
                {profile?.classId || 'Unassigned'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20">
              <div>
                <p className="text-on-primary/80 text-xs font-bold uppercase tracking-widest mb-1">Department</p>
                <p className="font-extrabold text-xl">{profile?.department || '—'}</p>
              </div>
              <div>
                <p className="text-on-primary/80 text-xs font-bold uppercase tracking-widest mb-1">Semester</p>
                <p className="font-extrabold text-xl">{profile?.semester ? `Semester ${profile.semester}` : '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card p-8 flex flex-col justify-center items-center text-center">
          {overallAttendance < 75 && totalLectures > 0 ? (
            <>
              <div className="absolute top-0 left-0 w-full h-1 bg-error"></div>
              <div className="bg-error-container text-error w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-xl font-extrabold text-on-surface font-headline mb-2">Low Attendance!</h3>
              <p className="text-sm font-medium text-on-surface-variant">Your attendance is below 75%. Please attend more classes to be eligible for exams.</p>
            </>
          ) : (
            <>
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <div className="bg-green-100 text-green-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm border border-green-200">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <h3 className="text-xl font-extrabold text-on-surface font-headline mb-2">On Track</h3>
              <p className="text-sm font-medium text-on-surface-variant">Your attendance is healthy. Keep up the good work this semester!</p>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="surface-card p-6 flex items-center gap-5 group">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
            <span className="material-symbols-outlined text-2xl">update</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Overall Attendance</p>
            <p className="text-3xl font-extrabold text-on-surface font-headline">{overallAttendance}%</p>
          </div>
        </div>

        <div className="surface-card p-6 flex items-center gap-5 group">
          <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform">
            <span className="material-symbols-outlined text-2xl">analytics</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Sessional Avg</p>
            <p className="text-3xl font-extrabold text-on-surface font-headline">{sessionalAverage}%</p>
          </div>
        </div>

        <div className="surface-card p-6 flex items-center gap-5 group">
          <div className="bg-orange-50 text-orange-600 p-4 rounded-xl group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl">event_available</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Total Lectures</p>
            <p className="text-3xl font-extrabold text-on-surface font-headline">{totalLectures}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject-wise Attendance */}
        <div className="surface-card flex flex-col">
          <div className="p-4 px-6 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center bg-gradient-to-r from-primary-container/20 to-transparent">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">format_list_bulleted</span>
              Subject-wise Attendance
            </h3>
          </div>
          <div className="p-0 flex-1 flex flex-col">
            {subjects.length > 0 ? (
              <div className="divide-y divide-outline-variant/10">
                {subjects.map(sub => {
                  const subAtt = attendance.filter(a => a.subjectId === sub.name);
                  const present = subAtt.filter(a => a.status === 'present').length;
                  const perc = subAtt.length > 0 ? Math.round((present / subAtt.length) * 100) : 0;
                  if (subAtt.length === 0) return null;
                  return (
                    <div key={sub.id} className="p-6 hover:bg-surface-container-lowest/80 transition-colors">
                      <div className="flex justify-between items-end mb-3">
                        <span className="font-bold text-on-surface">{sub.name}</span>
                        <span className={`font-extrabold text-lg ${perc < 75 ? 'text-error' : 'text-green-600'}`}>
                          {perc}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden border border-outline-variant/10 shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-1000 ${perc < 75 ? 'bg-error' : 'bg-green-500'}`} style={{ width: `${perc}%` }}></div>
                      </div>
                      <p className="text-[11px] font-bold text-outline uppercase tracking-wider mt-2 text-right">
                        {present} / {subAtt.length} LECTURES ATTENDED
                      </p>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
                <span className="material-symbols-outlined text-outline text-4xl mb-3">inbox</span>
                <p className="text-on-surface-variant font-medium text-sm">No attendance records found yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Internal Marks Section */}
        <div className="surface-card flex flex-col">
          <div className="p-4 px-6 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center bg-gradient-to-r from-tertiary-container/20 to-transparent">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[18px]">workspace_premium</span>
              Internal Marks
            </h3>
          </div>
          <div className="p-0 overflow-x-auto flex-1 flex flex-col">
            {marks.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50 text-on-surface-variant text-xs uppercase tracking-wider font-bold border-b border-outline-variant/20">
                    <th className="py-3 px-6 h-12">Subject</th>
                    <th className="py-3 px-6 h-12">Exam Type</th>
                    <th className="py-3 px-6 h-12 text-right">Marks</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-on-surface divide-y divide-outline-variant/10">
                  {marks.map((m, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-lowest/80 transition-colors">
                      <td className="py-4 px-6 font-bold">{m.subjectId}</td>
                      <td className="py-4 px-6 capitalize">
                        <span className="bg-surface-container px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wide text-on-surface-variant border border-outline-variant/20">
                          {m.examType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-extrabold text-base">{m.marksObtained}</span>
                        <span className="text-[11px] font-bold text-outline ml-1">/ {m.maxMarks}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
                <span className="material-symbols-outlined text-outline text-4xl mb-3">history_edu</span>
                <p className="text-on-surface-variant font-medium text-sm">No internal marks uploaded yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
