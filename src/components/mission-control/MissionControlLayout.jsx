import React, { useState, useEffect } from 'react';
import { Menu, X, Search, Bell, AlertCircle, Download, Settings } from 'lucide-react';
import MissionControlNavigation from './MissionControlNavigation';
import MissionControlTopBar from './MissionControlTopBar';
import MissionControlRightPanel from './MissionControlRightPanel';

export default function MissionControlLayout({ children, activeModule, onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <MissionControlTopBar 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onPanelToggle={() => setRightPanelOpen(!rightPanelOpen)}
      />

      {/* Main 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0 flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ paddingTop: 'var(--cs-nav-height, 76px)' }}
        >
          <MissionControlNavigation activeModule={activeModule} onNavigate={onNavigate} />
        </aside>

        {/* Center Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ marginTop: 'var(--cs-nav-height, 76px)' }}>
          <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto p-6">
              {children}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        {rightPanelOpen && (
          <aside className="hidden xl:flex w-80 bg-card border-l border-border flex-col overflow-hidden" style={{ marginTop: 'var(--cs-nav-height, 76px)' }}>
            <MissionControlRightPanel />
          </aside>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
        />
      )}
    </div>
  );
}