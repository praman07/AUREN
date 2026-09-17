import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import type { AurenDocument, Connector, ChatConversation, SourceCitation, ConnectorDataItem, NotificationItem } from './src/types/index';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy Gemini SDK client
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
      return null;
    }
  }
  return genAIClient;
}

// In-Memory Real State for AUREN Workspace
const PERSONAS = [
  {
    id: 'usr_super_admin_elena',
    name: 'Elena Vance',
    firstName: 'Elena',
    email: 'elena.vance@gna.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'super_admin' as const,
    title: 'Chief Information Security Officer & Super Admin',
    department: 'Executive Security & Governance',
    isSuperAdmin: true,
    isDepartmentHead: false,
    organization: {
      id: 'org_gna_workspace',
      name: 'GNA / AUREN Workspace',
      domain: 'gna.internal',
    },
    preferences: {
      theme: 'light' as const,
      defaultScope: 'organization' as const,
      defaultChatBehavior: 'in_depth' as const,
      realtimeSync: true,
      notifyOnDocumentReady: true,
      notifyOnConnectorSync: true,
    },
    personalContext: {
      preferredLanguage: 'TypeScript / Rust',
      currentProject: 'Zero-Trust Enterprise Vault & Multi-Dept RBAC',
      recentInterests: ['Enterprise Security Governance', 'Audit Compliance', 'Cryptographic Vaults'],
    },
  },
  {
    id: 'usr_praman_101',
    name: 'Praman Singh Bhogal',
    firstName: 'Praman',
    email: 'praman@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'dept_head' as const,
    title: 'Core Architecture Lead & Department Head',
    department: 'Core Architecture',
    isSuperAdmin: false,
    isDepartmentHead: true,
    organization: {
      id: 'org_gna_workspace',
      name: 'GNA / AUREN Workspace',
      domain: 'gna.internal',
    },
    preferences: {
      theme: 'light' as const,
      defaultScope: 'personal' as const,
      defaultChatBehavior: 'in_depth' as const,
      realtimeSync: true,
      notifyOnDocumentReady: true,
      notifyOnConnectorSync: true,
    },
    personalContext: {
      preferredLanguage: 'TypeScript',
      currentProject: 'AUREN Knowledge Platform',
      recentInterests: ['RAG Architectures', 'System Design', 'Vector Quantization'],
    },
  },
  {
    id: 'usr_marcus_102',
    name: 'Marcus Brody',
    firstName: 'Marcus',
    email: 'marcus.brody@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'dept_head' as const,
    title: 'Platform Engineering Lead & Department Head',
    department: 'Platform Engineering',
    isSuperAdmin: false,
    isDepartmentHead: true,
    organization: {
      id: 'org_gna_workspace',
      name: 'GNA / AUREN Workspace',
      domain: 'gna.internal',
    },
    preferences: {
      theme: 'light' as const,
      defaultScope: 'organization' as const,
      defaultChatBehavior: 'technical' as const,
      realtimeSync: true,
      notifyOnDocumentReady: true,
      notifyOnConnectorSync: true,
    },
    personalContext: {
      preferredLanguage: 'Go / Python',
      currentProject: 'Distributed Multi-Region Vector Clusters',
      recentInterests: ['Kubernetes', 'BullMQ Workers', 'Low Latency RAG'],
    },
  },
  {
    id: 'usr_alex_103',
    name: 'Alex Chen',
    firstName: 'Alex',
    email: 'alex.chen@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'engineer' as const,
    title: 'Senior Systems Engineer',
    department: 'Core Architecture',
    isSuperAdmin: false,
    isDepartmentHead: false,
    organization: {
      id: 'org_gna_workspace',
      name: 'GNA / AUREN Workspace',
      domain: 'gna.internal',
    },
    preferences: {
      theme: 'light' as const,
      defaultScope: 'organization' as const,
      defaultChatBehavior: 'technical' as const,
      realtimeSync: true,
      notifyOnDocumentReady: true,
      notifyOnConnectorSync: true,
    },
    personalContext: {
      preferredLanguage: 'Rust',
      currentProject: 'AST Tokenizer & Chunking Pipeline',
      recentInterests: ['AST Parsers', 'Embeddings', 'Qdrant'],
    },
  },
  {
    id: 'usr_maya_104',
    name: 'Maya Lin',
    firstName: 'Maya',
    email: 'maya.lin@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'member' as const,
    title: 'AI Research Intern (Database Security)',
    department: 'Core Architecture',
    isSuperAdmin: false,
    isDepartmentHead: false,
    organization: {
      id: 'org_gna_workspace',
      name: 'GNA / AUREN Workspace',
      domain: 'gna.internal',
    },
    preferences: {
      theme: 'light' as const,
      defaultScope: 'personal' as const,
      defaultChatBehavior: 'concise' as const,
      realtimeSync: false,
      notifyOnDocumentReady: true,
      notifyOnConnectorSync: false,
    },
    personalContext: {
      preferredLanguage: 'Python',
      currentProject: 'Vector Embedding Benchmark Evaluation',
      recentInterests: ['Database Security', 'Vector Distance Metrics'],
    },
  },
];

let currentUser = PERSONAS[1]; // Default to Praman (Dept Head) or easily switchable to Elena (Super Admin)

let departments = [
  {
    id: 'dept_core_arch',
    name: 'Core Architecture',
    head: {
      id: 'usr_praman_101',
      name: 'Praman Singh Bhogal',
      email: 'praman@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Core Architecture Lead & Department Head',
    },
    memberCount: 14,
    documentCount: 8,
    storageUsed: '1.2 GB',
    subfields: ['Retrieval Pipeline', 'Vector Indexing', 'AST Parsing', 'SSE Streaming', 'Database Security'],
    status: 'active' as const,
    lastUpdatedByAdmin: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    lastAdminAction: 'Clearance audit verified: Zero-trust compliance 99.4%',
  },
  {
    id: 'dept_platform_eng',
    name: 'Platform Engineering',
    head: {
      id: 'usr_marcus_102',
      name: 'Marcus Brody',
      email: 'marcus.brody@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Platform Engineering Lead & Department Head',
    },
    memberCount: 22,
    documentCount: 12,
    storageUsed: '2.4 GB',
    subfields: ['Kubernetes Mesh', 'BullMQ Workers', 'GPU Inference Cluster', 'Multi-Region Ingestion'],
    status: 'active' as const,
    lastUpdatedByAdmin: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    lastAdminAction: 'Worker pool quota expanded by Super Admin',
  },
  {
    id: 'dept_sec_compliance',
    name: 'Security & Compliance',
    head: {
      id: 'usr_elena_r',
      name: 'Elena Rostova',
      email: 'elena.r@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      title: 'Director of Information Security',
    },
    memberCount: 9,
    documentCount: 6,
    storageUsed: '850 MB',
    subfields: ['SOC2 Type II', 'Connector Whitelisting', 'Cryptographic Key Vaults', 'Zero-Trust Auditing'],
    status: 'active' as const,
    lastUpdatedByAdmin: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    lastAdminAction: 'Enterprise cryptographic baseline ratified',
  },
  {
    id: 'dept_product_design',
    name: 'Product & Design',
    head: {
      id: 'usr_sofia_c',
      name: 'Sofia Chen',
      email: 'sofia.chen@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Product Experience',
    },
    memberCount: 11,
    documentCount: 5,
    storageUsed: '640 MB',
    subfields: ['Design Systems', 'PRD Specs', 'Information Architecture', 'User Testing ASTs'],
    status: 'active' as const,
    lastUpdatedByAdmin: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    lastAdminAction: 'Design system tokens approved for universal layout',
  },
  {
    id: 'dept_qa_infra',
    name: 'QA & Infrastructure',
    head: {
      id: 'usr_david_k',
      name: 'David Kim',
      email: 'david.kim@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      title: 'Head of Infrastructure Reliability',
    },
    memberCount: 8,
    documentCount: 4,
    storageUsed: '420 MB',
    subfields: ['Chaos Engineering', 'E2E Benchmarks', 'Failover Drills', 'Latency Monitoring'],
    status: 'active' as const,
    lastUpdatedByAdmin: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    lastAdminAction: 'Disaster recovery runbook certified',
  },
];

let superAdminAuditLog = [
  {
    id: 'action_init_001',
    actionType: 'publish_enterprise_doc' as const,
    targetDepartment: 'All Departments',
    title: 'Published Enterprise Governance Charter 2026',
    description: 'Elena Vance published the master organization-wide governance standard to the Enterprise Knowledge Base.',
    executedBy: 'Elena Vance (Super Admin)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    notifiedHeads: ['Praman Singh Bhogal', 'Marcus Brody', 'Elena Rostova', 'Sofia Chen', 'David Kim'],
    acknowledged: true,
  },
  {
    id: 'action_init_002',
    actionType: 'broadcast_directive' as const,
    targetDepartment: 'Core Architecture',
    title: 'Zero-Trust Retrieval Pipeline Audit Directive',
    description: 'Mandated strict departmental boundary verification for all incoming Qdrant vector points.',
    executedBy: 'Elena Vance (Super Admin)',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    notifiedHeads: ['Praman Singh Bhogal (Core Architecture)'],
    acknowledged: true,
  },
];

