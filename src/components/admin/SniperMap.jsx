/**
 * SniperMap
 * Interactive Leaflet map that pins sniper leads by city, clusters them,
 * color-codes by sniper score, and supports proximity radius filtering.
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, Layers, Sliders, X } from 'lucide-react';

// City coordinates for common target markets
const CITY_COORDS = {
  'Phoenix AZ':    [33.4484, -112.0740],
  'Scottsdale AZ': [33.4942, -111.9261],
  'Mesa AZ':       [33.4152, -111.8315],
  'Tempe AZ':      [33.4255, -111.9400],
  'Chandler AZ':   [33.3062, -111.8413],
  'Gilbert AZ':    [33.3528, -111.7890],
  'Glendale AZ':   [33.5387, -112.1860],
  'Las Vegas NV':  [36.1699, -115.1398],
  'Denver CO':     [39.7392, -104.9903],
  'Dallas TX':     [32.7767, -96.7970],
  'Houston TX':    [29.7604, -95.3698],
  'Atlanta GA':    [33.7490, -84.3880],
  'Tampa FL':      [27.9506, -82.4572],
  'Orlando FL':    [28.5383, -81.3792],
  'Austin TX':     [30.2672, -97.7431],
  'Charlotte NC':  [35.2271, -80.8431],
  'Nashville TN':  [36.1627, -86.7816],
  'Miami FL':      [25.7617, -80.1918],
  'Chicago IL':    [41.8781, -87.6298],
  'Los Angeles CA':[34.0522, -118.2437],
  'San Diego CA':  [32.7157, -117.1611],
  'Seattle WA':    [47.6062, -122.3321],
  'Portland OR':   [45.5051, -122.6750],
  'San Antonio TX':[29.4241, -98.4936],
  'Minneapolis MN':[44.9778, -93.2650],
};

function getCityKey(city, state) {
  return `${city} ${state}`;
}

function guessCoords(city, state) {
  const key = getCityKey(city, state);
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  // Fallback: jitter around Phoenix so pins are at least visible
  return [33.4484 + (Math.random() - 0.5) * 4, -112.0740 + (Math.random() - 0.5) * 4];
}

function scoreColor(score) {
  if (score >= 70) return '#ef4444'; // red-500
  if (score >= 50) return '#f97316'; // orange-500
  return '#eab308';                  // yellow-500
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Group leads by city so we can cluster
function clusterLeads(leads) {
  const clusters = {};
  leads.forEach(lead => {
    const key = getCityKey(lead.city, lead.state);
    if (!clusters[key]) clusters[key] = { city: lead.city, state: lead.state, leads: [] };
    clusters[key].leads.push(lead);
  });
  return Object.values(clusters).map(c => ({
    ...c,
    coords: guessCoords(c.city, c.state),
    count: c.leads.length,
    maxScore: Math.max(...c.leads.map(l => l.sniper_score || l.lead_score || 0)),
    avgScore: Math.round(c.leads.reduce((s, l) => s + (l.sniper_score || l.lead_score || 0), 0) / c.leads.length),
  }));
}

export default function SniperMap({ leads, onSelectCity }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);

  const [selectedCluster, setSelectedCluster] = useState(null);
  const [radiusMiles, setRadiusMiles] = useState(0); // 0 = off
  const [centerPin, setCenterPin] = useState(null); // {lat, lng}
  const [mapReady, setMapReady] = useState(false);

  const clusters = useMemo(() => clusterLeads(leads), [leads]);

  // Filter clusters by radius if set
  const visibleClusters = useMemo(() => {
    if (!radiusMiles || !centerPin) return clusters;
    const radiusKm = radiusMiles * 1.60934;
    return clusters.filter(c => {
      const dist = haversineKm(centerPin.lat, centerPin.lng, c.coords[0], c.coords[1]);
      return dist <= radiusKm;
    });
  }, [clusters, radiusMiles, centerPin]);

  // Leads in radius filter
  const leadsInRadius = useMemo(() => {
    if (!radiusMiles || !centerPin) return leads;
    const radiusKm = radiusMiles * 1.60934;
    return leads.filter(l => {
      const coords = guessCoords(l.city, l.state);
      return haversineKm(centerPin.lat, centerPin.lng, coords[0], coords[1]) <= radiusKm;
    });
  }, [leads, radiusMiles, centerPin]);

  // Initialize Leaflet
  useEffect(() => {
    if (leafletMapRef.current || !mapRef.current) return;

    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [33.4484, -112.0740],
      zoom: 7,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    }).addTo(map);

    // Click to set center pin for radius filter
    map.on('click', (e) => {
      setCenterPin({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    leafletMapRef.current = map;
    setMapReady(true);
  }, []);

  // Render markers whenever clusters or map is ready
  useEffect(() => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!L || !map || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    visibleClusters.forEach(cluster => {
      const color = scoreColor(cluster.maxScore);
      const size = Math.min(48, 28 + cluster.count * 3);

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:${size}px; height:${size}px;
            background:${color};
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
            font-weight:900; font-size:${size > 36 ? 13 : 11}px; color:white;
            font-family:sans-serif;
          ">${cluster.count}</div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker(cluster.coords, { icon })
        .addTo(map)
        .bindTooltip(`
          <strong>${cluster.city}, ${cluster.state}</strong><br/>
          ${cluster.count} target${cluster.count > 1 ? 's' : ''} · Top score: ${cluster.maxScore}
        `, { direction: 'top', offset: [0, -size / 2] });

      marker.on('click', () => {
        setSelectedCluster(cluster);
        onSelectCity?.(cluster.leads);
        map.flyTo(cluster.coords, 11, { duration: 0.8 });
      });

      markersRef.current.push(marker);
    });
  }, [visibleClusters, mapReady]);

  // Draw radius circle
  useEffect(() => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!L || !map) return;

    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }

    if (centerPin && radiusMiles > 0) {
      circleRef.current = L.circle([centerPin.lat, centerPin.lng], {
        radius: radiusMiles * 1609.34,
        color: '#00AEEF',
        weight: 2,
        fillColor: '#00AEEF',
        fillOpacity: 0.08,
        dashArray: '6 4',
      }).addTo(map);
    }
  }, [centerPin, radiusMiles, mapReady]);

  const NICHE_COLORS = {
    med_spa: 'bg-pink-100 text-pink-800',
    dental: 'bg-cyan-100 text-cyan-800',
    chiropractic: 'bg-purple-100 text-purple-800',
    hvac: 'bg-orange-100 text-orange-800',
    roofing: 'bg-slate-100 text-slate-800',
    contractors: 'bg-amber-100 text-amber-800',
  };

  const inRadiusCount = leadsInRadius.length;

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/40 rounded-xl border border-border px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Sliders className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-foreground">Proximity Radius</span>
              <span className="text-primary font-bold">{radiusMiles === 0 ? 'Off' : `${radiusMiles} mi`}</span>
            </div>
            <input
              type="range" min={0} max={200} step={10} value={radiusMiles}
              onChange={e => setRadiusMiles(Number(e.target.value))}
              className="w-full accent-primary h-1.5"
            />
          </div>
        </div>

        {radiusMiles > 0 && (
          <div className="text-xs text-muted-foreground">
            {centerPin ? (
              <span className="text-primary font-semibold">{inRadiusCount} lead{inRadiusCount !== 1 ? 's' : ''} within {radiusMiles} mi</span>
            ) : (
              <span className="italic">Click map to set center point</span>
            )}
          </div>
        )}

        {centerPin && (
          <button
            onClick={() => { setCenterPin(null); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors"
          >
            <X className="w-3 h-3" /> Clear center
          </button>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-[10px] font-semibold">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 70+</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> 50–69</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> &lt;50</span>
        </div>
      </div>

      {radiusMiles > 0 && !centerPin && (
        <div className="text-center text-sm text-muted-foreground italic py-1">
          👆 Click anywhere on the map to set your radius center point
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: 480 }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* City detail panel */}
        {selectedCluster && (
          <div className="absolute top-3 right-3 w-72 bg-white rounded-xl shadow-xl border border-border overflow-hidden z-[500]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div>
                <p className="font-bold text-foreground text-sm">{selectedCluster.city}, {selectedCluster.state}</p>
                <p className="text-xs text-muted-foreground">{selectedCluster.count} target{selectedCluster.count > 1 ? 's' : ''} · Avg score {selectedCluster.avgScore}</p>
              </div>
              <button onClick={() => setSelectedCluster(null)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {selectedCluster.leads
                .sort((a, b) => (b.sniper_score || b.lead_score || 0) - (a.sniper_score || a.lead_score || 0))
                .map(lead => {
                  const score = lead.sniper_score || lead.lead_score || 0;
                  return (
                    <div key={lead.id} className="px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[10px] flex-shrink-0"
                          style={{ background: scoreColor(score) }}
                        >
                          {score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{lead.business_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {lead.niche && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${NICHE_COLORS[lead.niche] || 'bg-gray-100 text-gray-700'}`}>
                                {lead.niche.replace('_', ' ')}
                              </span>
                            )}
                            <span className="text-[9px] text-muted-foreground">
                              {lead.website_quality === 'none' ? '🚫 No site' : lead.website_quality === 'low' ? '⚠ Bad site' : lead.website_quality}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            {radiusMiles > 0 && centerPin && (
              <div className="px-4 py-2 border-t border-border bg-primary/5 text-[10px] text-primary font-semibold">
                {inRadiusCount} leads within {radiusMiles}-mile radius
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Circle size = number of targets per city · Color = highest sniper score · Click a circle to see leads · Drag slider or click map to set radius filter
      </p>
    </div>
  );
}