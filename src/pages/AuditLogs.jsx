import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/layout/AccessDenied';
import { exportToCSV } from '../utils/exportCsv';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles
} from 'lucide-react';

export function AuditLogs() {
  const { auditLogs, currentUser, addToast } = useApp();

  // If user is Employee, RBAC blocks access
  if (currentUser.role === 'Employee') {
    return <AccessDenied requiredRole="Admin" />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [selectedResult, setSelectedResult] = useState('All');
  const [selectedOrg, setSelectedOrg] = useState('All');

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesUser = log.user?.toLowerCase().includes(q);
        const matchesEmail = log.email?.toLowerCase().includes(q);
        const matchesResource = log.resource?.toLowerCase().includes(q);
        const matchesDetails = log.details?.toLowerCase().includes(q);
        const matchesAction = log.action?.toLowerCase().includes(q);
        if (!matchesUser && !matchesEmail && !matchesResource && !matchesDetails && !matchesAction) {
          return false;
        }
      }

      if (selectedAction !== 'All' && log.action !== selectedAction) {
        return false;
      }

      if (selectedResult !== 'All' && log.result !== selectedResult) {
        return false;
      }

      if (selectedOrg !== 'All' && log.organization !== selectedOrg) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchTerm, selectedAction, selectedResult, selectedOrg]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      addToast('No matching audit records to export.', 'warning');
      return;
    }

    const exportPayload = filteredLogs.map(log => ({
      Timestamp: log.timestamp,
      User: log.user,
      Email: log.email,
      Role: log.role,
      Organization: log.organization,
      Action: log.action,
      Resource: log.resource,
      Result: log.result,
      IP_Address: log.ipAddress,
      Details: log.details
    }));

    exportToCSV(exportPayload, `securerag-audit-filtered-${new Date().toISOString().split('T')[0]}.csv`);
    addToast(`Exported ${filteredLogs.length} filtered audit records to CSV`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Security Governance
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Audit Trail</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Security & Access Audit Logs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Persistent audit log of document ingestion, semantic queries, permission validations, and administrative events.
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Export Filtered CSV ({filteredLogs.length})</span>
        </button>
      </div>

      {/* Compliance Banner */}
      <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold">Zero-Trust Audit Logging & Event Tracking:</span>
            <p className="text-[11px] text-indigo-800 mt-0.5">
              All document access attempts, query evaluations, and role permissions are tracked and persisted in MongoDB Atlas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-700">Audit System Active</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by user, action, resource, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 transition-all"
            />
          </div>

          {/* Action filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              aria-label="Filter by action type"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Actions</option>
              <option value="AI_QUERY">AI Query</option>
              <option value="DOCUMENT_VIEW">Document View</option>
              <option value="PERMISSION_DENIED">Permission Denied</option>
              <option value="DOCUMENT_UPLOAD">Document Upload</option>
              <option value="USER_ROLE_CHANGED">User Role Changed</option>
              <option value="DOCUMENT_DELETED">Document Deleted</option>
              <option value="EXFILTRATION_ALERT">Exfiltration Alert</option>
            </select>

            {/* Result filter */}
            <select
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              aria-label="Filter by authorization outcome"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Outcomes</option>
              <option value="Allowed">Allowed Only</option>
              <option value="Denied">Denied (Security Blocks)</option>
            </select>

            {/* Reset */}
            {(searchTerm || selectedAction !== 'All' || selectedResult !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedAction('All');
                  setSelectedResult('All');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Displaying <strong>{filteredLogs.length}</strong> event records</span>
          <span className="font-mono text-slate-400">Retention: 365 Days</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-3">User & Persona</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Target Resource</th>
                <th className="py-3 px-3">Result</th>
                <th className="py-3 px-3">IP Address</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No audit events match your filter</p>
                    <p className="text-[11px] mt-0.5">Try resetting search criteria to view historical logs.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isDenied = log.result === 'Denied';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-semibold text-slate-900">{log.user}</p>
                          <span className="text-[10px] text-slate-400">{log.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[200px] truncate font-medium text-slate-800" title={log.resource}>
                        {log.resource}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isDenied
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isDenied ? <Lock className="w-3 h-3 text-rose-600" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {log.result}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