let documents: AurenDocument[] = [
  // ----------------------------------------------------
  // Scope 1: ENTERPRISE KNOWLEDGE BASE (Super-Organizational Vault, Super Admin Governed)
  // ----------------------------------------------------
  {
    id: 'doc_enterprise_001',
    title: 'AUREN Enterprise Zero-Trust & Master Governance Charter 2026',
    filename: 'enterprise-governance-charter-2026.md',
    type: 'spec' as const,
    scope: 'enterprise' as const,
    knowledgeTier: 'enterprise' as const,
    department: 'Executive Security & Governance',
    isEnterpriseSuperOrg: true,
    managedByRole: 'super_admin' as const,
    source: 'direct_upload' as const,
    fileSize: '3.8 MB',
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: 'ready' as const,
    statusDetail: 'Certified & Ratified by Elena Vance (Super Admin)',
    accessPolicy: {
      ownerId: 'usr_super_admin_elena',
      ownerName: 'Elena Vance (Super Admin)',
      scope: 'organization' as const,
      allowedRoles: ['member', 'engineer', 'lead', 'admin', 'super_admin', 'dept_head'],
      allowedDepartments: ['Core Architecture', 'Platform Engineering', 'Security & Compliance', 'Product & Design', 'QA & Infrastructure'],
      minSubgroupLevel: 'trainee' as const,
      isRestricted: false,
    },
    versionHistory: [
      {
        version: 'v1.0.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        author: 'Elena Vance',
        changeSummary: 'Ratified organization-wide zero trust isolation standards between Personal, Departmental, and Super-Organizational Knowledge tiers.',
      },
    ],
    activityLog: [
      {
        id: 'act_ent_1',
        action: 'Enterprise Directive Published',
        user: 'Elena Vance (Super Admin)',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        details: 'Broadcasted to all 5 Department Heads. Enforces cryptographic provenance.',
      },
    ],
    intelligence: {
      documentType: 'Master Enterprise Governance Specification',
      executiveSummary:
        'Organization-wide sovereign governance charter establishing the cryptographic isolation parameters across personal user notebooks, department-specific engineering vaults, and the master super-organizational knowledge repository. Enforces zero data leakage and mandatory audit logs.',
      keyTopics: [
        'Super-Organizational Knowledge Vault',
        'Three-Tier Knowledge Separation',
        'Department Head Delegation Matrix',
        'Zero-Trust Vector Boundary Enforcement',
        'Executive Audit Trail Preservation',
      ],
      readingTimeMinutes: 12,
      technologies: ['Zero-Trust RBAC', 'Qdrant Tenant Partitioning', 'AST Verification', 'SHA-256 Provenance'],
      entities: ['EnterpriseVault', 'DepartmentKnowledgeBase', 'PersonalNotebook', 'SuperAdminController'],
      aiTags: ['Enterprise', 'Governance', 'Zero-Trust', 'Master-Policy'],
      documentPurpose:
        'Provides company-wide authoritative baseline for all departmental knowledge bases, establishing that Super Admin holds sovereign override while Department Heads govern day-to-day departmental resources.',
      importantSections: [
        {
          title: 'Section 1: The Three-Tier Knowledge Topology',
          summary: 'Defines Personal (User Private), Departmental (Dept Head Governed), and Super-Organizational (Super Admin Controlled) boundaries.',
          page: 1,
        },
        {
          title: 'Section 2: Department Head Operational Autonomy',
          summary: 'Grants Department Heads full clearance control over team assets while mandating immediate automated notification upon any Super Admin intervention.',
          page: 4,
        },
      ],
      pageCount: 22,
      headingsCount: 38,
      tablesCount: 5,
    },
  },
  {
    id: 'doc_enterprise_002',
    title: 'Corporate Security Baseline & Multi-Region Vector Compliance Standard',
    filename: 'corporate-security-baseline-v4.pdf',
    type: 'pdf' as const,
    scope: 'enterprise' as const,
    knowledgeTier: 'enterprise' as const,
    department: 'Security & Compliance',
    isEnterpriseSuperOrg: true,
    managedByRole: 'super_admin' as const,
    source: 'direct_upload' as const,
    fileSize: '4.2 MB',
    updatedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    status: 'ready' as const,
    statusDetail: 'Audited & Compliant with SOC2 Type II & FedRAMP High',
    accessPolicy: {
      ownerId: 'usr_super_admin_elena',
      ownerName: 'Elena Vance (Super Admin)',
      scope: 'organization' as const,
      allowedRoles: ['member', 'engineer', 'lead', 'admin', 'super_admin', 'dept_head'],
      allowedDepartments: ['Core Architecture', 'Platform Engineering', 'Security & Compliance', 'Product & Design', 'QA & Infrastructure'],
      minSubgroupLevel: 'trainee' as const,
      isRestricted: false,
    },
    versionHistory: [
      {
        version: 'v4.1.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        author: 'Elena Vance',
        changeSummary: 'Added strict requirements for multi-region vector database payload sanitization.',
      },
    ],
    activityLog: [
      {
        id: 'act_ent_2',
        action: 'Security Baseline Updated',
        user: 'Elena Vance (Super Admin)',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      },
    ],
    intelligence: {
      documentType: 'Corporate Security Compliance Standard',
      executiveSummary:
        'Company-wide security compliance standard mandating AES-256 encryption at rest, TLS 1.3 in transit, automated certificate rotation, and deterministic AST chunk validation before any vector indexing.',
      keyTopics: ['AES-256 Encryption', 'AST Sanitization', 'Multi-Region Replication', 'Connector Whitelist Protocols'],
      readingTimeMinutes: 9,
      technologies: ['Vault', 'KMS', 'TLS 1.3', 'Qdrant RBAC', 'PostgreSQL Row-Level Security'],
      entities: ['ComplianceBaseline', 'SecurityEngine', 'AuditController'],
      aiTags: ['Compliance', 'Security', 'Enterprise', 'SOC2'],
      documentPurpose: 'Enforces universal security protocols that no single department may disable without written Super Admin exception.',
      importantSections: [
        {
          title: 'Mandatory Connector Sandboxing',
          summary: 'All third-party connectors (GitHub, Google Drive, Notion) must execute through ephemeral proxy containers with strict egress filters.',
          page: 2,
        },
      ],
      pageCount: 18,
    },
  },

  // ----------------------------------------------------
  // Scope 2: DEPARTMENTAL KNOWLEDGE BASE (Department Head Governed)
  // ----------------------------------------------------
  {
    id: 'doc_arch_001',
    title: 'AUREN System Architecture & Service Topology',
    filename: 'auren-system-architecture-v2.md',
    type: 'markdown' as const,
    scope: 'organization' as const,
    knowledgeTier: 'departmental' as const,
    department: 'Core Architecture',
    managedByRole: 'dept_head' as const,
    source: 'github' as const,
    sourceMetadata: {
      repo: 'auren-core/retrieval-service',
      branch: 'main',
      commitSha: '7f9a2e1',
      externalUrl: 'https://github.com/auren-core/retrieval-service/blob/main/docs/architecture.md',
    },
    fileSize: '1.4 MB',
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: 'ready' as const,
    statusDetail: 'Indexed and knowledge synthesized',
    accessPolicy: {
      ownerId: 'usr_praman_101',
      ownerName: 'Praman Singh Bhogal (Dept Head)',
      scope: 'organization' as const,
      allowedRoles: ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Core Architecture', 'Platform Engineering', 'Security & Compliance'],
      allowedSubgroups: ['senior', 'mid_senior'],
      minSubgroupLevel: 'mid_senior' as const,
      allowedSubfields: ['Retrieval Pipeline', 'Vector Indexing', 'AST Parsing'],
      isRestricted: false,
    },
    versionHistory: [
      {
        version: 'v2.4.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        author: 'Alex Vance',
        changeSummary: 'Documented llama.cpp local inference pipeline and SearXNG verification engine',
        commitSha: '7f9a2e1',
      },
      {
        version: 'v2.3.1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        author: 'Elena Rostova',
        changeSummary: 'Hardened DocumentAccessPolicy checks for multi-tenant isolation',
        commitSha: '3a18e0f',
      },
    ],
    activityLog: [
      {
        id: 'act_1',
        action: 'Ingestion Completed',
        user: 'AUREN Ingestion Engine',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        details: 'Extracted 42 chunks, Qdrant vectors generated, knowledge graph unified',
      },
      {
        id: 'act_2',
        action: 'GitHub Webhook Push',
        user: 'GitHub App',
        timestamp: new Date(Date.now() - 1000 * 60 * 36).toISOString(),
        details: 'Triggered by commit 7f9a2e1 on branch main',
      },
    ],
    intelligence: {
      documentType: 'System Architecture Specification',
      executiveSummary:
        "Comprehensive architectural blueprint detailing AUREN's decoupled knowledge retrieval pipeline, tenant-isolated vector indexing, and source-grounded inference topology. Documents the strict separation between personal and organization knowledge tiers, Qdrant partition policies, and zero-leakage RBAC rules.",
      keyTopics: [
        'Decoupled Ingestion Pipeline',
        'Dual-Tier Tenant Isolation',
        'Qdrant Vector Indexing',
        'SSE Token Streaming',
        'SearXNG Evidence Grounding',
        'Connector Access Policies',
      ],
      readingTimeMinutes: 7,
      technologies: ['PostgreSQL', 'Prisma', 'Redis', 'BullMQ', 'Qdrant', 'llama.cpp', 'SearXNG', 'Express', 'React 19'],
      entities: ['DocumentAccessPolicy', 'ConnectorPolicy', 'PersonalStore', 'OrgKnowledgeCluster', 'VLM Ingestion Service'],
      aiTags: ['Architecture', 'Security', 'Ingestion', 'Retrieval', 'Production'],
      documentPurpose:
        'Serves as the engineering contract defining how documents, connectors, and queries are securely routed and grounded across private personal vaults and organization boundaries.',
      importantSections: [
        {
          title: '1. Ingestion Pipeline & Event Loop',
          summary: 'Upload triggers Redis/BullMQ task for asynchronous OCR, VLM table extraction, chunking, and embedding generation.',
          page: 1,
        },
        {
          title: '2. Dual-Tier Knowledge Isolation',
          summary: 'Personal documents remain encrypted under owner-derived keys while organization documents strictly adhere to DocumentAccessPolicy role matrices.',
          page: 3,
        },
        {
          title: '3. Grounded Synthesis & Citations',
          summary: 'Retrieved chunks are passed through context validation before conversational synthesis emits verifiable citations with exact byte anchors.',
          page: 5,
        },
      ],
      pageCount: 14,
      headingsCount: 28,
      tablesCount: 6,
      visualSummary: 'Contains 4 architectural topology diagrams illustrating document ingestion state machines and citation routing.',
    },
    relatedDocuments: [
      {
        id: 'doc_sec_002',
        title: 'Zero-Trust Document Access & Connector Policy',
        scope: 'organization' as const,
        similarityScore: 0.94,
        reason: 'Directly implements the DocumentAccessPolicy and ConnectorPolicy defined in this architecture spec.',
        type: 'spec' as const,
      },
      {
        id: 'doc_qdrant_003',
        title: 'Qdrant Vector Partitioning & Tenant Isolation Rules',
        scope: 'organization' as const,
        similarityScore: 0.89,
        reason: 'Deep dive into payload filtering and HNSW indexing per department.',
        type: 'markdown' as const,
      },
    ],
    rawContent: `AUREN Architecture Specification v2.4.0\n\nThe core of AUREN is a unified knowledge retrieval and synthesis engine designed with strict isolation guarantees. Personal knowledge vaults are private by default, while Organization knowledge is partitioned across department-level Access Control Lists (ACLs). When a query is initiated, the router determines whether the request requires internal vector retrieval via Qdrant or evidence synthesis via SearXNG. In all cases, citations are emitted with byte-level grounding.`,
  },
  {
    id: 'doc_sec_002',
    title: 'Zero-Trust Document Access & Connector Policy',
    filename: 'connector-policy-spec.md',
    type: 'spec' as const,
    scope: 'organization' as const,
    source: 'github' as const,
    sourceMetadata: {
      repo: 'auren-core/security-policies',
      branch: 'main',
      commitSha: '9b201f4',
      externalUrl: 'https://github.com/auren-core/security-policies/blob/main/connector-policy.md',
    },
    fileSize: '890 KB',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    status: 'ready' as const,
    statusDetail: 'Validated against active compliance policy',
    accessPolicy: {
      ownerId: 'usr_sec_lead',
      ownerName: 'Security & Compliance Guild',
      scope: 'organization' as const,
      allowedRoles: ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Core Architecture', 'Security', 'Compliance'],
      isRestricted: false,
    },
    versionHistory: [
      {
        version: 'v1.8.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        author: 'Marcus Brody',
        changeSummary: 'Added automated webhook commit verification rules',
        commitSha: '9b201f4',
      },
    ],
    activityLog: [
      {
        id: 'act_sec_1',
        action: 'Security Audit Passed',
        user: 'Compliance Auditor',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
    ],
    intelligence: {
      documentType: 'Security & Governance Specification',
      executiveSummary:
        'Formal specification of ConnectorPolicy and DocumentAccessPolicy enforcement rules. Dictates how external data synchronized from GitHub, Google Drive, and Slack is scrubbed, classified, and tagged with immutable permission envelopes.',
      keyTopics: ['Role-Based Access Control', 'Department Scoping', 'Connector Token Security', 'Audit Trails'],
      readingTimeMinutes: 5,
      technologies: ['Prisma Client Extensions', 'PostgreSQL RLS', 'JWT Claims'],
      entities: ['ConnectorPolicy', 'DocumentAccessPolicy', 'TenantAuditLog'],
      aiTags: ['Security', 'Governance', 'Compliance', 'Access Control'],
      documentPurpose: 'Enforces security guarantees across all background sync workers and query retrieval pipelines.',
      importantSections: [
        {
          title: 'Connector Ingestion Envelopes',
          summary: 'Every incoming resource from GitHub or Drive receives an immutable organizationId and department whitelist before entering Qdrant.',
          page: 1,
        },
      ],
      pageCount: 9,
      headingsCount: 16,
      tablesCount: 4,
    },
    relatedDocuments: [
      {
        id: 'doc_arch_001',
        title: 'AUREN System Architecture & Service Topology',
        scope: 'organization' as const,
        similarityScore: 0.94,
        reason: 'Parent specification for access policies.',
        type: 'markdown' as const,
      },
    ],
    rawContent: `Security Specification: Zero-Trust Access Policies.\nAll connectors operating inside AUREN execute in sandboxed contexts. Data synchronized from repositories or cloud drives undergoes automated PII scanning and classification before being committed to PostgreSQL and Qdrant.`,
  },
  {
    id: 'doc_personal_001',
    title: 'Research Notes: Autonomous Agent Memory & Latent Graphs',
    filename: 'agent-memory-latent-graphs.md',
    type: 'markdown' as const,
    scope: 'personal' as const,
    source: 'direct_upload' as const,
    fileSize: '420 KB',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'ready' as const,
    statusDetail: 'Personal vault encrypted & indexed',
    accessPolicy: {
      ownerId: 'usr_auren_942',
      ownerName: 'Alex Vance',
      scope: 'personal' as const,
      allowedRoles: ['lead' as const],
      allowedDepartments: ['Core Architecture'],
      isRestricted: true,
    },
    versionHistory: [
      {
        version: 'v1.2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        author: 'Alex Vance',
        changeSummary: 'Added benchmark comparison between linear buffer and latent graph recall',
      },
    ],
    activityLog: [
      {
        id: 'act_p1',
        action: 'Vault Encrypted',
        user: 'Alex Vance',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      },
    ],
    intelligence: {
      documentType: 'Personal Research Document',
      executiveSummary:
        'Exploratory research investigating hierarchical latent memory networks for conversational AI. Evaluates trade-offs between dense semantic retrieval, entity-anchored episodic graphs, and working context window decay.',
      keyTopics: ['Episodic Memory', 'Latent Knowledge Graphs', 'Retrieval Decay Curves', 'Context Compression'],
      readingTimeMinutes: 6,
      technologies: ['Graph Theory', 'HNSW Vector Indices', 'Cosine Distance Curves'],
      entities: ['LatentRecallEngine', 'EpisodicStore', 'MemoryDecayFunction'],
      aiTags: ['Research', 'Memory', 'AI', 'Personal'],
      documentPurpose: 'Investigate how long-term knowledge retention can be achieved without prompt context bloat.',
      importantSections: [
        {
          title: 'Hierarchical Memory Layers',
          summary: 'Proposes 3-tiered memory: Working scratchpad (session), Episodic ledger (recency-weighted), and Core semantic graph (permanent).',
          page: 1,
        },
      ],
      pageCount: 6,
      headingsCount: 12,
      tablesCount: 2,
    },
    relatedDocuments: [
      {
        id: 'doc_arch_001',
        title: 'AUREN System Architecture & Service Topology',
        scope: 'organization' as const,
        similarityScore: 0.78,
        reason: 'Concepts relate to context window packing and conversational state management.',
        type: 'markdown' as const,
      },
    ],
    rawContent: `Personal Research Note: Latent Memory Graph Formulation.\nTraditional conversational agents suffer from context window exhaustion and prompt saturation. By maintaining a latent graph that connects user statements with verified source documents, the agent can dynamically pull only the minimal spanning subgraph required for inference.`,
  },
  {
    id: 'doc_github_004',
    title: 'retrieval-service/src/pipeline/chunker.ts',
    filename: 'chunker.ts',
    type: 'code' as const,
    scope: 'organization' as const,
    source: 'github' as const,
    sourceMetadata: {
      repo: 'auren-core/retrieval-service',
      branch: 'main',
      commitSha: '7f9a2e1',
      externalUrl: 'https://github.com/auren-core/retrieval-service/blob/main/src/pipeline/chunker.ts',
    },
    fileSize: '34 KB',
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    status: 'ready' as const,
    statusDetail: 'AST parsed & syntax verified',
    accessPolicy: {
      ownerId: 'usr_org_admin',
      ownerName: 'Platform Guild',
      scope: 'organization' as const,
      allowedRoles: ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Core Architecture', 'Platform Engineering'],
      isRestricted: false,
    },
    versionHistory: [
      {
        version: 'v2.1',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        author: 'Devin K.',
        changeSummary: 'Implemented sliding window chunking with markdown header boundary preservation',
        commitSha: '7f9a2e1',
      },
    ],
    activityLog: [
      {
        id: 'act_code_1',
        action: 'AST Analyzed',
        user: 'AUREN Code Parser',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
    ],
    intelligence: {
      documentType: 'TypeScript Source Code',
      executiveSummary:
        'Core sliding window semantic chunker for ingested markdown, code, and technical specs. Preserves logical structural units like functions, classes, and markdown headers while enforcing maximum token bounds with 15% overlap.',
      keyTopics: ['AST Parsing', 'Sliding Window Chunking', 'Header Boundary Preservation', 'Token Window Budgeting'],
      readingTimeMinutes: 3,
      technologies: ['TypeScript', 'Tree-sitter', 'Tiktoken'],
      entities: ['SemanticChunker', 'ChunkBoundaryDetector', 'TokenBudgetManager'],
      aiTags: ['Code', 'Ingestion', 'TypeScript', 'Parsing'],
      documentPurpose: 'Splits raw textual and code payloads into optimal vector embeddings while retaining context headers.',
      importantSections: [
        {
          title: 'Class: SemanticChunker',
          summary: 'Accepts document buffer and AST tree, splitting by boundary points without severing function blocks.',
        },
      ],
      codeDetails: {
        language: 'TypeScript',
        framework: 'Node.js / Express',
        architectureConcepts: ['Sliding Window', 'Token Preservation', 'Context Anchoring'],
        majorComponents: ['SemanticChunker', 'BoundaryResolver', 'MetadataAnnotator'],
        importantFiles: ['chunker.ts', 'tokenizer.ts', 'types.ts'],
        projectOverview: 'Internal chunking pipeline running inside BullMQ ingestion workers.',
      },
    },
    relatedDocuments: [
      {
        id: 'doc_arch_001',
        title: 'AUREN System Architecture & Service Topology',
        scope: 'organization' as const,
        similarityScore: 0.92,
        reason: 'Component described in Section 1 of the architecture specification.',
        type: 'markdown' as const,
      },
    ],
    rawContent: `import { Tokenizer } from './tokenizer';\nexport class SemanticChunker {\n  constructor(private maxTokens = 512, private overlap = 64) {}\n  public chunk(text: string): Chunk[] {\n    // AST-aware boundary splits...\n    return [];\n  }\n}`,
  },
  {
    id: 'doc_processing_sample',
    title: 'Q3 Product & Engineering Roadmap 2026.pdf',
    filename: 'q3-product-engineering-roadmap-2026.pdf',
    type: 'pdf' as const,
    scope: 'organization' as const,
    source: 'direct_upload' as const,
    fileSize: '4.8 MB',
    updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    status: 'building_knowledge' as const,
    statusDetail: 'Extracting key topics and generating executive summary',
    accessPolicy: {
      ownerId: 'usr_auren_942',
      ownerName: 'Alex Vance',
      scope: 'organization' as const,
      allowedRoles: ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Product', 'Engineering', 'Core Architecture'],
      isRestricted: false,
    },
    versionHistory: [
      {
        version: 'v1.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        author: 'Alex Vance',
        changeSummary: 'Uploaded original document',
      },
    ],
    activityLog: [
      {
        id: 'act_pdf_1',
        action: 'OCR Extraction',
        user: 'VLM Ingestion Engine',
        timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
        details: 'Extracted 18 pages, identified 5 quarterly milestone tables',
      },
    ],
    intelligence: {
      documentType: 'Strategic Product Roadmap',
      executiveSummary:
        'Draft roadmap detailing core deliverable targets for AUREN knowledge integrations in Q3 2026, highlighting enterprise connector expansion, offline embeddings, and localized research agents.',
      keyTopics: ['Enterprise Connectors', 'Offline Retrieval', 'Audit Capabilities', 'Client-side Encryption'],
      readingTimeMinutes: 10,
      technologies: ['Roadmap', 'Enterprise', 'Strategic Goals'],
      entities: ['ProductCouncil', 'EngineeringSteering', 'SecurityAuditTeam'],
      aiTags: ['Roadmap', 'Strategy', 'Q3', 'Product'],
      documentPurpose: 'Outlines milestones and deliverables for technical leadership.',
      importantSections: [
        {
          title: 'Q3 Objectives & Key Results',
          summary: 'Targeting 99.95% retrieval accuracy and sub-200ms citation latency across enterprise workspaces.',
          page: 2,
        },
      ],
      pageCount: 18,
      headingsCount: 24,
      tablesCount: 8,
    },
    rawContent: 'AUREN Product & Engineering Roadmap Q3 2026. Executive summary of upcoming technical milestones.',
  },
  {
    id: 'doc_prod_req_01',
    title: 'Product Requirements.pdf',
    filename: 'Product-Requirements-v2.pdf',
    type: 'pdf' as const,
    scope: 'organization' as const,
    source: 'google_drive' as const,
    sourceMetadata: {
      externalUrl: 'https://drive.google.com/file/d/1prod_req_auren_v2/view',
    },
    fileSize: '2.1 MB',
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'ready' as const,
    statusDetail: 'Indexed and knowledge synthesized',
    accessPolicy: {
      ownerId: 'usr_praman_101',
      ownerName: 'Praman Singh Bhogal',
      scope: 'organization' as const,
      allowedRoles: ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Product', 'Engineering', 'Core Architecture'],
      isRestricted: false,
    },
    versionHistory: [
      {
        version: 'v2.1',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        author: 'Praman Singh Bhogal',
        changeSummary: 'Finalized dual-tier knowledge isolation and connector access policy specifications',
      },
    ],
    activityLog: [
      {
        id: 'act_pr_1',
        action: 'Google Drive Synced',
        user: 'Connector Sync Daemon',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
    ],
    intelligence: {
      documentType: 'Product Requirements Document (PRD)',
      executiveSummary:
        'Comprehensive specification defining the next generation AUREN Knowledge Assistant. Specifies dual-tier knowledge boundaries separating Personal Vaults from Organization Workspaces, zero-trust Qdrant vector retrieval, and automated document intelligence overview generation.',
      keyTopics: ['Dual-Tier Boundaries', 'Qdrant Partitioning', 'Connector Policies', 'Document Overview AI', 'SSE Streaming'],
      readingTimeMinutes: 7,
      technologies: ['TypeScript', 'React', 'Node.js', 'Qdrant', 'Gemini 2.5'],
      entities: ['AUREN Workspace', 'Google Drive', 'GitHub Enterprise', 'Security Guild'],
      aiTags: ['PRD', 'Specification', 'Requirements', 'Architecture'],
      documentPurpose: 'Serves as the core architectural and functional blueprint for engineering and product delivery.',
      importantSections: [
        {
          title: 'Section 1: Knowledge Spaces & Dual-Tier Isolation',
          summary: 'Defines how personal notes remain cryptographically encrypted to ownerId while organization documents follow RBAC.',
          page: 1,
        },
        {
          title: 'Section 2: Automatic Document Intelligence',
          summary: 'Requires every uploaded document to automatically generate executive summaries, key topics, reading time, and entities.',
          page: 3,
        },
        {
          title: 'Section 3: Grounded Citations & Traceability',
          summary: 'Mandates that all conversational answers cite exact document fragments or commit SHAs.',
          page: 5,
        },
      ],
      pageCount: 12,
      headingsCount: 18,
      tablesCount: 4,
    },
    relatedDocuments: [
      {
        id: 'doc_arch_001',
        title: 'AUREN System Architecture & Service Topology',
        scope: 'organization' as const,
        similarityScore: 0.96,
        reason: 'Direct architectural implementation of PRD specifications.',
        type: 'markdown' as const,
      },
      {
        id: 'doc_sec_002',
        title: 'Zero-Trust Document Access & Connector Policy',
        scope: 'organization' as const,
        similarityScore: 0.91,
        reason: 'Defines security and authorization constraints for PRD Section 1.',
        type: 'spec' as const,
      },
    ],
    rawContent: 'AUREN Product Requirements Document v2.1. Dual-tier knowledge isolation, zero-trust vector retrieval, and automated document intelligence.',
  },
  {
    id: 'doc_travel_plans',
    title: 'Travel Plans.pdf',
    filename: 'Travel-Plans-2026.pdf',
    type: 'pdf' as const,
    scope: 'personal' as const,
    source: 'direct_upload' as const,
    fileSize: '340 KB',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'ready' as const,
    statusDetail: 'Personal vault encrypted & indexed',
    accessPolicy: {
      ownerId: 'usr_praman_101',
      ownerName: 'Praman Singh Bhogal',
      scope: 'personal' as const,
      allowedRoles: ['lead' as const],
      allowedDepartments: ['Core Architecture'],
      isRestricted: true,
    },
    versionHistory: [
      {
        version: 'v1.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        author: 'Praman Singh Bhogal',
        changeSummary: 'Uploaded personal itinerary',
      },
    ],
    activityLog: [
      {
        id: 'act_tp_1',
        action: 'Vault Encrypted',
        user: 'Praman Singh Bhogal',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
    ],
    intelligence: {
      documentType: 'Personal Itinerary & Travel Notes',
      executiveSummary:
        'Personal travel schedule, flights, hotel reservations, and technical conference attendance for upcoming international architecture symposiums in 2026.',
      keyTopics: ['Conferences', 'Flights', 'Hotels', 'Itinerary'],
      readingTimeMinutes: 3,
      technologies: ['Personal Document'],
      entities: ['San Francisco', 'Tokyo', 'Star Alliance'],
      aiTags: ['Personal', 'Travel', 'Itinerary'],
      documentPurpose: 'Private travel log stored strictly within Personal Knowledge Vault.',
      importantSections: [
        {
          title: 'Flight Confirmations',
          summary: 'Departures, terminal information, and baggage allowances.',
          page: 1,
        },
      ],
      pageCount: 3,
      headingsCount: 6,
      tablesCount: 2,
    },
    rawContent: 'Personal travel itinerary for 2026 technical conferences and personal vacation.',
  },
];

let connectors: Connector[] = [
  {
    id: 'conn_github',
    type: 'github' as const,
    name: 'GitHub Enterprise',
    scope: 'organization' as const,
    connected: true,
    account: 'alex-vance-auren',
    resourceCount: 48,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'active' as const,
    policy: {
      allowedUsers: ['usr_auren_942', 'usr_org_admin', 'usr_sec_lead'],
      allowedRoles: ['engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Core Architecture', 'Platform Engineering', 'Security'],
      allowAllOrg: true,
    },
    githubDetails: {
      organization: 'auren-core',
      repositories: [
        {
          id: 'repo_1',
          name: 'retrieval-service',
          fullName: 'auren-core/retrieval-service',
          private: true,
          defaultBranch: 'main',
          lastCommitSha: '7f9a2e1',
          lastCommitMessage: 'docs(arch): update llama.cpp topology and citation anchors',
          lastSyncAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          syncedFilesCount: 32,
          status: 'synced' as const,
        },
        {
          id: 'repo_2',
          name: 'security-policies',
          fullName: 'auren-core/security-policies',
          private: true,
          defaultBranch: 'main',
          lastCommitSha: '9b201f4',
          lastCommitMessage: 'feat(policy): automate commit verification rules',
          lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          syncedFilesCount: 16,
          status: 'synced' as const,
        },
      ],
      webhookActive: true,
      webhookUrl: 'https://api.auren.internal/webhooks/github/push',
      lastWebhookEvent: {
        event: 'push',
        repo: 'auren-core/retrieval-service',
        commitSha: '7f9a2e1',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
    },
  },
  {
    id: 'conn_gdrive',
    type: 'google_drive' as const,
    name: 'Google Drive',
    scope: 'organization' as const,
    connected: true,
    account: 'alex.vance@auren.internal',
    resourceCount: 142,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'active' as const,
    policy: {
      allowedUsers: ['usr_auren_942'],
      allowedRoles: ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Core Architecture', 'Product', 'Leadership'],
      allowAllOrg: false,
    },
  },
  {
    id: 'conn_notion',
    type: 'notion' as const,
    name: 'Notion Workspace',
    scope: 'personal' as const,
    connected: true,
    account: 'Alex Vance (Personal)',
    resourceCount: 27,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: 'active' as const,
    policy: {
      allowedUsers: ['usr_auren_942'],
      allowedRoles: ['lead' as const],
      allowedDepartments: ['Core Architecture'],
      allowAllOrg: false,
    },
  },
  {
    id: 'conn_slack',
    type: 'slack' as const,
    name: 'Slack Channels',
    scope: 'organization' as const,
    connected: true,
    account: 'auren-workspace.slack.com',
    resourceCount: 24,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'active' as const,
    policy: {
      allowedUsers: ['usr_auren_942', 'usr_org_admin'],
      allowedRoles: ['engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Core Architecture', 'Platform Engineering'],
      allowAllOrg: true,
    },
  },
  {
    id: 'conn_gmail',
    type: 'gmail' as const,
    name: 'Gmail Inbox',
    scope: 'personal' as const,
    connected: true,
    account: 'pramanbhogal13@gmail.com',
    resourceCount: 88,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'active' as const,
    policy: {
      allowedUsers: ['usr_auren_942'],
      allowedRoles: ['lead' as const],
      allowedDepartments: ['Core Architecture'],
      allowAllOrg: false,
    },
  },
  {
    id: 'conn_linear',
    type: 'linear' as const,
    name: 'Linear Issues & Cycles',
    scope: 'organization' as const,
    connected: true,
    account: 'linear.app/auren-labs',
    resourceCount: 164,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    status: 'active' as const,
    policy: {
      allowedUsers: ['usr_auren_942', 'usr_org_admin'],
      allowedRoles: ['engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Core Architecture', 'Product'],
      allowAllOrg: true,
    },
  },
  {
    id: 'conn_jira',
    type: 'jira' as const,
    name: 'Jira Software',
    scope: 'organization' as const,
    connected: true,
    account: 'auren-corp.atlassian.net',
    resourceCount: 312,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'active' as const,
    policy: {
      allowedUsers: ['usr_auren_942', 'usr_org_admin'],
      allowedRoles: ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Core Architecture', 'Security', 'QA'],
      allowAllOrg: true,
    },
  },
  {
    id: 'conn_figma',
    type: 'figma' as const,
    name: 'Figma Design Tokens & Specs',
    scope: 'organization' as const,
    connected: true,
    account: 'figma.com/@auren-design',
    resourceCount: 42,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: 'active' as const,
    policy: {
      allowedUsers: ['usr_auren_942'],
      allowedRoles: ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
      allowedDepartments: ['Product', 'Design', 'Core Architecture'],
      allowAllOrg: true,
    },
  },
  {
    id: 'conn_onedrive',
    type: 'onedrive' as const,
    name: 'Microsoft OneDrive Vault',
    scope: 'personal' as const,
    connected: true,
    account: 'praman.onedrive@live.com',
    resourceCount: 56,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    status: 'active' as const,
    policy: {
      allowedUsers: ['usr_auren_942'],
      allowedRoles: ['lead' as const],
      allowedDepartments: ['Core Architecture'],
      allowAllOrg: false,
    },
  },
];

let connectorDataItems: ConnectorDataItem[] = [
  // --- GitHub Enterprise (Organization) ---
  {
    id: 'cdata_gh_repo_1',
    connectorId: 'conn_github',
    connectorName: 'GitHub Enterprise',
    connectorType: 'github',
    title: 'auren-core/retrieval-service',
    itemType: 'repository',
    scope: 'organization',
    parentGroup: 'auren-core/retrieval-service',
    nestedPath: 'main',
    author: 'Alex Vance',
    syncedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'synced',
    sizeOrCount: '32 files • 1.8 MB',
    tags: ['Core Engine', 'Qdrant', 'RAG', 'TypeScript'],
    summary: 'Core decoupled retrieval and vector partition microservice powering semantic search and context synthesis.',
    externalUrl: 'https://github.com/auren-core/retrieval-service',
    metadata: {
      commitSha: '7f9a2e1',
      branch: 'main',
      labels: ['Production', 'Tier-1'],
    },
  },
  {
    id: 'cdata_gh_pr_142',
    connectorId: 'conn_github',
    connectorName: 'GitHub Enterprise',
    connectorType: 'github',
    title: 'PR #142: Decoupled Vector Retrieval Pipeline & Qdrant Sharding',
    itemType: 'pull_request',
    scope: 'organization',
    parentGroup: 'auren-core/retrieval-service',
    nestedPath: 'pulls/142',
    author: 'Elena Rostova',
    syncedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'synced',
    sizeOrCount: '+1,420 / -380 lines',
    tags: ['PR', 'Approved', 'Architecture'],
    summary: 'Refactors single-node vector indexing into partitioned Qdrant collections with strict tenant isolation and sub-40ms P99 latency.',
    externalUrl: 'https://github.com/auren-core/retrieval-service/pull/142',
    metadata: {
      branch: 'feat/qdrant-sharding',
      commitSha: '4c8901a',
      assignee: 'Elena Rostova',
      labels: ['Performance', 'Reviewed'],
    },
  },
  {
    id: 'cdata_gh_file_qdrant',
    connectorId: 'conn_github',
    connectorName: 'GitHub Enterprise',
    connectorType: 'github',
    title: 'src/vector/qdrant_client.ts',
    itemType: 'file',
    scope: 'organization',
    parentGroup: 'auren-core/retrieval-service',
    nestedPath: 'src/vector/qdrant_client.ts',
    author: 'Alex Vance',
    syncedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'synced',
    sizeOrCount: '480 lines • 16.4 KB',
    tags: ['TypeScript', 'Client', 'VectorDB'],
    summary: 'Low-latency async Qdrant REST/gRPC client featuring tenant boundary filters and automated cosine-distance recall.',
    externalUrl: 'https://github.com/auren-core/retrieval-service/blob/main/src/vector/qdrant_client.ts',
    metadata: {
      commitSha: '7f9a2e1',
      branch: 'main',
    },
  },
  {
    id: 'cdata_gh_repo_2',
    connectorId: 'conn_github',
    connectorName: 'GitHub Enterprise',
    connectorType: 'github',
    title: 'auren-core/security-policies',
    itemType: 'repository',
    scope: 'organization',
    parentGroup: 'auren-core/security-policies',
    nestedPath: 'main',
    author: 'Marcus Brody',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: 'synced',
    sizeOrCount: '16 files • 420 KB',
    tags: ['Security', 'OPA', 'RBAC', 'Compliance'],
    summary: 'Open Policy Agent (OPA) and Rego rules defining strict RBAC policies for documents, connectors, and conversational access.',
    externalUrl: 'https://github.com/auren-core/security-policies',
    metadata: {
      commitSha: '9b201f4',
      branch: 'main',
      labels: ['Infosec', 'Zero-Trust'],
    },
  },
  {
    id: 'cdata_gh_file_rego',
    connectorId: 'conn_github',
    connectorName: 'GitHub Enterprise',
    connectorType: 'github',
    title: 'policies/rbac_matrix.rego',
    itemType: 'file',
    scope: 'organization',
    parentGroup: 'auren-core/security-policies',
    nestedPath: 'policies/rbac_matrix.rego',
    author: 'Marcus Brody',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: 'synced',
    sizeOrCount: '210 lines • 7.8 KB',
    tags: ['Rego', 'AccessControl'],
    summary: 'Rule definition file that denies cross-tenant retrieval queries and enforces owner-only access on personal vaults.',
    externalUrl: 'https://github.com/auren-core/security-policies/blob/main/policies/rbac_matrix.rego',
    metadata: {
      commitSha: '9b201f4',
    },
  },

  // --- Google Drive (Organization) ---
  {
    id: 'cdata_gd_roadmap',
    connectorId: 'conn_gdrive',
    connectorName: 'Google Drive',
    connectorType: 'google_drive',
    title: 'Q2 Strategic Engineering Roadmap & Resource Allocation.gdoc',
    itemType: 'document',
    scope: 'organization',
    parentGroup: 'Executive & Strategic Planning',
    nestedPath: '2026/Roadmaps/Q2-Engineering.gdoc',
    author: 'Sarah Jenkins (VP Eng)',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'synced',
    sizeOrCount: '18 pages • Rev 6',
    tags: ['Strategy', 'Roadmap', 'OKRs', 'Executive'],
    summary: 'Executive roadmap committing to sub-100ms vector latency, hybrid personal/org context switching, and automated document intelligence.',
    externalUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZj_AUREN_Q2',
    metadata: {
      labels: ['Confidential', 'Leadership'],
    },
  },
  {
    id: 'cdata_gd_spec',
    connectorId: 'conn_gdrive',
    connectorName: 'Google Drive',
    connectorType: 'google_drive',
    title: 'System Architecture & Service Topology Spec v2.4.gdoc',
    itemType: 'document',
    scope: 'organization',
    parentGroup: 'Architecture Guild',
    nestedPath: 'Architecture/Topology-v2.4.gdoc',
    author: 'Alex Vance',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: 'synced',
    sizeOrCount: '24 pages • 8 diagrams',
    tags: ['Architecture', 'Specification', 'Vector Retrieval'],
    summary: 'Full specification for SSE token streaming, dual-tier tenant isolation, and BullMQ ingestion task pipelines.',
    externalUrl: 'https://docs.google.com/document/d/1Xy_Arch_Spec_v2_4',
  },
  {
    id: 'cdata_gd_matrix',
    connectorId: 'conn_gdrive',
    connectorName: 'Google Drive',
    connectorType: 'google_drive',
    title: 'Zero-Trust Document Access & Connector Policy Matrix.gsheet',
    itemType: 'document',
    scope: 'organization',
    parentGroup: 'Security & Compliance',
    nestedPath: 'Compliance/Access-Matrix-2026.gsheet',
    author: 'Marcus Brody',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'synced',
    sizeOrCount: '5 sheets • 180 rows',
    tags: ['Compliance', 'RBAC', 'Audit'],
    summary: 'Access control matrices mapping organizational roles (Admin, Lead, Engineer, Member) to connector ingestion boundaries.',
    externalUrl: 'https://docs.google.com/spreadsheets/d/1Matrix_RBAC_2026',
  },
  {
    id: 'cdata_gd_gpu',
    connectorId: 'conn_gdrive',
    connectorName: 'Google Drive',
    connectorType: 'google_drive',
    title: 'Infrastructure Capacity & GPU Allocation Model.gsheet',
    itemType: 'document',
    scope: 'organization',
    parentGroup: 'Platform Engineering',
    nestedPath: 'Infrastructure/GPU-Capacity-Q2.gsheet',
    author: 'Elena Rostova',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    status: 'synced',
    sizeOrCount: '3 sheets • 6 charts',
    tags: ['Cloud', 'Cost', 'GPU', 'Inference'],
    summary: 'Capacity modeling for on-premise H100 GPU clusters and fallback cloud endpoints for peak RAG synthesis loads.',
    externalUrl: 'https://docs.google.com/spreadsheets/d/1GPU_Cost_Model_Q2',
  },

  // --- Notion Workspace (Personal) ---
  {
    id: 'cdata_notion_scratchpad',
    connectorId: 'conn_notion',
    connectorName: 'Notion Workspace',
    connectorType: 'notion',
    title: 'Personal Architecture Scratchpad & LLM Latency Experiments',
    itemType: 'page',
    scope: 'personal',
    parentGroup: 'Personal Notes & Research',
    nestedPath: 'Research/Local-Inference-Notes',
    author: 'Praman Singh Bhogal',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: 'synced',
    sizeOrCount: '2,800 words • 14 code blocks',
    tags: ['Personal', 'Benchmarking', 'llama.cpp'],
    summary: 'Benchmarking observations on llama.cpp 4-bit quantized embeddings vs OpenAI text-embedding-3-small on memory-constrained nodes.',
    externalUrl: 'https://notion.so/praman/Architecture-Scratchpad-92a10',
    metadata: {
      labels: ['Draft', 'Private'],
    },
  },
  {
    id: 'cdata_notion_reading',
    connectorId: 'conn_notion',
    connectorName: 'Notion Workspace',
    connectorType: 'notion',
    title: 'Distributed Consensus & Vector Indexing Whitepapers Reading List',
    itemType: 'page',
    scope: 'personal',
    parentGroup: 'Reading & Continuous Learning',
    nestedPath: 'Reading/2026-Systems-Papers',
    author: 'Praman Singh Bhogal',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    status: 'synced',
    sizeOrCount: '32 items • 8 notes',
    tags: ['Personal', 'Research', 'Papers'],
    summary: 'Curated list of recent academic publications on HNSW index optimizations, graph-based RAG, and multi-tenant vector partitioning.',
    externalUrl: 'https://notion.so/praman/Systems-Papers-2026',
  },
  {
    id: 'cdata_notion_travel',
    connectorId: 'conn_notion',
    connectorName: 'Notion Workspace',
    connectorType: 'notion',
    title: 'Travel Itinerary & Tokyo Architecture Symposium 2026',
    itemType: 'page',
    scope: 'personal',
    parentGroup: 'Personal Travel & Logistics',
    nestedPath: 'Travel/2026-Tokyo-Symposium',
    author: 'Praman Singh Bhogal',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'synced',
    sizeOrCount: '4 sub-pages • Map anchors',
    tags: ['Personal', 'Travel', 'Tokyo', 'Conference'],
    summary: 'Personal travel itinerary, Shinkansen reservation numbers, hotel details in Roppongi, and technical conference talk outline.',
    externalUrl: 'https://notion.so/praman/Tokyo-Symposium-2026',
  },

  // --- Gmail Inbox (Personal) ---
  {
    id: 'cdata_gmail_ieee',
    connectorId: 'conn_gmail',
    connectorName: 'Gmail Inbox',
    connectorType: 'gmail',
    title: 'Registration Confirmation: IEEE Distributed RAG Symposium 2026',
    itemType: 'email',
    scope: 'personal',
    parentGroup: 'Conferences & Events',
    nestedPath: 'Inbox/IEEE-2026',
    author: 'IEEE Events Secretariat',
    syncedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'synced',
    sizeOrCount: 'Confirmed Pass • PDF attached',
    tags: ['Personal', 'Email', 'Events'],
    summary: 'Confirmation ticket and attendee barcode for the 2026 IEEE International Symposium on Distributed Retrieval-Augmented Generation.',
    externalUrl: 'https://mail.google.com/mail/u/0/#inbox/18fc890123',
  },
  {
    id: 'cdata_gmail_patent',
    connectorId: 'conn_gmail',
    connectorName: 'Gmail Inbox',
    connectorType: 'gmail',
    title: 'Patent Filing Status: Isolated Vector Partitioning for Multi-Tenant LLMs',
    itemType: 'email',
    scope: 'personal',
    parentGroup: 'Legal & Intellectual Property',
    nestedPath: 'Inbox/Patents/AUR-091',
    author: 'WilmerHale IP Counsel',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: 'synced',
    sizeOrCount: 'Notice of Allowance',
    tags: ['Personal', 'Patent', 'IP', 'Confidential'],
    summary: 'Formal communication regarding the provisional patent application for zero-leakage cross-tenant vector partitioning.',
    externalUrl: 'https://mail.google.com/mail/u/0/#inbox/18fc718291',
  },
  {
    id: 'cdata_gmail_ana',
    connectorId: 'conn_gmail',
    connectorName: 'Gmail Inbox',
    connectorType: 'gmail',
    title: 'Flight Itinerary & Terminal Confirmation - Tokyo Narita (NRT)',
    itemType: 'email',
    scope: 'personal',
    parentGroup: 'Travel Logistics',
    nestedPath: 'Inbox/Travel/ANA-842',
    author: 'All Nippon Airways Reservations',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    status: 'synced',
    sizeOrCount: 'E-Ticket NH 007 • Terminal 1',
    tags: ['Personal', 'Flight', 'Travel'],
    summary: 'Direct flight confirmation from SFO to NRT with seat assignment 12A and electronic boarding pass generation link.',
    externalUrl: 'https://mail.google.com/mail/u/0/#inbox/18fc628100',
  },

  // --- Slack Channels (Organization) ---
  {
    id: 'cdata_slack_arch',
    connectorId: 'conn_slack',
    connectorName: 'Slack Channels',
    connectorType: 'slack',
    title: '#arch-review: Consensus on local inference latency vs streaming throughput',
    itemType: 'message',
    scope: 'organization',
    parentGroup: '#arch-review',
    nestedPath: 'threads/p1710928192',
    author: 'Elena Rostova',
    syncedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'synced',
    sizeOrCount: '18 replies • 6 participants',
    tags: ['Architecture', 'Slack', 'Latency'],
    summary: 'Thread discussion concluding that local quantized model responses will use chunked streaming with 150ms time-to-first-token target.',
    externalUrl: 'https://auren-workspace.slack.com/archives/C05ARCH/p1710928192',
    metadata: {
      channel: '#arch-review',
    },
  },
  {
    id: 'cdata_slack_alerts',
    connectorId: 'conn_slack',
    connectorName: 'Slack Channels',
    connectorType: 'slack',
    title: '#platform-incidents: BullMQ queue memory threshold mitigation report',
    itemType: 'message',
    scope: 'organization',
    parentGroup: '#platform-incidents',
    nestedPath: 'threads/p1710920101',
    author: 'Platform Bot',
    syncedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    status: 'synced',
    sizeOrCount: '9 replies • Auto-resolved',
    tags: ['Incidents', 'BullMQ', 'Infrastructure'],
    summary: 'Automated post-incident resolution log: Ingestion task worker pod memory limits bumped from 2Gi to 4Gi to avoid OOM during PDF OCR.',
    externalUrl: 'https://auren-workspace.slack.com/archives/C05INC/p1710920101',
    metadata: {
      channel: '#platform-incidents',
    },
  },

  // --- Linear Issues & Cycles (Organization) ---
  {
    id: 'cdata_linear_aur104',
    connectorId: 'conn_linear',
    connectorName: 'Linear Issues & Cycles',
    connectorType: 'linear',
    title: 'AUR-104: Vector Index Quantization for Sub-50ms Recall',
    itemType: 'issue',
    scope: 'organization',
    parentGroup: 'Sprint 24: Core Retrieval',
    nestedPath: 'Cycles/Sprint-24/AUR-104',
    author: 'Alex Vance',
    syncedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    status: 'synced',
    sizeOrCount: 'Estimate: 5 pts • In Progress',
    tags: ['Linear', 'Sprint-24', 'Performance'],
    summary: 'Enable scalar quantization in Qdrant collections to cut RAM consumption by 70% while maintaining recall precision above 97%.',
    externalUrl: 'https://linear.app/auren-labs/issue/AUR-104',
    metadata: {
      issueKey: 'AUR-104',
      priority: 'Urgent',
      assignee: 'Alex Vance',
      labels: ['Engine', 'Qdrant'],
    },
  },
  {
    id: 'cdata_linear_aur118',
    connectorId: 'conn_linear',
    connectorName: 'Linear Issues & Cycles',
    connectorType: 'linear',
    title: 'AUR-118: Decouple SearXNG scrapers from live conversational loop',
    itemType: 'issue',
    scope: 'organization',
    parentGroup: 'Sprint 24: Core Retrieval',
    nestedPath: 'Cycles/Sprint-24/AUR-118',
    author: 'Elena Rostova',
    syncedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: 'synced',
    sizeOrCount: 'Estimate: 3 pts • Done',
    tags: ['Linear', 'WebSearch', 'Scraping'],
    summary: 'Route external web search queries through an asynchronous BullMQ queue with Redis caching to avoid blocking SSE streaming tokens.',
    externalUrl: 'https://linear.app/auren-labs/issue/AUR-118',
    metadata: {
      issueKey: 'AUR-118',
      priority: 'High',
      assignee: 'Elena Rostova',
      labels: ['Retriever', 'Done'],
    },
  },

  // --- Jira Software (Organization) ---
  {
    id: 'cdata_jira_sec402',
    connectorId: 'conn_jira',
    connectorName: 'Jira Software',
    connectorType: 'jira',
    title: 'SEC-402: Zero-trust token rotation daemon for cloud connectors',
    itemType: 'issue',
    scope: 'organization',
    parentGroup: 'Security Infrastructure',
    nestedPath: 'Boards/SEC/SEC-402',
    author: 'Marcus Brody',
    syncedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'synced',
    sizeOrCount: 'Story • Resolved',
    tags: ['Security', 'OAuth', 'Tokens'],
    summary: 'Daemon automatically rotates Google Drive and GitHub OAuth refresh tokens every 24 hours with audit logs recorded in Vault.',
    externalUrl: 'https://auren-corp.atlassian.net/browse/SEC-402',
    metadata: {
      issueKey: 'SEC-402',
      priority: 'High',
      assignee: 'Marcus Brody',
    },
  },

  // --- Microsoft OneDrive Vault (Personal) ---
  {
    id: 'cdata_onedrive_fin',
    connectorId: 'conn_onedrive',
    connectorName: 'Microsoft OneDrive Vault',
    connectorType: 'onedrive',
    title: 'Personal_Financial_Planning_2026.xlsx',
    itemType: 'file',
    scope: 'personal',
    parentGroup: 'Personal Vault',
    nestedPath: 'Finance/2026_Projections.xlsx',
    author: 'Praman Singh Bhogal',
    syncedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    status: 'synced',
    sizeOrCount: '4 sheets • 640 KB',
    tags: ['Personal', 'Spreadsheet', 'Finance'],
    summary: 'Private household budget, tech stock holdings, angel investments, and long-term retirement forecasts.',
    externalUrl: 'https://onedrive.live.com/view.aspx?resid=9124801!104',
  },
  {
    id: 'cdata_onedrive_lease',
    connectorId: 'conn_onedrive',
    connectorName: 'Microsoft OneDrive Vault',
    connectorType: 'onedrive',
    title: 'Apartment_Lease_Agreement_Signed.pdf',
    itemType: 'document',
    scope: 'personal',
    parentGroup: 'Personal Legal',
    nestedPath: 'RealEstate/Lease_2026.pdf',
    author: 'Praman Singh Bhogal',
    syncedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'synced',
    sizeOrCount: '12 pages • 1.2 MB',
    tags: ['Personal', 'Lease', 'Legal'],
    summary: 'Executed residential lease contract with building rules, parking space assignment, and deposit confirmation.',
    externalUrl: 'https://onedrive.live.com/view.aspx?resid=9124801!105',
  },
];

let chatConversations: ChatConversation[] = [
  {
    id: 'conv_q2_arch_review',
    title: 'Q2 Architecture Review',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    scope: 'organization' as const,
    pinned: true,
    attachedDocuments: [
      { id: 'doc_prod_req_01', title: 'Product Requirements.pdf', type: 'pdf' as const },
      { id: 'doc_arch_001', title: 'AUREN System Architecture & Service Topology', type: 'markdown' as const },
    ],
    messages: [
      {
        id: 'msg_q2_1',
        role: 'user' as const,
        content: 'What are the three most critical delivery targets outlined in our Q2 Architecture and Product Requirements?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'msg_q2_2',
        role: 'assistant' as const,
        content: `Based on [Product Requirements.pdf] and [AUREN System Architecture], here are the three primary delivery targets for Q2:

### 1. Dual-Tier Knowledge Boundaries (Zero-Trust Enforcement)
- Strict cryptographic isolation between private owner vaults (\`scope: 'personal'\`) and department-scoped organizational knowledge (\`scope: 'organization'\`).
- Tenant-level Qdrant payload filters that eliminate unauthorized cross-scope retrieval prior to vector cosine ranking.
- All documents enforce fine-grained Document Access Policies before any vector comparison begins [Product Requirements.pdf].

### 2. Automatic Document Intelligence
- Zero-latency asynchronous parsing pipeline extracting Executive Summaries, Key Topics, Referenced Technologies, Named Entities, and Structural Sections immediately upon ingestion.
- Built-in overview generation without manual tagging or schema configuration.

### 3. Grounded Source Traceability & Web Citations
- Every assistant response must preserve direct bidirectional provenance back to exact document sections, GitHub commits, and verified external technical references [AUREN System Architecture].
- Decoupled ingestion pipeline guaranteeing byte-level citation precision and verifiable evidence verification.`,
        timestamp: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
        groundingScope: 'organization' as const,
        sources: [
          {
            id: 'src_q2_1',
            type: 'internal_document' as const,
            title: 'Product Requirements.pdf',
            scope: 'organization' as const,
            documentId: 'doc_prod_req_01',
            snippet: 'Section 1: Dual-Tier Knowledge Isolation\nSection 2: Automatic Document Intelligence',
            confidence: 0.99,
            timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          },
          {
            id: 'src_q2_2',
            type: 'internal_document' as const,
            title: 'AUREN System Architecture',
            scope: 'organization' as const,
            documentId: 'doc_arch_001',
            snippet: 'Section 1: Retrieval Service\nSection 2: Qdrant Cluster Isolation',
            confidence: 0.96,
            timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          },
        ],
        webSuggestions: [
          {
            title: 'Qdrant Vector Database Architecture - Multitenant Filtering & Payload Indexing',
            url: 'https://qdrant.tech/documentation/concepts/filtering/',
            domain: 'qdrant.tech',
            snippet: 'Payload indexing optimizes payload schema checks before HNSW graph traversal, keeping zero-trust boundary verification sub-millisecond.',
          },
          {
            title: 'Kubernetes Pod Security Standards & Dual-Scope Vault Isolation',
            url: 'https://kubernetes.io/docs/concepts/security/pod-security-standards/',
            domain: 'kubernetes.io',
            snippet: 'Hardened namespace isolation parameters aligning cryptographic owner vault separation with node-affinity scheduling.',
          },
          {
            title: 'Zero-Trust Architecture NIST Special Publication 800-207',
            url: 'https://csrc.nist.gov/publications/detail/sp/800-207/final',
            domain: 'csrc.nist.gov',
            snippet: 'Enterprise zero-trust model establishing per-session dynamic access decisions at the moment of document retrieval.',
          },
        ],
        orgImages: [
          {
            id: 'img_arch_topo',
            title: 'AUREN System Architecture & Service Topology Diagram',
            caption: 'Service mesh layout, zero-trust Qdrant vector retrieval service, and bidirectional connector sync workers.',
            imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&auto=format&fit=crop&q=80',
            sourceDocId: 'doc_arch_001',
            sourceDocTitle: 'AUREN System Architecture & Service Topology',
            dimensions: '1920 × 1080 • Vector Topology Schematic',
          },
          {
            id: 'img_rbac_matrix',
            title: 'Organizational RBAC & Department Clearance Flowchart',
            caption: 'Hierarchical clearance matrix gating Senior, Junior, Intern, and Trainee access across department boundaries.',
            imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80',
            sourceDocId: 'doc_sec_002',
            sourceDocTitle: 'Zero-Trust Document Access & Connector Policy',
            dimensions: '1600 × 900 • Clearance Decision Flow',
          },
        ],
        suggestedFollowUps: [
          'What are the latency budgets for Qdrant payload filtering?',
          'How does GitHub webhook sync trigger incremental re-indexing?',
        ],
      },
    ],
  },
  {
    id: 'conv_today_01',
    title: 'Dual-tier knowledge isolation & Qdrant partitioning',
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    scope: 'organization' as const,
    attachedDocuments: [
      { id: 'doc_arch_001', title: 'AUREN System Architecture & Service Topology', type: 'markdown' as const },
      { id: 'doc_sec_002', title: 'Zero-Trust Document Access & Connector Policy', type: 'spec' as const },
    ],
    messages: [
      {
        id: 'msg_1',
        role: 'user' as const,
        content:
          'How does AUREN prevent personal document contents from leaking into organization-wide queries when both are indexed?',
        timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      },
      {
        id: 'msg_2',
        role: 'assistant' as const,
        content: `AUREN guarantees absolute isolation between Personal and Organization knowledge through a dual-key payload filtering mechanism in Qdrant combined with cryptographic boundary enforcement:

1. **Partitioned Ingestion Envelopes**: Personal documents are tagged strictly with \`scope: 'personal'\` and bound to your cryptographic \`ownerId\`. They are never colocated with organization-scoped vectors in shared query namespaces.

2. **Zero-Trust Retrieval Filtering**: Every search query payload contains an immutable filter predicate:
\`\`\`json
{
  "must": [
    { "key": "scope", "match": { "value": "organization" } },
    { "key": "department", "match": { "any": userDepartments } }
  ]
}
\`\`\`
Unless the user explicitly asks inside an authorized personal vault context, personal vectors are mathematically excluded before any cosine similarity comparison begins.

3. **Context Packing Sanitization**: During LLM context construction, the context assembler verifies each chunk against active session authorization claims. If a chunk lacks explicit clearance, it is immediately dropped before token generation.`,
        timestamp: new Date(Date.now() - 1000 * 60 * 49).toISOString(),
        groundingScope: 'organization' as const,
        sources: [
          {
            id: 'src_1',
            type: 'internal_document' as const,
            title: 'AUREN System Architecture & Service Topology',
            scope: 'organization' as const,
            documentId: 'doc_arch_001',
            snippet:
              'Section 2: Dual-Tier Knowledge Isolation. Personal documents remain encrypted under owner-derived keys while organization documents strictly adhere to DocumentAccessPolicy role matrices.',
            confidence: 0.98,
            timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          },
          {
            id: 'src_2',
            type: 'internal_document' as const,
            title: 'Zero-Trust Document Access & Connector Policy',
            scope: 'organization' as const,
            documentId: 'doc_sec_002',
            snippet:
              'Connector Ingestion Envelopes: Every incoming resource from GitHub or Drive receives an immutable organizationId and department whitelist before entering Qdrant.',
            confidence: 0.95,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          },
        ],
        suggestedFollowUps: [
          'Can a personal document ever be shared with an organization team?',
          'What happens during a GitHub webhook push if repository permissions change?',
          'Explain the difference between DocumentAccessPolicy and ConnectorPolicy.',
        ],
      },
    ],
  },
  {
    id: 'conv_today_02',
    title: 'Sliding window chunking algorithm in chunker.ts',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    scope: 'organization' as const,
    attachedDocuments: [{ id: 'doc_github_004', title: 'retrieval-service/src/pipeline/chunker.ts', type: 'code' as const }],
    messages: [
      {
        id: 'msg_3',
        role: 'user' as const,
        content: 'Explain how chunker.ts handles markdown heading boundaries without breaking code blocks.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: 'msg_4',
        role: 'assistant' as const,
        content: `In \`chunker.ts\`, the \`SemanticChunker\` employs an AST-aware token budgeting pipeline:

- **AST Boundary Detection**: Rather than splitting naively on character counts, it parses markdown and code blocks into logical syntax nodes using Tree-sitter.
- **Fenced Block Protection**: Multi-line code fences (\`\`\`) are treated as atomic units. If a code block fits within the maximum 512-token boundary, it is preserved intact. If it exceeds 512 tokens, it is split on function declarations rather than arbitrary lines.
- **Header Context Prefixing**: When a heading initiates a new chunk, the breadcrumb trail (e.g., \`# Architecture > ## Ingestion\`) is prepended to child chunks to preserve hierarchical context in Qdrant embeddings.`,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        groundingScope: 'organization' as const,
        sources: [
          {
            id: 'src_3',
            type: 'github' as const,
            title: 'retrieval-service/src/pipeline/chunker.ts',
            repo: 'auren-core/retrieval-service',
            commitSha: '7f9a2e1',
            snippet: 'AST-aware boundary splits with 15% sliding overlap and header breadcrumb retention.',
            confidence: 0.99,
          },
        ],
        suggestedFollowUps: ['What is the token overlap ratio?', 'How are PDF tables handled during extraction?'],
      },
    ],
  },
  {
    id: 'conv_yesterday_01',
    title: 'Research review: Latent graphs vs vector buffers',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    scope: 'personal' as const,
    attachedDocuments: [
      { id: 'doc_personal_001', title: 'Research Notes: Autonomous Agent Memory & Latent Graphs', type: 'markdown' as const },
    ],
    messages: [
      {
        id: 'msg_5',
        role: 'user' as const,
        content: 'Summarize my notes on episodic memory decay curves.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      },
      {
        id: 'msg_6',
        role: 'assistant' as const,
        content: `Based on your research notes in **Autonomous Agent Memory & Latent Graphs**:

Your hypothesis identifies that a purely recency-weighted linear buffer fails after extended interactions due to conversational drift. You modeled an exponential decay curve coupled with an entity recurrence multiplier:

$$R(e) = e^{-\\lambda \\Delta t} \\times (1 + \\alpha \\cdot \\text{frequency}(e))$$

Where:
- $\\lambda$ represents conversational session decay
- $\\alpha$ rewards cross-session conceptual recurrence
- Critical anchors that maintain connections to verified knowledge documents are elevated to the permanent semantic graph tier, completely bypassing working memory decay.`,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        groundingScope: 'personal' as const,
        sources: [
          {
            id: 'src_4',
            type: 'internal_document' as const,
            title: 'Research Notes: Autonomous Agent Memory & Latent Graphs',
            scope: 'personal' as const,
            documentId: 'doc_personal_001',
            snippet: 'Section 1: Hierarchical Memory Layers and exponential decay multipliers for long-term recall.',
            confidence: 0.97,
          },
        ],
      },
    ],
  },
];

let notifications: NotificationItem[] = [
  {
    id: 'notif_1',
    type: 'document_ready' as const,
    title: 'Document Ready',
    description: 'AUREN System Architecture & Service Topology indexed with 42 chunks',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    read: false,
    entityId: 'doc_arch_001',
    entityType: 'document' as const,
  },
  {
    id: 'notif_2',
    type: 'github_sync' as const,
    title: 'GitHub Sync Completed',
    description: 'Repository auren-core/retrieval-service synced 32 files on commit 7f9a2e1',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    read: false,
    entityId: 'conn_github',
    entityType: 'connector' as const,
  },
  {
    id: 'notif_3',
    type: 'permission_updated' as const,
    title: 'Connector Policy Updated',
    description: 'Marcus Brody updated commit verification policy for GitHub Enterprise',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: true,
    entityId: 'conn_github',
    entityType: 'connector' as const,
  },
];

// ----------------------------------------------------
// API Endpoints
// ----------------------------------------------------

// User & Preferences
app.get('/api/me', (req: Request, res: Response) => {
  res.json(currentUser);
});

// Authentication & Personas
app.get('/api/auth/personas', (req: Request, res: Response) => {
  res.json(PERSONAS);
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { personaId, email } = req.body;
  let found = PERSONAS.find((p) => p.id === personaId || p.email === email);
  if (!found && email) {
    found = PERSONAS.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }
  if (!found) {
    found = PERSONAS[0]; // fallback
  }
  currentUser = found;
  res.json({ success: true, user: currentUser });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/switch-persona', (req: Request, res: Response) => {
  const { personaId } = req.body;
  const found = PERSONAS.find((p) => p.id === personaId);
  if (found) {
    currentUser = found;
    res.json({ success: true, user: currentUser });
  } else {
    res.status(404).json({ error: 'Persona not found' });
  }
});

// Departments Registry
app.get('/api/departments', (req: Request, res: Response) => {
  res.json(departments);
});

// Super Admin Department Actions & Notifications to Department Heads
app.post('/api/departments/:id/action', (req: Request, res: Response) => {
  const dept = departments.find((d) => d.id === req.params.id);
  if (!dept) {
    res.status(404).json({ error: 'Department not found' });
    return;
  }

  const { actionType, title, message, newHeadId, newStatus, newSubfields } = req.body;
  const actionTitle = title || `Administrative Directive on ${dept.name}`;
  const actionDesc = message || `Super Admin updated access policies for ${dept.name}`;

  if (newStatus) dept.status = newStatus;
  if (newSubfields && Array.isArray(newSubfields)) dept.subfields = newSubfields;
  if (newHeadId) {
    const newHeadPersona = PERSONAS.find((p) => p.id === newHeadId);
    if (newHeadPersona) {
      dept.head = {
        id: newHeadPersona.id,
        name: newHeadPersona.name,
        email: newHeadPersona.email,
        avatarUrl: newHeadPersona.avatarUrl,
        title: newHeadPersona.title,
      };
    }
  }

  dept.lastUpdatedByAdmin = new Date().toISOString();
  dept.lastAdminAction = actionTitle;

  // 1. Record in Super Admin Audit Log
  const auditItem = {
    id: `sa_act_${Date.now()}`,
    actionType: actionType || ('broadcast_directive' as const),
    targetDepartment: dept.name,
    title: actionTitle,
    description: actionDesc,
    executedBy: `${currentUser.name} (Super Admin)`,
    timestamp: new Date().toISOString(),
    notifiedHeads: [`${dept.head.name} (${dept.name})`],
    acknowledged: false,
  };
  superAdminAuditLog.unshift(auditItem);

  // 2. CRITICAL: Automatically Notify the Department Head!
  const notifItem = {
    id: `notif_sa_${Date.now()}`,
    type: 'super_admin_action' as const,
    title: `👑 Super Admin Action: ${actionTitle}`,
    description: `${currentUser.name} (Super Admin) executed an action on ${dept.name}: "${actionDesc}". Department clearance has been synchronized.`,
    timestamp: new Date().toISOString(),
    read: false,
    entityId: dept.id,
    entityType: 'department' as const,
    priority: 'high' as const,
    actor: {
      name: currentUser.name,
      role: 'Super Admin',
      avatarUrl: currentUser.avatarUrl,
    },
  };
  notifications.unshift(notifItem);

  res.json({ success: true, department: dept, notification: notifItem, auditItem });
});

// Super Admin Broadcast Directive to All or Multiple Department Heads
app.post('/api/super-admin/broadcast', (req: Request, res: Response) => {
  const { title, message, targetDepartmentIds = [] } = req.body;
  const broadcastTitle = title || 'Enterprise Security Directive';
  const broadcastMessage = message || 'Super Admin published a mandatory enterprise compliance update.';

  const targetDepts = targetDepartmentIds.length > 0
    ? departments.filter((d) => targetDepartmentIds.includes(d.id))
    : departments;

  const notifiedNames: string[] = [];

  // Dispatch individual notification to each Department Head
  targetDepts.forEach((dept) => {
    notifiedNames.push(`${dept.head.name} (${dept.name})`);
    dept.lastUpdatedByAdmin = new Date().toISOString();
    dept.lastAdminAction = broadcastTitle;

    notifications.unshift({
      id: `notif_broad_${dept.id}_${Date.now()}`,
      type: 'super_admin_action' as const,
      title: `👑 Super Admin Directive: ${broadcastTitle}`,
      description: `${currentUser.name} (Super Admin) broadcasted to ${dept.name}: "${broadcastMessage}"`,
      timestamp: new Date().toISOString(),
      read: false,
      entityId: dept.id,
      entityType: 'department' as const,
      priority: 'high' as const,
      actor: {
        name: currentUser.name,
        role: 'Super Admin',
        avatarUrl: currentUser.avatarUrl,
      },
    });
  });

  const auditItem = {
    id: `sa_broad_${Date.now()}`,
    actionType: 'broadcast_directive' as const,
    targetDepartment: targetDepartmentIds.length > 0 ? targetDepts.map((d) => d.name).join(', ') : 'All Departments',
    title: broadcastTitle,
    description: broadcastMessage,
    executedBy: `${currentUser.name} (Super Admin)`,
    timestamp: new Date().toISOString(),
    notifiedHeads: notifiedNames,
    acknowledged: false,
  };
  superAdminAuditLog.unshift(auditItem);

  res.json({ success: true, notifiedCount: targetDepts.length, notifiedHeads: notifiedNames, auditItem });
});

// Super Admin Audit Log
app.get('/api/super-admin/audit-log', (req: Request, res: Response) => {
  res.json(superAdminAuditLog);
});

// Super Admin Enterprise Knowledge Base: Create Enterprise Directive Document
app.post('/api/super-admin/enterprise-docs', (req: Request, res: Response) => {
  const { title, filename, content, summary, notifyDepartmentHeads = true } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const newDocId = `doc_enterprise_${Date.now()}`;
  const effectiveFilename = filename || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;

  const newEnterpriseDoc: AurenDocument = {
    id: newDocId,
    title,
    filename: effectiveFilename,
    type: effectiveFilename.endsWith('.pdf') ? 'pdf' : 'spec',
    scope: 'enterprise',
    knowledgeTier: 'enterprise',
    department: 'Global / All Departments',
    isEnterpriseSuperOrg: true,
    managedByRole: 'super_admin',
    source: 'direct_upload',
    fileSize: `${(Math.random() * 2 + 1).toFixed(1)} MB`,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    status: 'ready',
    statusDetail: 'Published by Super Admin to Enterprise Knowledge Base',
    rawContent: content,
    accessPolicy: {
      ownerId: currentUser.id,
      ownerName: `${currentUser.name} (Super Admin)`,
      scope: 'organization',
      allowedRoles: ['member', 'engineer', 'lead', 'admin', 'super_admin', 'dept_head'],
      allowedDepartments: departments.map((d) => d.name),
      minSubgroupLevel: 'trainee',
      isRestricted: false,
    },
    versionHistory: [
      {
        version: 'v1.0.0',
        timestamp: new Date().toISOString(),
        author: currentUser.name,
        changeSummary: 'Initial publication to Enterprise Knowledge Base by Super Admin.',
      },
    ],
    activityLog: [
      {
        id: `act_${Date.now()}`,
        action: 'Enterprise Document Published',
        user: `${currentUser.name} (Super Admin)`,
        timestamp: new Date().toISOString(),
        details: 'Ratified organization-wide directive in Super-Organizational Vault.',
      },
    ],
    intelligence: {
      documentType: 'Super-Organizational Directive',
      executiveSummary: summary || `Master enterprise directive published by ${currentUser.name}. Establishes organization-wide compliance and architectural benchmarks.`,
      keyTopics: ['Enterprise Directive', 'Super-Organizational Governance', 'Compliance Baseline'],
      readingTimeMinutes: 6,
      technologies: ['Zero-Trust', 'Enterprise Vault', 'AUREN Gateway'],
      entities: ['EnterpriseDirective', 'SuperAdminController'],
      aiTags: ['Enterprise', 'Super-Organizational', 'Policy'],
      documentPurpose: 'Company-wide directive governing all departmental operations and compliance standards.',
      importantSections: [
        {
          title: 'Mandate & Scope',
          summary: summary || 'Applies to all departments and personnel across the organization.',
          page: 1,
        },
      ],
      pageCount: 6,
    },
  };

  documents.unshift(newEnterpriseDoc);

  // Notify Department Heads if requested
  if (notifyDepartmentHeads) {
    const headNames: string[] = [];
    departments.forEach((dept) => {
      headNames.push(`${dept.head.name} (${dept.name})`);
      dept.lastUpdatedByAdmin = new Date().toISOString();
      dept.lastAdminAction = `New Enterprise Directive: ${title}`;

      notifications.unshift({
        id: `notif_ent_${dept.id}_${Date.now()}`,
        type: 'super_admin_action' as const,
        title: `👑 New Enterprise Directive Published: ${title}`,
        description: `${currentUser.name} (Super Admin) published a new document to the Enterprise Knowledge Base. Please review impact on ${dept.name}.`,
        timestamp: new Date().toISOString(),
        read: false,
        entityId: newEnterpriseDoc.id,
        entityType: 'document' as const,
        priority: 'high' as const,
        actor: {
          name: currentUser.name,
          role: 'Super Admin',
          avatarUrl: currentUser.avatarUrl,
        },
      });
    });

    superAdminAuditLog.unshift({
      id: `sa_ent_pub_${Date.now()}`,
      actionType: 'publish_enterprise_doc',
      targetDepartment: 'All Departments',
      title: `Published Enterprise Directive: ${title}`,
      description: `Document added to Enterprise Knowledge Base. Dispatched notifications to ${headNames.length} Department Heads.`,
      executedBy: `${currentUser.name} (Super Admin)`,
      timestamp: new Date().toISOString(),
      notifiedHeads: headNames,
      acknowledged: false,
    });
  }

  res.status(201).json(newEnterpriseDoc);
});

app.put('/api/me/preferences', (req: Request, res: Response) => {
  const { theme, defaultScope, defaultChatBehavior, realtimeSync, notifyOnDocumentReady, notifyOnConnectorSync } = req.body;
  if (theme) currentUser.preferences.theme = theme;
  if (defaultScope) currentUser.preferences.defaultScope = defaultScope;
  if (defaultChatBehavior) currentUser.preferences.defaultChatBehavior = defaultChatBehavior;
  if (typeof realtimeSync === 'boolean') currentUser.preferences.realtimeSync = realtimeSync;
  if (typeof notifyOnDocumentReady === 'boolean') currentUser.preferences.notifyOnDocumentReady = notifyOnDocumentReady;
  if (typeof notifyOnConnectorSync === 'boolean') currentUser.preferences.notifyOnConnectorSync = notifyOnConnectorSync;
  res.json(currentUser.preferences);
});

// Documents List with Multi-Tier Scope Filtering
app.get('/api/documents', (req: Request, res: Response) => {
  const scope = req.query.scope as string;
  const department = req.query.department as string;
  const search = (req.query.search as string || '').toLowerCase();

  let filtered = documents;

  // Multi-tier scope filtering
  if (scope && scope !== 'all') {
    if (scope === 'personal') {
      filtered = filtered.filter((d) => d.scope === 'personal');
    } else if (scope === 'enterprise') {
      filtered = filtered.filter((d) => d.scope === 'enterprise' || d.knowledgeTier === 'enterprise' || d.isEnterpriseSuperOrg);
    } else if (scope === 'departmental') {
      filtered = filtered.filter((d) => d.knowledgeTier === 'departmental' || (d.scope === 'organization' && !d.isEnterpriseSuperOrg));
    } else if (scope === 'organization') {
      filtered = filtered.filter((d) => d.scope === 'organization' || d.knowledgeTier === 'departmental' || d.scope === 'enterprise');
    }
  }

  // Department filtering
  if (department && department !== 'all') {
    filtered = filtered.filter((d) => d.department === department || d.accessPolicy?.allowedDepartments?.includes(department));
  }

  if (search) {
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(search) ||
        d.filename.toLowerCase().includes(search) ||
        d.department?.toLowerCase().includes(search) ||
        d.intelligence?.keyTopics.some((t) => t.toLowerCase().includes(search))
    );
  }

  res.json(filtered);
});

// Document Details
app.get('/api/documents/:id', (req: Request, res: Response) => {
  const doc = documents.find((d) => d.id === req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.json(doc);
});

// Document Upload & Ingestion Simulation
app.post('/api/documents/upload', (req: Request, res: Response) => {
  const { title, filename, content, scope, type, accessPolicy } = req.body;

  if (!title || !filename) {
    res.status(400).json({ error: 'Title and filename are required' });
    return;
  }

  const docScope = scope === 'organization' ? 'organization' : 'personal';
  const docType = type || (filename.endsWith('.pdf') ? 'pdf' : filename.endsWith('.ts') ? 'code' : 'markdown');
  const newId = `doc_${Date.now()}`;

  const newDoc = {
    id: newId,
    title,
    filename,
    type: docType,
    scope: docScope as 'personal' | 'organization',
    source: 'direct_upload' as const,
    fileSize: `${Math.max(120, Math.round((content?.length || 5000) / 1024))} KB`,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    status: 'uploading' as const,
    statusDetail: 'Receiving file buffer and hashing content',
    accessPolicy: accessPolicy
      ? {
          ownerId: currentUser.id,
          ownerName: currentUser.name,
          scope: docScope as 'personal' | 'organization',
          allowedRoles: accessPolicy.allowedRoles !== undefined ? accessPolicy.allowedRoles : ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
          allowedDepartments: accessPolicy.allowedDepartments !== undefined ? accessPolicy.allowedDepartments : [currentUser.department],
          allowedSubgroups: accessPolicy.allowedSubgroups !== undefined ? accessPolicy.allowedSubgroups : ['senior' as const, 'mid_senior' as const, 'junior' as const, 'intern' as const, 'trainee' as const],
          minSubgroupLevel: accessPolicy.minSubgroupLevel !== undefined ? accessPolicy.minSubgroupLevel : 'trainee',
          allowedSubfields: accessPolicy.allowedSubfields !== undefined ? accessPolicy.allowedSubfields : [],
          allowedDomains: accessPolicy.allowedDomains !== undefined ? accessPolicy.allowedDomains : [],
          allowedSpecificMembers: accessPolicy.allowedSpecificMembers !== undefined ? accessPolicy.allowedSpecificMembers : [],
          isRestricted: accessPolicy.isRestricted ?? (docScope === 'personal'),
        }
      : {
          ownerId: currentUser.id,
          ownerName: currentUser.name,
          scope: docScope as 'personal' | 'organization',
          allowedRoles: ['member' as const, 'engineer' as const, 'lead' as const, 'admin' as const],
          allowedDepartments: [currentUser.department],
          allowedSubgroups: ['senior' as const, 'mid_senior' as const, 'junior' as const, 'intern' as const, 'trainee' as const],
          minSubgroupLevel: 'trainee' as const,
          allowedSubfields: [],
          allowedDomains: [],
          allowedSpecificMembers: [],
          isRestricted: docScope === 'personal',
        },
    versionHistory: [
      {
        version: 'v1.0',
        timestamp: new Date().toISOString(),
        author: currentUser.name,
        changeSummary: 'Initial document upload',
      },
    ],
    activityLog: [
      {
        id: `act_${Date.now()}`,
        action: 'Uploaded',
        user: currentUser.name,
        timestamp: new Date().toISOString(),
        details: 'Uploaded directly via knowledge workspace',
      },
    ],
    rawContent: content || `Contents of ${title}.\n\nDocument ingested into AUREN knowledge platform.`,
    intelligence: {
      documentType: docType === 'code' ? 'Source Code' : docType === 'pdf' ? 'Technical Report' : 'Knowledge Document',
      executiveSummary: `Synthesized intelligence for ${title}. Document has been extracted, analyzed for structural concepts, and integrated into the ${docScope} knowledge space.`,
      keyTopics: ['Knowledge Ingestion', 'Retrieval Grounding', docScope === 'personal' ? 'Personal Notes' : 'Team Standards'],
      readingTimeMinutes: Math.max(3, Math.round((content?.length || 3000) / 1200)),
      technologies: ['AUREN VLM', 'Qdrant Embeddings'],
      entities: [title, currentUser.name, currentUser.organization.name],
      aiTags: [docScope, docType, 'Ingested'],
      documentPurpose: `Provides reference material for ${currentUser.department} operations.`,
      importantSections: [
        {
          title: 'Core Concepts',
          summary: 'Fundamental axioms and references identified during vector extraction.',
          page: 1,
        },
      ],
      pageCount: docType === 'pdf' ? 5 : 2,
      headingsCount: 6,
      tablesCount: 1,
    },
  };

  documents.unshift(newDoc);

  // Simulate real processing lifecycle steps without reload
  setTimeout(() => {
    const d = documents.find((item) => item.id === newId);
    if (d) {
      d.status = 'extracting';
      d.statusDetail = 'Extracting structural hierarchy and text boundaries';
    }
  }, 1200);

  setTimeout(() => {
    const d = documents.find((item) => item.id === newId);
    if (d) {
      d.status = 'building_knowledge';
      d.statusDetail = 'Computing embeddings and indexing in Qdrant';
    }
  }, 3200);

  setTimeout(() => {
    const d = documents.find((item) => item.id === newId);
    if (d) {
      d.status = 'ready';
      d.statusDetail = 'Ready for search and grounded conversation';

      // Push notification
      notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'document_ready',
        title: 'Document Ready',
        description: `${title} has completed processing and is ready for queries.`,
        timestamp: new Date().toISOString(),
        read: false,
        entityId: newId,
        entityType: 'document',
      });
    }
  }, 6000);

  res.status(201).json(newDoc);
});

// Update Document & Access Policy
app.put('/api/documents/:id', (req: Request, res: Response) => {
  const index = documents.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  const { title, content, scope, type, accessPolicy } = req.body;
  const doc = documents[index];
  if (title) doc.title = title;
  if (content !== undefined) doc.rawContent = content;
  if (type) doc.type = type;
  if (scope) {
    doc.scope = scope;
    if (doc.accessPolicy) doc.accessPolicy.scope = scope;
  }
  if (accessPolicy) {
    doc.accessPolicy = {
      ...doc.accessPolicy,
      ...accessPolicy,
      scope: doc.scope,
    };
  }
  doc.updatedAt = new Date().toISOString();
  if (doc.versionHistory) {
    doc.versionHistory.unshift({
      version: `v1.${doc.versionHistory.length + 1}`,
      timestamp: new Date().toISOString(),
      author: currentUser.name,
      changeSummary: 'Document metadata & clearance policy updated',
    });
  }
  if (doc.activityLog) {
    doc.activityLog.unshift({
      id: `act_${Date.now()}`,
      action: 'Clearance Updated',
      user: currentUser.name,
      timestamp: new Date().toISOString(),
      details: 'Updated department clearance policy, subfields, and individual member exceptions',
    });
  }

  res.json(doc);
});

// Delete Document
app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const index = documents.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  documents.splice(index, 1);
  res.json({ success: true, id: req.params.id });
});

// Connectors List
app.get('/api/connectors', (req: Request, res: Response) => {
  res.json(connectors);
});

// Sync Connector
app.post('/api/connectors/:id/sync', (req: Request, res: Response) => {
  const conn = connectors.find((c) => c.id === req.params.id);
  if (!conn) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }

  conn.status = 'syncing';

  setTimeout(() => {
    conn.status = 'active';
    conn.lastSyncAt = new Date().toISOString();
    if (conn.githubDetails && conn.githubDetails.repositories.length > 0) {
      const repo = conn.githubDetails.repositories[0];
      const newSha = Math.random().toString(16).substring(2, 9);
      repo.lastCommitSha = newSha;
      repo.lastCommitMessage = 'chore: automated synchronization commit';
      repo.lastSyncAt = new Date().toISOString();
      conn.githubDetails.lastWebhookEvent = {
        event: 'sync',
        repo: repo.fullName,
        commitSha: newSha,
        timestamp: new Date().toISOString(),
      };
    }

    notifications.unshift({
      id: `notif_${Date.now()}`,
      type: 'github_sync',
      title: `${conn.name} Synced`,
      description: `Synchronized resources for ${conn.name}. All vector partitions updated.`,
      timestamp: new Date().toISOString(),
      read: false,
      entityId: conn.id,
      entityType: 'connector',
    });
  }, 2000);

  res.json({ success: true, message: 'Sync scheduled' });
});

// Update Connector Policy
app.put('/api/connectors/:id/policy', (req: Request, res: Response) => {
  const conn = connectors.find((c) => c.id === req.params.id);
  if (!conn) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }
  const { allowedRoles, allowedDepartments, allowAllOrg } = req.body;
  if (allowedRoles) conn.policy.allowedRoles = allowedRoles;
  if (allowedDepartments) conn.policy.allowedDepartments = allowedDepartments;
  if (typeof allowAllOrg === 'boolean') conn.policy.allowAllOrg = allowAllOrg;

  notifications.unshift({
    id: `notif_${Date.now()}`,
    type: 'permission_updated',
    title: 'Connector Policy Updated',
    description: `Access policy updated for ${conn.name}`,
    timestamp: new Date().toISOString(),
    read: false,
    entityId: conn.id,
    entityType: 'connector',
  });

  res.json(conn.policy);
});

