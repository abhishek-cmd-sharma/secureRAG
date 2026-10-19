// Mock Data for SecureRAG AI Frontend Phase 1 Prototype

export const INITIAL_ORGANIZATIONS = [
  {
    id: 'org-1',
    name: 'NovaCorp Global',
    domain: 'novacorp.com',
    tier: 'Enterprise Plus',
    seats: 200,
    activeUsers: 142,
    documentsCount: 48,
    storageUsed: '4.2 GB',
    storageLimit: '25 GB',
    status: 'Active',
    createdAt: '2024-01-15',
    adminContact: 'admin@novacorp.com',
    compliance: ['SOC 2 Type II', 'ISO 27001', 'GDPR'],
    ssoEnabled: true,
    qdrantCollection: 'novacorp-enterprise-v2',
    color: 'indigo'
  },
  {
    id: 'org-2',
    name: 'Apex Health AI',
    domain: 'apexhealth.io',
    tier: 'Enterprise HIPAA',
    seats: 100,
    activeUsers: 86,
    documentsCount: 31,
    storageUsed: '2.8 GB',
    storageLimit: '20 GB',
    status: 'Active',
    createdAt: '2024-03-20',
    adminContact: 'security@apexhealth.io',
    compliance: ['HIPAA', 'HITECH', 'SOC 2 Type II'],
    ssoEnabled: true,
    qdrantCollection: 'apex-clinical-v1',
    color: 'emerald'
  },
  {
    id: 'org-3',
    name: 'Vanguard Financial',
    domain: 'vanguard-fin.com',
    tier: 'Business Pro',
    seats: 75,
    activeUsers: 54,
    documentsCount: 19,
    storageUsed: '1.4 GB',
    storageLimit: '10 GB',
    status: 'Active',
    createdAt: '2024-06-10',
    adminContact: 'rchen@vanguard-fin.com',
    compliance: ['FINRA', 'SOC 2 Type II'],
    ssoEnabled: false,
    qdrantCollection: 'vanguard-fin-prod',
    color: 'amber'
  }
];

export const DEMO_ROLES = {
  admin: {
    id: 'user-admin',
    name: 'Sarah Connor',
    email: 'admin@novacorp.com',
    role: 'Admin',
    roleKey: 'admin',
    orgId: 'org-1',
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
    orgId: 'org-1',
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
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    title: 'Compliance & Legal Analyst',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: 'Standard Access',
    description: 'Accesses authorized internal and public documents only. Restricted from confidential executive files and system administration.'
  }
};

export const INITIAL_USERS = [
  {
    id: 'usr-1',
    name: 'Sarah Connor',
    email: 'admin@novacorp.com',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    role: 'Admin',
    status: 'Active',
    lastActive: 'Just now',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    accessScope: 'All Documents (Unrestricted)',
    queriesCount: 342
  },
  {
    id: 'usr-2',
    name: 'David Vance',
    email: 'manager@novacorp.com',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    role: 'Manager',
    status: 'Active',
    lastActive: '12 mins ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    accessScope: 'Public, Internal, Confidential',
    queriesCount: 189
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena@novacorp.com',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    role: 'Employee',
    status: 'Active',
    lastActive: '45 mins ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    accessScope: 'Public & Internal Only',
    queriesCount: 94
  },
  {
    id: 'usr-4',
    name: 'Marcus Brody',
    email: 'm.brody@novacorp.com',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    role: 'Employee',
    status: 'Active',
    lastActive: '3 hours ago',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    accessScope: 'Public & Internal Only',
    queriesCount: 61
  },
  {
    id: 'usr-5',
    name: 'Aisha Patel',
    email: 'aisha.p@novacorp.com',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    role: 'Manager',
    status: 'Active',
    lastActive: 'Yesterday',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    accessScope: 'Public, Internal, Confidential',
    queriesCount: 215
  },
  {
    id: 'usr-6',
    name: 'Julian Sterling',
    email: 'j.sterling@apexhealth.io',
    orgId: 'org-2',
    orgName: 'Apex Health AI',
    role: 'Admin',
    status: 'Active',
    lastActive: '5 hours ago',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    accessScope: 'All Documents (Apex Health)',
    queriesCount: 420
  },
  {
    id: 'usr-7',
    name: 'Dr. Maya Lin',
    email: 'm.lin@apexhealth.io',
    orgId: 'org-2',
    orgName: 'Apex Health AI',
    role: 'Manager',
    status: 'Active',
    lastActive: '2 days ago',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    accessScope: 'Clinical Data & SOPs',
    queriesCount: 153
  },
  {
    id: 'usr-8',
    name: 'Robert Chen',
    email: 'rchen@vanguard-fin.com',
    orgId: 'org-3',
    orgName: 'Vanguard Financial',
    role: 'Admin',
    status: 'Inactive',
    lastActive: '5 days ago',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    accessScope: 'Financial Audit Records',
    queriesCount: 88
  }
];

