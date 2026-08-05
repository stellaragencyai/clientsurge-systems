/**
 * AdminOverlay — Minimal floating admin control panel that sits above the live site.
 * Users can click the logo and navigate the site normally while staying logged in.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Menu, X, LogOut, Eye, Loader2, Inbox, ChevronDown } from 'lucide-react';

const CORE_NAV = [
  { id: 'overview', label: 'Overview', tab: 'overview' },
  { id: 'leads', label: 'Leads', tab: 'leads' },
  { id: 'inbox', label: 'Inbox', tab: 'inbox', badge: 'inbox' },
  { id: 'revenue', label: 'Revenue', tab: 'revenue' },
  { id: 'analytics', label: 'Analytics', tab: 'analytics' },
  { id: 'settings', label: 'Settings', tab: 'settings' },
];

export default function AdminOverlay() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [panelOpen, setPanelOpen] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [previewingAsClient, setPreviewingAsClient] = useState(false);

  // Load unread counts
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const msgs = await base44.admin.entities.SupportMessage.filter({ read: false }, "-created_date", 50);
        setInboxUnread((msgs || []).length);
      } catch {}
    };
    loadUnread();
    const interval = setInterval(loadUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoadingAuth) return null;

  const handleLogout = () => {
    setLoggingOut(true);
    base44.auth.logout('/');
  };

  const handlePreviewAsClient = async () => {
    setPreviewingAsClient(true);
    try {
      window.open('/client-portal', '_blank');
    } catch (e) {
      window.open('/client-portal', '_blank');
    } finally {
      setPreviewingAsClient(false);
    }
  };

  const handleNavClick = (tab) => {
    navigate(`/admin?tab=${tab}`);
    setPanelOpen(false);
  };

  return (
    <>
      {/* Floating Toggle Button — fixed bottom right */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center md:hidden"
      >
        {panelOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay Panel */}
      <div
        className={`fixed inset-0 z-30 pointer-events-none transition-opacity duration-300 ${
          panelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        } md:pointer-events-none md:opacity-0 bg-black/30`}
        onClick={() => setPanelOpen(false)}
      />

      {/* Admin Panel — slides in from bottom on mobile, fixed left on desktop */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 md:top-0 md:inset-y-0 md:left-0 md:bottom-auto md:w-72 bg-background border border-border rounded-t-2xl md:rounded-none md:rounded-r-2xl shadow-2xl transition-all duration-300 transform pointer-events-auto ${
          panelOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-0 md:hidden'
        }`}
        style={{
          maxHeight: 'min(80vh, 600px)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm rounded-t-2xl md:rounded-none">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-foreground text-sm">Admin</h2>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1 hover:bg-muted rounded-lg transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {CORE_NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.tab)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors text-left relative"
            >
              <span>{item.label}</span>
              {item.badge === 'inbox' && inboxUnread > 0 && (
                <span className="ml-auto text-xs font-bold bg-primary text-white rounded-full px-2 py-0.5">
                  {inboxUnread}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="h-px bg-border mx-3" />

        {/* User & Actions */}
        <div className="p-3 space-y-2">
          <button
            onClick={handlePreviewAsClient}
            disabled={previewingAsClient}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-60"
          >
            {previewingAsClient ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
            {previewingAsClient ? 'Opening...' : 'Preview as Client'}
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
            {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>

        {/* User Info */}
        <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground">
          Logged in as <span className="font-medium text-foreground">{user?.full_name || 'Admin'}</span>
        </div>
      </div>
    </>
  );
}