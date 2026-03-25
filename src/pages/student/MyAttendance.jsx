import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function MyAttendance() {
  const { currentUser } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAtt = async () => {
      try {
        const q = query(collection(db, 'attendance'), where('studentId', '==', currentUser.uid));
        const snap = await getDocs(q);
        setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.date) - new Date(a.date)));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchAtt();
  }, [currentUser]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Attendance Log</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading details...</div>
        ) : attendance.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No attendance records found.</div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">Lecture</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-gray-900">{a.subjectId}</td>
                  <td className="p-4 text-gray-600">Lecture {a.lectureNumber}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      a.status === 'present' ? 'bg-green-100 text-green-800' :
                      a.status === 'absent' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {a.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
