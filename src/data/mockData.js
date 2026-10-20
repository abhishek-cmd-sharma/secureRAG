// SecureRAG AI — Production Real Data Configurations
// All mock documents, users, organizations, audit logs, and simulated AI responses
// have been permanently removed. Real live data is fetched directly from MongoDB Atlas and Qdrant.

export const DEMO_ROLES = {
  admin: {
    id: 'user-admin',
    name: 'Sarah Connor',
    email: 'admin@novacorp.com',
    role: 'Admin',
    roleKey: 'admin',
    orgId: 'novacorp',
    orgName: 'NovaCorp Global',
    title: 'Chief Information Security Officer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    badge: 'Enterprise Admin',
    description: 'Full administrative access across all organizational workspaces, documents, RBAC policies, and audit trails.'
  },
  manager: {
    id: 'user-mgr',
    name: 'David Vance',
    email: 'manager@novacorp.com',
    role: 'Manager',
    roleKey: 'manager',
    orgId: 'novacorp',
    orgName: 'NovaCorp Global',
    title: 'Engineering & Operations Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: 'Team Manager',
    description: 'Manages departmental documents, monitors team query volumes, and evaluates knowledge retrieval accuracy.'
  },
  employee: {
    id: 'user-emp',
    name: 'Elena Rostova',
    email: 'elena@novacorp.com',
    role: 'Employee',
    roleKey: 'employee',
    orgId: 'novacorp',
    orgName: 'NovaCorp Global',
    title: 'Compliance & Legal Analyst',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: 'Standard Access',
    description: 'Accesses authorized internal and public documents only. Restricted from confidential executive files and system administration.'
  }
};

// All collections initialize empty and populate strictly from live MongoDB Atlas & Qdrant
export const INITIAL_ORGANIZATIONS = [];
export const INITIAL_USERS = [];
export const INITIAL_DOCUMENTS = [];
export const INITIAL_AUDIT_LOGS = [];
export const INITIAL_CHAT_SESSIONS = [];
export const MOCK_RESPONSES = {};
export const SUGGESTED_PROMPTS = [];

export const DASHBOARD_METRICS = {
  kpis: {
    totalDocs: 0,
    totalDocsChange: 'Live data',
    totalUsers: 0,
    totalUsersChange: 'Live data',
    aiQuestions: 0,
    aiQuestionsChange: 'Live data',
    accessDenied: 0,
    accessDeniedChange: 'Live data',
    vectorChunks: 0,
    storageUsed: '0 MB'
  },
  chartQueryTrends: [],
  chartDocTypes: [],
  mostUsedDocs: []
};
