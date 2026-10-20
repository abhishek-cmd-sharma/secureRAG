import bcrypt from 'bcrypt';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Document } from '../models/Document.js';
import { AuditLog } from '../models/AuditLog.js';
import { chunkDocument } from '../services/chunking.service.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { upsertChunks } from '../services/qdrant.service.js';

export async function seedInitialData() {
  const orgCount = await Organization.countDocuments();
  if (orgCount > 0) {
    // Database seeded; check if initial documents need vector synchronization in Qdrant
    try {
      const { searchVectorIndex } = await import('../services/qdrant.service.js');
      const docs = await Document.find({ title: { $in: [
        'Company Policy & Code of Conduct 2025.pdf',
        'Employee Handbook & Benefits Guide.pdf',
        'Project Titan Architecture & Security Spec.pdf',
        'Q3 Executive Financial & Audit Report.pdf'
      ] } });

      for (const doc of docs) {
        const dummyVec = new Array(768).fill(0.01);
        const matches = await searchVectorIndex(dummyVec, {
          organizationId: String(doc.organizationId),
          documentId: String(doc._id)
        }, 1, 0);

        if (matches.length === 0) {
          const textPassages = [
            `${doc.title}: ${doc.summary}`,
            `Details from ${doc.title}: ${doc.excerpt}`
          ];
          for (let pIdx = 0; pIdx < textPassages.length; pIdx++) {
            const text = textPassages[pIdx];
            const emb = await generateEmbedding(text);
            await upsertChunks([{
              chunkIndex: pIdx,
              chunkId: `init_${doc._id}_${pIdx}`,
              text,
              vector: emb.embedding,
              page: pIdx + 1,
              documentId: String(doc._id),
              docName: doc.title,
              organizationId: String(doc.organizationId),
              accessLevel: doc.accessLevel,
              allowedRoles: doc.allowedRoles
            }]);
          }
          console.log(`[Seed Sync] Synchronized vectors into Qdrant for "${doc.title}"`);
        }
      }
    } catch (e) {
      console.warn('[Seed Sync] Vector check notice:', e.message);
    }
    return;
  }

  console.log('[Seed] Bootstrapping enterprise organizations, users, and documents...');

  // 1. Organizations
  const novaCorp = await Organization.create({
    name: 'NovaCorp Global',
    slug: 'novacorp',
    description: 'Enterprise security & AI data intelligence conglomerate',
    tier: 'Enterprise Plus',
    compliance: ['SOC 2 Type II', 'ISO 27001', 'GDPR'],
    seats: 200,
    storageLimit: '25 GB',
    isActive: true
  });

  const apexHealth = await Organization.create({
    name: 'Apex Health AI',
    slug: 'apexhealth',
    description: 'Clinical healthcare AI and patient records intelligence',
    tier: 'Enterprise HIPAA',
    compliance: ['HIPAA', 'HITECH', 'SOC 2 Type II'],
    seats: 100,
    storageLimit: '20 GB',
    isActive: true
  });

  const vanguardFin = await Organization.create({
    name: 'Vanguard Financial',
    slug: 'vanguard',
    description: 'Algorithmic compliance and institutional risk governance',
    tier: 'Business Pro',
    compliance: ['FINRA', 'SOC 2 Type II'],
    seats: 75,
    storageLimit: '10 GB',
    isActive: true
  });

  // 2. Demo Users
  const defaultPassword = 'SecurePass123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const adminUser = await User.create({
    name: 'Sarah Connor',
    email: 'admin@novacorp.com',
    passwordHash,
    role: 'admin',
    organizationId: novaCorp._id,
    title: 'Chief Information Security Officer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isActive: true
  });

  const managerUser = await User.create({
    name: 'David Vance',
    email: 'manager@novacorp.com',
    passwordHash,
    role: 'manager',
    organizationId: novaCorp._id,
    title: 'Engineering & Operations Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true
  });

  const employeeUser = await User.create({
    name: 'Elena Rostova',
    email: 'elena@novacorp.com',
    passwordHash,
    role: 'employee',
    organizationId: novaCorp._id,
    title: 'Compliance & Legal Analyst',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true
  });

  // Additional team members
  await User.create([
    {
      name: 'Marcus Brody',
      email: 'm.brody@novacorp.com',
      passwordHash,
      role: 'employee',
      organizationId: novaCorp._id,
      title: 'Sr. DevOps Lead',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Aisha Patel',
      email: 'aisha.p@novacorp.com',
      passwordHash,
      role: 'manager',
      organizationId: novaCorp._id,
      title: 'Legal Counsel',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Julian Sterling',
      email: 'j.sterling@apexhealth.io',
      passwordHash,
      role: 'admin',
      organizationId: apexHealth._id,
      title: 'Security Director',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Dr. Maya Lin',
      email: 'm.lin@apexhealth.io',
      passwordHash,
      role: 'manager',
      organizationId: apexHealth._id,
      title: 'Clinical Lead',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Robert Chen',
      email: 'rchen@vanguard-fin.com',
      passwordHash,
      role: 'admin',
      organizationId: vanguardFin._id,
      title: 'Compliance Officer',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      isActive: false
    }
  ]);

  // 3. Document Metadata
  const createdDocs = await Document.create([
    {
      title: 'Company Policy & Code of Conduct 2025.pdf',
      originalFileName: 'Company Policy & Code of Conduct 2025.pdf',
      fileType: 'PDF',
      fileSize: '2.4 MB',
      organizationId: novaCorp._id,
      ownerId: adminUser._id,
      accessLevel: 'Internal',
      allowedRoles: ['admin', 'manager', 'employee'],
      status: 'indexed',
      chunksCount: 48,
      summary: 'Comprehensive guidelines on professional conduct, workplace integrity, and operational ethics.',
      excerpt: 'Section 4.2 - Information Security & Confidentiality: Multi-factor authentication is mandatory for all employee accounts accessing internal systems.'
    },
    {
      title: 'Employee Handbook & Benefits Guide.pdf',
      originalFileName: 'Employee Handbook & Benefits Guide.pdf',
      fileType: 'PDF',
      fileSize: '4.1 MB',
      organizationId: novaCorp._id,
      ownerId: adminUser._id,
      accessLevel: 'Internal',
      allowedRoles: ['admin', 'manager', 'employee'],
      status: 'indexed',
      chunksCount: 82,
      summary: 'Standard operating handbook outlining PTO policies, remote work, and medical coverage.',
      excerpt: 'Section 7.1 - Flexible Work & Remote Policies: Employees are entitled to up to 3 days per week remote work with direct manager approval. Standard PTO is 20 days annually.'
    },
    {
      title: 'Project Titan Architecture & Security Spec.pdf',
      originalFileName: 'Project Titan Architecture & Security Spec.pdf',
      fileType: 'PDF',
      fileSize: '6.8 MB',
      organizationId: novaCorp._id,
      ownerId: managerUser._id,
      accessLevel: 'Confidential',
      allowedRoles: ['admin', 'manager'],
      status: 'indexed',
      chunksCount: 134,
      summary: 'Deep architectural blueprints for Project Titan vector pipelines and encryption at rest.',
      excerpt: 'Architecture Overview: Vectors are generated using 768 dimensions and encrypted with AES-256-GCM. Tenant keys are held in dedicated KMS vaults with periodic rotation.'
    },
    {
      title: 'Q3 Executive Financial & Audit Report.pdf',
      originalFileName: 'Q3 Executive Financial & Audit Report.pdf',
      fileType: 'PDF',
      fileSize: '3.2 MB',
      organizationId: novaCorp._id,
      ownerId: adminUser._id,
      accessLevel: 'Restricted',
      allowedRoles: ['admin'],
      status: 'indexed',
      chunksCount: 64,
      summary: 'Restricted board-level executive financials, burn rates, and capital expenditures.',
      excerpt: 'Board Executive Summary: Net recurring revenue grew 42% YoY reaching $24.8M ARR. Capital expenditures were focused on GPU clusters for low-latency vector indexing.'
    },
    {
      title: 'Product API Documentation v2.4.docx',
      originalFileName: 'Product API Documentation v2.4.docx',
      fileType: 'DOCX',
      fileSize: '1.8 MB',
      organizationId: novaCorp._id,
      ownerId: managerUser._id,
      accessLevel: 'Public',
      allowedRoles: ['admin', 'manager', 'employee'],
      status: 'indexed',
      chunksCount: 36,
      summary: 'Developer documentation for REST endpoints and document ingestion pipelines.',
      excerpt: 'POST /api/v1/query: Submits a natural language query against tenant-scoped collections. Answers include citation payloads with page offsets and similarity scores.'
    },
    {
      title: 'Incident Response & Disaster Recovery Playbook.pdf',
      originalFileName: 'Incident Response & Disaster Recovery Playbook.pdf',
      fileType: 'PDF',
      fileSize: '2.1 MB',
      organizationId: novaCorp._id,
      ownerId: adminUser._id,
      accessLevel: 'Confidential',
      allowedRoles: ['admin', 'manager'],
      status: 'indexed',
      chunksCount: 42,
      summary: 'Standard operating procedures for Sev-1 security incidents, ransomware containment, and failover.',
      excerpt: 'Playbook Phase 2 - Containment: Incident Commander must isolate compromised VPC endpoints within 15 minutes. High-privilege access keys must be automatically rotated.'
    },
    {
      title: 'HIPAA Compliance Standard Operating Procedures.pdf',
      originalFileName: 'HIPAA Compliance Standard Operating Procedures.pdf',
      fileType: 'PDF',
      fileSize: '5.2 MB',
      organizationId: apexHealth._id,
      ownerId: adminUser._id,
      accessLevel: 'Confidential',
      allowedRoles: ['admin', 'manager'],
      status: 'indexed',
      chunksCount: 102,
      summary: 'Clinical procedures for safeguarding Protected Health Information (PHI).',
      excerpt: 'PHI Safeguards: All patient identifiable fields must be masked before embedding creation. Only authorized healthcare personnel may access clinical records.'
    },
    {
      title: 'Vanguard Anti-Money Laundering Protocols.pdf',
      originalFileName: 'Vanguard Anti-Money Laundering Protocols.pdf',
      fileType: 'PDF',
      fileSize: '3.9 MB',
      organizationId: vanguardFin._id,
      ownerId: adminUser._id,
      accessLevel: 'Restricted',
      allowedRoles: ['admin'],
      status: 'indexed',
      chunksCount: 78,
      summary: 'Regulatory compliance manual for automated transaction pattern screening.',
      excerpt: 'Transaction Monitoring Thresholds: Transactions exceeding $10,000 USD require automatic hold and suspicious activity reports filed within 24 hours.'
    }
  ]);

  // Index initial document passages into vector engine
  for (const doc of createdDocs) {
    const textPassages = [
      `${doc.title}: ${doc.summary}`,
      `Details from ${doc.title}: ${doc.excerpt}`
    ];
    for (let pIdx = 0; pIdx < textPassages.length; pIdx++) {
      const text = textPassages[pIdx];
      const emb = await generateEmbedding(text);
      await upsertChunks([{
        chunkIndex: pIdx,
        chunkId: `init_${doc._id}_${pIdx}`,
        text,
        vector: emb.embedding,
        page: pIdx + 1,
        documentId: String(doc._id),
        organizationId: String(doc.organizationId),
        accessLevel: doc.accessLevel,
        allowedRoles: doc.allowedRoles
      }]);
    }
  }

  // 4. Initial Audit Logs
  await AuditLog.create([
    {
      organizationId: novaCorp._id,
      actorId: adminUser._id,
      actorName: adminUser.name,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resourceId: String(adminUser._id),
      result: 'allowed',
      ipAddress: '192.168.1.45',
      details: 'Administrator authenticated successfully via secure session'
    },
    {
      organizationId: novaCorp._id,
      actorId: employeeUser._id,
      actorName: employeeUser.name,
      actorEmail: employeeUser.email,
      actorRole: employeeUser.role,
      action: 'PERMISSION_DENIED',
      resourceType: 'DOCUMENT',
      resourceName: 'Q3 Executive Financial & Audit Report.pdf',
      result: 'denied',
      ipAddress: '192.168.1.88',
      details: 'RBAC Policy Violation: Employee role cannot access Restricted classification files'
    },
    {
      organizationId: novaCorp._id,
      actorId: managerUser._id,
      actorName: managerUser.name,
      actorEmail: managerUser.email,
      actorRole: managerUser.role,
      action: 'DOCUMENT_VIEW',
      resourceType: 'DOCUMENT',
      resourceName: 'Project Titan Architecture & Security Spec.pdf',
      result: 'allowed',
      ipAddress: '192.168.2.14',
      details: 'Document preview modal opened. Access level: Confidential'
    },
    {
      organizationId: novaCorp._id,
      actorId: employeeUser._id,
      actorName: employeeUser.name,
      actorEmail: employeeUser.email,
      actorRole: employeeUser.role,
      action: 'DOCUMENT_VIEW',
      resourceType: 'DOCUMENT',
      resourceName: 'Employee Handbook & Benefits Guide.pdf',
      result: 'allowed',
      ipAddress: '192.168.1.88',
      details: 'Viewed Section 7.1 regarding PTO accrual and remote work policies'
    }
  ]);

  console.log('✅ [Seed] Successfully seeded initial organizations, users, documents, and audit logs!');
}
