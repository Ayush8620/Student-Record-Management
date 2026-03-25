import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, addDoc, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, Plus, Loader2 } from 'lucide-react';

export default function Announcements() {
  const { currentUser, userRole } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'all' });

  const fetchAnnouncements = async () => {
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (userRole === 'student') {
        setAnnouncements(data.filter(a => a.targetRole === 'all' || a.targetRole === 'student'));
      } else if (userRole === 'teacher') {
        setAnnouncements(data.filter(a => a.targetRole === 'all' || a.targetRole === 'teacher'));
      } else {
        setAnnouncements(data); // Admin sees all
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [userRole]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...form,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email || 'Admin'
      });
      setForm({ title: '', message: '', targetRole: 'all' });
      fetchAnnouncements();
    } catch (err) {
      alert("Failed to add announcement");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="text-primary-600 w-8 h-8" />
        <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
      </div>

      {userRole === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium mb-4">Post New Notice</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border border-gray-300 rounded-md p-2" />
              <select value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})} className="border border-gray-300 rounded-md p-2">
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
              </select>
            </div>
            <textarea required placeholder="Announcement Message..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 h-24"></textarea>
            <button disabled={isAdding} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2">
              {isAdding ? <Loader2 className="animate-spin w-4 h-4"/> : <Plus className="w-4 h-4"/>} Post Announcement
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading notices...</div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No announcements found.</div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{a.title}</h3>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase">
                  {a.targetRole}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{a.message}</p>
              <div className="mt-4 text-xs text-gray-400">
                Posted by {a.createdBy} on {new Date(a.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
