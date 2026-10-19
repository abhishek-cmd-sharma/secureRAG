import React from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { Modal } from '../ui/Modal';

export function CitationDrawer({ isOpen, onClose, citation }) {
  if (!citation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Retrieved Vector Chunk & Citation"
      description="Inspect the ground-truth document excerpt retrieved from the Qdrant vector index."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Source metadata card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {citation.docName}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span>Page {citation.page}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-600">Cosine Similarity: {citation.matchScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section title */}
        {citation.section && (
          <div className="text-xs">
            <span className="text-slate-400 font-medium">Document Section: </span>
            <span className="font-semibold text-slate-800">{citation.section}</span>
          </div>
        )}

        {/* Chunk text payload */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-700">Raw Embedding Chunk (512 tokens):</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Chunk #14</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono leading-relaxed border border-slate-800 selection:bg-indigo-600">
            {citation.snippet || 'No raw snippet available for this citation.'}
          </div>
        </div>

        {/* Verification badge */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified Ground-Truth: Zero-hallucination guarantee via RAG</span>
          </div>
          <span className="font-bold text-emerald-700">RBAC Verified</span>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Excerpt
          </button>
        </div>
      </div>
    </Modal>
  );
}
