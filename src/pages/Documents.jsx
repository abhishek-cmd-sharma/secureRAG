import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { canAccessDocument } from '../utils/formatters';
import { AccessBadge, StatusBadge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import { DocumentDetailsModal } from '../components/documents/DocumentDetailsModal';
import { UploadDocumentModal } from '../components/documents/UploadDocumentModal';
import {
  FileText,
  UploadCloud,
  Search,
  Filter,
  Eye,
  Info,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export function Documents() {
  const { documents, deleteDocument, currentUser } = useApp();
  const [searchParams] = useSearchParams();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedAccess, setSelectedAccess] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [detailsDoc, setDetailsDoc] = useState(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Filter documents based on role permission and user filter selections
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // 1. Role-based Access Enforcement:
      // If Employee, only show Public & Internal
      const isRoleAllowed = canAccessDocument(currentUser.role, doc.accessLevel);
      if (!isRoleAllowed && currentUser.role === 'Employee') {
        return false;
      }

      // 2. Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(query);
        const matchesOwner = doc.owner.toLowerCase().includes(query);
        const matchesSummary = doc.summary?.toLowerCase().includes(query);
        if (!matchesName && !matchesOwner && !matchesSummary) return false;
      }

      // 3. File type
      if (selectedType !== 'All' && doc.type !== selectedType) {
        return false;
      }

      // 4. Access level
      if (selectedAccess !== 'All' && doc.accessLevel !== selectedAccess) {
        return false;
      }

      // 5. Status
      if (selectedStatus !== 'All' && doc.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [documents, currentUser.role, searchTerm, selectedType, selectedAccess, selectedStatus]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(startIndex, startIndex + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Knowledge Repository
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {currentUser.role === 'Employee' ? 'Authorized Documents Only' : 'All Enterprise Collections'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {currentUser.role === 'Employee' ? 'Authorized Documents' : 'Document Knowledge Base'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {currentUser.role === 'Employee'
              ? 'Displaying company documents you have authorization to query under your Employee clearance.'
              : 'Manage ingested enterprise files, vector indexing pipelines, and RBAC classifications.'}
          </p>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Role-based notice banner for Employee */}
      {currentUser.role === 'Employee' && (
        <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs text-blue-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">Role Filter Active (Employee Clearance):</span>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Restricted and Confidential executive files are automatically hidden in accordance with Zero-Trust pre-filtering.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-white text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 shrink-0">
            RBAC Active
          </span>
        </div>
      )}

      {/* Upload Dropzone Preview Banner */}
      <div
        onClick={() => setUploadModalOpen(true)}
        className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              Drag & drop document or click to upload
            </h4>
            <p className="text-[11px] text-slate-400">
              Supports PDF, DOCX, TXT. Documents are chunked and converted into 768-D vectors.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="px-3.5 py-1.5 bg-slate-100 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
        >
          Browse Files
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by document name, owner, or content..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 transition-all"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* File type filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by file format"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Formats</option>
              <option value="PDF">PDF Only</option>
              <option value="DOCX">DOCX Only</option>
            </select>

            {/* Access level filter (only show levels accessible to role) */}
            <select
              value={selectedAccess}
              onChange={(e) => {
                setSelectedAccess(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by security classification"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Classifications</option>
              <option value="Public">Public</option>
              <option value="Internal">Internal</option>
              {currentUser.role !== 'Employee' && (
                <>
                  <option value="Confidential">Confidential</option>
                  {currentUser.role === 'Admin' && <option value="Restricted">Restricted</option>}
                </>
              )}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by status"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Indexed">Indexed</option>
              <option value="Processing">Processing</option>
            </select>

            {/* Reset filters if any active */}
            {(searchTerm || selectedType !== 'All' || selectedAccess !== 'All' || selectedStatus !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('All');
                  setSelectedAccess('All');
                  setSelectedStatus('All');
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong>{filteredDocuments.length}</strong> matching documents</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            Zero-Trust Vector Storage
          </span>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Workspace</th>
                <th className="py-3 px-3">Owner</th>
                <th className="py-3 px-3">Chunks</th>
                <th className="py-3 px-3">Upload Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No documents found</p>
                    <p className="text-[11px] mt-0.5">Try adjusting your search criteria or uploading a new file.</p>
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-xs">{doc.name}</p>
                          <span className="text-[10px] text-slate-400">{doc.type} • {doc.size}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <AccessBadge level={doc.accessLevel} />
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium truncate max-w-[140px]">
                      {doc.orgName}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {doc.owner}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {doc.chunksCount}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {doc.uploadDate}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview button */}
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Metadata Details */}
                        <button
                          onClick={() => setDetailsDoc(doc)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Vector & Ingestion Details"
                        >
                          <Info className="w-4 h-4" />
                        </button>

                        {/* Delete (Admin/Manager only) */}
                        {currentUser.role !== 'Employee' && (
                          <button
                            onClick={() => setDeleteDocTarget(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Items per page"
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={10}>10</option>
            </select>
            <span>items per page</span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />

      <DocumentDetailsModal
        isOpen={!!detailsDoc}
        onClose={() => setDetailsDoc(null)}
        document={detailsDoc}
      />

      <ConfirmDialog
        isOpen={!!deleteDocTarget}
        onClose={() => setDeleteDocTarget(null)}
        onConfirm={() => {
          if (deleteDocTarget) {
            deleteDocument(deleteDocTarget.id);
            setDeleteDocTarget(null);
          }
        }}
        title="Delete Document & Purge Vectors"
        message={`Are you sure you want to delete "${deleteDocTarget?.name}"? All associated 768-D vectors and semantic indexes will be permanently removed from the Qdrant cluster.`}
        confirmText="Permanently Delete"
      />
    </div>
  );
}
