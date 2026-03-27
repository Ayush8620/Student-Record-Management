import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminMenuItems = [
    { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
    { name: 'Manage Students', path: '/admin/students', icon: 'group' },
    { name: 'Manage Teachers', path: '/admin/teachers', icon: 'badge' },
    { name: 'Classes & Subjects', path: '/admin/academics', icon: 'menu_book' },
    { name: 'Announcements', path: '/admin/announcements', icon: 'campaign' },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-surface">
      <Sidebar 
        menuItems={adminMenuItems} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        roleName="Admin"
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
