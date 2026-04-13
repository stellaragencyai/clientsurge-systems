import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Play, Loader2, TrendingUp, Users, Target, Zap } from 'lucide-react';
import DiscoveryPanel from '@/components/leads/DiscoveryPanel';
import LeadsTable from '@/components/leads/LeadsTableIntelligence';
import LeadMetrics from '@/components/leads/LeadMetrics';
import LeadDetail from '@/components/leads/LeadDetail';

export default function LeadIntelligence() {
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNiche, setFilterNiche] = useState('all');
  const [filterScore, setFilterScore] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [niches, setNiches] = useState([]);

  useEffect(() => {
    loadLeads();
    loadAnalytics();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Lead.list('-lead_score', 500);
      setLeads(data);
      
      // Extract unique niches
      const uniqueNiches = [...new Set(data.map(l => l.niche))].filter(Boolean);
      setNiches(uniqueNiches);
    } catch (err) {
      console.error('Error loading leads:', err);
    }
    setLoading(false);
  };

  const loadAnalytics = async () => {
    try {
      await base44.functions.invoke('calculateLeadAnalytics', {});
      const today = new Date().toISOString().split('T')[0];
      const analyticsData = await base44.entities.LeadAnalytics.filter({ date: today });
      if (analyticsData.length > 0) {
        setAnalytics(analyticsData[0]);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const handleDiscover = async (params) => {
    setDiscovering(true);
    try {
      await base44.functions.invoke('discoverLeads', params);
      await new Promise(r => setTimeout(r, 1000)); // Wait for DB sync
      await loadLeads();
      await loadAnalytics();
    } catch (err) {
      console.error('Discovery error:', err);
    }
    setDiscovering(false);
  };

  const filteredLeads = leads.filter(lead => {
    const matchSearch = lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       lead.phone?.includes(searchTerm) ||
                       lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchNiche = filterNiche === 'all' || lead.niche === filterNiche;
    
    const matchScore = filterScore === 'all' || 
                      (filterScore === 'high' && lead.lead_quality_label === 'High') ||
                      (filterScore === 'medium' && lead.lead_quality_label === 'Medium') ||
                      (filterScore === 'low' && lead.lead_quality_label === 'Low');
    
    const matchStatus = filterStatus === 'all' || lead.status === filterStatus;

    return matchSearch && matchNiche && matchScore && matchStatus;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Lead Intelligence Dashboard</h1>
          <p className="text-muted-foreground">Discover, enrich, score, and manage high-quality leads</p>
        </div>

        {/* Metrics */}
        {analytics && <LeadMetrics analytics={analytics} />}

        {/* Tabs */}
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discover">Discovery Engine</TabsTrigger>
            <TabsTrigger value="leads">Lead Pipeline</TabsTrigger>
            <TabsTrigger value="detail">Lead Details</TabsTrigger>
          </TabsList>

          {/* Discovery Panel */}
          <TabsContent value="discover" className="space-y-4">
            <DiscoveryPanel onDiscover={handleDiscover} discovering={discovering} />
          </TabsContent>

          {/* Leads Table */}
          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Pipeline</CardTitle>
                <CardDescription>All discovered and managed leads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, phone, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select value={filterNiche} onValueChange={setFilterNiche}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Niche" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Niches</SelectItem>
                      {niches.map(niche => (
                        <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterScore} onValueChange={setFilterScore}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="high">High (80-100)</SelectItem>
                        <SelectItem value="medium">Medium (50-79)</SelectItem>
                        <SelectItem value="low">Low ({'<'}50)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Responded">Responded</SelectItem>
                      <SelectItem value="Booked">Booked</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredLeads.length} of {leads.length} leads
                    </p>
                    <LeadsTable 
                      leads={filteredLeads} 
                      onSelectLead={setSelectedLead}
                      onLeadsUpdated={loadLeads}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Detail */}
          <TabsContent value="detail">
            {selectedLead ? (
              <LeadDetail 
                lead={selectedLead} 
                onClose={() => setSelectedLead(null)}
                onUpdate={loadLeads}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select a lead from the pipeline to view details</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}