// Connector Synced Data Resources List & Nested Filtering
app.get('/api/connectors/data', (req: Request, res: Response) => {
  const scope = req.query.scope as string;
  const connectorId = req.query.connectorId as string;
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const type = req.query.type as string;
  const status = req.query.status as string;
  const sort = (req.query.sort as string) || 'synced_desc';

  let results = [...connectorDataItems];

  // 1. Filter by Personal / Organizational Scope
  if (scope && scope !== 'all') {
    results = results.filter((item) => item.scope === scope);
  }

  // 2. Filter by Connector
  if (connectorId && connectorId !== 'all') {
    results = results.filter((item) => item.connectorId === connectorId);
  }

  // 3. Filter by Resource Type
  if (type && type !== 'all') {
    results = results.filter((item) => item.itemType === type);
  }

  // 4. Filter by Status
  if (status && status !== 'all') {
    results = results.filter((item) => item.status === status);
  }

  // 5. Search text filter
  if (search) {
    results = results.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(search);
      const matchParent = item.parentGroup.toLowerCase().includes(search);
      const matchPath = (item.nestedPath || '').toLowerCase().includes(search);
      const matchAuthor = item.author.toLowerCase().includes(search);
      const matchSummary = item.summary.toLowerCase().includes(search);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(search));
      const matchMeta = item.metadata?.commitSha?.toLowerCase().includes(search) ||
        item.metadata?.issueKey?.toLowerCase().includes(search);
      return matchTitle || matchParent || matchPath || matchAuthor || matchSummary || matchTags || matchMeta;
    });
  }

  // 6. Sorting
  results.sort((a, b) => {
    switch (sort) {
      case 'synced_asc':
        return new Date(a.syncedAt).getTime() - new Date(b.syncedAt).getTime();
      case 'name_asc':
        return a.title.localeCompare(b.title);
      case 'name_desc':
        return b.title.localeCompare(a.title);
      case 'connector':
        return a.connectorName.localeCompare(b.connectorName);
      case 'type':
        return a.itemType.localeCompare(b.itemType);
      case 'synced_desc':
      default:
        return new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime();
    }
  });

  res.json(results);
});

