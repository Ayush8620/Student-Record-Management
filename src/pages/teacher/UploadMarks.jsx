import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Search } from 'lucide-react';

export default function UploadMarks() {
  const { currentUser } = useAuth();
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      const clsSnap = await getDocs(collection(db, "classes"));
      setClasses(clsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const subSnap = await getDocs(collection(db, "subjects"));
      setSubjects(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchDropdowns();
  }, []);

  const handleFetchStudents = async () => {
    if (!selectedClass) return alert("Select a class first");
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      const allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const studentList = allStudents.filter(s => s.classId === selectedClass);
      setStudents(studentList);
      
      const initialData = {};
      studentList.forEach(s => {
        initialData[s.id] = '';
      });
      setMarksData(initialData);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !examType || !maxMarks) {
      return alert("Fill all details");
    }
    setSubmitting(true);
    try {
      const batchPromises = Object.keys(marksData).map(studentId => {
        if (!marksData[studentId]) return Promise.resolve(); // Skip empty marks
        return addDoc(collection(db, 'marks'), {
          studentId,
          subjectId: selectedSubject,
          examType,
          marksObtained: parseFloat(marksData[studentId]),
          maxMarks: parseFloat(maxMarks),
          teacherId: currentUser.uid,
          timestamp: new Date().toISOString()
        });
      });
      await Promise.all(batchPromises);
      alert("Marks uploaded successfully");
      setStudents([]); // Reset screen
    } catch (error) {
      console.error(error);
      alert("Failed to upload marks");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Upload Marks</h1>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full border border-gray-300 rounded-md p-2">
            <option value="">Select Class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full border border-gray-300 rounded-md p-2">
            <option value="">Select Subject...</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
          <select value={examType} onChange={e => setExamType(e.target.value)} className="w-full border border-gray-300 rounded-md p-2">
            <option value="">Select Exam...</option>
            <option value="sessional_1">Sessional 1</option>
            <option value="sessional_2">Sessional 2</option>
            <option value="remedial">Remedial</option>
            <option value="assignment">Assignment</option>
            <option value="practical">Practical</option>
            <option value="end_sem">End Semester</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
          <input type="number" min="1" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div className="lg:col-span-1 flex items-end">
          <button 
            onClick={handleFetchStudents}
            disabled={loading}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Search className="w-4 h-4"/>} Load Students
          </button>
        </div>
      </div>

      {/* Marks Entry List */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h2 className="text-lg font-medium text-gray-800">Student List</h2>
             <button disabled={submitting} onClick={handleSubmit} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm font-medium flex items-center gap-2">
               {submitting && <Loader2 className="animate-spin w-4 h-4"/>} Submit Marks
             </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-medium w-16">Roll</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {students.map((student, idx) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-500">{idx + 1}</td>
                    <td className="p-4 font-medium text-gray-900">{student.name}</td>
                    <td className="p-4">
                      <input 
                        type="number"
                        min="0"
                        max={maxMarks}
                        value={marksData[student.id]}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        className="border border-gray-300 rounded-md p-2 w-32 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter marks"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
