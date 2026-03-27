import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';

export default function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentMenuItems = [
    { name: 'Dashboard', path: '/student', icon: 'dashboard' },
    { name: 'My Attendance', path: '/student/attendance', icon: 'calendar_month' },
    { name: 'My Marks', path: '/student/marks', icon: 'grading' },
    { name: 'Announcements', path: '/student/announcements', icon: 'campaign' },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-surface">
      <Sidebar 
        menuItems={studentMenuItems} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        roleName="Student"
      />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:pl-72">
        <TopNav setMobileOpen={setMobileOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