export const INITIAL_DOCUMENTS = [
  {
    id: 'doc-1',
    name: 'Company Policy & Code of Conduct 2025.pdf',
    type: 'PDF',
    size: '2.4 MB',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    owner: 'Sarah Connor',
    accessLevel: 'Internal', // Public, Internal, Confidential, Restricted
    uploadDate: '2025-01-10',
    status: 'Indexed',
    chunksCount: 48,
    vectorCount: 48,
    dimension: 768,
    retrievalScore: 0.96,
    summary: 'Comprehensive guidelines on professional conduct, workplace integrity, conflicts of interest, whistleblower safety, and operational ethics.',
    excerpt: `Section 4.2 - Information Security & Confidentiality: All employees must safeguard non-public information. Multi-factor authentication (MFA) is strictly mandatory on all corporate hardware and cloud endpoints. Password rotations occur every 90 days, requiring a minimum of 14 characters. Unauthorized disclosure of trade secrets or proprietary algorithms constitutes immediate grounds for termination and legal remediation.`
  },
  {
    id: 'doc-2',
    name: 'Employee Handbook & Benefits Guide.pdf',
    type: 'PDF',
    size: '4.1 MB',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    owner: 'Sarah Connor',
    accessLevel: 'Internal',
    uploadDate: '2025-01-18',
    status: 'Indexed',
    chunksCount: 82,
    vectorCount: 82,
    dimension: 768,
    retrievalScore: 0.94,
    summary: 'Standard operating handbook outlining PTO policies, remote work guidelines, medical benefits coverage, and wellness stipends.',
    excerpt: `Section 7.1 - Flexible Work & Remote Policies: Employees are entitled to up to 3 days per week remote work schedule upon manager approval. Remote workspaces must comply with Ergonomic and Digital Privacy requirements. Annual wellness stipend is $1,200, reimbursable on a quarterly basis. Paid time off (PTO) accrues at 1.75 days per month (21 days annually) with 5 rollover days allowed per calendar year.`
  },
  {
    id: 'doc-3',
    name: 'Project Titan Architecture & Security Spec.pdf',
    type: 'PDF',
    size: '6.8 MB',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    owner: 'David Vance',
    accessLevel: 'Confidential',
    uploadDate: '2025-02-01',
    status: 'Indexed',
    chunksCount: 134,
    vectorCount: 134,
    dimension: 768,
    retrievalScore: 0.98,
    summary: 'Deep architectural blueprints for Project Titan, including vector embedding pipelines, Qdrant cluster topology, and AES-256 GCM encryption at rest.',
    excerpt: `Architecture Overview: Project Titan implements a hybrid semantic retrieval mesh. Vectors are generated using text-embedding-004 with 768 dimensions and indexed into Qdrant using HNSW (Hierarchical Navigable Small World) with M=16, efConstruct=128. Document payloads are encrypted using envelope encryption with AWS KMS-managed keys. Access tokens require SHA-256 signed JWTs with strict RBAC scope validation.`
  },
  {
    id: 'doc-4',
    name: 'Q3 Executive Financial & Audit Report.pdf',
    type: 'PDF',
    size: '3.2 MB',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    owner: 'Sarah Connor',
    accessLevel: 'Restricted',
    uploadDate: '2025-02-14',
    status: 'Indexed',
    chunksCount: 64,
    vectorCount: 64,
    dimension: 768,
    retrievalScore: 0.99,
    summary: 'Restricted board-level executive financials, burn rates, capital expenditures, and confidential merger evaluations.',
    excerpt: `Board Executive Summary: Net recurring revenue grew 42% YoY reaching $24.8M ARR. Gross margins expanded to 78.4%. Cash reserves stand at $41.2M with 28 months runway. Projected acquisition budget allocated $12.5M for synergistic vector data infrastructure and edge inference compute clusters.`
  },
  {
    id: 'doc-5',
    name: 'Product API Documentation v2.4.docx',
    type: 'DOCX',
    size: '1.8 MB',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    owner: 'David Vance',
    accessLevel: 'Public',
    uploadDate: '2025-02-20',
    status: 'Indexed',
    chunksCount: 36,
    vectorCount: 36,
    dimension: 768,
    retrievalScore: 0.91,
    summary: 'Developer documentation for public REST and streaming WebSocket endpoints for document retrieval and ingestion.',
    excerpt: `POST /api/v1/query: Submits a natural language query against tenant-scoped vector collections. Returns streaming chunk payloads with cosine similarity metrics and token usage telemetry. Rate limit: 120 requests/minute per API key.`
  },
  {
    id: 'doc-6',
    name: 'Incident Response & Disaster Recovery Playbook.pdf',
    type: 'PDF',
    size: '2.1 MB',
    orgId: 'org-1',
    orgName: 'NovaCorp Global',
    owner: 'Sarah Connor',
    accessLevel: 'Confidential',
    uploadDate: '2025-02-25',
    status: 'Indexed',
    chunksCount: 42,
    vectorCount: 42,
    dimension: 768,
    retrievalScore: 0.95,
    summary: 'Standard operating procedures for Sev-1 security incidents, ransomware containment, breach notifications, and multi-region failover.',
    excerpt: `Playbook Phase 2 - Containment: In the event of confirmed credential compromise or exfiltration anomaly, the Incident Commander must isolate compromised VPC endpoints within 15 minutes. Revoke all active session tokens via the global Redis blacklist and rotate IAM KMS Master Keys.`
  },
  {
    id: 'doc-7',
    name: 'HIPAA Compliance Standard Operating Procedures.pdf',
    type: 'PDF',
    size: '5.2 MB',
    orgId: 'org-2',
    orgName: 'Apex Health AI',
    owner: 'Julian Sterling',
    accessLevel: 'Confidential',
    uploadDate: '2025-01-22',
    status: 'Indexed',
    chunksCount: 102,
    vectorCount: 102,
    dimension: 768,
    retrievalScore: 0.97,
    summary: 'Clinical procedures for safeguarding Protected Health Information (PHI) under HIPAA Omnibus rules and encryption standards.',
    excerpt: `PHI Safeguards: All patient identifiable fields (MRN, SSN, biometric scans) must be masked at ingestion time using differential privacy filters before vector embedding creation. Zero persistent storage of unmasked PHI in vector payloads.`
  },
  {
    id: 'doc-8',
    name: 'Vanguard Anti-Money Laundering Protocols.pdf',
    type: 'PDF',
    size: '3.9 MB',
    orgId: 'org-3',
    orgName: 'Vanguard Financial',
    owner: 'Robert Chen',
    accessLevel: 'Restricted',
    uploadDate: '2025-02-11',
    status: 'Indexed',
    chunksCount: 78,
    vectorCount: 78,
    dimension: 768,
    retrievalScore: 0.99,
    summary: 'Regulatory compliance manual for automated transaction pattern screening and suspicious activity reports (SAR).',
    excerpt: `Transaction Monitoring Thresholds: Transactions exceeding $10,000 USD or cross-border velocity spikes exceeding 3 transfers within 1 hour require automatic hold and compliance officer manual validation within 24 hours.`
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-101',
    timestamp: '2025-03-02 14:32:10',
    user: 'Sarah Connor',
    email: 'admin@novacorp.com',
    role: 'Admin',
    organization: 'NovaCorp Global',
    action: 'AI_QUERY',
    resource: 'Project Titan Architecture & Security Spec.pdf',
    ipAddress: '192.168.1.45',
    result: 'Allowed',
    details: 'User initiated RAG semantic search on vector cluster #4. Cosine similarity 0.98. Scope verified.'
  },
  {
    id: 'log-102',
    timestamp: '2025-03-02 13:15:02',
    user: 'Elena Rostova',
    email: 'elena@novacorp.com',
    role: 'Employee',
    organization: 'NovaCorp Global',
    action: 'PERMISSION_DENIED',
    resource: 'Q3 Executive Financial & Audit Report.pdf',
    ipAddress: '192.168.1.88',
    result: 'Denied',
    details: 'RBAC Policy Violation: Employee role cannot access Restricted classification files. Query blocked.'
  },
  {
    id: 'log-103',
    timestamp: '2025-03-02 11:45:19',
    user: 'David Vance',
    email: 'manager@novacorp.com',
    role: 'Manager',
    organization: 'NovaCorp Global',
    action: 'DOCUMENT_VIEW',
    resource: 'Project Titan Architecture & Security Spec.pdf',
    ipAddress: '192.168.2.14',
    result: 'Allowed',
    details: 'Document preview modal opened. Access level: Confidential. Manager authorization verified.'
  },
  {
    id: 'log-104',
    timestamp: '2025-03-02 10:20:44',
    user: 'Elena Rostova',
    email: 'elena@novacorp.com',
    role: 'Employee',
    organization: 'NovaCorp Global',
    action: 'AI_QUERY',
    resource: 'Employee Handbook & Benefits Guide.pdf',
    ipAddress: '192.168.1.88',
    result: 'Allowed',
    details: 'Retrieved Section 7.1 regarding PTO accrual and remote work policies. Chunk match 0.94.'
  },
  {
    id: 'log-105',
    timestamp: '2025-03-02 09:05:31',
    user: 'Sarah Connor',
    email: 'admin@novacorp.com',
    role: 'Admin',
    organization: 'NovaCorp Global',
    action: 'USER_ROLE_CHANGED',
    resource: 'User: aisha.p@novacorp.com',
    ipAddress: '192.168.1.45',
    result: 'Allowed',
    details: 'Promoted Aisha Patel from Employee to Manager. Updated organization access scopes.'
  },
  {
    id: 'log-106',
    timestamp: '2025-03-01 17:40:12',
    user: 'Julian Sterling',
    email: 'j.sterling@apexhealth.io',
    role: 'Admin',
    organization: 'Apex Health AI',
    action: 'DOCUMENT_UPLOAD',
    resource: 'HIPAA Compliance Standard Operating Procedures.pdf',
    ipAddress: '10.0.4.120',
    result: 'Allowed',
    details: 'Document ingested and parsed into 102 vector chunks. PHI redaction filter passed with 0 warnings.'
  },
  {
    id: 'log-107',
    timestamp: '2025-03-01 15:22:50',
    user: 'Unknown / Suspicious Session',
    email: 'unauth-probe@external.net',
    role: 'Anonymous',
    organization: 'NovaCorp Global',
    action: 'EXFILTRATION_ALERT',
    resource: 'API /v1/documents/bulk_export',
    ipAddress: '185.220.101.5',
    result: 'Denied',
    details: 'WAF Rate Limit & Geographic IP block triggered. Blacklisted token attempt.'
  },
  {
    id: 'log-108',
    timestamp: '2025-03-01 12:11:04',
    user: 'David Vance',
    email: 'manager@novacorp.com',
    role: 'Manager',
    organization: 'NovaCorp Global',
    action: 'DOCUMENT_VIEW',
    resource: 'Company Policy & Code of Conduct 2025.pdf',
    ipAddress: '192.168.2.14',
    result: 'Allowed',
    details: 'Viewed section 4.2 compliance clauses.'
  }
];

