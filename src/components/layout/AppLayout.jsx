import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useApp } from '../../context/AppContext';
import { ToastContainer } from '../ui/Toast';
import { Info, Sparkles } from 'lucide-react';

export function AppLayout() {
  const { isLoggedIn, currentUser } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // If Employee lands on root (/ or /dashboard), redirect to /chat
  if (currentUser.role === 'Employee' && (location.pathname === '/' || location.pathname === '/dashboard')) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Demo Context Banner */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
          </span>
          <span className="font-semibold text-white tracking-wide">SecureRAG AI</span>
          <span className="text-slate-400 hidden sm:inline">— Phase 1 Frontend Interactive Prototype</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="hidden md:inline">Simulated Mock Engine • Pre-calculated RAG retrieval</span>
          <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">
            Frontend Only
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Collapsible Sidebar */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar setMobileOpen={setMobileOpen} />
          
          <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
