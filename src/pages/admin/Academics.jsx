import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Plus, Loader2, Book, Layers } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

export default function Academics() {
  const { showAlert } = useModal();
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

  const handleAddClass = async (e) => {
    e.preventDefault();
    setIsAddingClass(true);
    try {
      await addDoc(collection(db, "classes"), classForm);
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
      await addDoc(collection(db, "subjects"), subjectForm);
      setSubjectForm({ name: '', code: '' });
      fetchSubjects();
    } catch (error) {
      showAlert("Failed to add subject", "error");
    } finally {
      setIsAddingSubject(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Academics Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Classes Section */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="text-primary-600" />
              <h2 className="text-lg font-medium">Add Class</h2>
            </div>
            <form onSubmit={handleAddClass} className="space-y-4">
              <input required type="text" placeholder="Class Name (e.g. CSE_4_A)" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
              <input required type="text" placeholder="Department" value={classForm.department} onChange={e => setClassForm({...classForm, department: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
              <input required type="number" placeholder="Semester" value={classForm.semester} onChange={e => setClassForm({...classForm, semester: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
              <button disabled={isAddingClass} className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex justify-center items-center gap-2">
                {isAddingClass ? <Loader2 className="animate-spin w-4 h-4"/> : <Plus className="w-4 h-4"/>} Add Class
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Classes List</h3>
            </div>
            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {loadingClasses ? (
                <li className="p-4 text-center text-gray-500">Loading...</li>
              ) : classes.length === 0 ? (
                <li className="p-4 text-center text-gray-500">No classes found.</li>
              ) : classes.map(c => (
                <li key={c.id} className="p-4 hover:bg-gray-50">
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-sm text-gray-500">{c.department} - Sem {c.semester}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Subjects Section */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Book className="text-primary-600" />
              <h2 className="text-lg font-medium">Add Subject</h2>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <input required type="text" placeholder="Subject Name (e.g. DBMS)" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
              <input required type="text" placeholder="Subject Code (e.g. CS401)" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
              <button disabled={isAddingSubject} className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex justify-center items-center gap-2">
                {isAddingSubject ? <Loader2 className="animate-spin w-4 h-4"/> : <Plus className="w-4 h-4"/>} Add Subject
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Subjects List</h3>
            </div>
            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {loadingSubjects ? (
                <li className="p-4 text-center text-gray-500">Loading...</li>
              ) : subjects.length === 0 ? (
                <li className="p-4 text-center text-gray-500">No subjects found.</li>
              ) : subjects.map(s => (
                <li key={s.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div className="font-medium text-gray-900">{s.name}</div>
                  <div className="text-sm text-gray-500 bg-gray-100 px-2 rounded-md">{s.code}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
