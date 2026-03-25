import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { LayoutDashboard, Users, UserCog, BookOpen, Megaphone } from 'lucide-react';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminMenuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Students', path: '/admin/students', icon: Users },
    { name: 'Manage Teachers', path: '/admin/teachers', icon: UserCog },
    { name: 'Classes & Subjects', path: '/admin/academics', icon: BookOpen },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar 
        menuItems={adminMenuItems} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        roleName="Admin"
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
