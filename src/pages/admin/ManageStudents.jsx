import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { secondaryAuth } from '../../firebase/adminAuth';
import { collection, getDocs, query, where, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useModal } from '../../context/ModalContext';

export default function ManageStudents() {
  const { showAlert, showConfirm } = useModal();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    semester: '',
    classId: ''
  });

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const querySnapshot = await getDocs(q);
      const studentData = [];
      querySnapshot.forEach((doc) => {
        studentData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentData);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeleteStudent = (studentId) => {
    showConfirm("Are you sure you want to remove this student?", async () => {
      try {
        await deleteDoc(doc(db, "users", studentId));
        await deleteDoc(doc(db, "students", studentId));
        fetchStudents();
      } catch (error) {
        console.error("Error deleting student:", error);
        showAlert("Failed to delete student.", "error");
      }
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStudent = async (e) => {
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

      await setDoc(doc(db, "users", newUserId), {
        name: formData.name,
        email: formData.email,
        role: "student",
        department: formData.department,
        semester: formData.semester,
        classId: formData.classId,
        createdAt: new Date().toISOString()
      });

<<<<<<< HEAD
=======
      // 4. Add to 'students' collection
      await setDoc(doc(db, "students", newUserId), {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        semester: formData.semester,
        classId: formData.classId,
        uid: newUserId
      });

      // Reset form and refresh list
>>>>>>> 287e23434939da610a00629aed24e55cfc090dc8
      setFormData({ name: '', email: '', password: '', department: '', semester: '', classId: '' });
      fetchStudents();
      showAlert("Student added successfully!", "success");
    } catch (error) {
      console.error("Error adding student:", error);
      showAlert("Failed to add student: " + error.message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.classId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Student Registry</h2>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">Manage enrolled students, academic standing, and administrative records.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 bg-white border border-outline-variant/30 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg shadow-sm font-medium text-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Add New Student Form Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 mb-8 group">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">person_add</span>
          <h3 className="text-lg font-bold text-on-surface font-headline">Add New Student</h3>
        </div>
        
        <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Full Name</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="e.g. Jane Doe" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Email</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="student@university.edu" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Password</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Department</label>
            <input required type="text" name="department" value={formData.department} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="e.g. Computer Science" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Semester</label>
            <input required type="text" name="semester" value={formData.semester} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="S1, S2, etc." />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Class / Section</label>
            <input required type="text" name="classId" value={formData.classId} onChange={handleChange} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" placeholder="CS-A" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <button 
              type="submit" 
              disabled={isAdding}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm font-bold text-sm transition-all active:scale-[0.98] ${isAdding ? "bg-primary/50 text-white cursor-not-allowed" : "bg-primary hover:bg-primary-container text-on-primary shadow-primary/20"}`}
            >
              {isAdding ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">add</span>}
              {isAdding ? "Registering..." : "Enroll Student"}
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
            placeholder="Search students..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            All Depts
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin mb-4">sync</span>
            <p className="text-on-surface-variant font-medium">Loading student directory...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-outline text-5xl mb-4">person_off</span>
            <p className="text-on-surface-variant font-medium">No students registered yet.</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-on-surface-variant font-medium">No students match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider font-bold border-b border-outline-variant/20">
                  <th className="p-4 pl-6">Student ID / Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Program</th>
                  <th className="p-4">Class</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/80 hover:shadow-[inset_4px_0_0_0_#003fb1] transition-all group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary-fixed text-primary-fixed-variant flex items-center justify-center font-bold text-xs ring-2 ring-white">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{student.name}</p>
                          <p className="text-[11px] font-medium text-outline uppercase">STU-{index.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-on-surface-variant font-medium">{student.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-on-surface font-semibold">{student.department}</p>
                      <p className="text-[11px] font-medium text-outline uppercase">{student.semester}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-md text-xs font-bold text-on-surface-variant border border-outline-variant/20">
                        {student.classId}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Enrolled
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-outline hover:text-primary hover:bg-primary-fixed/30 rounded-md transition-colors" title="Edit Student">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)} 
                          className="p-1.5 text-outline hover:text-error hover:bg-error-container/50 rounded-md transition-colors" 
                          title="Remove Student"
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
