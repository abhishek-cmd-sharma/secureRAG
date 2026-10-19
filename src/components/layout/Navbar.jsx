import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  ShieldAlert,
  UserCheck,
  FileCheck2,
  LogOut,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { DEMO_ROLES } from '../../data/mockData';

export function Navbar({ setMobileOpen }) {
  const { currentUser, switchRole, logout, auditLogs } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roleMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setRoleMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setNotifMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumb title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Executive Overview';
    if (path.startsWith('/chat')) return 'AI Document Chat';
    if (path.startsWith('/documents')) return currentUser.role === 'Employee' ? 'Authorized Documents' : 'Document Knowledge Base';
    if (path.startsWith('/users')) return 'Users & Access Control';
    if (path.startsWith('/organizations')) return 'Multi-Tenant Organizations';
    if (path.startsWith('/audit-logs')) return 'Security & Compliance Audit Logs';
    if (path.startsWith('/settings')) return 'Enterprise Settings';
    return 'SecureRAG AI';
  };

  const recentNotifications = auditLogs.slice(0, 4);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile hamburger & breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>SecureRAG</span>
              <span>/</span>
              <span className="text-slate-600 font-medium">{currentUser.orgName}</span>
            </div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Center: Search Input */}
        <div className="hidden md:flex items-center max-w-xs xl:max-w-md w-full mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents, policies, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2.5">
          {/* DEMO ROLE SWITCHER (Highlighted pill) */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-xl text-xs font-medium text-indigo-900 hover:bg-indigo-100/70 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-slate-500 font-normal hidden sm:inline">Demo Role:</span>
                <span className="font-bold text-indigo-700">{currentUser.role}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-indigo-500 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Role dropdown modal/menu */}
            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">Switch Demo Role</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Experience the frontend through different RBAC permissions.
                  </p>
                </div>

                <div className="p-2 space-y-1">
                  {Object.entries(DEMO_ROLES).map(([key, roleData]) => {
                    const isSelected = currentUser.roleKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          switchRole(key);
                          setRoleMenuOpen(false);
                          // If current page is restricted for this role, bounce to chat or overview
                          if (key === 'employee' && (location.pathname === '/users' || location.pathname === '/organizations' || location.pathname === '/audit-logs')) {
                            navigate('/chat');
                          }
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/90 border border-indigo-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <img
                          src={roleData.avatar}
                          alt={roleData.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900">
                              {roleData.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              key === 'admin' 
                                ? 'bg-indigo-100 text-indigo-700' 
                                : key === 'manager' 
                                  ? 'bg-sky-100 text-sky-700' 
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {roleData.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {roleData.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">
                            {roleData.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* NOTIFICATIONS DROPDOWN */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setNotifMenuOpen(!notifMenuOpen)}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors relative"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>

            {notifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900">Security & Activity Feed</span>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Live
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setNotifMenuOpen(false);
                      navigate('/audit-logs');
                    }}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    View all logs
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {recentNotifications.map(item => (
                    <div key={item.id} className="p-3 hover:bg-slate-50/80 transition-colors text-left flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        item.result === 'Denied' 
                          ? 'bg-rose-50 text-rose-600' 
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {item.result === 'Denied' ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <FileCheck2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate">{item.user}</span>
                          <span className="text-[10px] text-slate-400">{item.timestamp.split(' ')[1]}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                          {item.details}
                        </p>
                        <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.result === 'Denied' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.action} • {item.result}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* HELP MODAL BUTTON */}
          <button
            onClick={() => setHelpModalOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="Demo Guide & Architecture"
            aria-label="Open Demo Guide"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* USER PROFILE AVATAR MENU */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-none">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {currentUser.role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {currentUser.role} • {currentUser.orgName}
                  </span>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>Profile & Preferences</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setHelpModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Demo Walkthrough Guide
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out Demo Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* DEMO GUIDE MODAL */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="SecureRAG AI — Phase 1 Frontend Prototype Guide"
        description="Understanding simulated RAG architecture, demo personas, and enterprise security features."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-indigo-950">Phase 1 Scope Notice</p>
              <p className="text-[11px] text-indigo-800 mt-0.5">
                This is a complete frontend implementation utilizing rich simulated enterprise data, local React state, and realistic mock RAG responses. Backend API servers, Gemini API integration, and real Qdrant vector databases will connect in subsequent phases.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              Role-Based Access Control (RBAC) Demonstration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block text-xs">Admin (Sarah Connor)</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Full clearance. Can access Overview, AI Chat, All Documents, Users, Organizations, Audit Logs, and Settings.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block text-xs">Manager (David Vance)</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Operational clearance. Manages departmental docs and team query activity.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block text-xs">Employee (Elena Rostova)</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Restricted clearance. Only sees Authorized Public & Internal documents. Blocked from querying confidential files.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Key Interactive Features to Test
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Demo Role Switcher:</strong> Use the top bar pill to swap between Admin, Manager, and Employee at any time to see menus and permissions change dynamically.</li>
              <li><strong>Interactive AI Chat:</strong> Ask questions about PTO, remote work, password policy, or Titan architecture to see simulated RAG answers with clickable document citations.</li>
              <li><strong>RBAC Security Block:</strong> Switch to Employee role and ask about "Q3 Financials" or "Titan architecture" in the AI chat to witness the access denial filter!</li>
              <li><strong>Document Upload Simulation:</strong> Drag or browse a file in the Documents page to see the ingestion progress simulator and add mock records.</li>
              <li><strong>Audit Log CSV Export:</strong> Click "Export CSV" on the Audit Logs page to download a real security audit spreadsheet.</li>
              <li><strong>Local State Persistence:</strong> Modifying users or uploading documents updates local state and survives page reloads.</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setHelpModalOpen(false)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Got it, Let's Explore
          </button>
        </div>
      </Modal>
    </>
  );
}
