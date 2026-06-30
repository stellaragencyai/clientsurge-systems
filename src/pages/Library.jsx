import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ResourceDownloadModal from "@/components/library/ResourceDownloadModal";
import { BookOpen, FileText, CheckSquare, BarChart2, Play, FileCode, Search, Filter } from "lucide-react";
import { setPageMetadata } from "@/lib/seo";

const CATEGORY_ICONS = { Guide: BookOpen, Template: FileCode, Checklist: CheckSquare, "Case Study": BarChart2, Playbook: Play, Script: FileText };
const CATEGORIES = ["All", "Guide", "Template", "Checklist", "Case Study", "Playbook", "Script"];
const INDUSTRIES = ["All Industries", "Med Spa", "Dental", "Chiropractic", "HVAC", "Roofing", "Contractors", "Real Estate", "Personal Injury", "Plumbing"];

function ResourceCard({ resource, onDownload }) {
  const Icon = CATEGORY_ICONS[resource.category] || BookOpen;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col">
      <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
        {resource.thumbnail_url ? <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover" /> : <Icon className="w-12 h-12 text-primary/40" />}
        <div className="absolute top-3 left-3"><span className="bg-white/90 text-xs font-bold text-primary px-2.5 py-1 rounded-full shadow-sm">{resource.category}</span></div>
        {resource.is_gated && <div className="absolute top-3 right-3"><span className="bg-foreground/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</span></div>}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary/70 mb-1.5">{resource.industry || "All Industries"}</p>
        <h3 className="font-semibold text-foreground text-base leading-snug mb-2">{resource.title}</h3>
        {resource.description && <p className="text-sm text-muted-foreground leading-relaxed flex-1">{resource.description}</p>}
        <button onClick={() => onDownload(resource)} className="cs-btn-primary mt-4 w-full">{resource.is_gated ? "Get Free Access" : "Download Now"}</button>
        {resource.download_count > 0 && <p className="text-center text-[11px] text-muted-foreground mt-2">{resource.download_count.toLocaleString()} downloads</p>}
      </div>
    </div>
  );
}

export default function Library() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [industry, setIndustry] = useState("All Industries");
  const [search, setSearch] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    const cleanup = setPageMetadata({ title: "Free Resources & Automation Guides | ClientSurge Systems", description: "Download free automation guides, templates, checklists, and playbooks for service businesses.", canonicalPath: "/library" });
    return cleanup;
  }, []);

  useEffect(() => {
    base44.entities.Resource.filter({ is_published: true }, "-created_date", 50).then((data) => setResources(data || [])).catch(() => setResources([])).finally(() => setLoading(false));
  }, []);

  const filtered = resources.filter((r) => {
    const matchCat = category === "All" || r.category === category;
    const matchInd = industry === "All Industries" || r.industry === industry || r.industry === "All Industries";
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchInd && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-16 px-6 text-center bg-gradient-to-b from-primary/5 to-background">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-3">Free Resources</p>
        <h1 className="font-titles text-[#001B44] text-4xl md:text-5xl font-bold mb-4">The Service Business<br /><span className="text-primary">Automation Library</span></h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">Guides, templates, checklists, and playbooks to help service businesses capture more leads and automate follow-up.</p>
        <div className="mt-8 max-w-md mx-auto relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search resources…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm" /></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex flex-wrap gap-2 flex-1">{CATEGORIES.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${category === cat ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"}`}>{cat}</button>)}</div>
          <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" /><select value={industry} onChange={(e) => setIndustry(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40">{INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}</select></div>
        </div>
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}</div> : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4"><BookOpen className="w-12 h-12 opacity-30" /><p className="text-lg font-medium">No resources found.</p><p className="text-sm">Try a different category or search term.</p></div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filtered.map((resource) => <ResourceCard key={resource.id} resource={resource} onDownload={setSelectedResource} />)}</div>}
      </div>
      <Footer />
      {selectedResource && <ResourceDownloadModal resource={selectedResource} onClose={() => setSelectedResource(null)} />}
    </div>
  );
}
