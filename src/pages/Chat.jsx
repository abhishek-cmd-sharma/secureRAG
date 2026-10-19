import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SUGGESTED_PROMPTS } from '../data/mockData';
import { canAccessDocument } from '../utils/formatters';
import { CitationDrawer } from '../components/chat/CitationDrawer';
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
  Layers
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
    setFeedback,
    isAiTyping,
    addToast
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedDocScope, setSelectedDocScope] = useState('all');
  const [activeCitation, setActiveCitation] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Filter documents authorized for the current user
  const authorizedDocs = documents.filter(doc => canAccessDocument(currentUser.role, doc.accessLevel));

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isAiTyping]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isAiTyping) return;
    const textToSend = inputMessage;
    setInputMessage('');
    sendMessage(textToSend, selectedDocScope);
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
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white z-10">
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
                  Qdrant Vector Mesh Ready
                </span>
                <span>•</span>
                <span>Role: {currentUser.role}</span>
              </div>
            </div>
          </div>

          {/* Document Scope Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Search in:</span>
            <div className="relative">
              <select
                value={selectedDocScope}
                onChange={(e) => setSelectedDocScope(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">All Authorized Documents ({authorizedDocs.length})</option>
                {authorizedDocs.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name.length > 28 ? doc.name.substring(0, 28) + '...' : doc.name} ({doc.accessLevel})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Live RAG Engine Banner */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Secure RAG Pipeline Active:</strong> Zero-Trust RBAC pre-filtered retrieval • Qdrant Vector Engine • Grounded Gemini AI answer generation with verified source citations.
            </span>
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
                Query your private organizational documents with verified citations and automatic RBAC authorization filtering.
              </p>

              {/* Quick suggestion cards */}
              <div className="mt-6 text-left">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Recommended Test Prompts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(prompt.query, selectedDocScope)}
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
                                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-[11px] text-slate-700 font-medium transition-all group shadow-2xs"
                              >
                                <span className="font-semibold text-indigo-700 truncate max-w-[200px]">
                                  {cite.docName}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500">p. {cite.page}</span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1 rounded font-bold">
                                  {cite.matchScore}
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
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 transition-colors"
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
                              className={`p-1 rounded-md transition-colors ${
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
                              className={`p-1 rounded-md transition-colors ${
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

          {/* Simulated AI Typing Indicator */}
          {isAiTyping && (
            <div className="flex items-start gap-3.5 max-w-xl animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
                <span>Searching Qdrant vector index & calculating cosine similarity...</span>
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
              placeholder={`Ask a question across ${selectedDocScope === 'all' ? 'all authorized documents' : 'selected document'}...`}
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

      {/* Citation Inspector Drawer Modal */}
      <CitationDrawer
        isOpen={!!activeCitation}
        onClose={() => setActiveCitation(null)}
        citation={activeCitation}
      />
    </div>
  );
}
