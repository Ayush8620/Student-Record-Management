import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, addDoc, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

export default function UploadMarks() {
  const { currentUser } = useAuth();
  const { showAlert } = useModal();
  
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
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const assignedClasses = userData.assignedClasses || [];
          const assignedSubjects = userData.subjects || [];
          
          setClasses(assignedClasses.map(c => ({ id: c, name: c })));
          setSubjects(assignedSubjects.map(s => ({ id: s, name: s })));
        }
      } catch (error) {
        console.error("Error fetching teacher dropdowns", error);
      }
    };
    fetchDropdowns();
  }, [currentUser]);

  const handleFetchStudents = async () => {
    if (!selectedClass) return showAlert("Select a class first", "error");
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      const allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const studentList = allStudents.filter(s => s.classId === selectedClass);
      
      if (studentList.length === 0) {
         showAlert("No students found in this class.", "info");
      }
      setStudents(studentList);
      
      const initialData = {};
      studentList.forEach(s => {
        initialData[s.id] = '';
      });
      setMarksData(initialData);
    } catch (error) {
      console.error(error);
      showAlert("Failed to fetch students", "error");
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
      return showAlert("Fill all details", "error");
    }
    setSubmitting(true);
    try {
      const batchPromises = Object.keys(marksData).map(studentId => {
        if (!marksData[studentId]) return Promise.resolve(); // Skip empty marks
        return addDoc(collection(db, 'marks'), {
          studentId,
          subjectId: selectedSubject,
          classId: selectedClass,
          examType,
          marksObtained: parseFloat(marksData[studentId]),
          maxMarks: parseFloat(maxMarks),
          teacherId: currentUser.uid,
          timestamp: new Date().toISOString()
        });
      });
      await Promise.all(batchPromises);
      showAlert("Marks uploaded successfully", "success");
      setStudents([]); // Reset screen
    } catch (error) {
      console.error(error);
      showAlert("Failed to upload marks", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Academic Evaluation</h2>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">Upload grades and academic performance metrics.</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 mb-8 group">
        <div className="flex items-center gap-2 mb-6">
           <span className="material-symbols-outlined text-primary">assessment</span>
           <h3 className="text-lg font-bold text-on-surface font-headline">Assessment Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none appearance-none cursor-pointer">
              <option value="" disabled>Select Class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Subject</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none appearance-none cursor-pointer">
              <option value="" disabled>Select Subject...</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Exam Type</label>
            <select value={examType} onChange={e => setExamType(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none appearance-none cursor-pointer">
              <option value="" disabled>Select Exam...</option>
              <option value="sessional_1">Sessional 1</option>
              <option value="sessional_2">Sessional 2</option>
              <option value="remedial">Remedial</option>
              <option value="assignment">Assignment</option>
              <option value="practical">Practical</option>
              <option value="end_sem">End Semester</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Max Marks</label>
            <input type="number" min="1" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-3 text-sm transition-all outline-none" />
          </div>
        </div>

        <div className="flex justify-end border-t border-outline-variant/10 pt-5 mt-2">
          <button
            onClick={handleFetchStudents}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm font-bold text-sm transition-all active:scale-[0.98] ${loading ? "bg-surface-container text-outline cursor-not-allowed" : "bg-inverse-surface text-inverse-on-surface hover:bg-on-surface hover:shadow-md"}`}
          >
            {loading ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">group</span>} 
            {loading ? "Loading Roster..." : "Load Roster"}
          </button>
        </div>
      </div>

      {/* Marks Entry List */}
      {students.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
          <div className="p-4 px-6 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center bg-gradient-to-r from-primary-container/30 to-transparent">
             <div>
               <h2 className="text-lg font-bold text-on-surface font-headline flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">grading</span>
                 Grade Ledger
               </h2>
               <p className="text-xs font-medium text-on-surface-variant mt-0.5">{students.length} students loaded for {selectedClass}</p>
             </div>
             <button 
               disabled={submitting} 
               onClick={handleSubmit} 
               className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm font-bold text-sm transition-all active:scale-[0.98] ${submitting ? "bg-primary/50 text-white cursor-not-allowed" : "bg-primary hover:bg-primary-container text-on-primary shadow-primary/20"}`}
             >
               {submitting ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>} 
               {submitting ? "Saving..." : "Submit Grades"}
             </button>
          </div>
          <div className="overflow-x-auto text-on-surface">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider font-bold border-b border-outline-variant/20">
                  <th className="p-4 pl-6 w-16">No.</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4 pr-6 text-right w-48">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {students.map((student, idx) => (
                  <tr key={student.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/80 transition-colors">
                    <td className="p-4 pl-6 font-bold text-outline">{idx + 1}</td>
                    <td className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-primary-fixed/30 text-primary-fixed-variant flex items-center justify-center font-bold text-xs">
                           {student.name.charAt(0).toUpperCase()}
                         </div>
                         <p className="font-bold text-on-surface">{student.name}</p>
                       </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="relative inline-block w-32">
                        <input 
                          type="number"
                          min="0"
                          max={maxMarks}
                          value={marksData[student.id]}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/50 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2 text-sm text-center font-bold text-on-surface transition-all outline-none"
                          placeholder="—"
                        />
                        <span className="absolute right-[-30px] top-1/2 -translate-y-1/2 text-[10px] font-bold text-outline">
                          / {maxMarks}
                        </span>
                      </div>
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
