import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

export default function Sidebar({ menuItems, mobileOpen, setMobileOpen, roleName }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64">
      <div className="flex items-center justify-between px-4 h-16 bg-slate-800">
        <span className="text-xl font-bold tracking-wider">ERP Portal</span>
        <span className="text-xs uppercase bg-primary-600 px-2 py-1 rounded-md font-semibold">
          {roleName}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-white"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-red-300 hover:bg-slate-800 hover:text-red-200 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 transform transition-transform duration-300 ease-in-out">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent />
      </div>
    </>
  );
}
