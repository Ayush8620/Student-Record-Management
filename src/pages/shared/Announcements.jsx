import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, addDoc, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

export default function Announcements() {
  const { currentUser, userRole } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState('all');
  
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
      showAlert("Failed to add announcement", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm("Are you sure you want to delete this announcement?", async () => {
      try {
        await deleteDoc(doc(db, 'announcements', id));
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      } catch (error) {
        console.error("Error deleting announcement:", error);
        showAlert("Failed to delete announcement", "error");
      }
    });
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const importantMatch = filter === 'all' || (filter === 'important' && (a.isImportant || /important/i.test(a.title) || /important/i.test(a.message)));

    return importantMatch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm border border-primary/20">
            <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>campaign</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight font-headline bg-gradient-to-r from-primary to-primary-container text-transparent bg-clip-text">Academic Notices</h2>
            <p className="text-on-surface-variant mt-1 font-medium text-sm">Vital updates and official campus announcements.</p>
          </div>
        </div>
      </div>

      {userRole === 'admin' && (
        <div className="surface-card p-6 mb-8 group">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">add_circle</span>
            <h2 className="text-lg font-bold text-on-surface font-headline">Post New Notice</h2>
          </div>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                required 
                type="text" 
                placeholder="Notice Title" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              />
              <select 
                value={form.targetRole} 
                onChange={e => setForm({...form, targetRole: e.target.value})} 
                className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="all">All Audiences</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
              </select>
            </div>
            <textarea 
              required 
              placeholder="Announcement Message..." 
              value={form.message} 
              onChange={e => setForm({...form, message: e.target.value})} 
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 h-32 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            ></textarea>
            <button 
              disabled={isAdding} 
              className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-sm shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isAdding ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">send</span>}
              Post Announcement
            </button>
          </form>
        </div>
      )}

      <div className="surface-card flex flex-col divide-y divide-outline-variant/10">
        <div className="px-6 py-4 flex flex-wrap gap-2 items-center">
          {['all','important'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-full font-semibold text-sm ${filter === type ? 'bg-primary text-white' : 'bg-surface-container text-on-surface'} transition-all`}
            >
              {type === 'all' ? 'All' : 'Important'}
            </button>
          ))}
          <span className="text-xs text-on-surface-variant ml-auto">
            Showing {filter === 'all' ? 'all' : 'important'} announcements
          </span>
        </div>
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-primary animate-spin">sync</span>
            <p className="text-on-surface-variant font-medium text-sm">Loading notices...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
             <span className="material-symbols-outlined text-outline text-5xl">campaign</span>
             <p className="text-on-surface-variant font-bold">No announcements match the selected filter.</p>
          </div>
        ) : (
          filteredAnnouncements.map(a => (
            <div key={a.id} className="p-8 hover:bg-surface-container-low/30 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-extrabold text-on-surface font-headline">{a.title}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-extrabold bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full uppercase tracking-widest border border-outline-variant/20">
                    {a.targetRole}
                  </span>
                  {userRole === 'admin' && (
                    <button 
                      onClick={() => handleDelete(a.id)}
                      className="text-outline hover:text-error hover:bg-error-container/20 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Announcement"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-on-surface-variant leading-relaxed font-medium mb-6 whitespace-pre-wrap">{a.message}</p>
              <div className="flex items-center gap-2 text-[11px] font-bold text-outline uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">person</span>
                <span>{a.createdBy}</span>
                <span className="text-outline-variant">•</span>
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
