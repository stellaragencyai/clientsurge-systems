import { useState } from 'react';
import { useTenantContext } from '@/lib/useTenantContext.jsx';
import { ChevronDown, Building2, FolderOpen } from 'lucide-react';

/**
 * TENANT SWITCHER COMPONENT
 * 
 * Allows admins to switch between tenants (Clients and their Projects)
 * Non-admins see only their assigned tenant
 * 
 * Integrates with Mission Control to scope all data views to selected tenant
 */
export default function TenantSwitcher() {
  const {
    selectedClientId,
    selectedProjectId,
    setSelectedClientId,
    setSelectedProjectId,
    availableClients,
    availableProjects,
    isAdmin,
    loading,
  } = useTenantContext();

  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const selectedClient = availableClients.find(c => c.id === selectedClientId);
  const selectedProject = availableProjects.find(p => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Client Switcher */}
      <div className="relative">
        <button
          onClick={() => {
            setShowClientDropdown(!showClientDropdown);
            setShowProjectDropdown(false);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {selectedClient?.business_name || 'Select Client'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </button>

        {showClientDropdown && availableClients.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
            <div className="max-h-64 overflow-y-auto">
              {availableClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setShowClientDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 border-b border-border/50 last:border-0 hover:bg-muted transition-colors text-sm ${
                    selectedClientId === client.id ? 'bg-primary/10 text-primary font-semibold' : ''
                  }`}
                >
                  <div className="font-medium">{client.business_name}</div>
                  <div className="text-xs text-muted-foreground">{client.email}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Project Switcher */}
      {availableProjects.length > 0 && (
        <div className="relative">
          <button
            onClick={() => {
              setShowProjectDropdown(!showProjectDropdown);
              setShowClientDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium min-w-[200px] justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {selectedProject?.business_name || 'Select Project'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>

          {showProjectDropdown && availableProjects.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  setSelectedProjectId(null);
                  setShowProjectDropdown(false);
                }}
                className="w-full text-left px-4 py-2 border-b border-border/50 hover:bg-muted transition-colors text-sm"
              >
                <div className="text-muted-foreground italic">All Projects</div>
              </button>
              <div className="max-h-64 overflow-y-auto">
                {availableProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 border-b border-border/50 last:border-0 hover:bg-muted transition-colors text-sm ${
                      selectedProjectId === project.id ? 'bg-primary/10 text-primary font-semibold' : ''
                    }`}
                  >
                    <div className="font-medium">{project.business_name}</div>
                    <div className="text-xs text-muted-foreground">{project.client_project_status}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}