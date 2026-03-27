import { NavLink, useNavigate } from 'react-router-dom';
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
    <div className="flex flex-col h-full p-6 w-72 border-r border-outline-variant/30 bg-white z-50 shadow-[20px_0_40px_rgba(0,0,0,0.02)]">
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-blue-800 font-headline tracking-tight leading-none mb-1">Academic Editorial</h1>
          <p className="text-[10px] font-medium text-slate-500 font-label uppercase tracking-widest">{roleName} Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/admin' || item.path === '/teacher' || item.path === '/student'}
            className={({ isActive }) =>
              `flex items-center gap-4 py-3 px-4 rounded-lg transition-all duration-300 transform active:scale-[0.97] ${isActive
                ? 'text-blue-700 font-bold border-r-4 border-blue-700 bg-blue-50/50'
                : 'text-slate-500 font-medium hover:bg-slate-200/50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span className="font-headline tracking-tight text-sm">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-200 mt-auto space-y-4">
        <button
          onClick={handleLogout}
          className="flex w-full justify-center items-center gap-2 px-4 py-2.5 text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-500 font-manrope text-sm font-semibold tracking-tight transition-colors rounded-lg group"
        >
          <span className="material-symbols-outlined text-sm group-hover:text-red-500">logout</span>
          Secure Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full transform transition-transform duration-300 ease-in-out">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none ring-2 ring-white/50 bg-white/20 hover:bg-white/40 backdrop-blur-md"
                onClick={() => setMobileOpen(false)}
              >
                <span className="material-symbols-outlined text-white">close</span>
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50">
        <SidebarContent />
      </div>
    </>
  );
}
