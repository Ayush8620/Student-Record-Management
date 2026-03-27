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
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Attendance Log</h2>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">Review your day-to-day lecture presence.</p>
        </div>
      </div>

      <div className="surface-card flex flex-col">
         <div className="p-4 px-6 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center bg-gradient-to-r from-primary-container/20 to-transparent">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
               <span className="material-symbols-outlined text-primary text-[18px]">history</span>
               Recent Records
            </h3>
         </div>
         <div className="p-0 flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                 <span className="material-symbols-outlined text-primary text-4xl animate-spin mb-4">sync</span>
                 <p className="text-on-surface-variant font-medium text-sm">Loading attendance ledger...</p>
              </div>
            ) : attendance.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                 <span className="material-symbols-outlined text-outline text-5xl mb-4">event_busy</span>
                 <p className="text-on-surface-variant font-bold text-base">No Records Found</p>
                 <p className="text-outline text-sm mt-1">Your attendance hasn't been logged yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto text-on-surface">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-widest font-extrabold border-b border-outline-variant/40">
                      <th className="py-4 px-6 h-12">Date</th>
                      <th className="py-4 px-6 h-12">Subject</th>
                      <th className="py-4 px-6 h-12">Lecture</th>
                      <th className="py-4 px-6 h-12 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-outline-variant/10">
                    {attendance.map(a => (
                      <tr key={a.id} className="hover:bg-surface-container-lowest/80 transition-colors">
                        <td className="py-4 px-6 font-medium text-on-surface-variant">
                          <span className="bg-surface-container px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border border-outline-variant/40">
                             {new Date(a.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-on-surface">{a.subjectId}</td>
                        <td className="py-4 px-6 font-medium text-outline">Lec {a.lectureNumber}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-extrabold uppercase tracking-wide rounded-full border text-[10px] transition-colors ${
                            a.status === 'present' ? 'bg-green-50 text-green-700 border-green-200' :
                            a.status === 'absent' ? 'bg-error-container/20 text-error border-error-container/30' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {a.status === 'present' ? <span className="material-symbols-outlined text-[14px]">check_circle</span> :
                             a.status === 'absent' ? <span className="material-symbols-outlined text-[14px]">cancel</span> :
                             <span className="material-symbols-outlined text-[14px]">directions_run</span>}
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
