import React from 'react';
import { Modal } from '../ui/Modal';
import { AccessBadge, StatusBadge } from '../ui/Badge';
import { Database, ShieldCheck, Cpu, HardDrive, Hash, Layers } from 'lucide-react';

export function DocumentDetailsModal({ isOpen, onClose, document }) {
  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vector Pipeline & Ingestion Metadata"
      description="Technical parameters of chunking, vector embeddings, and storage topologies."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Basic Metadata */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Document Identifier</span>
            <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{document.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">File Name</span>
            <span className="font-semibold text-slate-900 truncate max-w-xs">{document.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Organization Workspace</span>
            <span className="text-slate-700">{document.orgName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">RBAC Security Classification</span>
            <AccessBadge level={document.accessLevel} />
          </div>
        </div>

        {/* Vector Pipeline Telemetry */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-600" />
            Embedding & Chunking Architecture
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Model Architecture</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">text-embedding-004</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Vector Dimension</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">768-D Float32</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Chunk Strategy</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">512 Tokens (64 Overlap)</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Similarity Distance</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">Cosine Similarity</span>
            </div>
          </div>
        </div>

        {/* Storage Topology */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-indigo-600" />
            Qdrant Vector Cluster Allocation
          </h4>
          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Collection:</span>
              <span className="text-emerald-400">novacorp-enterprise-v2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">HNSW M / efConstruct:</span>
              <span>16 / 128</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Encrypted Shards:</span>
              <span>3 Replicas (Multi-AZ)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Index Status:</span>
              <span className="text-emerald-400">OPTIMIZED & READY</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </Modal>
  );
}
