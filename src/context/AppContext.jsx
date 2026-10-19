import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DEMO_ROLES,
  INITIAL_ORGANIZATIONS,
  INITIAL_USERS,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CHAT_SESSIONS,
  MOCK_RESPONSES,
} from '../data/mockData';
import { api } from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // 1. Authentication & Role state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('securerag_user');
    return saved ? JSON.parse(saved) : DEMO_ROLES.admin;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('securerag_auth');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 2. Data collections (populated from MongoDB via Backend API)
  const [organizations, setOrganizations] = useState(() => {
    const saved = localStorage.getItem('securerag_orgs');
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('securerag_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('securerag_docs');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('securerag_audit');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [dashboardKpis, setDashboardKpis] = useState(null);

  const [chatSessions, setChatSessions] = useState(() => {
    const saved = localStorage.getItem('securerag_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHAT_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return chatSessions.length > 0 ? chatSessions[0].id : null;
  });

  const [isAiTyping, setIsAiTyping] = useState(false);

  // 3. Application Settings
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('securerag_settings');
    return saved ? JSON.parse(saved) : {
      profile: {
        fullName: 'Sarah Connor',
        email: 'admin@novacorp.com',
        title: 'Chief Information Security Officer',
        department: 'Security & Compliance',
        bio: 'Oversees enterprise zero-trust posture, data sovereignty, and AI knowledge retrieval governance.',
        timezone: 'America/New_York (UTC-5)'
      },
      appearance: {
        density: 'comfortable',
        accentColor: 'indigo',
        showConfidenceMetrics: true,
        highContrastBorders: false
      },
      notifications: {
        securityAlerts: true,
        accessDeniedNotif: true,
        documentProcessed: true,
        weeklyDigest: false,
        emailChannel: true
      },
      organization: {
        orgName: 'NovaCorp Global',
        primaryDomain: 'novacorp.com',
        complianceFrameworks: ['SOC 2 Type II', 'ISO 27001', 'GDPR'],
        retentionDays: 365,
        defaultAccessLevel: 'Internal'
      },
      security: {
        enforceMfa: true,
        sessionTimeoutMinutes: 60,
        ipAllowlistOnly: false,
        allowedIpRanges: '192.168.1.0/24, 10.0.0.0/16',
        ragSimilarityThreshold: 0.85,
        maskPiiBeforeEmbedding: true
      }
    };
  });

  // 4. Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync to local storage for offline resilience
  useEffect(() => {
    localStorage.setItem('securerag_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('securerag_auth', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('securerag_orgs', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem('securerag_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('securerag_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('securerag_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('securerag_chats', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    localStorage.setItem('securerag_settings', JSON.stringify(settings));
  }, [settings]);

  // Fetch live backend data
  const refreshBackendData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // 1. Dashboard summary
      try {
        const dashRes = await api.getDashboardSummary();
        if (dashRes?.success) {
          setDashboardKpis(dashRes.data?.kpis);
        }
      } catch (e) {
        // Ignored if unauthenticated or role insufficient
      }

      // 2. Documents
      try {
        const docsRes = await api.getDocuments();
        if (docsRes?.success && Array.isArray(docsRes.data)) {
          setDocuments(docsRes.data);
        }
      } catch (e) {}

      // 3. Users (Admins and Managers)
      try {
        const usersRes = await api.getUsers();
        if (usersRes?.success && Array.isArray(usersRes.data)) {
          // Normalize user format for UI
          const formattedUsers = usersRes.data.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            orgId: u.organizationId?._id || u.organizationId,
            orgName: u.organizationId?.name || 'NovaCorp Global',
            role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
            status: u.isActive ? 'Active' : 'Inactive',
            lastActive: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            accessScope: u.role === 'admin' ? 'All Documents (Unrestricted)' : u.role === 'manager' ? 'Public, Internal, Confidential' : 'Public & Internal Only'
          }));
          setUsers(formattedUsers);
        }
      } catch (e) {}

      // 4. Organizations
      try {
        const orgsRes = await api.getOrganizations();
        if (orgsRes?.success && Array.isArray(orgsRes.data)) {
          setOrganizations(orgsRes.data);
        }
      } catch (e) {}

      // 5. Audit Logs (Admin and Manager)
      try {
        const auditRes = await api.getAuditLogs();
        if (auditRes?.success && Array.isArray(auditRes.data)) {
          setAuditLogs(auditRes.data);
        }
      } catch (e) {}

      setIsBackendConnected(true);
    } catch (err) {
      console.warn('[Sync] Backend live data sync warning:', err.message);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Initial authentication & session bootstrap
  useEffect(() => {
    async function initSession() {
      try {
        // Test backend connectivity
        const health = await fetch('http://localhost:5000/api/health').then(r => r.json()).catch(() => null);
        if (health && health.status === 'healthy') {
          setIsBackendConnected(true);

          // If token exists, verify with backend /auth/me
          const token = api.getToken();
          if (token) {
            try {
              const meRes = await api.getMe();
              if (meRes?.success && meRes.user) {
                const u = meRes.user;
                const formattedUser = {
                  id: u._id,
                  name: u.name,
                  email: u.email,
                  role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
                  roleKey: u.role.toLowerCase(),
                  orgId: u.organizationId?._id || u.organizationId,
                  orgName: u.organizationId?.name || 'NovaCorp Global',
                  title: u.title || 'Enterprise User',
                  avatar: u.avatar || DEMO_ROLES[u.role.toLowerCase()]?.avatar || DEMO_ROLES.admin.avatar,
                  badge: u.role === 'admin' ? 'Enterprise Admin' : u.role === 'manager' ? 'Team Manager' : 'Standard Access'
                };
                setCurrentUser(formattedUser);
                setIsLoggedIn(true);
                refreshBackendData();
                return;
              }
            } catch (authErr) {
              // Token expired, clear token
              api.setToken(null);
            }
          }

          // Initial auto-login with default admin token so user can explore immediately
          try {
            const loginRes = await api.login('admin@novacorp.com', 'SecurePass123!');
            if (loginRes?.success) {
              const u = loginRes.user;
              const formattedUser = {
                id: u._id,
                name: u.name,
                email: u.email,
                role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
                roleKey: u.role.toLowerCase(),
                orgId: u.organizationId?._id || u.organizationId,
                orgName: u.organizationId?.name || 'NovaCorp Global',
                title: u.title || 'Enterprise User',
                avatar: u.avatar || DEMO_ROLES.admin.avatar,
                badge: 'Enterprise Admin'
              };
              setCurrentUser(formattedUser);
              setIsLoggedIn(true);
              refreshBackendData();
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Backend server not detected, running with local mock fallback.');
      }
    }
    initSession();
  }, [refreshBackendData]);

  // Auth & Role functions
  const login = async (roleKey = 'admin', customPassword = 'SecurePass123!') => {
    const roleUser = DEMO_ROLES[roleKey] || DEMO_ROLES.admin;
    try {
      const res = await api.login(roleUser.email, customPassword);
      if (res?.success) {
        const u = res.user;
        const formattedUser = {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          roleKey: u.role.toLowerCase(),
          orgId: u.organizationId?._id || u.organizationId,
          orgName: u.organizationId?.name || 'NovaCorp Global',
          title: u.title || roleUser.title,
          avatar: u.avatar || roleUser.avatar,
          badge: roleUser.badge
        };
        setCurrentUser(formattedUser);
        setIsLoggedIn(true);
        setIsBackendConnected(true);
        addToast(`Signed in as ${formattedUser.name} (${formattedUser.role})`, 'success');
        refreshBackendData();
        return { success: true };
      }
    } catch (err) {
      // Fallback to local mock if backend offline
      setCurrentUser(roleUser);
      setIsLoggedIn(true);
      addToast(`Signed in as ${roleUser.name} (${roleUser.role})`, 'success');
      return { success: true };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setIsLoggedIn(false);
    addToast('Signed out of session', 'info');
  };

  const switchRole = async (roleKey) => {
    const newRoleUser = DEMO_ROLES[roleKey];
    if (!newRoleUser) return;

    try {
      // Authenticate as this role on the real backend to get verified token & permissions
      const res = await api.login(newRoleUser.email, 'SecurePass123!');
      if (res?.success) {
        const u = res.user;
        const formattedUser = {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          roleKey: u.role.toLowerCase(),
          orgId: u.organizationId?._id || u.organizationId,
          orgName: u.organizationId?.name || 'NovaCorp Global',
          title: u.title || newRoleUser.title,
          avatar: u.avatar || newRoleUser.avatar,
          badge: newRoleUser.badge
        };
        setCurrentUser(formattedUser);
        refreshBackendData();
      }
    } catch (err) {
      setCurrentUser(newRoleUser);
    }

    addToast(`Role switched to ${newRoleUser.role} (${newRoleUser.name})`, 'info');
  };

  // Document Operations
  const addDocument = async (newDoc) => {
    try {
      if (newDoc.file) {
        const formData = new FormData();
        formData.append('file', newDoc.file);
        formData.append('title', newDoc.name);
        formData.append('accessLevel', newDoc.accessLevel || 'Internal');
        if (newDoc.summary) formData.append('summary', newDoc.summary);

        const uploadRes = await api.uploadDocument(formData);
        if (uploadRes?.success && uploadRes.data) {
          setDocuments(prev => [uploadRes.data, ...prev]);
          addToast(`"${newDoc.name}" uploaded, parsed, and indexed in Qdrant!`, 'success');
          refreshBackendData();
          return;
        }
      }

      const res = await api.createDocument({
        title: newDoc.name,
        name: newDoc.name,
        type: newDoc.type,
        size: newDoc.size,
        accessLevel: newDoc.accessLevel,
        summary: newDoc.summary,
        excerpt: newDoc.excerpt
      });
      if (res?.success && res.data) {
        setDocuments(prev => [res.data, ...prev]);
        addToast(`"${newDoc.name}" uploaded and indexed successfully in MongoDB`, 'success');
        refreshBackendData();
        return;
      }
    } catch (err) {
      console.warn('Backend document save failed, fallback to local state:', err.message);
    }

    // Local fallback
    const docWithId = {
      ...newDoc,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Indexed',
      chunksCount: Math.floor(Math.random() * 60) + 20,
      retrievalScore: 0.95
    };
    setDocuments(prev => [docWithId, ...prev]);
    addToast(`"${docWithId.name}" saved to knowledge base`, 'success');
  };

  const deleteDocument = async (docId) => {
    try {
      await api.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId && d._id !== docId));
      addToast('Document metadata deleted from MongoDB', 'info');
      refreshBackendData();
    } catch (err) {
      setDocuments(prev => prev.filter(d => d.id !== docId && d._id !== docId));
      addToast('Document deleted from knowledge base', 'info');
    }
  };

  // User Operations
  const addUser = async (userData) => {
    try {
      const res = await api.createUser({
        name: userData.name,
        email: userData.email,
        role: (userData.role || 'employee').toLowerCase(),
        title: userData.title,
        accessScope: userData.accessScope
      });
      if (res?.success) {
        addToast(`User ${userData.name} provisioned in MongoDB`, 'success');
        refreshBackendData();
        return;
      }
    } catch (err) {
      addToast(err.message || 'Failed to create user on backend', 'warning');
    }

    // Local fallback
    const newUser = {
      ...userData,
      id: `usr-${Date.now()}`,
      lastActive: 'Just now',
      queriesCount: 0,
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const editUser = async (userId, updatedFields) => {
    try {
      await api.updateUser(userId, {
        name: updatedFields.name,
        role: updatedFields.role?.toLowerCase(),
        title: updatedFields.title,
        isActive: updatedFields.status ? updatedFields.status === 'Active' : undefined
      });
      addToast('User details updated in MongoDB', 'success');
      refreshBackendData();
    } catch (err) {
      setUsers(prev => prev.map(u => u.id === userId || u._id === userId ? { ...u, ...updatedFields } : u));
      addToast('User details updated', 'success');
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId && u._id !== userId));
      addToast('User removed from MongoDB', 'info');
      refreshBackendData();
    } catch (err) {
      setUsers(prev => prev.filter(u => u.id !== userId && u._id !== userId));
      addToast('User removed', 'info');
    }
  };

  const toggleUserStatus = async (userId) => {
    const target = users.find(u => u.id === userId || u._id === userId);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await api.updateUser(userId, { isActive: nextStatus === 'Active' });
      addToast(`User status set to ${nextStatus} in MongoDB`, 'info');
      refreshBackendData();
    } catch (err) {
      setUsers(prev => prev.map(u => {
        if (u.id === userId || u._id === userId) {
          return { ...u, status: nextStatus };
        }
        return u;
      }));
      addToast(`User status set to ${nextStatus}`, 'info');
    }
  };

  // Organization Operations
  const addOrganization = async (orgData) => {
    try {
      const res = await api.createOrganization({
        name: orgData.name,
        domain: orgData.domain,
        tier: orgData.tier,
        seats: orgData.seats,
        description: orgData.description
      });
      if (res?.success) {
        addToast(`Organization ${orgData.name} provisioned in MongoDB`, 'success');
        refreshBackendData();
        return;
      }
    } catch (err) {
      console.warn('Backend org creation fallback:', err.message);
    }

    const newOrg = {
      ...orgData,
      id: `org-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      activeUsers: 1,
      documentsCount: 0,
      storageUsed: '0 MB',
      status: 'Active',
      color: 'indigo'
    };
    setOrganizations(prev => [...prev, newOrg]);
    addToast(`Organization ${newOrg.name} registered`, 'success');
  };

  // Chat Operations
  const createNewSession = () => {
    const newId = `chat-${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Knowledge Search',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      documentScope: 'all',
      messages: []
    };
    setChatSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const deleteSession = (sessionId) => {
    setChatSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    addToast('Chat conversation deleted', 'info');
  };

  const sendMessage = (text, documentScope = 'all') => {
    if (!text.trim()) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId || !chatSessions.find(s => s.id === targetSessionId)) {
      const newId = `chat-${Date.now()}`;
      const newSession = {
        id: newId,
        title: text.length > 30 ? text.substring(0, 30) + '...' : text,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        documentScope: documentScope,
        messages: []
      };
      setChatSessions(prev => [newSession, ...prev]);
      targetSessionId = newId;
      setActiveSessionId(newId);
    }

    const userMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatSessions(prev => prev.map(s => {
      if (s.id === targetSessionId) {
        const title = s.messages.length === 0 
          ? (text.length > 30 ? text.substring(0, 30) + '...' : text)
          : s.title;
        return {
          ...s,
          title,
          documentScope,
          messages: [...s.messages, userMessage]
        };
      }
      return s;
    }));

    setIsAiTyping(true);

    // Call real backend RAG API
    (async () => {
      try {
        const docScopeParam = documentScope === 'all' ? 'all' : documentScope;
        const chatRes = await api.askQuestion(text.trim(), docScopeParam, targetSessionId.startsWith('chat-') ? null : targetSessionId);

        if (chatRes?.success && chatRes.data) {
          const aiMessage = {
            id: String(chatRes.data.messageId || `msg-${Date.now() + 1}`),
            sender: 'ai',
            text: chatRes.data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            citations: chatRes.data.citations || [],
            isDenied: false,
            model: chatRes.data.model,
            feedback: null
          };

          setChatSessions(prev => prev.map(s => {
            if (s.id === targetSessionId) {
              return {
                ...s,
                id: chatRes.data.conversationId ? String(chatRes.data.conversationId) : s.id,
                messages: [...s.messages, aiMessage]
              };
            }
            return s;
          }));

          if (chatRes.data.conversationId && targetSessionId !== String(chatRes.data.conversationId)) {
            setActiveSessionId(String(chatRes.data.conversationId));
          }

          setIsAiTyping(false);
          return;
        }
      } catch (err) {
        console.warn('[RAG API] Real chat query error, using grounded fallback:', err.message);
        
        // If error was 403 Access Denied
        if (err.status === 403 || err.message?.includes('Access Denied')) {
          const deniedMessage = {
            id: `msg-${Date.now() + 1}`,
            sender: 'ai',
            text: `⚠️ **ACCESS RESTRICTED: RBAC Policy Violation**\n\n${err.message || 'You do not possess clearance to query this document.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            citations: [],
            isDenied: true,
            feedback: null
          };
          setChatSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, deniedMessage] } : s));
          setIsAiTyping(false);
          return;
        }
      }

      // Offline resilient fallback
      const lower = text.toLowerCase();
      let responseData = MOCK_RESPONSES.generic;

      if (currentUser.role === 'Employee' && (lower.includes('financial') || lower.includes('q3') || lower.includes('audit report') || lower.includes('restricted'))) {
        responseData = MOCK_RESPONSES.restricted;
      } else if (lower.includes('password') || lower.includes('mfa') || lower.includes('rotation') || lower.includes('conduct')) {
        responseData = MOCK_RESPONSES.password;
      } else if (lower.includes('remote') || lower.includes('pto') || lower.includes('vacation') || lower.includes('wellness') || lower.includes('benefit')) {
        responseData = MOCK_RESPONSES.pto;
      } else if (lower.includes('titan') || lower.includes('architecture') || lower.includes('encryption') || lower.includes('vector') || lower.includes('qdrant')) {
        if (currentUser.role === 'Employee') {
          responseData = {
            text: `⚠️ **ACCESS RESTRICTED: Confidential Classification**\n\nThe Project Titan Technical Specification requires Manager or Admin clearance. As an Employee, your current RBAC filter blocks retrieval of Confidential vectors.`,
            citations: [],
            isDenied: true
          };
        } else {
          responseData = MOCK_RESPONSES.security;
        }
      } else if (lower.includes('incident') || lower.includes('disaster') || lower.includes('breach') || lower.includes('containment')) {
        responseData = MOCK_RESPONSES.incident;
      }

      const fallbackMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: responseData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: responseData.citations || [],
        isDenied: !!responseData.isDenied,
        feedback: null
      };

      setChatSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, fallbackMsg] } : s));
      setIsAiTyping(false);
    })();
  };

  const setFeedback = (sessionId, messageId, feedbackType) => {
    setChatSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: s.messages.map(m => {
            if (m.id === messageId) {
              const newFeedback = m.feedback === feedbackType ? null : feedbackType;
              return { ...m, feedback: newFeedback };
            }
            return m;
          })
        };
      }
      return s;
    }));
    addToast(`Feedback recorded: ${feedbackType === 'up' ? 'Helpful' : 'Needs Improvement'}`, 'info');
  };

  // Settings update
  const updateSettings = (section, data) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data
      }
    }));
    addToast('Settings updated successfully', 'success');
  };

  // Reset demo
  const resetAllDemoData = () => {
    localStorage.removeItem('securerag_user');
    localStorage.removeItem('securerag_auth');
    localStorage.removeItem('securerag_orgs');
    localStorage.removeItem('securerag_users');
    localStorage.removeItem('securerag_docs');
    localStorage.removeItem('securerag_audit');
    localStorage.removeItem('securerag_chats');
    localStorage.removeItem('securerag_settings');
    localStorage.removeItem('securerag_jwt_token');

    setCurrentUser(DEMO_ROLES.admin);
    setIsLoggedIn(true);
    setOrganizations(INITIAL_ORGANIZATIONS);
    setUsers(INITIAL_USERS);
    setDocuments(INITIAL_DOCUMENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setChatSessions(INITIAL_CHAT_SESSIONS);
    setActiveSessionId(INITIAL_CHAT_SESSIONS[0].id);

    addToast('All demo data has been reset to default', 'info');
    refreshBackendData();
  };

  const activeSession = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0] || null;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isBackendConnected,
        isLoadingData,
        refreshBackendData,
        dashboardKpis,
        login,
        logout,
        switchRole,
        organizations,
        addOrganization,
        users,
        addUser,
        editUser,
        deleteUser,
        toggleUserStatus,
        documents,
        addDocument,
        deleteDocument,
        auditLogs,
        chatSessions,
        activeSession,
        activeSessionId,
        setActiveSessionId,
        createNewSession,
        deleteSession,
        sendMessage,
        setFeedback,
        isAiTyping,
        settings,
        updateSettings,
        resetAllDemoData,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
