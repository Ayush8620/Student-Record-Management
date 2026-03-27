import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { secondaryAuth } from '../../firebase/adminAuth';
import { collection, getDocs, query, where, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useModal } from '../../context/ModalContext';

export default function ManageTeachers() {
  const { showAlert, showConfirm } = useModal();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    assignedClasses: '', 
    subjects: '' 
  });

  const fetchTeachers = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "teacher"));
      const querySnapshot = await getDocs(q);
      const teacherData = [];
      querySnapshot.forEach((doc) => {
        teacherData.push({ id: doc.id, ...doc.data() });
      });
      setTeachers(teacherData);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDeleteTeacher = (teacherId) => {
    showConfirm("Are you sure you want to remove this teacher?", async () => {
      try {
        await deleteDoc(doc(db, "users", teacherId));
        await deleteDoc(doc(db, "teachers", teacherId));
        fetchTeachers();
      } catch (error) {
        console.error("Error deleting teacher:", error);
        showAlert("Failed to delete teacher.", "error");
      }
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );
      
      const newUserId = userCredential.user.uid;
      await signOut(secondaryAuth);

      const classesArray = formData.assignedClasses.split(',').map(s => s.trim()).filter(Boolean);
      const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(Boolean);

      await setDoc(doc(db, "users", newUserId), {
        name: formData.name,
        email: formData.email,
        role: "teacher",
        department: formData.department,
        assignedClasses: classesArray,
        subjects: subjectsArray,
        createdAt: new Date().toISOString()
      });

      await setDoc(doc(db, "teachers", newUserId), {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        assignedClasses: classesArray,
        subjects: subjectsArray,
        uid: newUserId
      });

      setFormData({ name: '', email: '', password: '', department: '', assignedClasses: '', subjects: '' });
      fetchTeachers();
      showAlert("Teacher added successfully!", "success");
    } catch (error) {
      console.error("Error adding teacher:", error);
      showAlert("Failed to add teacher: " + error.message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Faculty Registry</h2>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">Manage teaching staff, assignments, and departmental roles.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 bg-white border border-outline-variant/30 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg shadow-sm font-medium text-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Add New Teacher Form Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 mb-8 group">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">person_add</span>
          <h3 className="text-lg font-bold text-on-surface font-headline">Add New Faculty</h3>
        </div>
        
        <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Full Name</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="e.g. Dr. John Smith" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Email</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="faculty@university.edu" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Password</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Department</label>
            <input required type="text" name="department" value={formData.department} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="e.g. Mathematics" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Assigned Classes</label>
            <input type="text" name="assignedClasses" value={formData.assignedClasses} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="CS-A, CS-B (Comma separated)" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Subjects</label>
            <input type="text" name="subjects" value={formData.subjects} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="Calculus, Linear Algebra" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <button 
              type="submit" 
              disabled={isAdding}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm font-bold text-sm transition-all active:scale-[0.98] ${isAdding ? "bg-primary/50 text-white cursor-not-allowed" : "bg-primary hover:bg-primary-container text-on-primary shadow-primary/20"}`}
            >
              {isAdding ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">add</span>}
              {isAdding ? "Registering..." : "Add Faculty"}
            </button>
          </div>
        </form>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-4 bg-surface-container-lowest/50 backdrop-blur-sm rounded-xl border border-outline-variant/20">
        <div className="relative w-full sm:max-w-xs group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
          <input 
            className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant/30 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
            placeholder="Search faculty..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin mb-4">sync</span>
            <p className="text-on-surface-variant font-medium">Loading faculty directory...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-outline text-5xl mb-4">person_off</span>
            <p className="text-on-surface-variant font-medium">No faculty registered yet.</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-on-surface-variant font-medium">No faculty match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider font-bold border-b border-outline-variant/20">
                  <th className="p-4 pl-6">Faculty Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Classes</th>
                  <th className="p-4">Subjects</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/80 hover:shadow-[inset_4px_0_0_0_#852b00] transition-all group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-xs ring-2 ring-white">
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{teacher.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-on-surface-variant font-medium">{teacher.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-md text-xs font-bold text-on-surface-variant border border-outline-variant/20">
                        {teacher.department}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant font-medium">
                      {teacher.assignedClasses?.join(', ') || '-'}
                    </td>
                    <td className="p-4 text-on-surface-variant font-medium">
                      {teacher.subjects?.join(', ') || '-'}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-outline hover:text-primary hover:bg-primary-fixed/30 rounded-md transition-colors" title="Edit Teacher">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteTeacher(teacher.id)} 
                          className="p-1.5 text-outline hover:text-error hover:bg-error-container/50 rounded-md transition-colors" 
                          title="Remove Teacher"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
