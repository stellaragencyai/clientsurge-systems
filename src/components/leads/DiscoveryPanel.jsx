// @ts-nocheck
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Play, Loader2, Target } from 'lucide-react';

const NICHE_OPTIONS = [
  'med spa',
  'real estate',
  'dental',
  'hvac',
  'plumbing',
  'salon',
  'fitness',
  'law firm',
  'accounting',
];

export default function DiscoveryPanel({ onDiscover, discovering }) {
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [radius, setRadius] = useState('25');
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [minRating, setMinRating] = useState('0');

  const handleDiscover = async () => {
    if (!niche || !city || !state) {
      alert('Please fill in niche, city, and state');
      return;
    }

    onDiscover({
      niche,
      city,
      state,
      radius: parseInt(radius),
      require_website: requireWebsite,
      min_rating: parseInt(minRating),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Lead Discovery Engine
        </CardTitle>
        <CardDescription>
          Define your target market and discover new leads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Niche Selection */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Target Niche *</Label>
          <Select value={niche} onValueChange={setNiche}>
            <SelectTrigger>
              <SelectValue placeholder="Select or enter niche" />
            </SelectTrigger>
            <SelectContent>
              {NICHE_OPTIONS.map(n => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!niche && <p className="text-xs text-red-500 mt-1">Required</p>}
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">City *</Label>
            <Input
              placeholder="e.g., Phoenix"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">State *</Label>
            <Input
              placeholder="e.g., AZ"
              value={state}
              onChange={(e) => setState(e.target.value)}
              maxLength="2"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Radius (miles)</Label>
            <Input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              min="1"
              max="100"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm font-semibold">Optional Filters</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="website"
              checked={requireWebsite}
              onCheckedChange={setRequireWebsite}
            />
            <Label htmlFor="website" className="text-sm font-normal cursor-pointer">
              Require website (higher quality leads)
            </Label>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Minimum Rating</Label>
            <Input
              type="number"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              min="0"
              max="5"
              step="0.5"
            />
          </div>
        </div>

        {/* Action */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleDiscover}
            disabled={!niche || !city || !state || discovering}
            size="lg"
            className="flex-1"
          >
            {discovering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Discovering...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Discovery
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Discovery will find and enrich leads based on your criteria. Results appear in the Lead Pipeline tab.
        </p>
      </CardContent>
    </Card>
  );
}
