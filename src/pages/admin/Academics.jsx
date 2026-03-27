import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useModal } from '../../context/ModalContext';

export default function Academics() {
  const { showAlert, showConfirm } = useModal();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Forms
  const [classForm, setClassForm] = useState({ name: '', department: '', semester: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' });
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const fetchClasses = async () => {
    try {
      const snap = await getDocs(collection(db, "classes"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const snap = await getDocs(collection(db, "subjects"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  const handleDeleteClass = (id) => {
    showConfirm("Are you sure you want to delete this class?", async () => {
      try {
        await deleteDoc(doc(db, "classes", id));
        showAlert("Class deleted successfully", "success");
        fetchClasses();
      } catch (error) {
        showAlert("Failed to delete class", "error");
      }
    });
  };

  const handleDeleteSubject = (id) => {
    showConfirm("Are you sure you want to delete this subject?", async () => {
      try {
        await deleteDoc(doc(db, "subjects", id));
        showAlert("Subject deleted successfully", "success");
        fetchSubjects();
      } catch (error) {
        showAlert("Failed to delete subject", "error");
      }
    });
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setIsAddingClass(true);
    try {
      await setDoc(doc(db, "classes", classForm.name), classForm);
      setClassForm({ name: '', department: '', semester: '' });
      fetchClasses();
    } catch (error) {
      showAlert("Failed to add class", "error");
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setIsAddingSubject(true);
    try {
      await setDoc(doc(db, "subjects", subjectForm.name), subjectForm);
      setSubjectForm({ name: '', code: '' });
      fetchSubjects();
    } catch (error) {
      showAlert("Failed to add subject", "error");
    } finally {
      setIsAddingSubject(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Academic Infrastructure</h2>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">Manage class structures, departments, and course catalog.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Classes Section */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">domain</span>
              <h2 className="text-lg font-bold text-on-surface font-headline">Add Class Group</h2>
            </div>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Class Name</label>
                <input required type="text" placeholder="e.g. CSE_4_A" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Department</label>
                  <input required type="text" placeholder="e.g. CSE" value={classForm.department} onChange={e => setClassForm({...classForm, department: e.target.value})} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Semester</label>
                  <input required type="number" placeholder="e.g. 4" value={classForm.semester} onChange={e => setClassForm({...classForm, semester: e.target.value})} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" />
                </div>
              </div>
              <button disabled={isAddingClass} className={`w-full flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm font-bold text-sm transition-all active:scale-[0.98] mt-2 ${isAddingClass ? "bg-primary/50 text-white cursor-not-allowed" : "bg-primary hover:bg-primary-container text-on-primary shadow-primary/20"}`}>
                {isAddingClass ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">add</span>} 
                Create Class
              </button>
            </form>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden flex-1">
             <div className="p-4 border-b border-outline-variant/20 bg-gradient-to-r from-primary to-primary-container text-on-primary flex justify-between items-center">
              <h3 className="text-xs uppercase tracking-wider font-bold">Class Directory</h3>
            </div>
            <ul className="divide-y divide-outline-variant/10 max-h-[500px] overflow-y-auto custom-scrollbar">
              {loadingClasses ? (
                <li className="p-8 text-center text-on-surface-variant flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary animate-spin mb-2">sync</span> Loading...
                </li>
              ) : classes.length === 0 ? (
                <li className="p-8 text-center text-on-surface-variant">No classes registered.</li>
              ) : classes.map(c => (
                <li key={c.id} className="p-4 hover:bg-surface-container-lowest/80 transition-colors flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 text-primary-fixed-variant flex items-center justify-center">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                    <div>
                      <div className="font-bold text-on-surface">{c.name}</div>
                      <div className="text-xs font-medium text-outline uppercase">{c.department} &bull; Semester {c.semester}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteClass(c.id)}
                    className="p-2 text-outline hover:text-error hover:bg-error-container/50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Class"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Subjects Section */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-tertiary">book_4</span>
              <h2 className="text-lg font-bold text-on-surface font-headline">Add Course Subject</h2>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Subject Name</label>
                <input required type="text" placeholder="e.g. Database Management Systems" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-tertiary focus:ring-2 focus:ring-tertiary/20 rounded-lg p-3 text-sm transition-all outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Course Code</label>
                <input required type="text" placeholder="e.g. CS401" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-tertiary focus:ring-2 focus:ring-tertiary/20 rounded-lg p-3 text-sm transition-all outline-none" />
              </div>
              <button disabled={isAddingSubject} className={`w-full flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm font-bold text-sm transition-all active:scale-[0.98] mt-2 ${isAddingSubject ? "bg-tertiary/50 text-white cursor-not-allowed" : "bg-tertiary hover:bg-tertiary-container hover:text-on-tertiary-container text-on-tertiary shadow-tertiary/20"}`}>
                {isAddingSubject ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">add</span>} 
                Add Subject
              </button>
            </form>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden flex-1">
             <div className="p-4 border-b border-outline-variant/20 bg-gradient-to-r from-tertiary to-tertiary-container text-on-tertiary flex justify-between items-center">
              <h3 className="text-xs uppercase tracking-wider font-bold">Course Catalog</h3>
            </div>
            <ul className="divide-y divide-outline-variant/10 max-h-[500px] overflow-y-auto custom-scrollbar">
              {loadingSubjects ? (
                <li className="p-8 text-center text-on-surface-variant flex flex-col items-center">
                  <span className="material-symbols-outlined text-tertiary animate-spin mb-2">sync</span> Loading...
                </li>
              ) : subjects.length === 0 ? (
                <li className="p-8 text-center text-on-surface-variant">No subjects cataloged.</li>
              ) : subjects.map(s => (
                <li key={s.id} className="p-4 hover:bg-surface-container-lowest/80 transition-colors flex justify-between items-center group">
                  <div className="flex-1 flex flex-col items-start">
                    <div className="font-bold text-on-surface">{s.name}</div>
                    <div className="text-[11px] font-extrabold text-tertiary bg-tertiary-fixed/40 px-2 py-0.5 rounded-md inline-flex mt-1 border border-tertiary/20">{s.code}</div>
                  </div>
                  <button 
                    onClick={() => handleDeleteSubject(s.id)}
                    className="p-2 text-outline hover:text-error hover:bg-error-container/50 rounded-md transition-colors ml-4 opacity-0 group-hover:opacity-100"
                    title="Delete Subject"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