// Single Connector Data Item Sync
app.post('/api/connectors/data/:id/sync', (req: Request, res: Response) => {
  const item = connectorDataItems.find((d) => d.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Connector data item not found' });
    return;
  }

  item.status = 'syncing';
  const updatedTime = new Date().toISOString();

  setTimeout(() => {
    item.status = 'synced';
    item.syncedAt = updatedTime;
    if (item.metadata?.commitSha) {
      item.metadata.commitSha = Math.random().toString(16).substring(2, 9);
    }
  }, 1200);

  res.json({ success: true, item });
});

// Chat Conversations List
app.get('/api/chat/conversations', (req: Request, res: Response) => {
  res.json(chatConversations);
});

// Get Specific Conversation
app.get('/api/chat/conversations/:id', (req: Request, res: Response) => {
  const conv = chatConversations.find((c) => c.id === req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json(conv);
});

// Delete Conversation
app.delete('/api/chat/conversations/:id', (req: Request, res: Response) => {
  const index = chatConversations.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  chatConversations.splice(index, 1);
  res.json({ success: true });
});

// Update Conversation (Rename, Pin/Unpin)
app.patch('/api/chat/conversations/:id', (req: Request, res: Response) => {
  const conv = chatConversations.find((c) => c.id === req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  const { title, pinned } = req.body;
  if (typeof title === 'string' && title.trim()) {
    conv.title = title.trim();
  }
  if (typeof pinned === 'boolean') {
    conv.pinned = pinned;
  }
  conv.updatedAt = new Date().toISOString();
  res.json(conv);
});

// Start or continue SSE chat stream
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const { conversationId, query, attachedDocumentIds, scope = 'organization', searchWeb = false } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Find or create conversation
  let conv = chatConversations.find((c) => c.id === conversationId);
  if (!conv) {
    conv = {
      id: `conv_${Date.now()}`,
      title: query.length > 40 ? query.substring(0, 38) + '...' : query,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scope: (scope === 'personal' ? 'personal' : 'organization') as any,
      attachedDocuments: [],
      messages: [],
    };
    chatConversations.unshift(conv);
  }

  // Attach requested documents if any
  if (attachedDocumentIds && Array.isArray(attachedDocumentIds)) {
    for (const docId of attachedDocumentIds) {
      const doc = documents.find((d) => d.id === docId);
      if (doc && !conv.attachedDocuments?.some((ad) => ad.id === doc.id)) {
        conv.attachedDocuments = conv.attachedDocuments || [];
        conv.attachedDocuments.push({ id: doc.id, title: doc.title, type: doc.type });
      }
    }
  }

  // Push user message
  const userMessageId = `msg_${Date.now()}_u`;
  conv.messages.push({
    id: userMessageId,
    role: 'user',
    content: query,
    timestamp: new Date().toISOString(),
    attachedDocumentIds,
  });

  const assistantMessageId = `msg_${Date.now()}_a`;

  // Determine relevant document sources based on query and attached documents
  const matchingDocs = documents.filter((doc) => {
    if (attachedDocumentIds?.includes(doc.id)) return true;
    if (scope !== 'all' && doc.scope !== scope) return false;
    const qLower = query.toLowerCase();
    return (
      doc.title.toLowerCase().includes(qLower) ||
      doc.intelligence?.keyTopics.some((t) => qLower.includes(t.toLowerCase())) ||
      doc.filename.toLowerCase().includes(qLower)
    );
  });

  const relevantDocs = matchingDocs.length > 0 ? matchingDocs.slice(0, 3) : documents.slice(0, 2);

  const citations: SourceCitation[] = relevantDocs.map((doc, idx) => ({
    id: `cit_${idx}_${Date.now()}`,
    type: (doc.source === 'github' ? 'github' : 'internal_document') as any,
    title: doc.title,
    scope: (doc.scope === 'personal' ? 'personal' : 'organization') as 'personal' | 'organization',
    documentId: doc.id,
    repo: doc.sourceMetadata?.repo,
    commitSha: doc.sourceMetadata?.commitSha,
    snippet:
      doc.intelligence?.executiveSummary?.slice(0, 180) ||
      doc.rawContent?.slice(0, 180) ||
      'Verified content from grounded knowledge base.',
    confidence: Number((0.95 - idx * 0.04).toFixed(2)),
    timestamp: doc.updatedAt,
  }));

  // If searchWeb is requested, add a validated web citation
  if (searchWeb) {
    citations.push({
      id: `cit_web_${Date.now()}`,
      type: 'web' as any,
      title: `SearXNG Verified: Knowledge Engineering Standards`,
      snippet: 'External validation from verified public engineering indices and specifications.',
      confidence: 0.91,
      sourceUrl: 'https://arxiv.org/abs/2312.10997',
      timestamp: new Date().toISOString(),
    });
  }

  // Web link suggestions like ChatGPT/Grok
  const webSuggestions = [
    {
      title: 'Qdrant Multitenant Vector Partitioning & Payload Indexing',
      url: 'https://qdrant.tech/documentation/concepts/filtering/',
      domain: 'qdrant.tech',
      snippet: 'High-throughput payload indexing isolates zero-trust tenant namespaces before graph traversal.',
    },
    {
      title: 'Kubernetes Pod Security Standards & Dual-Scope Vault Isolation',
      url: 'https://kubernetes.io/docs/concepts/security/pod-security-standards/',
      domain: 'kubernetes.io',
      snippet: 'Hardened namespace isolation parameters aligning cryptographic owner vault separation.',
    },
    {
      title: 'Zero-Trust Architecture Guidelines (NIST SP 800-207)',
      url: 'https://csrc.nist.gov/publications/detail/sp/800-207/final',
      domain: 'csrc.nist.gov',
      snippet: 'Enterprise zero-trust model establishing dynamic per-session access decisions.',
    },
  ];

  // Images from ORG Knowledge Base
  const orgImages = [
    {
      id: `img_topo_${Date.now()}`,
      title: 'AUREN Retrieval & Service Topology',
      caption: 'Zero-trust Qdrant vector retrieval service, SSE streaming bus, and webhook workers.',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&auto=format&fit=crop&q=80',
      sourceDocId: relevantDocs[0]?.id || 'doc_arch_001',
      sourceDocTitle: relevantDocs[0]?.title || 'AUREN System Architecture & Service Topology',
      dimensions: '1920 × 1080 • System Schematic',
    },
  ];

  // Send conversation info event
  res.write(`data: ${JSON.stringify({ type: 'init', conversationId: conv.id, messageId: assistantMessageId, citations, webSuggestions, orgImages })}\n\n`);

  // Stream content: attempt Gemini API if key is set; otherwise stream high-quality grounded synthesis
  const gemini = getGeminiClient();
  let accumulatedContent = '';

  if (gemini) {
    try {
      const docContext = relevantDocs
        .map((d) => `[DOCUMENT: ${d.title} (Scope: ${d.scope})]\n${d.rawContent || d.intelligence?.executiveSummary}`)
        .join('\n\n');

      const prompt = `You are AUREN, an intelligent, calm, and mathematically precise Knowledge Assistant and Research Workspace.
Answer the user query based on the following grounded internal knowledge documents and context.
Tone: Apple + Linear + Perplexity elegance. Concise, objective, direct, and free of hype or unnecessary fluff. Use Markdown formatting. If citing facts, reference the documents naturally.

Knowledge Context:
${docContext}

Query: ${query}`;

      const responseStream = await gemini.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          accumulatedContent += text;
          res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`);
        }
      }
    } catch (geminiError) {
      console.warn('Gemini stream failed, falling back to deterministic grounded synthesis:', geminiError);
    }
  }

  // Fallback if no Gemini client or if error occurred
  if (!accumulatedContent) {
    const docTitles = relevantDocs.map((d) => `**${d.title}**`).join(' and ');
    const primaryDoc = relevantDocs[0];

    const paragraphs = [
      `Based on knowledge indexed in ${docTitles || 'your verified knowledge workspace'}:\n\n`,
      `The knowledge retrieved from **${primaryDoc?.title || 'System Architecture'}** confirms that the retrieval pipeline enforces strict boundaries. `,
      `${primaryDoc?.intelligence?.executiveSummary || 'Relevant parameters are evaluated against the active security envelope before answering.'}\n\n`,
      `Key aspects identified for your query:\n`,
      `• **Scope Isolation**: Retrieved under **${scope.toUpperCase()}** scope constraints without cross-boundary leakage.\n`,
      `• **Grounding Confidence**: Grounded against ${citations.length} primary source citations with cryptographic provenance.\n`,
      `• **Structural Units**: Evaluated structural AST boundaries and confirmed compliance with current workspace policies.`,
    ];

    for (const paragraph of paragraphs) {
      for (const word of paragraph.split(' ')) {
        const token = word + ' ';
        accumulatedContent += token;
        res.write(`data: ${JSON.stringify({ type: 'token', text: token })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
  }

  // Suggest follow up questions
  const followUps = [
    `How does this relate to ${relevantDocs[0]?.title || 'our architectural guidelines'}?`,
    `Can we export or share these source citations?`,
    `Show the underlying commit SHA and access policy rules.`,
  ];

  res.write(`data: ${JSON.stringify({ type: 'follow_ups', followUps })}\n\n`);
  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  res.end();

  // Persist assistant message
  conv.messages.push({
    id: assistantMessageId,
    role: 'assistant',
    content: accumulatedContent,
    timestamp: new Date().toISOString(),
    groundingScope: scope as any,
    sources: citations,
    webSuggestions,
    orgImages,
    suggestedFollowUps: followUps,
  });
  conv.updatedAt = new Date().toISOString();
});

// Universal Search
app.get('/api/search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const scope = req.query.scope as string;
  const typeFilter = req.query.type as string;

  if (!query) {
    res.json({ results: [] });
    return;
  }

  const results: any[] = [];

  // 1. Search Documents
  documents.forEach((doc) => {
    if (scope && scope !== 'all' && doc.scope !== scope) return;
    if (typeFilter && typeFilter !== 'all' && doc.type !== typeFilter) return;

    const inTitle = doc.title.toLowerCase().includes(query);
    const inTopics = doc.intelligence?.keyTopics.some((t) => t.toLowerCase().includes(query));
    const inSummary = doc.intelligence?.executiveSummary.toLowerCase().includes(query);

    if (inTitle || inTopics || inSummary) {
      results.push({
        id: `sr_doc_${doc.id}`,
        title: doc.title,
        snippet: doc.intelligence?.executiveSummary.slice(0, 160) || doc.filename,
        type: doc.type === 'code' ? 'code' : 'document',
        scope: doc.scope,
        sourceName: doc.source === 'github' ? doc.sourceMetadata?.repo || 'GitHub' : 'Knowledge Library',
        updatedAt: doc.updatedAt,
        documentId: doc.id,
      });
    }
  });

  // 2. Search Conversations
  chatConversations.forEach((conv) => {
    if (scope && scope !== 'all' && conv.scope !== scope) return;
    const inTitle = conv.title.toLowerCase().includes(query);
    const matchedMsg = conv.messages.find((m) => m.content.toLowerCase().includes(query));

    if (inTitle || matchedMsg) {
      results.push({
        id: `sr_conv_${conv.id}`,
        title: conv.title,
        snippet: matchedMsg ? matchedMsg.content.slice(0, 150) + '...' : 'Conversation thread in AUREN chat',
        type: 'conversation',
        scope: conv.scope,
        sourceName: 'Chat History',
        updatedAt: conv.updatedAt,
      });
    }
  });

  res.json({ query, results, total: results.length });
});

// Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(notifications);
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = notifications.find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req: Request, res: Response) => {
  notifications.forEach((n) => (n.read = true));
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'AUREN Knowledge Assistant',
    version: '2.4.0',
    modelProvider: 'llama.cpp & Gemini Hybrid Gateway',
    database: 'PostgreSQL / Qdrant Vector Engine',
  });
});

// ----------------------------------------------------
// Vite Development Middleware or Production Static
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AUREN Knowledge Workspace server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
