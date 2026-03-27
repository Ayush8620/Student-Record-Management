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
    <header className="sticky top-0 right-0 h-20 z-40 bg-white/70 backdrop-blur-md flex items-center justify-between px-10 border-b border-outline-variant/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] w-full">
      <div className="flex items-center flex-1 max-w-xl">
        <button
          type="button"
          className="mr-4 text-slate-500 md:hidden p-2 rounded-md hover:bg-slate-100"
          onClick={() => setMobileOpen(true)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        
        <div className="relative w-full hidden sm:block group lg:max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors">search</span>
          <input 
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-full py-2.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-700 transition-all outline-none" 
            placeholder="Search records, resources or directory..." 
            type="text"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6 ml-8">
        <nav className="hidden lg:flex items-center gap-6">
          <a href="#" className="font-manrope font-bold text-xs uppercase tracking-widest text-blue-700 border-b-2 border-blue-700 py-6">Directory</a>
          <a href="#" className="font-manrope font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 py-6 transition-opacity">Reports</a>
          <a href="#" className="font-manrope font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 py-6 transition-opacity">Archive</a>
        </nav>
        
        <div className="flex items-center gap-4 border-l border-slate-200 pl-6 h-10">
          <button 
             onClick={handleAlertClick}
             className="relative p-2 text-slate-500 hover:text-blue-700 transition-colors hover:bg-blue-50 rounded-full"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-white animate-pulse"></span>
          </button>
          <button className="p-2 text-slate-500 hover:text-blue-700 transition-colors hover:bg-blue-50 rounded-full hidden sm:block">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>
          
          <div className="flex items-center gap-3 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 font-headline capitalize leading-tight">{userRole || "User"}</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter truncate max-w-[100px]">{currentUser?.email}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-white shadow-sm ring-2 ring-blue-50">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
