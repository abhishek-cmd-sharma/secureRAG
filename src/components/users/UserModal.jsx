import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { Users, Shield, Mail, Building, CheckCircle2, AlertCircle } from 'lucide-react';

export function UserModal({ isOpen, onClose, userToEdit = null }) {
  const { addUser, editUser, organizations } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orgId, setOrgId] = useState('org-1');
  const [role, setRole] = useState('Employee');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setOrgId(userToEdit.orgId || 'org-1');
      setRole(userToEdit.role);
      setStatus(userToEdit.status);
    } else {
      setName('');
      setEmail('');
      setOrgId('org-1');
      setRole('Employee');
      setStatus('Active');
    }
    setError('');
  }, [userToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    const org = organizations.find(o => o.id === orgId) || organizations[0];
    const accessScope = role === 'Admin'
      ? 'All Documents (Unrestricted)'
      : role === 'Manager'
        ? 'Public, Internal, Confidential'
        : 'Public & Internal Only';

    if (userToEdit) {
      editUser(userToEdit.id, {
        name: name.trim(),
        email: email.trim(),
        orgId: org.id,
        orgName: org.name,
        role,
        status,
        accessScope
      });
    } else {
      addUser({
        name: name.trim(),
        email: email.trim(),
        orgId: org.id,
        orgName: org.name,
        role,
        status,
        accessScope
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? 'Edit User Credentials & Role' : 'Add New Authorized User'}
      description="Provision access permissions and bind the user to an organization tenant."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. John Doe"
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Corporate Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@organization.com"
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
            />
          </div>
        </div>

        {/* Organization Workspace */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Organization Workspace
          </label>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 cursor-pointer"
          >
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.tier})
              </option>
            ))}
          </select>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Assigned RBAC Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Admin', label: 'Admin', desc: 'Full control' },
              { id: 'Manager', label: 'Manager', desc: 'Team & Dept' },
              { id: 'Employee', label: 'Employee', desc: 'Authorized docs' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === r.id
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{r.label}</span>
                  {role === r.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Account Status
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="Active"
                checked={status === 'Active'}
                onChange={() => setStatus('Active')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="Inactive"
                checked={status === 'Inactive'}
                onChange={() => setStatus('Inactive')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700">Inactive (Suspended)</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
          >
            {userToEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
