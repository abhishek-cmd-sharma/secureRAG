import React from 'react';
import { Modal } from '../ui/Modal';
import { Building2, ShieldCheck, Database, KeyRound, Server, HardDrive, CheckCircle2 } from 'lucide-react';

export function OrgDetailsModal({ isOpen, onClose, org }) {
  if (!org) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={org.name}
      description={`Multi-Tenant Workspace Configuration • Domain: ${org.domain}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Workspace Plan Tier Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Plan Tier</span>
            <h3 className="text-base font-bold mt-0.5">{org.tier}</h3>
            <p className="text-[11px] text-slate-300 mt-0.5">Admin: {org.adminContact}</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold text-[11px]">
            {org.status}
          </span>
        </div>

        {/* Quota & Storage */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Provisioned User Seats:</span>
            <span className="font-bold text-slate-900">{org.activeUsers} / {org.seats} seats</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${(org.activeUsers / org.seats) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500 font-medium">Vector Storage Index:</span>
            <span className="font-bold text-slate-900">{org.storageUsed} / {org.storageLimit}</span>
          </div>
        </div>

        {/* Technical Isolation Architecture */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-indigo-600" />
            Zero-Trust Tenant Isolation Architecture
          </h4>
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Qdrant Collection:</span>
              <span className="font-mono text-indigo-600 font-semibold">{org.qdrantCollection}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SAML / Okta SSO:</span>
              <span className="text-slate-700">{org.ssoEnabled ? 'Enforced & Active' : 'Not Configured'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">KMS Key Management:</span>
              <span className="text-slate-700">Dedicated Customer Master Key (BYOK)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Audit Compliance:</span>
              <span className="text-emerald-600 font-medium">{org.compliance?.join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Configuration
          </button>
        </div>
      </div>
    </Modal>
  );
}
