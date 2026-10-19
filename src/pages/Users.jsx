import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/layout/AccessDenied';
import { RoleBadge, StatusBadge } from '../components/ui/Badge';
import { UserModal } from '../components/users/UserModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export function UsersPage() {
  const { users, deleteUser, toggleUserStatus, currentUser } = useApp();

  // If user is Employee, RBAC blocks access
  if (currentUser.role === 'Employee') {
    return <AccessDenied requiredRole="Admin" />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesOrg = u.orgName?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesOrg) return false;
      }

      if (selectedRole !== 'All' && u.role !== selectedRole) {
        return false;
      }

      if (selectedStatus !== 'All' && u.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Identity & Access Management
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">RBAC Matrix</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Users & Role Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Provision authorized accounts, allocate organizational workspaces, and govern semantic search clearance.
          </p>
        </div>

        {/* Add User button */}
        {currentUser.role === 'Admin' && (
          <button
            onClick={() => {
              setEditingUser(null);
              setUserModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Authorized User</span>
          </button>
        )}
      </div>

      {/* Role Matrix Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <RoleBadge role="Admin" />
            <span className="text-slate-400 font-mono text-[11px]">Clearance Level 3</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900">Enterprise Administrator</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Unrestricted access to all organizational documents, vector pipeline configurations, RBAC policies, and immutable audit trails.
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <RoleBadge role="Manager" />
            <span className="text-slate-400 font-mono text-[11px]">Clearance Level 2</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900">Departmental Manager</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Manages department files (Public, Internal, Confidential). Monitors team query volume, evaluations, and accuracy.
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <RoleBadge role="Employee" />
            <span className="text-slate-400 font-mono text-[11px]">Clearance Level 1</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900">Standard Employee</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Retrieves and queries authorized Public and Internal policies only. Zero access to confidential executive specifications.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            aria-label="Filter by role"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Employee">Employee</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by account status"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(searchTerm || selectedRole !== 'All' || selectedStatus !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('All');
                setSelectedStatus('All');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-3">Organization</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Access Scope</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No users match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {user.orgName}
                    </td>
                    <td className="py-3 px-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="cursor-pointer"
                        title="Click to toggle status"
                      >
                        <StatusBadge status={user.status} />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {user.accessScope}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {user.lastActive}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setUserModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setEditingUser(null);
        }}
        userToEdit={editingUser}
      />

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => {
          if (deletingUser) {
            deleteUser(deletingUser.id);
            setDeletingUser(null);
          }
        }}
        title="Revoke User Access"
        message={`Are you sure you want to remove ${deletingUser?.name} (${deletingUser?.email})? All session tokens will be invalidated immediately.`}
        confirmText="Revoke Access"
      />
    </div>
  );
}
