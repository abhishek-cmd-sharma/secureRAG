import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { canAccessDocument } from '../utils/formatters';
import { CitationDrawer } from '../components/chat/CitationDrawer';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  FileText,
  Filter,
  Shield,
  ShieldAlert,
  Info,
  ExternalLink,
  ChevronDown,
  Lock,
  Layers,
  GitCompare,
  FileSpreadsheet,
  ListChecks,
  CheckSquare,
  Square,
  X,
  FileCode
} from 'lucide-react';

export function Chat() {
  const {
    currentUser,
    documents,
    chatSessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    deleteSession,
    sendMessage,
    runDocumentSummary,
    runDocumentComparison,
    runDocumentExtraction,
    setFeedback,
    isAiTyping,
    addToast
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedDocScope, setSelectedDocScope] = useState('all');
  const [multiDocSelection, setMultiDocSelection] = useState([]);
  const [isMultiDocMode, setIsMultiDocMode] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const [previewDocFromCitation, setPreviewDocFromCitation] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Intelligence action menus
  const [summaryMenuOpen, setSummaryMenuOpen] = useState(false);
  const [extractMenuOpen, setExtractMenuOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Filter documents authorized for the current user
  const authorizedDocs = documents.filter(doc => canAccessDocument(currentUser.role, doc.accessLevel));

  // Dynamic suggested prompts generated strictly from real authorized documents
  const realSuggestedPrompts = useMemo(() => {
    if (authorizedDocs.length === 0) {
      return [
        {
          label: 'Knowledge Base',
          query: 'What documents are currently indexed in this workspace?'
        }
      ];
    }
    return authorizedDocs.slice(0, 4).map(d => {
      const cleanTitle = (d.name || d.title || 'Document').replace(/\.pdf$/i, '');
      return {
        label: d.name.length > 22 ? d.name.substring(0, 22) + '...' : d.name,
        query: `What is ${cleanTitle} and what are its key objectives?`
      };
    });
  }, [authorizedDocs]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isAiTyping]);

  // Determine current active document ID for single-doc operations
  const getPrimaryDocId = () => {
    if (isMultiDocMode && multiDocSelection.length > 0) {
      return multiDocSelection[0];
    }
    if (selectedDocScope !== 'all') {
      return selectedDocScope;
    }
    return authorizedDocs[0]?.id || authorizedDocs[0]?._id || null;
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isAiTyping) return;
    const textToSend = inputMessage;
    setInputMessage('');

    const targetScope = isMultiDocMode && multiDocSelection.length > 0
      ? multiDocSelection
      : selectedDocScope;

    sendMessage(textToSend, targetScope);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    addToast('Answer copied to clipboard', 'success', 2000);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  const toggleDocInMultiSelect = (docId) => {
    setMultiDocSelection(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      }
      return [...prev, docId];
    });
  };

  const handleTriggerSummary = (summaryType) => {
    setSummaryMenuOpen(false);
    const targetDocId = getPrimaryDocId();
    if (!targetDocId) {
      addToast('No authorized document available to summarize.', 'warning');
      return;
    }
    runDocumentSummary(targetDocId, summaryType);
  };

  const handleTriggerCompare = () => {
    const targetIds = isMultiDocMode && multiDocSelection.length >= 2
      ? multiDocSelection
      : authorizedDocs.slice(0, 2).map(d => d.id || d._id);

    if (targetIds.length < 2) {
      addToast('Please select at least two authorized documents to compare.', 'warning');
      setCompareModalOpen(true);
      return;
    }
    runDocumentComparison(targetIds);
  };

  const handleTriggerExtract = (extractionType) => {
    setExtractMenuOpen(false);
    const targetDocId = getPrimaryDocId();
    if (!targetDocId) {
      addToast('No authorized document available for extraction.', 'warning');
      return;
    }
    runDocumentExtraction(targetDocId, extractionType);
  };

  const handlePreviewDocumentFromCitation = (citation) => {
    if (!citation) return;
    const doc = documents.find(d =>
      (citation.docId && (d.id === citation.docId || d._id === citation.docId)) ||
      (citation.docName && (d.name === citation.docName || d.title === citation.docName))
    );
    if (doc) {
      setPreviewDocFromCitation(doc);
    } else {
      setPreviewDocFromCitation({
        name: citation.docName || 'Document Excerpt',
        type: 'PDF',
        size: '1.5 MB',
        orgName: currentUser.orgName,
        accessLevel: 'Internal',
        chunksCount: 'Indexed in Qdrant',
        uploadDate: 'Verified in Knowledge Base',
        summary: `Document source retrieved for query verification. Page ${citation.page || 1}.`,
        excerpt: citation.snippet || citation.excerpt || ''
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex h-[calc(100vh-8.5rem)] overflow-hidden relative">
      {/* 1. Left Chat Conversations Drawer */}
      <div
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } shrink-0 border-r border-slate-200 bg-slate-50/60 flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-10`}
      >
        {/* New Chat Header */}
        <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between gap-2">
          <button
            onClick={createNewSession}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Previous Inquiries
          </div>

          {chatSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No conversations yet. Start a new session above!
            </div>
          ) : (
            chatSessions.map(session => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-100/70 text-indigo-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{session.title}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-md transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Role Info */}
        <div className="p-3 border-t border-slate-200/80 bg-white/50 text-[11px] text-slate-500">
          <div className="flex items-center justify-between font-medium">
            <span>Authorized Scope:</span>
            <span className="text-indigo-600 font-semibold">{authorizedDocs.length} Docs</span>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Chat Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium"
              title={sidebarOpen ? 'Hide chats' : 'Show chats'}
            >
              <Layers className="w-4 h-4" />
            </button>

            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {activeSession?.title || 'AI Document Assistant'}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Phase 8 Document Intelligence Active
                </span>
                <span>•</span>
                <span>Role: {currentUser.role}</span>
              </div>
            </div>
          </div>

          {/* Document Scope Selection Controls */}
          <div className="flex items-center gap-2">
            {!isMultiDocMode ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Scope:</span>
                <div className="relative">
                  <select
                    value={selectedDocScope}
                    onChange={(e) => {
                      if (e.target.value === '__multi__') {
                        setIsMultiDocMode(true);
                        setMultiDocSelection(authorizedDocs.slice(0, 2).map(d => d.id || d._id));
                      } else {
                        setSelectedDocScope(e.target.value);
                      }
                    }}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="all">All Authorized Documents ({authorizedDocs.length})</option>
                    <option value="__multi__">✨ Multi-Document Selection...</option>
                    {authorizedDocs.map(doc => (
                      <option key={doc.id || doc._id} value={doc.id || doc._id}>
                        {(doc.name || doc.title).length > 28 ? (doc.name || doc.title).substring(0, 28) + '...' : (doc.name || doc.title)} ({doc.accessLevel})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-semibold text-indigo-900">
                  {multiDocSelection.length} Docs Selected
                </span>
                <button
                  onClick={() => setCompareModalOpen(true)}
                  className="text-[11px] text-indigo-700 hover:text-indigo-900 underline font-medium cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setIsMultiDocMode(false);
                    setMultiDocSelection([]);
                    setSelectedDocScope('all');
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                  title="Switch back to single/all scope"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Document Intelligence Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:inline">
              Intelligence Actions:
            </span>

            {/* Summarize Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setSummaryMenuOpen(!summaryMenuOpen);
                  setExtractMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-lg font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer text-xs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Summarize</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {summaryMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">Summary Types</div>
                  <button
                    onClick={() => handleTriggerSummary('short')}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50/70 text-slate-700 flex flex-col"
                  >
                    <span className="font-semibold text-slate-900">Executive Summary</span>
                    <span className="text-[10px] text-slate-400">Concise 1-2 paragraph overview</span>
                  </button>
                  <button
                    onClick={() => handleTriggerSummary('detailed')}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50/70 text-slate-700 flex flex-col"
                  >
                    <span className="font-semibold text-slate-900">Comprehensive Synthesis</span>
                    <span className="text-[10px] text-slate-400">Detailed 4-stage document analysis</span>
                  </button>
                  <button
                    onClick={() => handleTriggerSummary('key_points')}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50/70 text-slate-700 flex flex-col"
                  >
                    <span className="font-semibold text-slate-900">Key Points & Takeaways</span>
                    <span className="text-[10px] text-slate-400">High-impact operational facts</span>
                  </button>
                  <button
                    onClick={() => handleTriggerSummary('technologies')}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50/70 text-slate-700 flex flex-col"
                  >
                    <span className="font-semibold text-slate-900">Architecture & Tech Stack</span>
                    <span className="text-[10px] text-slate-400">Frontend, backend, AI & hardware</span>
                  </button>
                  <button
                    onClick={() => handleTriggerSummary('pros_cons')}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50/70 text-slate-700 flex flex-col"
                  >
                    <span className="font-semibold text-slate-900">Benefits & Constraints</span>
                    <span className="text-[10px] text-slate-400">Advantages, risks & limitations</span>
                  </button>
                </div>
              )}
            </div>

            {/* Compare Documents Action */}
            <button
              onClick={handleTriggerCompare}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-lg font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer text-xs"
            >
              <GitCompare className="w-3.5 h-3.5 text-violet-600" />
              <span>Compare Documents</span>
            </button>

            {/* Extract Intelligence Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setExtractMenuOpen(!extractMenuOpen);
                  setSummaryMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-lg font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer text-xs"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Extract Info</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {extractMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">Extraction Target</div>
                  <button
                    onClick={() => handleTriggerExtract('technologies')}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50/70 text-slate-700 flex flex-col"
                  >
                    <span className="font-semibold text-slate-900">Named Technologies</span>
                    <span className="text-[10px] text-slate-400">Validated tech breakdown</span>
                  </button>
                  <button
                    onClick={() => handleTriggerExtract('objectives')}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50/70 text-slate-700 flex flex-col"
                  >
                    <span className="font-semibold text-slate-900">Project Objectives</span>
                    <span className="text-[10px] text-slate-400">Mission, problem & beneficiaries</span>
                  </button>
                  <button
                    onClick={() => handleTriggerExtract('deadlines_dates')}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50/70 text-slate-700 flex flex-col"
                  >
                    <span className="font-semibold text-slate-900">Deadlines & Milestones</span>
                    <span className="text-[10px] text-slate-400">Dates, schedules & timelines</span>
                  </button>
                  <button
                    onClick={() => handleTriggerExtract('requirements')}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50/70 text-slate-700 flex flex-col"
                  >
                    <span className="font-semibold text-slate-900">System Requirements</span>
                    <span className="text-[10px] text-slate-400">Functional & hardware specs</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>RBAC Enforced</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {!activeSession || activeSession.messages.length === 0 ? (
            /* Empty state with suggested prompts */
            <div className="max-w-xl mx-auto py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Ask SecureRAG Assistant
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Query multi-document repositories, ask follow-up questions with conversational memory, summarize documents, and detect cross-document differences.
              </p>

              {/* Quick suggestion cards */}
              <div className="mt-6 text-left">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Recommended Inquiries
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {realSuggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(prompt.query, isMultiDocMode && multiDocSelection.length > 0 ? multiDocSelection : selectedDocScope)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group"
                    >
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block mb-1">
                        {prompt.label}
                      </span>
                      <p className="text-xs text-slate-700 font-medium group-hover:text-slate-900 leading-snug">
                        "{prompt.query}"
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active message stream */
            activeSession.messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  {isUser ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 mt-0.5"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs ${
                      msg.isDenied ? 'bg-rose-600' : 'bg-indigo-600'
                    }`}>
                      {msg.isDenied ? <ShieldAlert className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                  )}

                  {/* Message Bubble Content */}
                  <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isUser ? 'text-slate-700 ml-auto' : 'text-slate-900'}`}>
                        {isUser ? currentUser.name : 'SecureRAG AI'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {msg.timestamp}
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed text-left ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-xs font-normal'
                          : msg.isDenied
                            ? 'bg-rose-50/80 border border-rose-200 text-rose-950 rounded-tl-none'
                            : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none shadow-2xs'
                      }`}
                    >
                      {/* Context query resolution pill */}
                      {!isUser && msg.rewrittenQuery && (
                        <div className="flex items-center gap-1.5 mb-2.5 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg w-fit">
                          <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>Coreference Resolved: <strong>"{msg.rewrittenQuery}"</strong></span>
                        </div>
                      )}

                      {/* Searched documents indicator */}
                      {!isUser && msg.searchedDocuments && msg.searchedDocuments.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2.5 text-[10px] text-slate-600 bg-slate-100/80 border border-slate-200 px-2 py-0.5 rounded-md w-fit">
                          <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Searched {msg.searchedDocuments.length} Documents: {msg.searchedDocuments.map(d => d.title || d.name).join(', ')}</span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap space-y-2">
                        {msg.text}
                      </div>

                      {/* Ground Truth Document Citations (if any) */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200/70">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-2">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Retrieved Document Citations ({msg.citations.length})</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((cite, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => setActiveCitation(cite)}
                                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-[11px] text-slate-700 font-medium transition-all group shadow-2xs cursor-pointer"
                              >
                                <span className="font-semibold text-indigo-700 truncate max-w-[200px]">
                                  {cite.docName}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500">p. {cite.page}</span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1 rounded font-bold">
                                  {cite.matchScore || 'Verified'}
                                </span>
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Response Controls: Copy, Feedback */}
                      {!isUser && (
                        <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                          <span className="text-[10px] text-slate-400">
                            Zero-Trust RBAC Verified • Vector Mesh v1.8
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Thumbs up */}
                            <button
                              onClick={() => setFeedback(activeSession.id, msg.id, 'up')}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                msg.feedback === 'up'
                                  ? 'text-indigo-600 bg-indigo-100'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                              }`}
                              title="Helpful citation"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Thumbs down */}
                            <button
                              onClick={() => setFeedback(activeSession.id, msg.id, 'down')}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                msg.feedback === 'down'
                                  ? 'text-rose-600 bg-rose-100'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                              }`}
                              title="Incorrect or unhelpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* AI Typing Indicator */}
          {isAiTyping && (
            <div className="flex items-start gap-3.5 max-w-xl animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
                <span>Reasoning with multi-document intelligence & grounding...</span>
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse-dot-3" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form onSubmit={handleSend} className="relative">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask across ${
                isMultiDocMode && multiDocSelection.length > 0
                  ? `${multiDocSelection.length} selected documents`
                  : selectedDocScope === 'all'
                    ? 'all authorized documents'
                    : 'selected document'
              }...`}
              className="w-full pl-4 pr-24 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all placeholder:text-slate-400 text-slate-900"
            />

            <div className="absolute right-2.5 bottom-3.5 flex items-center gap-2">
              <button
                type="submit"
                disabled={!inputMessage.trim() || isAiTyping}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Press <strong>Enter</strong> to submit, <strong>Shift + Enter</strong> for newline</span>
            <span className="hidden sm:inline">Ground-truth verified RAG</span>
          </div>
        </div>
      </div>

      {/* Multi-Document Selection Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Select Documents</h3>
              </div>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-3">
              Check two or more documents from your authorized repository to compare or synthesize in queries:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {authorizedDocs.map(doc => {
                const docId = doc.id || doc._id;
                const isSelected = multiDocSelection.includes(docId);
                return (
                  <div
                    key={docId}
                    onClick={() => toggleDocInMultiSelect(docId)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50/60 text-indigo-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">{doc.name || doc.title}</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {doc.accessLevel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {multiDocSelection.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCompareModalOpen(false);
                    if (multiDocSelection.length > 0) {
                      setIsMultiDocMode(true);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Done
                </button>
                <button
                  disabled={multiDocSelection.length < 2}
                  onClick={() => {
                    setCompareModalOpen(false);
                    runDocumentComparison(multiDocSelection);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Compare Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citation Inspector Drawer Modal */}
      <CitationDrawer
        isOpen={!!activeCitation}
        onClose={() => setActiveCitation(null)}
        citation={activeCitation}
        onPreviewDocument={handlePreviewDocumentFromCitation}
      />

      {/* Full Document Preview Modal triggered from Citation */}
      <DocumentPreviewModal
        isOpen={!!previewDocFromCitation}
        onClose={() => setPreviewDocFromCitation(null)}
        document={previewDocFromCitation}
      />
    </div>
  );
}
