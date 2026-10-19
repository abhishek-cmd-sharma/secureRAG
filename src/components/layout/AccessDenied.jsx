import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export function AccessDenied({ requiredRole = 'Admin' }) {
  const { currentUser, switchRole } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-5 border border-rose-100 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-3">
          403 Forbidden • RBAC Enforcement
        </span>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Access Restricted
        </h2>

        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Your current persona <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role}) does not have authorized credentials to view this administrative resource.
        </p>

        <div className="my-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span>Your Current Role:</span>
            <span className="font-semibold text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded">{currentUser.role}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Required Role Clearance:</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{requiredRole}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Security Policy:</span>
            <span className="text-slate-500">Zero-Trust Pre-Filter</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to AI Chat
          </button>

          <button
            onClick={() => switchRole('admin')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Switch to Admin Role
          </button>
        </div>
      </div>
    </div>
  );
}
