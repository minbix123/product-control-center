import { useState, useCallback, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Activity, Settings, LogOut,
  Search, Wifi, WifiOff, Users, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { ToastContainer } from '../ui/Toast';
import { SearchModal } from '../ui/SearchModal';
import { UserAvatar } from '../ui/UserAvatar';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  requiresAdmin?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/admin', icon: Users, label: 'Admin', requiresAdmin: true },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppLayout() {
  const { profile, permissions, logout } = useAuth();
  const { isConnected, connectionState } = useRealtime();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  // Global search shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const visibleNav = navItems.filter(item => !item.requiresAdmin || permissions?.can_access_admin);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--aqua-bg-solid)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'aqua-sidebar flex flex-col transition-transform duration-200 z-40',
        'fixed lg:relative h-full',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo area */}
        <div className="px-4 py-5 border-b border-[var(--aqua-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              ⚙️
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--aqua-text)] leading-none tracking-wide">PRODUCT</p>
              <p className="text-[11px] font-bold text-[var(--aqua-text-secondary)] leading-none tracking-wide">CONTROL CENTER</p>
            </div>
          </div>
        </div>

        {/* Search button */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-[var(--aqua-text-muted)] border border-[var(--aqua-border-light)] bg-white/50 hover:bg-white/80 transition-colors"
          >
            <Search size={13} />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[9px] bg-[var(--aqua-bg-solid)] border border-[var(--aqua-border-light)] rounded px-1">⌘K</kbd>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="aqua-sidebar-section-title">Navigation</p>
          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn('aqua-sidebar-item', isActive && 'aqua-sidebar-item-active')}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={12} className="opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: profile + realtime + logout */}
        <div className="px-3 py-3 border-t border-[var(--aqua-border)] space-y-2">
          {/* Realtime status */}
          <div className="flex items-center gap-2 px-2 py-1">
            {isConnected ? (
              <Wifi size={12} className="text-green-500" />
            ) : (
              <WifiOff size={12} className="text-red-400" />
            )}
            <span className={cn('text-[10px] font-medium', isConnected ? 'text-green-600' : 'text-red-500')}>
              {connectionState === 'connecting' ? 'Connecting...' : isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* User profile */}
          {profile && (
            <div className="flex items-center gap-2 px-2">
              <UserAvatar profile={profile} size="sm" showRole />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--aqua-text)] truncate m-0">{profile.display_name || profile.name}</p>
                <p className="text-[10px] text-[var(--aqua-text-muted)] truncate m-0">{profile.role?.name}</p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top toolbar (mobile) */}
        <div className="aqua-toolbar lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-black/5 rounded" aria-label="Menu">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm font-semibold flex-1 text-center">PCC</span>
          <button onClick={() => setSearchOpen(true)} className="p-1.5 hover:bg-black/5 rounded" aria-label="Search">
            <Search size={18} />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Search modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
