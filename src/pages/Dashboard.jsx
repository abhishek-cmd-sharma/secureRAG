import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Users,
  MessageSquare,
  ShieldAlert,
  ArrowUpRight,
  UploadCloud,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { AccessBadge, StatusBadge } from '../components/ui/Badge';
import { UploadDocumentModal } from '../components/documents/UploadDocumentModal';

export function Dashboard() {
  const { currentUser, documents, users, auditLogs, dashboardKpis } = useApp();
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Compute live counts
  const totalDocsCount = documents.length;
  const totalUsersCount = users.length;
  const deniedCount = auditLogs.filter(log => (log.result || '').toLowerCase() === 'denied').length;
  const allowedQueryCount = auditLogs.filter(log => log.action === 'RAG_QUERY' || log.action === 'AI_QUERY').length;

  // Real query trends computed from actual audit logs
  const realChartQueryTrends = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { name: dayName, date: key, allowed: 0, denied: 0 };
    }

    auditLogs.forEach(log => {
      if (!log.timestamp) return;
      const datePart = log.timestamp.split(' ')[0];
      if (dayMap[datePart]) {
        const isDenied = (log.result || '').toLowerCase() === 'denied';
        if (isDenied) {
          dayMap[datePart].denied += 1;
        } else {
          dayMap[datePart].allowed += 1;
        }
      }
    });

    return Object.values(dayMap);
  }, [auditLogs]);

  // Real document classification distribution computed from actual documents
  const realDocTypes = useMemo(() => {
    const classificationMap = {
      'Public': 0,
      'Internal': 0,
      'Confidential': 0,
      'Restricted': 0
    };
    documents.forEach(doc => {
      const level = doc.accessLevel || 'Internal';
      classificationMap[level] = (classificationMap[level] || 0) + 1;
    });
    return Object.entries(classificationMap).map(([name, value]) => ({ name, value }));
  }, [documents]);

  // Real knowledge sources computed from actual documents
  const realKnowledgeSources = useMemo(() => {
    return documents.slice(0, 4).map(d => ({
      name: d.name || d.title,
      classification: d.accessLevel || 'Internal',
      chunks: d.chunksCount || 0,
      size: d.size || '1.5 MB',
      status: d.status || 'Indexed'
    }));
  }, [documents]);

  // Recent 4 uploads
  const recentDocs = documents.slice(0, 4);
  // Recent 4 audits
  const recentAudits = auditLogs.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome & Role Context Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {currentUser.role} Workspace
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs font-medium text-slate-500">{currentUser.orgName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Welcome back, {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {currentUser.role === 'Admin' 
              ? 'Zero-trust document indexing, RBAC policies, and audit trails are operating nominally.'
              : 'Here is your departmental document knowledge summary and AI query telemetry.'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI Assistant</span>
          </button>

          {currentUser.role === 'Admin' && (
            <button
              onClick={() => navigate('/users')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Documents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Indexed Documents</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalDocsCount}</span>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              Atlas Synced
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {dashboardKpis?.totalPersistedChunks ? `${dashboardKpis.totalPersistedChunks} vectorized chunks in Qdrant` : `Across ${currentUser.orgName} collections`}
          </p>
        </div>

        {/* Card 2: Users */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Authorized Users</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalUsersCount}</span>
            <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200">
              Active Directory
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            RBAC roles actively enforced
          </p>
        </div>

        {/* Card 3: AI Questions & Live RAG Engine */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">RAG Inquiries Processed</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {dashboardKpis?.totalAiQueries !== undefined ? dashboardKpis.totalAiQueries : (dashboardKpis?.aiQuestionsSimulated || 0)}
            </span>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              Live RAG
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Qdrant Vector Mesh • Gemini 2.5 Flash
          </p>
        </div>

        {/* Card 4: Access Denied Events */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Access Blocked (RBAC)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {dashboardKpis?.deniedEvents !== undefined ? dashboardKpis.deniedEvents : deniedCount}
            </span>
            <span className="text-xs font-semibold text-amber-600 flex items-center">
              Audited & Logged
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Server-side RBAC pre-filtered retrieval
          </p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: AI Questions & Allowed vs Denied Volume */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                AI Knowledge Retrieval Volume Over Time
              </h3>
              <p className="text-xs text-slate-500">
                Live semantic retrieval and RBAC access verification events from audit trail
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                Allowed
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Denied
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realChartQueryTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDenied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
                <Area type="monotone" dataKey="allowed" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorAllowed)" name="Allowed Queries" />
                <Area type="monotone" dataKey="denied" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorDenied)" name="Blocked Queries" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart: Document Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Knowledge Base Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time classification breakdown of active repository files
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={realDocTypes} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} hide />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={16} name="Documents" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Qdrant Vector Cluster Active
            </span>
            <span className="font-semibold text-slate-700">
              {dashboardKpis?.totalPersistedChunks 
                ? `${dashboardKpis.totalPersistedChunks.toLocaleString()} Chunks` 
                : `${documents.reduce((acc, d) => acc + (d.chunksCount || 0), 0).toLocaleString()} Chunks`}
            </span>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Documents & Recent Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Document Uploads */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Recent Document Ingestion
              </h3>
              <p className="text-xs text-slate-500">
                Newly uploaded and indexed private documents
              </p>
            </div>
            <button
              onClick={() => navigate('/documents')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentDocs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.chunksCount} chunks</span>
                      <span>•</span>
                      <span>{doc.uploadDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <AccessBadge level={doc.accessLevel} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Events */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Real-Time Security Activity
              </h3>
              <p className="text-xs text-slate-500">
                Audit trail of document access and queries
              </p>
            </div>
            {currentUser.role === 'Admin' ? (
              <button
                onClick={() => navigate('/audit-logs')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">Team activity</span>
            )}
          </div>

          <div className="space-y-3">
            {recentAudits.map(log => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    log.result === 'Denied' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {log.result === 'Denied' ? <Lock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 truncate">{log.user}</span>
                      <span className="text-[10px] text-slate-400">({log.role})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {log.details}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {log.timestamp}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  log.result === 'Denied' 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {log.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most-Used Documents Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Active Knowledge Collections
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Real documents indexed and available for semantic vector retrieval
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {realKnowledgeSources.length === 0 ? (
            <div className="col-span-full py-6 text-center text-slate-400 text-xs">
              No documents ingested yet. Upload your first document to populate knowledge sources.
            </div>
          ) : (
            realKnowledgeSources.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-indigo-600">#{idx + 1}</span>
                    <AccessBadge level={item.classification} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                    {item.name}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{item.chunks} chunks</span>
                  <span className="font-medium text-emerald-600">{item.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </div>
  );
}
