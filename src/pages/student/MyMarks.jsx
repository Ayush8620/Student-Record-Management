import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function MyMarks() {
  const { currentUser } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const q = query(collection(db, 'marks'), where('studentId', '==', currentUser.uid));
        const snap = await getDocs(q);
        setMarks(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchMarks();
  }, [currentUser]);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Marks Ledger</h2>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">Review your academic grades and assessments.</p>
        </div>
      </div>

      <div className="surface-card flex flex-col">
         <div className="p-4 px-6 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center bg-gradient-to-r from-tertiary-container/30 to-transparent">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
               <span className="material-symbols-outlined text-tertiary text-[18px]">workspace_premium</span>
               Academic Records
            </h3>
         </div>
         <div className="p-0 flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                 <span className="material-symbols-outlined text-primary text-4xl animate-spin mb-4">sync</span>
                 <p className="text-on-surface-variant font-medium text-sm">Loading grade ledger...</p>
              </div>
            ) : marks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                 <span className="material-symbols-outlined text-outline text-5xl mb-4">history_edu</span>
                 <p className="text-on-surface-variant font-bold text-base">No Records Found</p>
                 <p className="text-outline text-sm mt-1">Your marks haven't been uploaded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto text-on-surface">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-widest font-extrabold border-b border-outline-variant/40">
                      <th className="py-4 px-6 h-12">Subject</th>
                      <th className="py-4 px-6 h-12">Exam Type</th>
                      <th className="py-4 px-6 h-12">Marks Obtained</th>
                      <th className="py-4 px-6 h-12 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-outline-variant/10">
                    {marks.map(m => {
                      const percentage = Math.round((m.marksObtained / m.maxMarks) * 100);
                      return (
                        <tr key={m.id} className="hover:bg-surface-container-lowest/80 transition-colors">
                          <td className="py-4 px-6 font-bold text-on-surface flex items-center gap-3">
                             <div className="h-8 w-8 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                               <span className="material-symbols-outlined text-[16px]">book_4</span>
                             </div>
                             {m.subjectId}
                          </td>
                          <td className="py-4 px-6 capitalize">
                             <span className="bg-surface-container px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wide text-on-surface-variant border border-outline-variant/20">
                               {m.examType.replace('_', ' ')}
                             </span>
                          </td>
                          <td className="py-4 px-6 font-medium">
                             <span className="font-extrabold text-base text-on-surface">{m.marksObtained}</span>
                             <span className="text-[11px] font-bold text-outline ml-1">/ {m.maxMarks}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                             <div className="flex items-center justify-end gap-3">
                               <div className="w-24 bg-surface-container-high/40 rounded-full h-2 overflow-hidden border border-outline-variant/20 shadow-inner">
                                 <div 
                                   className={`h-full rounded-full shadow-sm transition-all duration-1000 ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-primary' : percentage >= 40 ? 'bg-yellow-500' : 'bg-error'}`} 
                                   style={{width: `${percentage}%`}}
                                 ></div>
                               </div>
                               <span className={`font-extrabold text-sm ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-primary' : percentage >= 40 ? 'text-yellow-600' : 'text-error'}`}>
                                 {percentage}%
                               </span>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
