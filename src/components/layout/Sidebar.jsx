import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  FileText,
  Users,
  Building2,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  Sparkles
} from 'lucide-react';

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { currentUser } = useApp();
  const role = currentUser.role;

  // Define navigation items with role visibility
  const navItems = [
    {
      title: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Manager'],
      badge: null
    },
    {
      title: 'AI Document Chat',
      path: '/chat',
      icon: MessageSquare,
      roles: ['Admin', 'Manager', 'Employee'],
      badge: 'RAG'
    },
    {
      title: role === 'Employee' ? 'Authorized Documents' : 'Documents',
      path: '/documents',
      icon: FileText,
      roles: ['Admin', 'Manager', 'Employee'],
      badge: null
    },
    {
      title: 'Users & Roles',
      path: '/users',
      icon: Users,
      roles: ['Admin'],
      badge: null
    },
    {
      title: 'Organizations',
      path: '/organizations',
      icon: Building2,
      roles: ['Admin'],
      badge: null
    },
    {
      title: 'Audit Logs',
      path: '/audit-logs',
      icon: FileSpreadsheet,
      roles: ['Admin'],
      badge: 'SOC2'
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['Admin', 'Manager', 'Employee'],
      badge: null
    }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out lg:static ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 tracking-tight text-base whitespace-nowrap">
                    SecureRAG
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-indigo-200">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  Enterprise Knowledge Guard
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Workspace Org Pill */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Workspace</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Demo
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                NC
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {currentUser.orgName}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Role: <span className="font-medium text-indigo-600">{currentUser.role}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group relative ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-600 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                    
                    {!collapsed && (
                      <span className="truncate flex-1">
                        {item.title}
                      </span>
                    )}

                    {!collapsed && item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isActive 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {item.title}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Quota & Info Card */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Vector Index Storage
              </span>
              <span className="font-semibold text-slate-700">4.2 / 25 GB</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full w-[17%]" />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                AES-256 Encrypted
              </span>
              <span className="text-slate-500">Qdrant v1.8</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