export const INITIAL_CHAT_SESSIONS = [
  {
    id: 'chat-1',
    title: 'Remote Work & PTO Policy Inquiries',
    createdAt: '2025-03-02 10:18',
    documentScope: 'all',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'How many days of remote work am I allowed per week, and what is the annual PTO accrual rate?',
        timestamp: '10:18 AM'
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: `Based on **NovaCorp Global's Employee Handbook & Benefits Guide**, here are the exact provisions:

1. **Remote Work Policy (Section 7.1):**
   - You are entitled to work remotely up to **3 days per week**, subject to direct manager approval.
   - Remote office setups must satisfy company ergonomic and digital data security guidelines.

2. **Paid Time Off (PTO) Accrual:**
   - Full-time staff members accrue **1.75 days of PTO per calendar month**, resulting in **21 days annually**.
   - You are permitted to roll over up to **5 unused PTO days** into the subsequent calendar year.

3. **Wellness Reimbursement:**
   - Additionally, all active employees receive a **$1,200 annual wellness stipend**, distributed on a quarterly reimbursement cycle ($300/quarter).`,
        timestamp: '10:18 AM',
        citations: [
          {
            docId: 'doc-2',
            docName: 'Employee Handbook & Benefits Guide.pdf',
            page: 14,
            section: 'Section 7.1 - Flexible Work & Remote Policies',
            matchScore: '98%',
            snippet: 'Employees are entitled to up to 3 days per week remote work schedule upon manager approval. Annual wellness stipend is $1,200...'
          }
        ],
        feedback: 'up'
      }
    ]
  },
  {
    id: 'chat-2',
    title: 'Titan Architecture & Encryption Standards',
    createdAt: '2025-03-02 14:30',
    documentScope: 'doc-3',
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        text: 'Explain how Project Titan secures document embeddings and what encryption algorithms are used at rest.',
        timestamp: '2:30 PM'
      },
      {
        id: 'msg-4',
        sender: 'ai',
        text: `According to the **Project Titan Architecture & Security Spec.pdf**:

### 1. Vector Dimension & Pipeline
- Vector embeddings are generated with **768 dimensions** using the enterprise embedding model.
- High-speed retrieval is executed via a distributed **Qdrant cluster** utilizing Hierarchical Navigable Small World (**HNSW**) graphs configured with \`M=16\` and \`efConstruct=128\`.

### 2. Encryption at Rest & In Transit
- **At Rest:** Stored document payloads and vector indexes are secured using **AES-256-GCM** envelope encryption with automated AWS KMS customer-managed key (CMK) rotations.
- **In Transit:** All cluster node communications and API endpoints require **TLS 1.3** with strict cipher suites.
- **Authentication:** Service calls enforce cryptographically signed JWT tokens with HMAC-SHA256 and localized RBAC scope inspection.`,
        timestamp: '2:31 PM',
        citations: [
          {
            docId: 'doc-3',
            docName: 'Project Titan Architecture & Security Spec.pdf',
            page: 8,
            section: 'Architecture Overview & Cryptographic Topology',
            matchScore: '99%',
            snippet: 'Project Titan implements a hybrid semantic retrieval mesh... Document payloads are encrypted using envelope encryption with AWS KMS-managed keys...'
          }
        ],
        feedback: null
      }
    ]
  }
];

