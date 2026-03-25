import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { LayoutDashboard, CheckSquare, UploadCloud, Megaphone } from 'lucide-react';

export default function TeacherLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const teacherMenuItems = [
    { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
    { name: 'Mark Attendance', path: '/teacher/attendance', icon: CheckSquare },
    { name: 'Upload Marks', path: '/teacher/marks', icon: UploadCloud },
    { name: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar 
        menuItems={teacherMenuItems} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        roleName="Teacher"
      />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:pl-64">
        <TopNav setMobileOpen={setMobileOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
