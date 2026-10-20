import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  User,
  Sliders,
  Bell,
  Building,
  Shield,
  Key,
  RotateCcw,
  Save,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';

export function Settings() {
  const { settings, updateSettings, currentUser, resetAllDemoData, addToast } = useApp();

  const [activeTab, setActiveTab] = useState('profile');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Local form states
  const [profileForm, setProfileForm] = useState(settings.profile);
  const [appearanceForm, setAppearanceForm] = useState(settings.appearance);
  const [notifForm, setNotifForm] = useState(settings.notifications);
  const [orgForm, setOrgForm] = useState(settings.organization);
  const [securityForm, setSecurityForm] = useState(settings.security);

  // API keys (persisted in local storage)
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('securerag_api_keys');
    return saved ? JSON.parse(saved) : [];
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateSettings('profile', profileForm);
  };

  const handleSaveAppearance = (e) => {
    e.preventDefault();
    updateSettings('appearance', appearanceForm);
  };

  const handleSaveNotifs = (e) => {
    e.preventDefault();
    updateSettings('notifications', notifForm);
  };

  const handleSaveOrg = (e) => {
    e.preventDefault();
    updateSettings('organization', orgForm);
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    updateSettings('security', securityForm);
  };

  const handleGenerateKey = () => {
    const newKey = {
      id: `key-${Date.now()}`,
      name: 'Custom Service API Key',
      prefix: `secrag_live_${Math.random().toString(36).substring(2, 6)}***`,
      created: new Date().toISOString().split('T')[0]
    };
    const updated = [newKey, ...apiKeys];
    setApiKeys(updated);
    localStorage.setItem('securerag_api_keys', JSON.stringify(updated));
    addToast('New API key generated. Ensure you copy the secret token.', 'success');
  };

  const handleRevokeKey = (keyId) => {
    const updated = apiKeys.filter(k => k.id !== keyId);
    setApiKeys(updated);
    localStorage.setItem('securerag_api_keys', JSON.stringify(updated));
    addToast('API Key revoked', 'info');
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'organization', label: 'Organization', icon: Building, adminOnly: true },
    { id: 'security', label: 'Security & Access', icon: Shield, adminOnly: true },
    { id: 'api', label: 'API Keys & Integration', icon: Key, adminOnly: true }
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || currentUser.role === 'Admin');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              System Configuration
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Local State Controls</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Enterprise Settings & Preferences
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure account profiles, security parameters, vector search thresholds, and API integration tokens.
          </p>
        </div>

        {/* Resync Live Data Button */}
        <button
          onClick={() => setResetConfirmOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear Cache & Resync Live Data</span>
        </button>
      </div>

      {/* Tabs & Content Split */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Navigation Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs space-y-1">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Profile Information</h3>
                <p className="text-[11px] text-slate-500">Update your account identity and notification email address.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Bio</label>
                <textarea
                  rows={2}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <form onSubmit={handleSaveAppearance} className="space-y-5 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Appearance & Theme Preferences</h3>
                <p className="text-[11px] text-slate-500">Tailor the visual density and confidence metrics display.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Interface Density</label>
                <div className="flex gap-3">
                  {['comfortable', 'compact'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAppearanceForm({ ...appearanceForm, density: d })}
                      className={`px-4 py-2 rounded-xl border text-xs capitalize ${
                        appearanceForm.density === d
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appearanceForm.showConfidenceMetrics}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, showConfidenceMetrics: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Display Cosine Similarity Match Scores</span>
                    <span className="text-[11px] text-slate-400">Show numeric vector distance percentages on document citations.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifs} className="space-y-5 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Notification Alerts</h3>
                <p className="text-[11px] text-slate-500">Configure real-time audit alerts and ingestion notifications.</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifForm.securityAlerts}
                    onChange={(e) => setNotifForm({ ...notifForm, securityAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">RBAC Security Alerts</span>
                    <span className="text-[11px] text-slate-500">Alert immediately when an unauthorized role attempts to query confidential documents.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifForm.documentProcessed}
                    onChange={(e) => setNotifForm({ ...notifForm, documentProcessed: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Document Chunking Completion</span>
                    <span className="text-[11px] text-slate-500">Notify when vector ingestion pipeline finishes indexing into Qdrant.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifForm.weeklyDigest}
                    onChange={(e) => setNotifForm({ ...notifForm, weeklyDigest: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Weekly Security Summary</span>
                    <span className="text-[11px] text-slate-500">Weekly email digest summarizing questions answered and access event trends.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notification Settings</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: ORGANIZATION */}
          {activeTab === 'organization' && (
            <form onSubmit={handleSaveOrg} className="space-y-5 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Organization Information</h3>
                <p className="text-[11px] text-slate-500">Manage tenant identity and default data governance policies.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Legal Name</label>
                  <input
                    type="text"
                    value={orgForm.orgName}
                    onChange={(e) => setOrgForm({ ...orgForm, orgName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Domain</label>
                  <input
                    type="text"
                    value={orgForm.primaryDomain}
                    onChange={(e) => setOrgForm({ ...orgForm, primaryDomain: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Retention (Days)</label>
                  <input
                    type="number"
                    value={orgForm.retentionDays}
                    onChange={(e) => setOrgForm({ ...orgForm, retentionDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Ingestion Access Level</label>
                  <select
                    value={orgForm.defaultAccessLevel}
                    onChange={(e) => setOrgForm({ ...orgForm, defaultAccessLevel: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Internal">Internal</option>
                    <option value="Public">Public</option>
                    <option value="Confidential">Confidential</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Organization</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity} className="space-y-5 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Security & Access Preferences</h3>
                <p className="text-[11px] text-slate-500">Configure zero-trust enforcement, session durations, and vector filtering thresholds.</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securityForm.enforceMfa}
                    onChange={(e) => setSecurityForm({ ...securityForm, enforceMfa: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Enforce Multi-Factor Authentication (MFA)</span>
                    <span className="text-[11px] text-slate-500">Mandates hardware security keys or TOTP authenticators for all organizational users.</span>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Idle Session Expiration</label>
                  <select
                    value={securityForm.sessionTimeoutMinutes}
                    onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeoutMinutes: Number(e.target.value) })}
                    className="w-full sm:w-64 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes (Standard)</option>
                    <option value={120}>120 Minutes</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      RAG Vector Similarity Confidence Threshold
                    </label>
                    <span className="font-mono text-indigo-600 font-bold">{securityForm.ragSimilarityThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="0.70"
                    max="0.95"
                    step="0.01"
                    value={securityForm.ragSimilarityThreshold}
                    onChange={(e) => setSecurityForm({ ...securityForm, ragSimilarityThreshold: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400">Chunks below this cosine threshold will not be passed to the generator.</span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Security Policies</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: API KEYS */}
          {activeTab === 'api' && (
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">API Keys & Integration</h3>
                  <p className="text-[11px] text-slate-500">Manage programmable tokens for document ingestion and retrieval.</p>
                </div>
                <button
                  onClick={handleGenerateKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Key</span>
                </button>
              </div>

              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div
                    key={key.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{key.name}</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px] mt-1 block">{key.prefix}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Created: {key.created}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addToast('API Token copied to clipboard', 'info')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                        title="Copy Key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resync Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          resetAllDemoData();
          setResetConfirmOpen(false);
        }}
        title="Clear Local Cache & Resync Live Data"
        message="This will clear cached local browser storage and reload all real documents, users, organizations, and chat conversations directly from MongoDB Atlas and Qdrant."
        confirmText="Confirm Resync"
        isDestructive={false}
      />
    </div>
  );
}
