import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const studentQ = query(collection(db, "users"), where("role", "==", "student"));
        const teacherQ = query(collection(db, "users"), where("role", "==", "teacher"));
        
        const [studentSnap, teacherSnap, classSnap] = await Promise.all([
          getCountFromServer(studentQ),
          getCountFromServer(teacherQ),
          getCountFromServer(collection(db, "classes"))
        ]);

        setStats({
          students: studentSnap.data().count,
          teachers: teacherSnap.data().count,
          classes: classSnap.data().count
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.students}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Teachers</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.teachers}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-500 text-sm font-medium">Active Classes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.classes}
          </p>
        </div>
      </div>
    </div>
  );
}
