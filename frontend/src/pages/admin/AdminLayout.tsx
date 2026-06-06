import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AdminData {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  avatarUrl?: string;
}

const navItems = [
  {
    label: 'Elections',
    items: [
      { name: 'My Elections', href: '/admin/dashboard', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
      )},
      { name: 'Create Election', href: '/admin/elections/new', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg>
      )},
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )},
    ],
  },
];

export default function AdminLayout() {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth guard + fetch fresh profile (avatarUrl may not be in localStorage for existing sessions)
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminData');

    if (!token || !admin) {
      navigate('/admin/login', { replace: true });
      return;
    }

    const parsed: AdminData = JSON.parse(admin);
    if (parsed.role === 'super_admin') {
      navigate('/super-admin/dashboard', { replace: true });
      return;
    }

    setAdminData(parsed);
    setLoading(false);

    // Fetch fresh profile so avatar is always current
    fetch(`${API_URL}/api/admin/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => {
        if (!profile) return;
        const fresh: AdminData = {
          ...parsed,
          name: profile.name ?? parsed.name,
          email: profile.email ?? parsed.email,
          avatarUrl: profile.avatarUrl ?? undefined,
        };
        setAdminData(fresh);
        localStorage.setItem('adminData', JSON.stringify(fresh));
      })
      .catch(() => {});
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-read from localStorage on every navigation so settings changes appear instantly
  useEffect(() => {
    const admin = localStorage.getItem('adminData');
    if (admin) setAdminData(JSON.parse(admin) as AdminData);
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  const confirmLogout = () => setLogoutConfirm(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const pathname = location.pathname;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Admin Panel</p>
            <p className="text-xs text-gray-400">Elections</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="sm:hidden p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navItems.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">{section.label}</p>
            {section.items.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/admin/elections/new' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-0.5 ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={active ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <Link to="/admin/settings" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border border-gray-100">
            {adminData?.avatarUrl ? (
              <img src={adminData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-700 font-semibold text-sm">{adminData?.name?.[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition">{adminData?.name}</p>
            <p className="text-xs text-gray-400 truncate">{adminData?.email}</p>
          </div>
        </Link>
        <button onClick={confirmLogout} title="Logout" aria-label="Logout" className="mt-2 w-full flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition px-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ConfirmModal
        isOpen={logoutConfirm}
        title="Sign out"
        message="Are you sure you want to sign out of the admin panel?"
        variant="warning"
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirm(false)}
      />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 sm:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 sm:w-60`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 sm:ml-60 min-w-0">
        {/* Mobile top bar */}
        <header className="sm:hidden sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-800">Admin Panel</span>
          </div>
        </header>

        <main className="p-4 sm:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
