/**
 * ResourceLibrary — Admin Resource Library View
 * Read-only display of existing Resource records.
 * No entity modifications, no backend changes.
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, Loader2, Search } from 'lucide-react';

export default function ResourceLibrary() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterPublished, setFilterPublished] = useState('all');

  const [categories, setCategories] = useState([]);
  const [industries, setIndustries] = useState([]);

  const loadResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await base44.entities.Resource.list('-created_date', 500).catch(() => []);
      setResources(items || []);

      // Extract unique categories and industries
      const uniqueCategories = new Set(items?.map(r => r.category).filter(Boolean) || []);
      const uniqueIndustries = new Set(items?.map(r => r.industry).filter(Boolean) || []);

      setCategories(Array.from(uniqueCategories).sort());
      setIndustries(Array.from(uniqueIndustries).sort());
    } catch (err) {
      console.error('[ResourceLibrary]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  // Apply filters
  const filtered = resources.filter(r => {
    const matchSearch =
      !searchTerm ||
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = filterCategory === 'all' || r.category === filterCategory;
    const matchIndustry = filterIndustry === 'all' || r.industry === filterIndustry;
    const matchPublished =
      filterPublished === 'all' ||
      (filterPublished === 'published' && r.published) ||
      (filterPublished === 'draft' && !r.published);

    return matchSearch && matchCategory && matchIndustry && matchPublished;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading resources…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Error loading resources: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Resource Library</h2>
        <p className="text-sm text-slate-500 mt-1">Browse and manage resources, guides, and templates</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources by title or description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Industry
            </label>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">All Industries</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Status
            </label>
            <select
              value={filterPublished}
              onChange={(e) => setFilterPublished(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <button
            onClick={loadResources}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Result count */}
        <p className="text-xs text-slate-500">
          Showing {filtered.length} of {resources.length} resources
        </p>
      </div>

      {/* Resources Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-sm text-slate-600">No resources found matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(resource => (
            <div
              key={resource.id}
              className="rounded-lg border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                    {resource.title || 'Untitled'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {resource.description || 'No description'}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    resource.published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {resource.published ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Meta */}
              <div className="space-y-1 border-t border-slate-100 pt-3">
                {resource.category && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Category:</span> {resource.category}
                  </p>
                )}
                {resource.industry && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Industry:</span> {resource.industry}
                  </p>
                )}
                {resource.download_count > 0 && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Downloads:</span> {resource.download_count}
                  </p>
                )}
              </div>

              {/* Tags */}
              {resource.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className="text-xs px-2 py-1 text-slate-500">
                      +{resource.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* File Link */}
              {resource.file_url && (
                <div className="border-t border-slate-100 pt-3">
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}