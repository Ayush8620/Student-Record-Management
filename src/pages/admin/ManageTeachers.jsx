import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { secondaryAuth } from '../../firebase/adminAuth';
import { collection, getDocs, query, where, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Plus, Loader2 } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

export default function ManageTeachers() {
  const { showAlert, showConfirm } = useModal();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    assignedClasses: '', // Comma separated for MVP
    subjects: '' // Comma separated for MVP
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

      // Convert comma-separated strings to arrays
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Teachers</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Add New Teacher</h2>
        <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input required type="text" name="department" value={formData.department} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Classes (Comma separated)</label>
            <input type="text" name="assignedClasses" placeholder="e.g. CSE_4_A, CSE_4_B" value={formData.assignedClasses} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (Comma separated)</label>
            <input type="text" name="subjects" placeholder="e.g. DBMS, OS" value={formData.subjects} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <button 
              type="submit" 
              disabled={isAdding}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
            >
              {isAdding ? <Loader2 className="animate-spin w-4 h-4"/> : <Plus className="w-4 h-4"/>}
              Add Teacher
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Teacher List</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No teachers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Classes</th>
                  <th className="p-4 font-medium">Subjects</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {teachers.map(teacher => (
                  <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{teacher.name}</td>
                    <td className="p-4 text-gray-600">{teacher.email}</td>
                    <td className="p-4 text-gray-600">{teacher.department}</td>
                    <td className="p-4 text-gray-600">{teacher.assignedClasses?.join(', ') || '-'}</td>
                    <td className="p-4 text-gray-600">{teacher.subjects?.join(', ') || '-'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteTeacher(teacher.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Remove</button>
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
