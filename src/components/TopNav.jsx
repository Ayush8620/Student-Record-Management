import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TopNav({ setMobileOpen }) {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  
  const handleAlertClick = () => {
    if (userRole) {
      navigate(`/${userRole}/announcements`);
    }
  };

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          {/* Search or breadcrumbs can go here */}
        </div>
        <div className="ml-4 flex items-center md:ml-6 gap-4">
          <button 
             onClick={handleAlertClick}
             className="relative bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            <div className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></div>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {currentUser?.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
