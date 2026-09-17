import type {
  MeetingTranscriptEntry,
  MeetingAgentAnalysis,
  ArchitectureReviewResult,
  KnowledgeAuditResult,
  OrganizationalMemoryTrace,
  OrganizationalMemoryNode,
  OrganizationalMemoryConnection,
} from '../types/agents';
import type { CollaborationMeeting } from '../types/collaboration';


// ============================================================================
// 1. MEETING AGENT DATA & GENERATOR
// ============================================================================

export const MOCK_MEETING_TRANSCRIPTS: Record<string, MeetingTranscriptEntry[]> = {
  meet_eng_alignment: [
    {
      id: 't_eng_01',
      speakerId: 'usr_marcus_203',
      speakerName: 'Marcus Vance',
      speakerRole: 'Senior Infrastructure Engineer',
      speakerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Platform Engineering',
      timestamp: '00:01',
      text: 'Thanks for jumping in Chloe. Let us focus on the edge Nginx ingress buffer sizing. Under yesterday peak telemetry bursts, worker nodes were saturating their ring buffers.',
    },
    {
      id: 't_eng_02',
      speakerId: 'usr_chloe_204',
      speakerName: 'Chloe Zhang',
      speakerRole: 'Junior Backend Developer',
      speakerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Platform Engineering',
      timestamp: '00:45',
      text: 'I looked at the client metrics. When the buffer drops packets, browsers initiate rapid reconnections simultaneously, creating a thundering herd against the SSE proxy.',
    },
    {
      id: 't_eng_03',
      speakerId: 'usr_marcus_203',
      speakerName: 'Marcus Vance',
      speakerRole: 'Senior Infrastructure Engineer',
      speakerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Platform Engineering',
      timestamp: '02:15',
      text: 'Right. So our primary decision today: we need to expand the shared memory ring buffer from 16MB to 64MB per Cloud Run worker container.',
      linkedCitation: { title: 'High-Throughput Stream Ingestion Engine', docId: 'doc_eng_003' },
    },
    {
      id: 't_eng_04',
      speakerId: 'usr_chloe_204',
      speakerName: 'Chloe Zhang',
      speakerRole: 'Junior Backend Developer',
      speakerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Platform Engineering',
      timestamp: '03:40',
      text: 'Agreed. And on the client side, I will enforce exponential jittered backoff from 1 second up to 30 seconds to suppress reconnect spikes.',
    },
    {
      id: 't_eng_05',
      speakerId: 'usr_marcus_203',
      speakerName: 'Marcus Vance',
      speakerRole: 'Senior Infrastructure Engineer',
      speakerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Platform Engineering',
      timestamp: '05:10',
      text: 'Perfect. Let us push the config patch to the West staging cluster immediately. That leaves one open question: do we need kernel socket tuning if concurrency hits 50k?',
    },
  ],
  meet_arch_review: [
    {
      id: 't_arch_01',
      speakerId: 'usr_praman_101',
      speakerName: 'Praman Singh Bhogal',
      speakerRole: 'Head of Architecture & Engineering',
      speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Core Architecture',
      timestamp: '00:05',
      text: 'Welcome everyone to the Architecture Review for Distributed Consensus & Qdrant Retrieval Sharding. We have Elena Vance from Security and Marcus from Platform.',
    },
    {
      id: 't_arch_02',
      speakerId: 'usr_elena_202',
      speakerName: 'Elena Rostova',
      speakerRole: 'Principal Systems Architect',
      speakerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Core Architecture',
      timestamp: '01:20',
      text: 'Our benchmark results confirm that partitioning Qdrant collection segments by tenant ID reduces p99 query latency by 38% compared to monolithic clustering.',
      linkedCitation: { title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine', docId: 'doc_arch_001' },
    },
    {
      id: 't_arch_03',
      speakerId: 'usr_super_admin_elena',
      speakerName: 'Elena Vance',
      speakerRole: 'Super Admin & CISO',
      speakerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Executive Security & Governance',
      timestamp: '03:10',
      text: 'From a compliance standpoint, tenant sharding is mandatory for SOC2 Type II. However, Security Policy #12 forbids unauthenticated public API access during ingestion. Every shard replica must use hardware HMAC authentication.',
      linkedCitation: { title: 'Zero-Trust Document Access & Connector Policy', docId: 'doc_sec_002' },
    },
    {
      id: 't_arch_04',
      speakerId: 'usr_marcus_203',
      speakerName: 'Marcus Vance',
      speakerRole: 'Senior Infrastructure Engineer',
      speakerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Platform Engineering',
      timestamp: '05:30',
      text: 'We can deploy the staging canary with hardware-bound HMAC verification at 15:00 PST. Chloe and I will monitor memory usage and connection retention.',
    },
    {
      id: 't_arch_05',
      speakerId: 'usr_praman_101',
      speakerName: 'Praman Singh Bhogal',
      speakerRole: 'Head of Architecture & Engineering',
      speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Core Architecture',
      timestamp: '07:45',
      text: 'Consensus is reached. We ratify tenant-level sharding, mandate HMAC verification, and assign the staging deployment canary to Marcus.',
    },
  ],
  meet_sec_policy_audit: [
    {
      id: 't_sec_01',
      speakerId: 'usr_super_admin_elena',
      speakerName: 'Elena Vance',
      speakerRole: 'Super Admin & CISO',
      speakerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Executive Security & Governance',
      timestamp: '00:10',
      text: 'We are auditing the API gateway security boundary against Security Policy #12. Some proposed connectors have been requesting unauthenticated webhook ingress.',
    },
    {
      id: 't_sec_02',
      speakerId: 'usr_aarav_205',
      speakerName: 'Aarav Patel',
      speakerRole: 'Lead Security Auditor',
      speakerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      speakerDept: 'Security & Compliance',
      timestamp: '01:50',
      text: 'Under our strict RBAC policy, zero anonymous routes are allowed. All incoming payloads must carry signed JWT tokens with 15-minute rotation.',
      linkedCitation: { title: 'Zero-Trust Enterprise Vault & Multi-Dept RBAC Specification', docId: 'doc_sec_002' },
    },
  ],
};

export const MOCK_MEETING_ANALYSES: Record<string, MeetingAgentAnalysis> = {
  meet_eng_alignment: {
    executiveSummary:
      'Platform engineering evaluated edge Nginx ingress buffer capacities and mitigation strategies for SSE telemetry connection retention. The team determined that high-concurrency client reconnections were inducing ring buffer exhaustion. The group finalized a 64MB buffer expansion and exponential backoff implementation.',
    keyDecisions: [
      {
        id: 'kd_eng_01',
        title: 'Provision 64MB Shared Memory Ring Buffer per Cloud Run Worker',
        context:
          'Default 16MB ring buffers were saturating under peak concurrent telemetry streams, causing edge drops.',
        evidence: 'Marcus Vance at 02:15: "Expand shared memory ring buffer from 16MB to 64MB per worker container."',
        evidenceDocId: 'doc_eng_003',
      },
      {
        id: 'kd_eng_02',
        title: 'Mandate Exponential Jittered Client Reconnect Backoff',
        context:
          'Dropping SSE connections triggered concurrent browser retries, leading to thundering-herd spikes on ingress.',
        evidence: 'Chloe Zhang at 03:40: "Enforce exponential jittered backoff from 1 second up to 30 seconds."',
      },
    ],
    actionItems: [
      {
        id: 'ma_eng_01',
        task: 'Deploy Nginx config update across West staging node',
        owner: 'Marcus Vance',
        ownerDepartment: 'Platform Engineering',
        dueDate: 'Today, 5:00 PM',
        priority: 'High',
      },
      {
        id: 'ma_eng_02',
        task: 'Verify client retry behavior in browser DevTools test suite',
        owner: 'Chloe Zhang',
        ownerDepartment: 'Platform Engineering',
        dueDate: 'Sep 11, 2026',
        priority: 'Medium',
      },
    ],
    openQuestions: [
      'Will kernel-level socket queue tuning be necessary if concurrent client connections exceed 50,000?',
      'Should SSE heartbeats be adjusted from 15s to 30s to reduce intermediate packet volume?',
    ],
    risks: [
      {
        risk: 'Memory footprint increase on lower-tier Cloud Run instances',
        severity: 'Medium',
        mitigation: 'Set container minimum RAM reservation to 1GB per replica before rolling out to production.',
      },
      {
        risk: 'Client timeouts behind strict enterprise corporate proxies',
        severity: 'Low',
        mitigation: 'Implement fallback HTTP long-polling if SSE connection handshake fails 3 consecutive times.',
      },
    ],
    referencedKnowledge: [
      {
        id: 'doc_eng_003',
        title: 'High-Throughput Stream Ingestion Engine',
        type: 'spec',
        snippet: 'Nginx edge ingress configuration & shared buffer architecture for sub-50ms vector stream dispatch.',
      },
      {
        id: 'doc_arch_001',
        title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine',
        type: 'markdown',
        snippet: 'Section 4: SSE streaming protocol and reactive subscriber event bus topology.',
      },
    ],
    analyzedAt: 'Sep 8, 2026 • 03:05 PM PST',
  },
  meet_arch_review: {
    executiveSummary:
      'The Architecture Council convened to review Qdrant vector retrieval sharding and zero-trust cross-tenant isolation. Benchmark evaluations proved a 38% reduction in p99 vector query latency using tenant-keyed collection segments. Security confirmed compliance with SOC2 Type II under mandatory HMAC replica signing.',
    keyDecisions: [
      {
        id: 'kd_arch_01',
        title: 'Adopt Tenant-Level Qdrant Collection Partitioning',
        context:
          'Monolithic vector indices caused query cross-talk and latency jitter during parallel organization search queries.',
        evidence: 'Elena Rostova at 01:20: "Partitioning Qdrant collection segments by tenant ID reduces p99 query latency by 38%."',
        evidenceDocId: 'doc_arch_001',
      },
      {
        id: 'kd_arch_02',
        title: 'Enforce Hardware HMAC Verification on Shard Replicas',
        context:
          'Security Policy #12 requires authenticated cryptographic verification across all vector transport boundaries.',
        evidence: 'Elena Vance at 03:10: "Security Policy #12 forbids unauthenticated public API access... Every shard replica must use hardware HMAC."',
        evidenceDocId: 'doc_sec_002',
      },
    ],
    actionItems: [
      {
        id: 'ma_arch_01',
        task: 'Deploy Qdrant tenant sharding canary on staging cluster',
        owner: 'Marcus Vance',
        ownerDepartment: 'Platform Engineering',
        dueDate: 'Today, 03:00 PM',
        priority: 'High',
      },
      {
        id: 'ma_arch_02',
        task: 'Benchmark p99 query latency under 100 concurrent SSE sessions',
        owner: 'Chloe Zhang',
        ownerDepartment: 'Platform Engineering',
        dueDate: 'Sep 10, 2026',
        priority: 'Medium',
      },
    ],
    openQuestions: [
      'What is the re-indexing rebalancing cost when an enterprise tenant doubles in document volume?',
      'Can AVX-512 cosine quantization be leveraged on arm64 Graviton instances without performance regression?',
    ],
    risks: [
      {
        risk: 'Cross-tenant memory leakage on replica node failover',
        severity: 'High',
        mitigation: 'Zero-trust HMAC authentication keys and isolated kernel namespaces per tenant segment.',
      },
      {
        risk: 'Index build delay during bulk document upload bursts',
        severity: 'Medium',
        mitigation: 'Asynchronous buffer queue with tiered chunk compaction in background worker pools.',
      },
    ],
    referencedKnowledge: [
      {
        id: 'doc_arch_001',
        title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine',
        type: 'markdown',
        snippet: 'Vector collection sharding benchmarks and consensus specifications.',
      },
      {
        id: 'doc_sec_002',
        title: 'Zero-Trust Document Access & Connector Policy',
        type: 'spec',
        snippet: 'Security Policy #12: Cryptographic validation and tenant network boundary isolation.',
      },
      {
        id: 'doc_github_004',
        title: 'retrieval-service/src/pipeline/chunker.ts',
        type: 'code',
        snippet: 'Vector chunking pipeline and tenant metadata injection logic.',
      },
    ],
    analyzedAt: 'Today • 05:45 PM PST',
  },
};

export function generateMeetingAnalysis(meeting: CollaborationMeeting): MeetingAgentAnalysis {
  if (MOCK_MEETING_ANALYSES[meeting.id]) {
    return MOCK_MEETING_ANALYSES[meeting.id];
  }

  // Dynamic synthesis fallback for any new or custom meeting
  return {
    executiveSummary: `AUREN Meeting Agent analyzed "${meeting.title}" involving ${meeting.participants.length} participants from ${meeting.department || 'the organization'}. Discussion covered agenda targets and ratified operational consensus grounded in attached knowledge documents.`,
    keyDecisions: [
      {
        id: `kd_${meeting.id}_01`,
        title: `Consensus on ${meeting.agenda[0] || meeting.title}`,
        context: `Evaluated operational tradeoffs based on discussion during ${meeting.scheduledTime}.`,
        evidence: `Referenced meeting notes and consensus ratified by ${meeting.participants[0]?.name || 'Department Lead'}.`,
        evidenceDocId: meeting.attachedDocumentIds[0],
      },
    ],
    actionItems: meeting.participants.slice(0, 2).map((p, i) => ({
      id: `ma_${meeting.id}_0${i + 1}`,
      task: i === 0 ? `Implement ratified changes for ${meeting.title}` : `Verify staging metrics and document outcomes`,
      owner: p.name,
      ownerDepartment: p.department,
      dueDate: 'Friday, 5:00 PM',
      priority: i === 0 ? 'High' : 'Medium',
    })),
    openQuestions: [
      'Are additional department stakeholders required before production deployment?',
      'Does this decision require an updated security compliance certification?',
    ],
    risks: [
      {
        risk: 'Schedule slip if dependent architectural milestones are delayed',
        severity: 'Medium',
        mitigation: 'Establish bi-weekly sync checks and automated alerting.',
      },
    ],
    referencedKnowledge: (meeting.attachedDocumentIds || []).map((id) => ({
      id,
      title: id === 'doc_arch_001' ? 'AUREN System Architecture & Service Topology' : id === 'doc_sec_002' ? 'Zero-Trust Document Access Policy' : `Document ${id}`,
      type: 'markdown',
      snippet: 'Grounding knowledge artifact referenced during speaker consensus deliberation.',
    })),
    analyzedAt: 'Just now • Verified by AUREN Meeting Agent',
  };
}

// ============================================================================
// 2. ARCHITECTURE REVIEWER AGENT DATA & SIMULATION
// ============================================================================

export const MOCK_ARCHITECTURE_REVIEWS: Record<string, ArchitectureReviewResult> = {
  doc_arch_001: {
    documentId: 'doc_arch_001',
    documentTitle: 'AUREN System Architecture & Multi-Tenant Retrieval Engine v4',
    overallStatus: 'CONFLICT',
    statusSummary:
      'Architecture Proposal v4 introduces high-performance vector sharding, but contains 1 critical policy conflict regarding unauthenticated API webhook ingress and 1 operational concern regarding ring-buffer sizing.',
    findings: [
      {
        id: 'f_01',
        type: 'conflict',
        title: 'Security Policy #12 Conflict: Unauthenticated Webhook Ingress',
        description:
          'The proposal specifies public HTTP endpoints for external connector webhooks. However, Security Policy #12 dictates that all external network ingress must terminate through authenticated mutual TLS (mTLS) or signed HMAC tokens with maximum 15-minute rotation.',
        evidence: [
          {
            type: 'policy',
            id: 'doc_sec_002',
            title: 'Security Policy #12 (Zero-Trust Document Access & Connector Policy)',
            snippet: 'Rule 12.4: External connector webhooks MUST enforce mutual TLS or signed HMAC credentials. Public anonymous ingress is strictly prohibited.',
          },
          {
            type: 'document',
            id: 'doc_arch_001',
            title: 'Architecture Proposal v4 (Section 3.2)',
            snippet: 'Inbound webhooks accept raw JSON payloads over public HTTPS on port 443 with path-based routing.',
          },
          {
            type: 'decision',
            id: 'dec_002',
            title: 'Decision #042 (Zero-Trust Rotation Schedule)',
            snippet: 'Ratified Sep 9, 2026: Enforce hardware-bound credentials and eliminate unauthenticated edge listeners.',
          },
        ],
      },
      {
        id: 'f_02',
        type: 'concern',
        title: 'Platform Concern: Ring Buffer Memory Saturation Under Burst',
        description:
          'Streaming telemetry during continuous vector re-indexing risks exhausting default container memory thresholds if concurrent SSE listeners exceed 10,000.',
        evidence: [
          {
            type: 'meeting',
            id: 'meet_eng_alignment',
            title: 'Platform Engineering Alignment (Sep 8, 2026)',
            snippet: 'Marcus Vance confirmed 16MB ring buffers dropped packets during peak ingestion bursts.',
          },
          {
            type: 'discussion',
            id: 'dept_eng_general',
            title: '#dept_eng_general Discussion Thread',
            snippet: 'Telemetry thread: "Worker nodes saturating memory under 10k connections without 64MB buffer allocation."',
          },
        ],
      },
      {
        id: 'f_03',
        type: 'alignment',
        title: 'Architecture Alignment: Tenant-Level Qdrant Sharding Schema',
        description:
          'The partitioned collection topology strictly complies with organizational Decision #001 and satisfies tenant isolation requirements for SOC2 Type II.',
        evidence: [
          {
            type: 'decision',
            id: 'dec_001',
            title: 'Decision #001 (Vector Collection Sharding Strategy)',
            snippet: 'Partition Qdrant collection segments strictly by organization tenant ID with AVX-512 quantization.',
          },
          {
            type: 'meeting',
            id: 'meet_arch_review',
            title: 'Architecture Review: Distributed Consensus (Today)',
            snippet: 'Praman Singh Bhogal ratified 38% reduction in p99 vector latency.',
          },
        ],
      },
    ],
    risks: [
      {
        id: 'r_01',
        title: 'Security vulnerability from unauthenticated edge webhook endpoint',
        severity: 'High',
        impact: 'Exposes ingestion pipeline to potential denial-of-service and unvetted payload poisoning.',
      },
      {
        id: 'r_02',
        title: 'Cluster memory starvation during multi-tenant re-indexing jobs',
        severity: 'Medium',
        impact: 'May trigger Kubernetes OOM-kill on worker nodes without 64MB ring buffer patch.',
      },
    ],
    recommendations: [
      'Refactor Section 3.2 of the proposal to route all webhook payloads through the mTLS Enterprise Gateway.',
      'Adopt Decision #001 tenant-level partition keys across all Qdrant collection schemas.',
      'Incorporate the 64MB shared memory ring buffer update ratified in the Platform Engineering Alignment.',
    ],
    reviewedAt: 'Today • Analyzed by AUREN Architecture Reviewer',
    analyzedAgainst: {
      relatedDocs: 3,
      policies: 4,
      decisions: 3,
      discussions: 12,
      meetings: 2,
    },
  },
  doc_eng_003: {
    documentId: 'doc_eng_003',
    documentTitle: 'High-Throughput Stream Ingestion Engine RFC',
    overallStatus: 'APPROVED',
    statusSummary:
      'The High-Throughput Stream Ingestion Engine specification demonstrates complete alignment with core engineering policies, approved SSE standards (Decision #003), and zero-trust certificate requirements.',
    findings: [
      {
        id: 'f_eng_01',
        type: 'alignment',
        title: 'Full Compliance with Decision #003 (SSE Envelope Standard)',
        description: 'Implementation adopts RFC 8895 SSE streaming with standardized JSON envelope tokens for token, citation, and done markers.',
        evidence: [
          {
            type: 'decision',
            id: 'dec_003',
            title: 'Decision #003 (Unified SSE Streaming Format)',
            snippet: 'Standardize all AI completion endpoints on RFC 8895 SSE streaming.',
          },
        ],
      },
      {
        id: 'f_eng_02',
        type: 'alignment',
        title: 'Buffer Expansion Validated by Platform Alignment Meeting',
        description: 'Configured 64MB dedicated shared memory ring buffers prevent packet drop under high-burst telemetry streams.',
        evidence: [
          {
            type: 'meeting',
            id: 'meet_eng_alignment',
            title: 'Ingress Proxy & Nginx Edge Optimization Alignment',
            snippet: 'Ratified Sep 8: Provision 64MB dedicated shared memory ring buffers per container.',
          },
        ],
      },
    ],
    risks: [
      {
        id: 'r_eng_01',
        title: 'Slight latency increase under cold-start container initialization',
        severity: 'Low',
        impact: 'Initial handshake may take up to 120ms during first container boot.',
      },
    ],
    recommendations: [
      'Maintain automated canary validation in West staging cluster prior to production promotion.',
    ],
    reviewedAt: 'Yesterday • Analyzed by AUREN Architecture Reviewer',
    analyzedAgainst: {
      relatedDocs: 2,
      policies: 3,
      decisions: 2,
      discussions: 6,
      meetings: 1,
    },
  },
  doc_sec_002: {
    documentId: 'doc_sec_002',
    documentTitle: 'Zero-Trust Enterprise Vault & Multi-Dept RBAC Specification',
    overallStatus: 'APPROVED',
    statusSummary:
      'Foundational security policy document ratified by CISO Elena Vance. Establishes baseline rules for hardware tokens, cryptographic access, and inter-departmental document isolation.',
    findings: [
      {
        id: 'f_sec_01',
        type: 'alignment',
        title: 'Zero-Trust Access Model Aligns with SOC2 Type II Framework',
        description: 'Hardware-bound FIDO2 credentials and 15-minute token rotation satisfy SOC2 CC6.1 criteria.',
        evidence: [
          {
            type: 'decision',
            id: 'dec_002',
            title: 'Decision #002 (Zero-Trust Rotation Schedule)',
            snippet: 'Enforce hardware-bound FIDO2 credentials with bi-weekly rotation.',
          },
        ],
      },
    ],
    risks: [],
    recommendations: [
      'Conduct bi-weekly audit of department clearance overrides in the Security & Compliance dashboard.',
    ],
    reviewedAt: 'Sep 9, 2026 • Analyzed by AUREN Architecture Reviewer',
    analyzedAgainst: {
      relatedDocs: 4,
      policies: 5,
      decisions: 3,
      discussions: 8,
      meetings: 2,
    },
  },
};

export function getArchitectureReview(docId: string, docTitle: string): ArchitectureReviewResult {
  if (MOCK_ARCHITECTURE_REVIEWS[docId]) {
    return MOCK_ARCHITECTURE_REVIEWS[docId];
  }

  // Dynamic fallback for arbitrary documents
  return {
    documentId: docId,
    documentTitle: docTitle,
    overallStatus: 'NEEDS_REVIEW',
    statusSummary: `AUREN Architecture Reviewer evaluated "${docTitle}" against 3 related architecture documents, Security Policy #12, and organizational decisions. Requires minor review of edge network assumptions.`,
    findings: [
      {
        id: `f_${docId}_01`,
        type: 'alignment',
        title: 'Document Scope Adheres to Departmental Boundaries',
        description: 'Access permissions and storage policies comply with enterprise RBAC specifications.',
        evidence: [
          {
            type: 'policy',
            id: 'doc_sec_002',
            title: 'Security Policy #12',
            snippet: 'Complies with multi-departmental role-based clearance standards.',
          },
        ],
      },
      {
        id: `f_${docId}_02`,
        type: 'concern',
        title: 'Review Needed: Interface Contract Versioning',
        description: 'Ensure exported API endpoints contain semantic version tags to prevent client breakage.',
        evidence: [
          {
            type: 'document',
            id: docId,
            title: docTitle,
            snippet: 'API contracts should follow semantic versioning standards.',
          },
        ],
      },
    ],
    risks: [
      {
        id: `r_${docId}_01`,
        title: 'Integration delay if schema dependencies evolve',
        severity: 'Low',
        impact: 'Downstream services may require contract validation tests.',
      },
    ],
    recommendations: [
      'Coordinate review with Core Architecture lead before merging proposal into main repository.',
      'Verify that all cited internal documents remain up to date.',
    ],
    reviewedAt: 'Just now • Analyzed by AUREN Architecture Reviewer',
    analyzedAgainst: {
      relatedDocs: 2,
      policies: 2,
      decisions: 1,
      discussions: 4,
      meetings: 1,
    },
  };
}

// ============================================================================
// 3. KNOWLEDGE CURATOR AGENT DATA & AUDIT ENGINE
// ============================================================================

export const MOCK_KNOWLEDGE_AUDITS: Record<string, KnowledgeAuditResult> = {
  all: {
    scope: 'all',
    scopeLabel: 'Entire Organization (All Vaults)',
    healthScore: 87,
    analyzedDocumentsCount: 42,
    issuesSummary: {
      duplicates: 4,
      stale: 12,
      conflicts: 3,
      missingOwners: 7,
      superseded: 2,
      disconnected: 5,
    },
    issues: [
      {
        id: 'iss_conf_01',
        category: 'conflicts',
        severity: 'high',
        title: 'Webhook Ingress Authentication Conflict',
        description:
          'Architecture Proposal v4 permits anonymous HTTP webhook ingress, directly conflicting with Security Policy #12 which mandates authenticated mTLS.',
        primaryDoc: {
          id: 'doc_arch_001',
          title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine v4',
          updatedAt: '2026-09-08',
          department: 'Core Architecture',
        },
        relatedDoc: {
          id: 'doc_sec_002',
          title: 'Security Policy #12 (Zero-Trust Document Access Policy)',
          updatedAt: '2026-09-09',
        },
        conflictDetail: 'Section 3.2 allows public unauthenticated ingress; Policy 12.4 prohibits any anonymous routes.',
        suggestedAction: 'Update Architecture Proposal v4 to mandate mTLS gateway termination.',
      },
      {
        id: 'iss_conf_02',
        category: 'conflicts',
        severity: 'high',
        title: 'Vector Quantization Precision Discrepancy',
        description:
          'Personal research notes recommend INT8 scalar quantization, whereas ratified Decision #001 mandates AVX-512 cosine float32 quantization.',
        primaryDoc: {
          id: 'doc_personal_001',
          title: 'Research Notes: Autonomous Agent Memory & Latent Graphs',
          updatedAt: '2026-09-05',
          department: 'Core Architecture',
        },
        relatedDoc: {
          id: 'doc_arch_001',
          title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine',
          updatedAt: '2026-09-08',
        },
        conflictDetail: 'INT8 quantization introduces 4.2% precision degradation on multi-lingual queries.',
        suggestedAction: 'Align research notes with ratified Decision #001 vector schema.',
      },
      {
        id: 'iss_conf_03',
        category: 'conflicts',
        severity: 'medium',
        title: 'SSE Heartbeat Interval Inconsistency',
        description:
          'Stream Ingestion Engine specifies 15s heartbeats while Nginx ingress proxy timeout is configured for 60s.',
        primaryDoc: {
          id: 'doc_eng_003',
          title: 'High-Throughput Stream Ingestion Engine',
          updatedAt: '2026-09-07',
          department: 'Platform Engineering',
        },
        relatedDoc: {
          id: 'doc_arch_001',
          title: 'AUREN System Architecture & Service Topology',
          updatedAt: '2026-09-08',
        },
        suggestedAction: 'Harmonize heartbeat timers to 30s across client and server.',
      },
      {
        id: 'iss_stale_01',
        category: 'stale',
        severity: 'medium',
        title: 'Compliance Audit Preparation Guidelines Unreviewed for 210 Days',
        description: 'Document has not been verified since last quarter SOC2 preliminary review in February 2026.',
        primaryDoc: {
          id: 'doc_enterprise_002',
          title: 'Enterprise Compliance Guidelines & SOC2 Type II Matrix',
          updatedAt: '2026-02-12',
          department: 'Security & Compliance',
        },
        suggestedAction: 'Request compliance review from CISO Elena Vance.',
      },
      {
        id: 'iss_stale_02',
        category: 'stale',
        severity: 'low',
        title: 'Hardware Token Procurement Manual Stale',
        description: 'YubiKey 5 FIPS distribution process has not been updated since new hardware keys were delivered.',
        primaryDoc: {
          id: 'doc_sec_token_guide',
          title: 'Hardware Token Procurement and Distribution Timeline',
          updatedAt: '2026-03-01',
          department: 'Security & Compliance',
        },
        suggestedAction: 'Archive or refresh with current serial inventory log.',
      },
      {
        id: 'iss_dup_01',
        category: 'duplicates',
        severity: 'medium',
        title: 'Duplicate Vector Chunker Implementation Code',
        description:
          'Code file retrieval-service/src/pipeline/chunker.ts duplicates markdown pseudocode in System Architecture Section 4.1.',
        primaryDoc: {
          id: 'doc_github_004',
          title: 'retrieval-service/src/pipeline/chunker.ts',
          updatedAt: '2026-09-09',
          department: 'Platform Engineering',
        },
        relatedDoc: {
          id: 'doc_arch_001',
          title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine',
          updatedAt: '2026-09-08',
        },
        suggestedAction: 'Link markdown documentation directly to the live GitHub repository source.',
      },
      {
        id: 'iss_dup_02',
        category: 'duplicates',
        severity: 'low',
        title: 'Duplicate Enterprise Security Whitepaper Drafts',
        description: 'Found 2 near-identical copies of Enterprise Security Whitepaper in personal vault and organization library.',
        primaryDoc: {
          id: 'doc_enterprise_001',
          title: 'Enterprise Security Whitepaper',
          updatedAt: '2026-09-01',
          department: 'Executive Security & Governance',
        },
        suggestedAction: 'Consolidate into single canonical enterprise document.',
      },
      {
        id: 'iss_own_01',
        category: 'missing_owners',
        severity: 'high',
        title: 'Product Requirements Document Has No Designated Owner',
        description: 'Uploaded document lacks assigned department head or accountable engineering point of contact.',
        primaryDoc: {
          id: 'doc_prod_req_01',
          title: 'Product Requirements Document v2.4.pdf',
          updatedAt: '2026-08-20',
          department: 'Unassigned',
        },
        suggestedAction: 'Assign ownership to Product Lead Maya Lin or Core Architecture.',
      },
      {
        id: 'iss_own_02',
        category: 'missing_owners',
        severity: 'medium',
        title: 'Stream Ingestion Engine Missing Maintainer Sign-off',
        description: 'Platform engineering RFC lacks designated primary on-call maintainer.',
        primaryDoc: {
          id: 'doc_eng_003',
          title: 'High-Throughput Stream Ingestion Engine',
          updatedAt: '2026-09-07',
          department: 'Platform Engineering',
        },
        suggestedAction: 'Assign Marcus Vance as primary technical maintainer.',
      },
      {
        id: 'iss_sup_01',
        category: 'superseded',
        severity: 'medium',
        title: 'Monolithic Ingestion Specification Superseded by v4 Architecture',
        description:
          'Older v2 architecture proposal has been completely superseded by AUREN System Architecture v4 (doc_arch_001).',
        primaryDoc: {
          id: 'doc_legacy_arch_v2',
          title: 'Legacy Monolithic Retrieval Architecture v2.0',
          updatedAt: '2025-11-15',
          department: 'Core Architecture',
        },
        relatedDoc: {
          id: 'doc_arch_001',
          title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine v4',
          updatedAt: '2026-09-08',
        },
        suggestedAction: 'Mark document as DEPRECATED / ARCHIVED to avoid polluting semantic search embeddings.',
      },
      {
        id: 'iss_disc_01',
        category: 'disconnected',
        severity: 'low',
        title: 'Team Offsite & Travel Logistics Document is Completely Disconnected',
        description:
          'This document has 0 citations in meetings, 0 related architectural decisions, and 0 references in collaboration channels.',
        primaryDoc: {
          id: 'doc_travel_plans',
          title: 'Q4 Core Engineering Offsite & Travel Logistics',
          updatedAt: '2026-08-30',
          department: 'Operations',
        },
        suggestedAction: 'Tag as transient logistics or move to personal vault.',
      },
      {
        id: 'iss_disc_02',
        category: 'disconnected',
        severity: 'low',
        title: 'Experimental Vector Quantization Benchmark Scratchpad',
        description: 'Orphaned scratchpad with no connections to active proposals or ratified decisions.',
        primaryDoc: {
          id: 'doc_scratch_01',
          title: 'Scratchpad: Quantization Test Runs on ARM64',
          updatedAt: '2026-08-15',
          department: 'Core Architecture',
        },
        suggestedAction: 'Link to Decision #001 or delete scratchpad.',
      },
    ],
    auditedAt: 'Today • 08:30 AM PST',
  },
  department_architecture: {
    scope: 'department',
    scopeLabel: 'Department: Core Architecture',
    healthScore: 92,
    analyzedDocumentsCount: 16,
    issuesSummary: {
      duplicates: 1,
      stale: 3,
      conflicts: 1,
      missingOwners: 1,
      superseded: 1,
      disconnected: 1,
    },
    issues: [
      {
        id: 'iss_dept_arch_01',
        category: 'conflicts',
        severity: 'high',
        title: 'Webhook Ingress Authentication Conflict',
        description: 'Architecture Proposal v4 conflicts with Security Policy #12 on mTLS ingress requirements.',
        primaryDoc: {
          id: 'doc_arch_001',
          title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine v4',
          updatedAt: '2026-09-08',
          department: 'Core Architecture',
        },
        suggestedAction: 'Patch Section 3.2 to route webhooks through mTLS gateway.',
      },
      {
        id: 'iss_dept_arch_02',
        category: 'stale',
        severity: 'medium',
        title: 'Raft Consensus Failover Benchmark RFC Unreviewed for 95 Days',
        description: 'Heartbeat timeout benchmarks need re-validation against multi-region clusters.',
        primaryDoc: {
          id: 'doc_arch_001',
          title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine',
          updatedAt: '2026-09-08',
          department: 'Core Architecture',
        },
        suggestedAction: 'Re-run benchmark suite in staging environment.',
      },
    ],
    auditedAt: 'Today • 08:30 AM PST',
  },
  department_security: {
    scope: 'department',
    scopeLabel: 'Department: Security & Compliance',
    healthScore: 89,
    analyzedDocumentsCount: 12,
    issuesSummary: {
      duplicates: 1,
      stale: 4,
      conflicts: 1,
      missingOwners: 0,
      superseded: 1,
      disconnected: 1,
    },
    issues: [
      {
        id: 'iss_dept_sec_01',
        category: 'conflicts',
        severity: 'high',
        title: 'Cross-Departmental Webhook Policy Discrepancy',
        description: 'Core Architecture proposal permits public webhooks, violating Security Policy #12.',
        primaryDoc: {
          id: 'doc_sec_002',
          title: 'Security Policy #12 (Zero-Trust Document Access Policy)',
          updatedAt: '2026-09-09',
          department: 'Security & Compliance',
        },
        suggestedAction: 'Notify Core Architecture Head Praman Singh Bhogal to patch ingress.',
      },
    ],
    auditedAt: 'Today • 08:30 AM PST',
  },
};

export function runKnowledgeAudit(
  scope: 'all' | 'department' | 'collection' = 'all',
  scopeId?: string
): KnowledgeAuditResult {
  if (scope === 'department' && scopeId === 'Security & Compliance') {
    return MOCK_KNOWLEDGE_AUDITS.department_security;
  }
  if (scope === 'department' && scopeId === 'Core Architecture') {
    return MOCK_KNOWLEDGE_AUDITS.department_architecture;
  }
  return MOCK_KNOWLEDGE_AUDITS.all;
}

// ============================================================================
// 4. ORGANIZATIONAL MEMORY TRACES & LINEAGE DATA
// ============================================================================

export const MOCK_ORGANIZATIONAL_MEMORY_TRACES: Record<string, OrganizationalMemoryTrace> = {
  doc_arch_001: {
    rootObjectId: 'doc_arch_001',
    rootObjectType: 'document',
    title: 'Architecture Proposal v4 (AUREN System Architecture & Multi-Tenant Retrieval Engine)',
    summary:
      'Complete organizational lineage connecting Architecture Proposal v4 through team discussions, security review summits, ratified decisions, and active infrastructure migration tasks.',
    documents: [
      {
        id: 'doc_arch_001',
        title: 'Architecture Proposal v4: Multi-Tenant Retrieval Engine',
        type: 'markdown',
        scope: 'organization',
        clearance: 'L4_Senior',
        relationship: 'Root Proposal Document',
      },
      {
        id: 'doc_sec_002',
        title: 'Security Policy #12 (Zero-Trust Access & Connector Policy)',
        type: 'spec',
        scope: 'enterprise',
        clearance: 'L5_Principal',
        relationship: 'Governing Engineering Policy',
      },
      {
        id: 'doc_github_004',
        title: 'retrieval-service/src/pipeline/chunker.ts',
        type: 'code',
        scope: 'organization',
        clearance: 'L3_Junior',
        relationship: 'Source Code Implementation',
      },
      {
        id: 'doc_eng_003',
        title: 'High-Throughput Stream Ingestion Engine',
        type: 'spec',
        scope: 'organization',
        clearance: 'L4_Senior',
        relationship: 'Dependent Ingress Architecture',
      },
    ],
    messages: [
      {
        id: 'msg_arch_001',
        channelId: 'dept_arch_general',
        channelName: '#dept_arch_general',
        senderName: 'Marcus Vance',
        timestamp: 'Sep 7, 2026 • 10:14 AM',
        snippet: 'Reviewing the draft for vector partition keys. Monolithic collections are degrading p99 latency during parallel org searches.',
      },
      {
        id: 'msg_arch_002',
        channelId: 'dept_arch_general',
        channelName: '#dept_arch_general',
        senderName: 'Elena Rostova',
        timestamp: 'Sep 7, 2026 • 10:45 AM',
        snippet: 'Benchmark numbers are in: tenant-level partitioning yields 38% latency reduction with zero cross-tenant leakage.',
      },
      {
        id: 'msg_arch_003',
        channelId: 'dept_sec_general',
        channelName: '#dept_sec_general',
        senderName: 'Elena Vance (CISO)',
        timestamp: 'Sep 8, 2026 • 09:30 AM',
        snippet: 'Flagging Section 3.2: public webhook access violates Security Policy #12. We must require mTLS or HMAC tokens on all ingress.',
      },
    ],
    threads: [
      {
        id: 'th_arch_01',
        channelId: 'dept_arch_general',
        topic: 'Qdrant Collection Tenant-Level Sharding Strategy RFC',
        replyCount: 14,
        participants: ['Marcus Vance', 'Elena Rostova', 'Praman Singh Bhogal', 'Chloe Zhang'],
      },
      {
        id: 'th_sec_01',
        channelId: 'dept_sec_general',
        topic: 'Zero-Trust Webhook Ingress & Policy #12 Compliance',
        replyCount: 8,
        participants: ['Elena Vance', 'Aarav Patel', 'Praman Singh Bhogal'],
      },
    ],
    meetings: [
      {
        id: 'meet_arch_review',
        title: 'Architecture Review: Distributed Consensus & Retrieval Sharding',
        date: 'Today • 5:30 PM PST',
        participantsCount: 6,
      },
      {
        id: 'meet_eng_alignment',
        title: 'Ingress Proxy & Nginx Edge Optimization Alignment',
        date: 'Sep 8, 2026 • 02:00 PM PST',
        participantsCount: 2,
      },
      {
        id: 'meet_sec_policy_audit',
        title: 'Zero-Trust Security Policy #12 Compliance & API Gateway Review',
        date: 'Sep 9, 2026 • 10:00 AM PST',
        participantsCount: 3,
      },
    ],
    transcripts: [
      {
        meetingId: 'meet_arch_review',
        speakerName: 'Elena Vance (CISO)',
        quote: 'Security Policy #12 forbids unauthenticated public API access during ingestion. Every shard replica must use hardware HMAC authentication.',
        timestamp: '03:10',
      },
      {
        meetingId: 'meet_arch_review',
        speakerName: 'Elena Rostova',
        quote: 'Partitioning Qdrant collection segments by tenant ID reduces p99 query latency by 38% compared to monolithic clustering.',
        timestamp: '01:20',
      },
      {
        meetingId: 'meet_eng_alignment',
        speakerName: 'Marcus Vance',
        quote: 'We need to expand the shared memory ring buffer from 16MB to 64MB per Cloud Run worker container to handle bursts.',
        timestamp: '02:15',
      },
    ],
    decisions: [
      {
        id: 'dec_001',
        title: 'Decision #001: Vector Collection Tenant-Level Sharding Strategy',
        status: 'Approved',
        owner: 'Core Architecture Team',
        date: 'Sep 9, 2026',
        decisionText: 'Partition Qdrant collection segments strictly by organization tenant ID with hardware-accelerated AVX-512 cosine quantization.',
      },
      {
        id: 'dec_002',
        title: 'Decision #042: Zero-Trust Client Certificate Rotation Schedule',
        status: 'Approved',
        owner: 'Elena Vance (CISO)',
        date: 'Sep 9, 2026',
        decisionText: 'Enforce hardware-bound FIDO2 credentials across all development environments with bi-weekly automated certificate renewal.',
      },
      {
        id: 'dec_003',
        title: 'Decision #003: Unified Server-Sent Events (SSE) Streaming Format',
        status: 'Implemented',
        owner: 'Platform Engineering',
        date: 'Sep 7, 2026',
        decisionText: 'Standardize all AI completion endpoints on RFC 8895 SSE streaming with deterministic JSON envelope tokens.',
      },
    ],
    actionItems: [
      {
        id: 'act_001',
        title: 'Deploy Qdrant tenant sharding canary on staging cluster',
        assignedTo: 'Marcus Vance',
        status: 'Open',
        dueDate: 'Today, 03:00 PM',
        priority: 'High',
      },
      {
        id: 'act_002',
        title: 'Benchmark p99 query latency under 100 concurrent SSE sessions',
        assignedTo: 'Chloe Zhang',
        status: 'Open',
        dueDate: 'Sep 10, 2026',
        priority: 'Medium',
      },
      {
        id: 'act_004',
        title: 'Draft API backwards-compatibility matrix for schema v4',
        assignedTo: 'Elena Rostova',
        status: 'Completed',
        dueDate: 'Sep 8, 2026',
        priority: 'Medium',
      },
    ],
  },
  doc_sec_002: {
    rootObjectId: 'doc_sec_002',
    rootObjectType: 'document',
    title: 'Security Policy #12 (Zero-Trust Document Access & Connector Policy)',
    summary:
      'Organizational memory tracing the zero-trust corporate security baseline to inter-cluster network rules, SOC2 compliance audits, and FIDO2 hardware credential enforcement.',
    documents: [
      {
        id: 'doc_sec_002',
        title: 'Security Policy #12: Zero-Trust Enterprise Vault & RBAC Policy',
        type: 'spec',
        scope: 'enterprise',
        clearance: 'L5_Principal',
        relationship: 'Root Security Standard',
      },
      {
        id: 'doc_arch_001',
        title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine',
        type: 'markdown',
        scope: 'organization',
        clearance: 'L4_Senior',
        relationship: 'Audited Technical Proposal',
      },
    ],
    messages: [
      {
        id: 'msg_sec_001',
        channelId: 'dept_sec_general',
        channelName: '#dept_sec_general',
        senderName: 'Elena Vance (CISO)',
        timestamp: 'Sep 8, 2026 • 09:30 AM',
        snippet: 'Zero unauthenticated endpoints allowed in the upcoming Q4 architecture release.',
      },
    ],
    threads: [
      {
        id: 'th_sec_01',
        channelId: 'dept_sec_general',
        topic: 'Zero-Trust Webhook Ingress & Policy #12 Compliance',
        replyCount: 8,
        participants: ['Elena Vance', 'Aarav Patel', 'Praman Singh Bhogal'],
      },
    ],
    meetings: [
      {
        id: 'meet_sec_policy_audit',
        title: 'Zero-Trust Security Policy #12 Compliance & API Gateway Review',
        date: 'Sep 9, 2026 • 10:00 AM PST',
        participantsCount: 3,
      },
      {
        id: 'meet_arch_review',
        title: 'Architecture Review: Distributed Consensus & Retrieval Sharding',
        date: 'Today • 5:30 PM PST',
        participantsCount: 6,
      },
    ],
    transcripts: [
      {
        meetingId: 'meet_sec_policy_audit',
        speakerName: 'Aarav Patel',
        quote: 'Under our strict RBAC policy, zero anonymous routes are allowed. All incoming payloads must carry signed JWT tokens with 15-minute rotation.',
        timestamp: '01:50',
      },
    ],
    decisions: [
      {
        id: 'dec_002',
        title: 'Decision #042: Zero-Trust Client Certificate Rotation Schedule',
        status: 'Approved',
        owner: 'Elena Vance (CISO)',
        date: 'Sep 9, 2026',
        decisionText: 'Enforce hardware-bound FIDO2 credentials across all environments.',
      },
    ],
    actionItems: [
      {
        id: 'act_003',
        title: 'Certify department hardware key inventory for SOC2 audit',
        assignedTo: 'Aarav Patel',
        status: 'Open',
        dueDate: 'Sep 12, 2026',
        priority: 'High',
      },
    ],
  },
  meet_eng_alignment: {
    rootObjectId: 'meet_eng_alignment',
    rootObjectType: 'meeting',
    title: 'Meeting: Ingress Proxy & Nginx Edge Optimization Alignment',
    summary:
      'Organizational memory linking the Sep 8 platform alignment summit to the stream ingestion RFC, worker telemetry threads, Decision #003, and live deployment tasks.',
    documents: [
      {
        id: 'doc_eng_003',
        title: 'High-Throughput Stream Ingestion Engine',
        type: 'spec',
        scope: 'organization',
        clearance: 'L4_Senior',
        relationship: 'Attached Technical RFC',
      },
      {
        id: 'doc_arch_001',
        title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine',
        type: 'markdown',
        scope: 'organization',
        clearance: 'L4_Senior',
        relationship: 'Parent System Architecture',
      },
    ],
    messages: [
      {
        id: 'msg_eng_001',
        channelId: 'dept_eng_general',
        channelName: '#dept_eng_general',
        senderName: 'Marcus Vance',
        timestamp: 'Sep 8, 2026 • 01:15 PM',
        snippet: 'Preparing agenda for the edge ingress buffer review. SSE connections experienced socket drops during high burst.',
      },
    ],
    threads: [
      {
        id: 'th_eng_01',
        channelId: 'dept_eng_general',
        topic: 'Edge TLS Session Cache & Ring Buffer Sizing',
        replyCount: 11,
        participants: ['Marcus Vance', 'Chloe Zhang'],
      },
    ],
    meetings: [
      {
        id: 'meet_eng_alignment',
        title: 'Ingress Proxy & Nginx Edge Optimization Alignment',
        date: 'Sep 8, 2026 • 02:00 PM PST',
        participantsCount: 2,
      },
    ],
    transcripts: [
      {
        meetingId: 'meet_eng_alignment',
        speakerName: 'Marcus Vance',
        quote: 'Our primary decision today: expand the shared memory ring buffer from 16MB to 64MB per Cloud Run worker container.',
        timestamp: '02:15',
      },
      {
        meetingId: 'meet_eng_alignment',
        speakerName: 'Chloe Zhang',
        quote: 'Enforce exponential jittered backoff from 1 second up to 30 seconds to suppress reconnect spikes.',
        timestamp: '03:40',
      },
    ],
    decisions: [
      {
        id: 'dec_003',
        title: 'Decision #003: Unified Server-Sent Events (SSE) Streaming Format',
        status: 'Implemented',
        owner: 'Platform Engineering',
        date: 'Sep 7, 2026',
        decisionText: 'Standardize all AI completion endpoints on RFC 8895 SSE streaming.',
      },
    ],
    actionItems: [
      {
        id: 'ma_eng_01',
        title: 'Deploy Nginx config update across West staging node',
        assignedTo: 'Marcus Vance',
        status: 'Open',
        dueDate: 'Today, 5:00 PM',
        priority: 'High',
      },
      {
        id: 'ma_eng_02',
        title: 'Verify client retry behavior in browser DevTools test suite',
        assignedTo: 'Chloe Zhang',
        status: 'Open',
        dueDate: 'Sep 11, 2026',
        priority: 'Medium',
      },
    ],
  },
};

// Initialize nodes and connections dynamically for all traces
Object.keys(MOCK_ORGANIZATIONAL_MEMORY_TRACES).forEach((key) => {
  const t = MOCK_ORGANIZATIONAL_MEMORY_TRACES[key];
  t.id = t.rootObjectId || key;
  t.description = t.summary;

  const nodes: OrganizationalMemoryNode[] = [];
  const connections: OrganizationalMemoryConnection[] = [];

  // Documents
  t.documents?.forEach((d) => {
    nodes.push({
      id: d.id,
      type: d.type === 'spec' && d.id.includes('sec') ? 'policy' : 'document',
      title: d.title,
      description: d.relationship || 'Associated document',
      clearance: d.clearance,
      department: d.scope,
      relatedDocId: d.id,
    });
    if (d.id !== t.rootObjectId) {
      connections.push({
        fromNodeId: t.rootObjectId,
        toNodeId: d.id,
        source: t.rootObjectId,
        target: d.id,
        relationship: d.relationship || 'References',
        label: d.relationship,
      });
    }
  });

  // Decisions
  t.decisions?.forEach((dec) => {
    nodes.push({
      id: dec.id,
      type: 'decision',
      title: dec.title,
      description: dec.decisionText,
      date: dec.date,
      timestamp: dec.date,
      referenceId: dec.id,
      author: dec.owner,
      status: dec.status,
    });
    connections.push({
      fromNodeId: t.rootObjectId,
      toNodeId: dec.id,
      source: t.rootObjectId,
      target: dec.id,
      relationship: 'Ratified Decision',
      label: dec.status,
    });
  });

  // Meetings
  t.meetings?.forEach((m) => {
    nodes.push({
      id: m.id,
      type: 'meeting',
      title: m.title,
      description: `Meeting on ${m.date} with ${m.participantsCount} participants`,
      date: m.date,
      timestamp: m.date,
      referenceId: m.id,
    });
    connections.push({
      fromNodeId: m.id,
      toNodeId: t.rootObjectId,
      source: m.id,
      target: t.rootObjectId,
      relationship: 'Discussed Document',
      label: 'Deliberation',
    });
  });

  // Threads
  t.threads?.forEach((th) => {
    nodes.push({
      id: th.id,
      type: 'thread',
      title: th.topic,
      description: `${th.replyCount} replies from ${th.participants.join(', ')}`,
      department: th.channelId,
      referenceId: th.id,
    });
    connections.push({
      fromNodeId: th.id,
      toNodeId: t.rootObjectId,
      source: th.id,
      target: t.rootObjectId,
      relationship: 'Channel Thread',
      label: `${th.replyCount} msgs`,
    });
  });

  // Action Items
  t.actionItems?.forEach((act) => {
    nodes.push({
      id: act.id,
      type: 'action_item',
      title: act.title,
      description: `Assigned to ${act.assignedTo} • Due ${act.dueDate}`,
      author: act.assignedTo,
      date: act.dueDate,
      timestamp: act.dueDate,
      referenceId: act.id,
      status: act.status,
    });
    connections.push({
      fromNodeId: t.rootObjectId,
      toNodeId: act.id,
      source: t.rootObjectId,
      target: act.id,
      relationship: 'Action Item',
      label: act.priority,
    });
  });

  t.nodes = nodes;
  t.connections = connections;
});

export function getOrganizationalMemoryTrace(rootId: string): OrganizationalMemoryTrace {
  if (MOCK_ORGANIZATIONAL_MEMORY_TRACES[rootId]) {
    return MOCK_ORGANIZATIONAL_MEMORY_TRACES[rootId];
  }
  // Default to doc_arch_001 trace if not found
  return MOCK_ORGANIZATIONAL_MEMORY_TRACES.doc_arch_001;
}
