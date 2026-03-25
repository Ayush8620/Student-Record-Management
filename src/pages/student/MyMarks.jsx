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
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Marks Log</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading details...</div>
        ) : marks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No mark records found.</div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">Exam Type</th>
                <th className="p-4 font-medium">Marks Obtained</th>
                <th className="p-4 font-medium">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marks.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{m.subjectId}</td>
                  <td className="p-4 capitalize text-gray-600">{m.examType.replace('_', ' ')}</td>
                  <td className="p-4 text-gray-900 font-medium">
                     {m.marksObtained} <span className="text-gray-400 font-normal">/ {m.maxMarks}</span>
                  </td>
                  <td className="p-4 text-primary-600 font-semibold">
                    {Math.round((m.marksObtained / m.maxMarks) * 100)}%
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
