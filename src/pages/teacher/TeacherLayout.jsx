import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';

export default function TeacherLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const teacherMenuItems = [
    { name: 'Dashboard', path: '/teacher', icon: 'dashboard' },
    { name: 'Mark Attendance', path: '/teacher/attendance', icon: 'check_box' },
    { name: 'Upload Marks', path: '/teacher/marks', icon: 'cloud_upload' },
    { name: 'Announcements', path: '/teacher/announcements', icon: 'campaign' },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-surface">
      <Sidebar 
        menuItems={teacherMenuItems} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        roleName="Teacher"
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
