// @ts-nocheck
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Eye } from 'lucide-react';

const statusColors = {
  'New': 'bg-slate-100 text-slate-800',
  'Qualified': 'bg-blue-100 text-blue-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Responded': 'bg-cyan-100 text-cyan-800',
  'Booked': 'bg-green-100 text-green-800',
  'Closed': 'bg-emerald-700 text-white',
  'Rejected': 'bg-red-100 text-red-800',
};

const qualityColors = {
  'High': 'text-green-700 bg-green-100',
  'Medium': 'text-yellow-700 bg-yellow-100',
  'Low': 'text-red-700 bg-red-100',
};

export default function LeadsTable({ leads, onSelectLead, onLeadsUpdated }) {
  const [updatingLeadId, setUpdatingLeadId] = useState(null);

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingLeadId(leadId);
    try {
      await base44.entities.Lead.update(leadId, {
        status: newStatus,
        contacted_at: newStatus === 'Contacted' ? new Date().toISOString() : undefined,
      });
      onLeadsUpdated?.();
    } catch (err) {
      console.error('Error updating status:', err);
    }
    setUpdatingLeadId(null);
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead className="font-semibold">Business Name</TableHead>
            <TableHead className="font-semibold">Contact</TableHead>
            <TableHead className="font-semibold">Score</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Presence</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-secondary/30 transition">
              <TableCell className="font-semibold text-foreground">
                <div>
                  <p>{lead.business_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.city}, {lead.state}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm space-y-1">
                  {lead.phone && <p>{lead.phone}</p>}
                  {lead.email && <p className="text-muted-foreground truncate">{lead.email}</p>}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{lead.lead_score}</span>
                  <Badge className={qualityColors[lead.lead_quality_label] || qualityColors['Low']}>
                    {lead.lead_quality_label}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <Select 
                  value={lead.status} 
                  onValueChange={(val) => handleStatusChange(lead.id, val)}
                  disabled={updatingLeadId === lead.id}
                >
                  <SelectTrigger className={`w-28 text-xs h-8 ${statusColors[lead.status] || statusColors['New']}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Responded">Responded</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 text-xs">
                  {lead.has_website && <Badge variant="outline">Website</Badge>}
                  {lead.has_social && <Badge variant="outline">Social</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelectLead(lead)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {lead.website && (
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a href={lead.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {leads.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No leads match your filters. Try adjusting your search.
        </div>
      )}
    </div>
  );
}
