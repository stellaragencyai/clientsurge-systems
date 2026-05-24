import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const intakeTypeLabels = {
  lead_capture: "Lead Capture",
  contact_inquiry: "Contact Inquiry",
  demo_booking: "Demo Booking",
};

const sourceLabels = {
  website: "Website",
};

export default function LeadsTable() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [intakeFilter, setIntakeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, intakeFilter, sourceFilter]);

  const loadLeads = async () => {
    try {
      setError("");
      const data = await base44.entities.Leads.list("-created_date", 500);
      setLeads(data);
    } catch (err) {
      console.error("Error loading leads:", err);
      setError("Unable to load leads right now.");
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    if (intakeFilter !== "all") {
      filtered = filtered.filter((lead) => (lead.intake_type || "legacy") === intakeFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => (lead.source || "unknown") === sourceFilter);
    }

    setFilteredLeads(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      "New": "bg-blue-100 text-blue-800",
      "Contacted": "bg-sky-100 text-sky-800",
      "Replied": "bg-purple-100 text-purple-800",
      "Qualified": "bg-green-100 text-green-800",
      "Booked": "bg-pink-100 text-pink-800",
      "Closed": "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatIntakeType = (value) => intakeTypeLabels[value] || value || "Unknown";
  const formatSource = (value) => sourceLabels[value] || value || "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Replied">Replied</option>
          <option value="Qualified">Qualified</option>
          <option value="Booked">Booked</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={intakeFilter}
          onChange={(e) => setIntakeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Intake Types</option>
          <option value="lead_capture">Lead Capture</option>
          <option value="contact_inquiry">Contact Inquiry</option>
          <option value="demo_booking">Demo Booking</option>
          <option value="legacy">Legacy / Unlabeled</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Sources</option>
          <option value="website">Website</option>
          <option value="unknown">Unknown / Legacy</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No leads found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                    Intake
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/admin/leads/${lead.id}`)}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {lead.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {lead.business_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {lead.phone}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-foreground">{formatIntakeType(lead.intake_type)}</p>
                        <p className="text-xs text-muted-foreground">{formatSource(lead.source)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(lead.created_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
