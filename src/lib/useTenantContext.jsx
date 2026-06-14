import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';

const TenantContext = createContext(null);

/**
 * TENANT CONTEXT PROVIDER
 * 
 * Manages SaaS multi-tenant isolation:
 * - Admins: Can switch between all tenants or view global data
 * - Non-admins: Automatically scoped to their own Client/ClientProject
 * 
 * System of Truth: client_id + client_project_id form the tenant boundary
 */
export function TenantProvider({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Tenant selection state
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [availableClients, setAvailableClients] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load available clients for the user
  useEffect(() => {
    const loadClients = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      try {
        if (isAdmin) {
          // Admins see all clients
          const clients = await base44.entities.Client.list('-created_date', 1000);
          setAvailableClients(clients || []);
          if (clients?.length > 0 && !selectedClientId) {
            setSelectedClientId(clients[0].id);
          }
        } else {
          // Non-admins see only their own client(s) by email
          const userClients = await base44.entities.Client.filter(
            { email: user.email },
            '-created_date',
            100
          );
          setAvailableClients(userClients || []);
          if (userClients?.length > 0 && !selectedClientId) {
            setSelectedClientId(userClients[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [user?.email, isAdmin]);

  // Load projects for the selected client
  useEffect(() => {
    const loadProjects = async () => {
      if (!selectedClientId) return;

      setLoading(true);
      try {
        const projects = await base44.entities.ClientProject.filter(
          { client_id: selectedClientId },
          '-created_date',
          100
        );
        setAvailableProjects(projects || []);
        if (projects?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projects[0].id);
        } else if (!projects?.length) {
          setSelectedProjectId(null);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [selectedClientId]);

  // Build filter object for queries
  const getTenantFilter = () => {
    if (isAdmin && !selectedClientId) {
      // Global view (no filter)
      return {};
    }
    
    // Scoped to selected tenant
    const filter = {};
    if (selectedClientId) {
      filter.client_id = selectedClientId;
    }
    if (selectedProjectId) {
      filter.client_project_id = selectedProjectId;
    }
    return filter;
  };

  const value = {
    // Current selection
    selectedClientId,
    selectedProjectId,
    setSelectedClientId,
    setSelectedProjectId,
    
    // Available options
    availableClients,
    availableProjects,
    loading,
    
    // Query helper
    getTenantFilter,
    
    // User context
    isAdmin,
    userEmail: user?.email,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within TenantProvider');
  }
  return context;
}