export const SUGGESTED_PROMPTS = [
  {
    label: 'Company Policies',
    query: 'What is our password rotation policy and MFA requirement?'
  },
  {
    label: 'PTO & Benefits',
    query: 'What are the remote work limits and wellness stipend details?'
  },
  {
    label: 'Security & Encryption',
    query: 'How does Project Titan protect vector data and what encryption is used?'
  },
  {
    label: 'Incident Protocol',
    query: 'What are the containment steps for a Sev-1 security incident?'
  }
];

export const MOCK_RESPONSES = {
  password: {
    text: `Based on **Company Policy & Code of Conduct 2025.pdf (Section 4.2)**:

- **MFA Requirement:** Multi-Factor Authentication (MFA) via hardware security key (FIDO2) or authenticator application is **strictly mandatory** for all corporate accounts and SSO sign-ins. SMS-based 2FA is prohibited.
- **Password Complexity:** Passwords must be at least **14 characters in length**, incorporating uppercase letters, lowercase letters, numbers, and special symbols.
- **Rotation Interval:** Passwords must be updated every **90 days**. Reusing the previous 6 passwords is systematically disallowed.`,
    citations: [
      {
        docId: 'doc-1',
        docName: 'Company Policy & Code of Conduct 2025.pdf',
        page: 6,
        section: 'Section 4.2 - Information Security & Credential Hygiene',
        matchScore: '97%',
        snippet: 'All employees must safeguard non-public information. Multi-factor authentication (MFA) is strictly mandatory on all corporate hardware...'
      }
    ]
  },
  pto: {
    text: `According to **Employee Handbook & Benefits Guide.pdf (Section 7.1)**:

- **Remote Work Entitlement:** Full-time team members can work remotely up to **3 days per week** with manager agreement.
- **PTO Accrual Rate:** Staff accrue **1.75 days per month** (equal to 21 paid days per year).
- **Rollover Limits:** You may carry forward up to **5 unused days** to the following year.
- **Wellness Benefit:** NovaCorp provides a **$1,200 annual health & wellness stipend** ($300/quarter) for fitness, ergonomic equipment, or mental health resources.`,
    citations: [
      {
        docId: 'doc-2',
        docName: 'Employee Handbook & Benefits Guide.pdf',
        page: 14,
        section: 'Section 7.1 - Flexible Work & Remote Policies',
        matchScore: '98%',
        snippet: 'Employees are entitled to up to 3 days per week remote work schedule upon manager approval. Annual wellness stipend is $1,200...'
      }
    ]
  },
  security: {
    text: `From **Project Titan Architecture & Security Spec.pdf**:

- **Embedding Architecture:** Documents are chunked into 512-token segments with 64-token overlap and converted into **768-dimensional vectors**.
- **Vector Storage:** Indexed inside a dedicated Qdrant instance with HNSW indexing (\`M=16\`, \`efConstruct=128\`).
- **Data Protection:** Payloads and vector embeddings are encrypted at rest with **AES-256-GCM** using AWS KMS customer-managed keys.
- **Zero-Trust Access Control:** Every search vector undergoes a cryptographic RBAC pre-filter so users never receive embedding distance metrics from unauthorized tenant files.`,
    citations: [
      {
        docId: 'doc-3',
        docName: 'Project Titan Architecture & Security Spec.pdf',
        page: 8,
        section: 'Architecture Overview & Cryptographic Topology',
        matchScore: '99%',
        snippet: 'Project Titan implements a hybrid semantic retrieval mesh... Vectors are generated using text-embedding-004 with 768 dimensions...'
      }
    ]
  },
  incident: {
    text: `Referencing **Incident Response & Disaster Recovery Playbook.pdf (Phase 2)**:

- **Sev-1 Incident Containment:** The Incident Commander must isolate impacted VPC nodes within **15 minutes** of triage.
- **Credential Revocation:** Immediately invalidate all active JWT user sessions via the global Redis revocation cache.
- **Key Rotation:** Execute an immediate KMS Master Key rotation for affected document buckets.
- **Notification Deadline:** In compliance with SOC2 and GDPR requirements, affected data owners and legal counsel must be notified within **72 hours** of confirmation.`,
    citations: [
      {
        docId: 'doc-6',
        docName: 'Incident Response & Disaster Recovery Playbook.pdf',
        page: 12,
        section: 'Playbook Phase 2 - Containment & Token Revocation',
        matchScore: '96%',
        snippet: 'In the event of confirmed credential compromise or exfiltration anomaly, the Incident Commander must isolate compromised VPC endpoints within 15 minutes...'
      }
    ]
  },
  restricted: {
    text: `⚠️ **ACCESS DENIED: Role-Based Access Control (RBAC) Enforcement**

The document you are attempting to query (**Q3 Executive Financial & Audit Report.pdf**) is designated with **Restricted** security classification.

- **Your Current Role:** Employee (Standard Access)
- **Required Permission Level:** Admin (Executive Clearance)
- **Status:** Query Terminated at Vector Gateway Pre-Filter.
- **Audit Action:** This authorization failure has been recorded in the security audit logs for compliance tracking.

*If you require access to this document for verified audit duties, please request an access role elevation from your organization administrator.*`,
    citations: [],
    isDenied: true
  },
  generic: {
    text: `Based on your authorized documents in **NovaCorp Global Knowledge Base**:

I analyzed the relevant passages across your authorized documents. The policy mandates strict compliance with organizational standards, transparent operational logging, and regular peer review. 

Key points:
- All processes follow established corporate governance protocols.
- Any exception requires written sign-off from department leadership.
- Data queries are tracked in real-time within the immutable security audit log.

*Note: This is a simulated RAG response demonstrating retrieval citations and role-based authorization filters.*`,
    citations: [
      {
        docId: 'doc-1',
        docName: 'Company Policy & Code of Conduct 2025.pdf',
        page: 3,
        section: 'General Corporate Governance Guidelines',
        matchScore: '92%',
        snippet: 'All processes follow established corporate governance protocols. Any exception requires written sign-off from department leadership.'
      }
    ]
  }
};

