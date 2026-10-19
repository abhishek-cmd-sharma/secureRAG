import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/layout/AccessDenied';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { OrgDetailsModal } from '../components/organizations/OrgDetailsModal';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  FileText,
  HardDrive,
  ShieldCheck,
  ExternalLink,
  Lock,
  Globe,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function Organizations() {
  const { organizations, addOrganization, currentUser, addToast } = useApp();

  // If user is Employee, RBAC blocks access
  if (currentUser.role === 'Employee') {
    return <AccessDenied requiredRole="Admin" />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailsOrg, setDetailsOrg] = useState(null);

  // Form state for new org
  const [orgName, setOrgName] = useState('');
  const [domain, setDomain] = useState('');
  const [tier, setTier] = useState('Enterprise Plus');
  const [adminContact, setAdminContact] = useState('');
  const [seats, setSeats] = useState(100);
  const [formError, setFormError] = useState('');

  const filteredOrgs = useMemo(() => {
    return organizations.filter(o => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = o.name.toLowerCase().includes(q);
        const matchesDomain = o.domain.toLowerCase().includes(q);
        if (!matchesName && !matchesDomain) return false;
      }
      if (selectedStatus !== 'All' && o.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [organizations, searchTerm, selectedStatus]);

  const handleCreateOrg = (e) => {
    e.preventDefault();
    if (!orgName.trim() || !domain.trim() || !adminContact.trim()) {
      setFormError('Please fill out all required fields.');
      return;
    }

    addOrganization({
      name: orgName.trim(),
      domain: domain.trim(),
      tier,
      adminContact: adminContact.trim(),
      seats: Number(seats) || 50,
      storageLimit: '20 GB',
      compliance: ['SOC 2 Type II', 'ISO 27001'],
      ssoEnabled: true,
      qdrantCollection: `${domain.trim().replace(/[^a-zA-Z0-9]/g, '-')}-v1`
    });

    // Reset & close
    setOrgName('');
    setDomain('');
    setAdminContact('');
    setFormError('');
    setAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Tenant Orchestration
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Logical Isolation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Multi-Tenant Organizations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage isolated customer organizations, vector index partitions, storage quotas, and compliance certifications.
          </p>
        </div>

        {currentUser.role === 'Admin' && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Organization</span>
          </button>
        )}
      </div>

      {/* Multi-tenant Architecture Notice */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 mt-0.5">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              Isolated Vector Namespaces & Multi-Tenant Partitioning
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
              Every organization operates within a distinct cryptographic tenant boundary. Semantic retrieval queries are pre-filtered at the API gateway layer to prevent cross-tenant vector leakage.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Zero-Leakage Enforcement
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organizations by name or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter organizations by status"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Organization Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrgs.map(org => {
          const initials = org.name.split(' ').map(n => n[0]).join('').substring(0, 2);
          return (
            <div
              key={org.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {org.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {org.domain}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={org.status} />
                </div>

                {/* Plan Tier Badge */}
                <div className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-100 mb-4">
                  {org.tier}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Users</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">{org.activeUsers}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Docs</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">{org.documentsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Storage</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">{org.storageUsed}</span>
                  </div>
                </div>

                {/* Compliance tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {org.compliance?.map((c, idx) => (
                    <span key={idx} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Created: {org.createdAt}</span>
                <button
                  onClick={() => setDetailsOrg(org)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Inspect Config</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Organization Details Modal */}
      <OrgDetailsModal
        isOpen={!!detailsOrg}
        onClose={() => setDetailsOrg(null)}
        org={detailsOrg}
      />

      {/* Add Organization Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Provision New Organization Workspace"
        description="Set up an isolated enterprise tenant with dedicated vector namespace."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              placeholder="e.g. Acme Health Corp"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Corporate Domain
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              placeholder="e.g. acmehealth.com"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Administrator Contact Email
            </label>
            <input
              type="email"
              value={adminContact}
              onChange={(e) => setAdminContact(e.target.value)}
              required
              placeholder="admin@acmehealth.com"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Enterprise Plus">Enterprise Plus</option>
                <option value="Enterprise HIPAA">Enterprise HIPAA</option>
                <option value="Business Pro">Business Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial User Seats
              </label>
              <input
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                min={10}
                max={1000}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
