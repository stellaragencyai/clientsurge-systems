import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Copy, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LeadDetail({ lead, onClose, onUpdate }) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.competitor_notes || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Lead.update(lead.id, {
        status,
        competitor_notes: notes,
      });
      onUpdate?.();
    } catch (err) {
      console.error('Error saving:', err);
    }
    setSaving(false);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const qualityColors = {
    'High': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-red-100 text-red-800',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle>{lead.business_name}</CardTitle>
            <CardDescription>{lead.city}, {lead.state}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Score & Quality */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Lead Score</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold">{lead.lead_score}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Quality</Label>
              <Badge className={`mt-1 ${qualityColors[lead.lead_quality_label]}`}>
                {lead.lead_quality_label}
              </Badge>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-sm">Contact Information</h3>
            
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-secondary px-3 py-2 rounded text-sm">{lead.phone}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(lead.phone, 'phone')}
                  className="h-8 w-8 p-0"
                >
                  {copied === 'phone' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {lead.email && (
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-secondary px-3 py-2 rounded text-sm">{lead.email}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(lead.email, 'email')}
                    className="h-8 w-8 p-0"
                  >
                    {copied === 'email' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {lead.website && (
              <div>
                <Label className="text-xs text-muted-foreground">Website</Label>
                <Button asChild variant="link" className="h-auto p-0 mt-1">
                  <a href={lead.website} target="_blank" rel="noopener noreferrer">{lead.website}</a>
                </Button>
              </div>
            )}
          </div>

          {/* Presence */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-sm">Digital Presence</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                {lead.has_website ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span className="text-sm">{lead.has_website ? 'Has Website' : 'No Website'}</span>
              </div>
              <div className="flex items-center gap-2">
                {lead.has_social ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span className="text-sm">{lead.has_social ? 'Has Social' : 'No Social'}</span>
              </div>
              {lead.website_quality && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{lead.website_quality} Website</Badge>
                </div>
              )}
              {lead.social_activity && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{lead.social_activity} Social</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Outreach Intelligence */}
          {lead.outreach_insight && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold text-sm">Outreach Intelligence</h3>
              <p className="text-sm leading-relaxed text-foreground bg-blue-50 p-3 rounded">
                {lead.outreach_insight}
              </p>
            </div>
          )}

          {/* Missing Systems */}
          {lead.missing_systems && lead.missing_systems.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold text-sm">Opportunities for Outreach</h3>
              <div className="space-y-1">
                {lead.missing_systems.map((system, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="text-yellow-600">→</span>
                    {system}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status & Notes */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Pipeline Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
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
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">Internal Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                className="min-h-24"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}