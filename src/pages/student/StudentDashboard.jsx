import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Book, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch profile
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }

        // Fetch subjects for this student's class
        // (For MVP, just fetch all subjects and match from attendance/marks)
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

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  // Analytics Computation
  const totalLectures = attendance.length;
  const presentLectures = attendance.filter(a => a.status === 'present').length;
  const overallAttendance = totalLectures > 0 ? ((presentLectures / totalLectures) * 100).toFixed(1) : 0;

  // Best of sessionals logic
  const sessionals = marks.filter(m => m.examType === 'sessional_1' || m.examType === 'sessional_2' || m.examType === 'remedial');
  const sessionalAverage = sessionals.length > 0 
    ? (sessionals.reduce((sum, m) => sum + (m.marksObtained / m.maxMarks)*100, 0) / sessionals.length).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.name}! 👋</h1>
          <p className="text-gray-500 mt-1">Here's your academic summary for this semester.</p>
        </div>
      </div>

      {/* Profile Card & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
           <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="flex justify-between items-start">
               <div>
                  <p className="text-primary-100 text-sm font-medium uppercase tracking-wider">Student Profile</p>
                  <h2 className="text-2xl font-bold mt-1">{profile?.name}</h2>
               </div>
               <div className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                 {profile?.classId}
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
               <div>
                 <p className="text-primary-200 text-xs">Department</p>
                 <p className="font-medium text-lg">{profile?.department}</p>
               </div>
               <div>
                 <p className="text-primary-200 text-xs">Semester</p>
                 <p className="font-medium text-lg">Semester {profile?.semester}</p>
               </div>
             </div>
           </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
          {overallAttendance < 75 && totalLectures > 0 ? (
             <div className="text-center">
               <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-red-600">
                 <AlertTriangle size={32} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Low Attendance!</h3>
               <p className="text-sm text-gray-500 mt-2">Your attendance is below 75%. Please attend more classes to be eligible for end-semester exams.</p>
             </div>
          ) : (
             <div className="text-center">
               <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-green-600">
                 <CheckCircle size={32} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">On Track</h3>
               <p className="text-sm text-gray-500 mt-2">Your attendance is healthy. Keep up the good work!</p>
             </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Overall Attendance</p>
            <p className="text-2xl font-bold text-gray-900">{overallAttendance}%</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="bg-indigo-100 p-4 rounded-xl text-indigo-600">
            <Book size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sessional Avg</p>
            <p className="text-2xl font-bold text-gray-900">{sessionalAverage}%</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="bg-orange-100 p-4 rounded-xl text-orange-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Lectures</p>
            <p className="text-2xl font-bold text-gray-900">{totalLectures}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject-wise Attendance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Subject-wise Attendance</h3>
          </div>
          <div className="p-4">
            {subjects.length > 0 ? (
               <div className="space-y-4">
                 {subjects.map(sub => {
                   const subAtt = attendance.filter(a => a.subjectId === sub.name);
                   const present = subAtt.filter(a => a.status === 'present').length;
                   const perc = subAtt.length > 0 ? Math.round((present / subAtt.length) * 100) : 0;
                   if (subAtt.length === 0) return null;
                   return (
                     <div key={sub.id}>
                       <div className="flex justify-between text-sm mb-1">
                         <span className="font-medium text-gray-700">{sub.name}</span>
                         <span className={perc < 75 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{perc}%</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div className={`h-2 rounded-full ${perc < 75 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${perc}%`}}></div>
                       </div>
                       <p className="text-xs text-gray-500 mt-1">{present} / {subAtt.length} lectures</p>
                     </div>
                   );
                 }).filter(Boolean)}
               </div>
            ) : (
              <p className="text-gray-500 text-sm">No attendance records found.</p>
            )}
          </div>
        </div>

        {/* Internal Marks Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Internal Marks</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead>
                 <tr className="border-b border-gray-200 text-gray-500">
                   <th className="py-2 font-medium">Subject</th>
                   <th className="py-2 font-medium">Exam Type</th>
                   <th className="py-2 font-medium text-right">Marks</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {marks.length > 0 ? marks.map((m, idx) => (
                   <tr key={idx} className="hover:bg-gray-50">
                     <td className="py-3 font-medium text-gray-900">{m.subjectId}</td>
                     <td className="py-3 capitalize text-gray-600">{m.examType.replace('_', ' ')}</td>
                     <td className="py-3 text-right font-medium">
                        {m.marksObtained} <span className="text-gray-400 font-normal">/ {m.maxMarks}</span>
                     </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan="3" className="py-4 text-center text-gray-500">No marks uploaded yet.</td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
