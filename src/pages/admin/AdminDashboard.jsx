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
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Admin Overview</h2>
          <p className="text-on-surface-variant mt-1 font-medium text-sm">High-level metrics and system status.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 bg-white border border-outline-variant/30 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-sm transition-colors font-medium text-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-lg shadow-sm shadow-primary/20 transition-colors font-medium text-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric Card 1 */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 flex items-start justify-between group hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-wider mb-2">Total Students</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-on-surface font-headline">
                {loading ? "..." : stats.students}
              </p>
              {!loading && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+4% this month</span>}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 flex items-start justify-between group hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-wider mb-2">Total Teachers</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-on-surface font-headline">
                {loading ? "..." : stats.teachers}
              </p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 flex items-start justify-between group hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-wider mb-2">Active Classes</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-on-surface font-headline">
                {loading ? "..." : stats.classes}
              </p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>import_contacts</span>
          </div>
        </div>
      </div>

      {/* Placeholder for Quick Actions or Recent Activity */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">bolt</span>
          <h3 className="text-lg font-bold text-on-surface font-headline">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-outline-variant/40 rounded-xl hover:bg-surface-container hover:border-primary/40 transition-colors group">
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary mb-3 text-3xl transition-colors">person_add</span>
            <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">Enroll Student</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-outline-variant/40 rounded-xl hover:bg-surface-container hover:border-primary/40 transition-colors group">
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary mb-3 text-3xl transition-colors">calendar_add_on</span>
            <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">Create Class</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-outline-variant/40 rounded-xl hover:bg-surface-container hover:border-primary/40 transition-colors group">
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary mb-3 text-3xl transition-colors">campaign</span>
            <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">Post Announcement</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-outline-variant/40 rounded-xl hover:bg-surface-container hover:border-primary/40 transition-colors group">
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary mb-3 text-3xl transition-colors">analytics</span>
            <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">System Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
