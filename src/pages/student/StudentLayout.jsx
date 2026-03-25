import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { LayoutDashboard, Calendar, FileText, Megaphone } from 'lucide-react';

export default function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentMenuItems = [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'My Attendance', path: '/student/attendance', icon: Calendar },
    { name: 'My Marks', path: '/student/marks', icon: FileText },
    { name: 'Announcements', path: '/student/announcements', icon: Megaphone },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar 
        menuItems={studentMenuItems} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        roleName="Student"
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
