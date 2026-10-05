import React, { useState, useEffect } from 'react';
import { Menu, X, Search, Bell, AlertCircle, Download, Settings, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MissionControlTopBar({ onMenuToggle, onPanelToggle }) {
  const [alerts, setAlerts] = useState([]);
  const [healthStatus, setHealthStatus] = useState('healthy');
  const [goNoGo, setGoNoGo] = useState('go');

  React.useEffect(() => {
    const loadAlerts = async () => {
      try {
        const result = await base44.admin.entities.Alert.filter({}, '-created_date', 5);
        setAlerts(result || []);
      } catch (e) {
        console.error('Failed to load alerts:', e);
      }
    };
    loadAlerts();
  }, []);

  const getStatusColor = (status) => {
    if (status === 'healthy') return 'bg-green-500';
    if (status === 'degraded') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-[var(--cs-nav-height,76px)] bg-white border-b border-border z-50 flex items-center justify-between px-6">
      {/* Left: Logo + Toggle */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="lg:hidden p-2 hover:bg-muted rounded-lg">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-primary rounded-sm" />
          <span className="font-bold text-lg text-foreground">Mission Control</span>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads, orders, events..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-muted/30 text-sm outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right: Health + Alerts + Controls */}
      <div className="flex items-center gap-4">
        {/* System Health */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs font-medium">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(healthStatus)}`} />
          <span className="text-muted-foreground">
            {healthStatus === 'healthy' ? 'Healthy' : healthStatus === 'degraded' ? 'Degraded' : 'Error'}
          </span>
        </div>

        {/* Go/No-Go Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
          goNoGo === 'go' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${goNoGo === 'go' ? 'bg-green-500' : 'bg-red-500'}`} />
          {goNoGo === 'go' ? 'GO' : 'NO-GO'}
        </div>

        {/* Alerts Badge */}
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Export Brief */}
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-foreground" />
        </button>

        {/* Right Panel Toggle */}
        <button onClick={onPanelToggle} className="hidden xl:block p-2 hover:bg-muted rounded-lg transition-colors">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </div>
  );
}