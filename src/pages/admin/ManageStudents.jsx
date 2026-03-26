import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { secondaryAuth } from '../../firebase/adminAuth';
import { collection, addDoc, getDocs, query, where, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Plus, Loader2 } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

export default function ManageStudents() {
  const { showAlert, showConfirm } = useModal();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
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
      // 1. Create user in Firebase Auth using secondary app
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );
      
      const newUserId = userCredential.user.uid;

      // 2. Sign out the secondary app immediately so state is clear
      await signOut(secondaryAuth);

      // 3. Add user details to Firestore 'users' collection
      await setDoc(doc(db, "users", newUserId), {
        name: formData.name,
        email: formData.email,
        role: "student",
        department: formData.department,
        semester: formData.semester,
        classId: formData.classId,
        createdAt: new Date().toISOString()
      });

      // Reset form and refresh list
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Students</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Add New Student</h2>
        <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <input required type="text" name="semester" value={formData.semester} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class/Section</label>
            <input required type="text" name="classId" value={formData.classId} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <button 
              type="submit" 
              disabled={isAdding}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
            >
              {isAdding ? <Loader2 className="animate-spin w-4 h-4"/> : <Plus className="w-4 h-4"/>}
              Add Student
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Student List</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Semester</th>
                  <th className="p-4 font-medium">Class</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {students.map(student => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{student.name}</td>
                    <td className="p-4 text-gray-600">{student.email}</td>
                    <td className="p-4 text-gray-600">{student.department}</td>
                    <td className="p-4 text-gray-600">{student.semester}</td>
                    <td className="p-4 text-gray-600">{student.classId}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteStudent(student.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Remove</button>
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