export const DASHBOARD_METRICS = {
  kpis: {
    totalDocs: 48,
    totalDocsChange: '+14% this month',
    totalUsers: 142,
    totalUsersChange: '+8 new this week',
    aiQuestions: 1845,
    aiQuestionsChange: '+23.4% vs last week',
    accessDenied: 12,
    accessDeniedChange: '-4 vs last week',
    vectorChunks: 1420,
    storageUsed: '4.2 GB'
  },
  chartQueryTrends: [
    { name: 'Mon', queries: 145, allowed: 142, denied: 3 },
    { name: 'Tue', queries: 230, allowed: 226, denied: 4 },
    { name: 'Wed', queries: 310, allowed: 308, denied: 2 },
    { name: 'Thu', queries: 285, allowed: 284, denied: 1 },
    { name: 'Fri', queries: 390, allowed: 388, denied: 2 },
    { name: 'Sat', queries: 95, allowed: 95, denied: 0 },
    { name: 'Sun', queries: 75, allowed: 75, denied: 0 }
  ],
  chartDocTypes: [
    { name: 'Policy & Legal', value: 18, color: '#4f46e5' },
    { name: 'Architecture & Tech', value: 14, color: '#06b6d4' },
    { name: 'HR & Benefits', value: 9, color: '#10b981' },
    { name: 'Financial & Audit', value: 7, color: '#f59e0b' }
  ],
  mostUsedDocs: [
    { name: 'Company Policy & Code of Conduct 2025.pdf', queries: 540, classification: 'Internal', score: '99%' },
    { name: 'Employee Handbook & Benefits Guide.pdf', queries: 482, classification: 'Internal', score: '96%' },
    { name: 'Project Titan Architecture & Security Spec.pdf', queries: 320, classification: 'Confidential', score: '98%' },
    { name: 'Product API Documentation v2.4.docx', queries: 215, classification: 'Public', score: '91%' }
  ]
};
