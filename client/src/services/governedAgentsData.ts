import type {
  GovernedAgent,
  AgentActivityItem,
  AgentApprovalRequest,
  AgentExecutionTraceStep,
} from '../types/agents';


// ============================================================================
// 1. THE 5 GOVERNED AGENTS OF AUREN
// ============================================================================

export const INITIAL_GOVERNED_AGENTS: GovernedAgent[] = [
  {
    id: 'meeting-agent',
    name: 'Meeting Agent',
    role: 'Meeting Synthesis & Knowledge Extractor',
    avatarIcon: 'Video',
    purpose: 'Turn meetings and transcripts into structured organizational knowledge.',
    departmentScope: 'Organization',
    knowledgeScope: ['Meetings & Summits', 'Live Transcripts', 'Referenced RFCs & Specs'],
    restrictedKnowledge: ['Security Restricted (L5)', 'Executive Compensation', 'HR Confidential'],
    minClearance: 'L3',
    status: 'available',
    lastRun: '12 minutes ago',
    accessExplanation: {
      organization: 'AUREN Enterprise Organization',
      organizationAllowed: true,
      department: 'All Departments (Org-wide deliberation)',
      departmentAllowed: true,
      clearance: 'L3_Junior to L4_Senior',
      clearanceAllowed: true,
      policy: 'Meeting Transcription & Knowledge Extraction Policy #08',
      policyAllowed: true,
      allowedToolCount: 8,
      restrictedToolCount: 3,
      decision: 'ACCESS GRANTED',
    },
    tools: [
      {
        id: 'tool_mtg_search_transcript',
        name: 'Search Transcript',
        description: 'Semantic & keyword search across meeting audio transcripts and diarized speech segments.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_mtg_get_messages',
        name: 'Get Meeting Messages',
        description: 'Retrieve real-time in-meeting chat notes, Q&A threads, and timestamped links.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_mtg_get_participants',
        name: 'Get Participants',
        description: 'Read verified attendee identities, clearance levels, departments, and speaker roles.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_mtg_search_knowledge',
        name: 'Search Knowledge',
        description: 'Search accessible organizational knowledge for specs referenced verbally during meetings.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_mtg_read_document',
        name: 'Read Document',
        description: 'Inspect full content of architectural RFCs or specifications projected in screen shares.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_mtg_create_decision',
        name: 'Create Decision',
        description: 'Extract ratified consensus from transcript and draft formal Organizational Decision record.',
        status: 'approval_required',
        category: 'create',
      },
      {
        id: 'tool_mtg_create_action_item',
        name: 'Create Action Item',
        description: 'Identify verbal commitments and create trackable action items assigned to attendees.',
        status: 'allowed',
        category: 'create',
      },
      {
        id: 'tool_mtg_update_summary',
        name: 'Update Meeting Summary',
        description: 'Synthesize executive summary, key takeaways, and outline into the official meeting record.',
        status: 'allowed',
        category: 'modify',
      },
    ],
    restrictedTools: [
      {
        id: 'tool_mtg_modify_audio',
        name: 'Modify Audio / Video Record',
        description: 'Tamper with raw immutable media artifacts stored in compliance archive.',
        status: 'restricted',
        category: 'modify',
      },
      {
        id: 'tool_mtg_delete_meeting',
        name: 'Delete Meeting Records',
        description: 'Purge historical meeting records or audit traces.',
        status: 'restricted',
        category: 'modify',
      },
      {
        id: 'tool_mtg_broadcast_announcement',
        name: 'Broadcast Organization Announcement',
        description: 'Publish company-wide broadcast alert from meeting conclusions.',
        status: 'approval_required',
        category: 'create',
      },
    ],
    approvalActions: [
      'Create ratified organizational decisions',
      'Publish company-wide announcements',
      'Escalate unresolved blockers to Executive tier',
    ],
  },
  {
    id: 'architecture-reviewer',
    name: 'Architecture Reviewer',
    role: 'Autonomous System & Policy Verifier',
    avatarIcon: 'Cpu',
    purpose: 'Review architecture proposals against organizational knowledge, policies, and previous decisions.',
    departmentScope: 'Engineering',
    knowledgeScope: ['Engineering Architecture', 'Zero-Trust Security Policies', 'Ratified ADRs & Decisions'],
    restrictedKnowledge: ['Executive Compensation', 'HR Confidential', 'Legal Dispute Holds'],
    minClearance: 'L4',
    status: 'available',
    lastRun: '18 minutes ago',
    accessExplanation: {
      organization: 'AUREN Enterprise Organization',
      organizationAllowed: true,
      department: 'Engineering (Core Platform)',
      departmentAllowed: true,
      clearance: 'L4_Senior Engineer minimum',
      clearanceAllowed: true,
      policy: 'Automated Architecture Review Policy #19',
      policyAllowed: true,
      allowedToolCount: 7,
      restrictedToolCount: 4,
      decision: 'ACCESS GRANTED',
    },
    tools: [
      {
        id: 'tool_arch_search_knowledge',
        name: 'Search Knowledge',
        description: 'Search architecture repositories, system RFCs, and past technical design docs.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_arch_read_document',
        name: 'Read Document',
        description: 'Read the full markdown/spec text of submitted architecture proposals.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_arch_search_decisions',
        name: 'Search Decisions',
        description: 'Search historical Architectural Decision Records (ADRs) and executive ratifications.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_arch_search_discussions',
        name: 'Search Discussions',
        description: 'Index engineering discussions and meeting transcripts for prior architectural consensus.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_arch_get_policy',
        name: 'Get Policy',
        description: 'Fetch authoritative security policies, rate limit guidelines, and cloud egress rules.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_arch_compare_documents',
        name: 'Compare Documents',
        description: 'Perform AST and semantic pairwise diffing to detect architectural drift and conflicts.',
        status: 'allowed',
        category: 'compliance',
      },
      {
        id: 'tool_arch_create_review_task',
        name: 'Create Review Task',
        description: 'Create remediation review task assigned to proposal authors with line-by-line evidence.',
        status: 'allowed',
        category: 'create',
      },
    ],
    restrictedTools: [
      {
        id: 'tool_arch_modify_source',
        name: 'Modify Source Documents',
        description: 'Directly edit author specifications without approval.',
        status: 'restricted',
        category: 'modify',
      },
      {
        id: 'tool_arch_override_policy',
        name: 'Override Security Policies',
        description: 'Unilaterally waive mandatory security or compliance rules.',
        status: 'restricted',
        category: 'compliance',
      },
      {
        id: 'tool_arch_deploy_infra',
        name: 'Deploy Infrastructure Changes',
        description: 'Execute Terraform or Kubernetes manifests directly.',
        status: 'restricted',
        category: 'modify',
      },
      {
        id: 'tool_arch_publish_announcement',
        name: 'Publish Architecture Mandate',
        description: 'Announce company-wide mandatory architectural migration.',
        status: 'approval_required',
        category: 'create',
      },
    ],
    approvalActions: [
      'Publish organization-wide architecture mandates',
      'Request formal Security Policy waiver',
      'Designate proposal as Superseded',
    ],
  },
  {
    id: 'knowledge-curator',
    name: 'Knowledge Curator',
    role: 'Corpus Integrity & Hygiene Sentinel',
    avatarIcon: 'Sparkles',
    purpose: 'Maintain the quality, freshness, and consistency of organizational knowledge.',
    departmentScope: 'Organization',
    knowledgeScope: ['Entire Organization Knowledge', 'Vault Collections', 'Cross-Department Documentation'],
    restrictedKnowledge: ['Classified Vaults', 'Executive Private'],
    minClearance: 'L4',
    status: 'available',
    lastRun: '45 minutes ago',
    accessExplanation: {
      organization: 'AUREN Enterprise Organization',
      organizationAllowed: true,
      department: 'Organization-wide Knowledge Operations',
      departmentAllowed: true,
      clearance: 'L4_Senior',
      clearanceAllowed: true,
      policy: 'Information Architecture & Corpus Hygiene Directive #04',
      policyAllowed: true,
      allowedToolCount: 10,
      restrictedToolCount: 3,
      decision: 'ACCESS GRANTED',
    },
    tools: [
      {
        id: 'tool_kc_list_documents',
        name: 'List Documents',
        description: 'Enumerate all indexed vault documents across departments with freshness metadata.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_kc_read_document',
        name: 'Read Document',
        description: 'Read document content, markdown blocks, frontmatter tags, and authorship attributes.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_kc_search_knowledge',
        name: 'Search Knowledge',
        description: 'Run dense vector and BM25 hybrid queries to identify topical knowledge clusters.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_kc_compare_documents',
        name: 'Compare Documents',
        description: 'Evaluate semantic similarity between candidate duplicate documents.',
        status: 'allowed',
        category: 'compliance',
      },
      {
        id: 'tool_kc_find_duplicates',
        name: 'Find Duplicates',
        description: 'Identify redundant documents (>80% cosine overlap) created across disconnected teams.',
        status: 'allowed',
        category: 'compliance',
      },
      {
        id: 'tool_kc_find_stale',
        name: 'Find Stale Documents',
        description: 'Flag documentation without verification or update in >90 days.',
        status: 'allowed',
        category: 'compliance',
      },
      {
        id: 'tool_kc_find_conflicts',
        name: 'Find Conflicts',
        description: 'Extract factual assertions and flag direct contradictions between active policies.',
        status: 'allowed',
        category: 'compliance',
      },
      {
        id: 'tool_kc_find_missing_owners',
        name: 'Find Missing Owners',
        description: 'Detect orphaned documents whose authors have transitioned or left the department.',
        status: 'allowed',
        category: 'compliance',
      },
      {
        id: 'tool_kc_create_review_task',
        name: 'Create Review Task',
        description: 'File automated curation review task assigned to the appropriate department lead.',
        status: 'allowed',
        category: 'create',
      },
      {
        id: 'tool_kc_mark_superseded',
        name: 'Mark Superseded',
        description: 'Deprecate obsolete documents with canonical replacement banner and search de-ranking.',
        status: 'approval_required',
        category: 'modify',
      },
    ],
    restrictedTools: [
      {
        id: 'tool_kc_hard_delete',
        name: 'Hard Delete Documents',
        description: 'Irreversibly delete source knowledge assets from blob storage.',
        status: 'restricted',
        category: 'modify',
      },
      {
        id: 'tool_kc_purge_ledger',
        name: 'Purge Audit Ledger',
        description: 'Clear tamper-evident document revision history.',
        status: 'restricted',
        category: 'modify',
      },
      {
        id: 'tool_kc_change_rbac',
        name: 'Change Document Access Level',
        description: 'Alter the security clearance required to view a document.',
        status: 'restricted',
        category: 'modify',
      },
    ],
    approvalActions: [
      'Mark documents as superseded in search index',
      'Archive stale cross-department specifications',
      'Batch reassign orphaned document collections',
    ],
  },
  {
    id: 'security-analyst',
    name: 'Security Analyst',
    role: 'Zero-Trust & Compliance Inspector',
    avatarIcon: 'ShieldAlert',
    purpose: 'Analyze security-related knowledge, proposals, and organizational policies.',
    departmentScope: 'Security & Compliance',
    knowledgeScope: ['Security Vault', 'SOC2 / ISO 27001 Controls', 'Zero-Trust Policies', 'Audit Logs'],
    restrictedKnowledge: ['Non-Security Personnel Reviews'],
    minClearance: 'L5',
    status: 'available',
    lastRun: '1 hour ago',
    accessExplanation: {
      organization: 'AUREN Enterprise Organization',
      organizationAllowed: true,
      department: 'Security & Compliance',
      departmentAllowed: true,
      clearance: 'L5_Principal / CISO',
      clearanceAllowed: true,
      policy: 'Continuous Zero-Trust Security Audit Policy #12',
      policyAllowed: true,
      allowedToolCount: 7,
      restrictedToolCount: 3,
      decision: 'ACCESS GRANTED',
    },
    tools: [
      {
        id: 'tool_sec_search_knowledge',
        name: 'Search Security Knowledge',
        description: 'Search CVE intelligence databases, internal security runbooks, and vulnerability tickets.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_sec_read_document',
        name: 'Read Document',
        description: 'Inspect confidential architecture specs, auth middleware files, and API endpoint contracts.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_sec_search_policies',
        name: 'Search Policies',
        description: 'Query zero-trust network mandates, cryptographic standards, and data retention rules.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_sec_search_decisions',
        name: 'Search Decisions',
        description: 'Inspect previous CISO security ratifications, exemption requests, and sign-offs.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_sec_compare_documents',
        name: 'Compare Documents',
        description: 'Cross-reference proposed API contracts against mandatory zero-trust specs.',
        status: 'allowed',
        category: 'compliance',
      },
      {
        id: 'tool_sec_check_compliance',
        name: 'Check Compliance',
        description: 'Run automated compliance verification against SOC2 Type II and FedRAMP high controls.',
        status: 'allowed',
        category: 'compliance',
      },
      {
        id: 'tool_sec_create_security_review',
        name: 'Create Security Review',
        description: 'File formal security review audit ticket in SecOps queue with risk ratings.',
        status: 'allowed',
        category: 'create',
      },
    ],
    restrictedTools: [
      {
        id: 'tool_sec_grant_clearance',
        name: 'Grant User Clearances',
        description: 'Elevate user clearance levels (strictly human administrator function).',
        status: 'restricted',
        category: 'modify',
      },
      {
        id: 'tool_sec_revoke_cert',
        name: 'Revoke Production TLS Certificates',
        description: 'Immediately revoke live client/server cryptographic credentials.',
        status: 'approval_required',
        category: 'modify',
      },
      {
        id: 'tool_sec_bypass_rbac',
        name: 'Bypass RBAC Enforcers',
        description: 'Execute queries bypassing organizational access policies.',
        status: 'restricted',
        category: 'compliance',
      },
    ],
    approvalActions: [
      'Publish critical security vulnerability notice',
      'Revoke live production credentials or API keys',
      'Issue mandatory compliance remediations',
    ],
  },
  {
    id: 'incident-assistant',
    name: 'Incident Assistant',
    role: 'War Room Coordinator & Postmortem Synthesizer',
    avatarIcon: 'AlertTriangle',
    purpose: 'Assist with incidents and operational response.',
    departmentScope: 'Operations & Infrastructure',
    knowledgeScope: ['Operations & SRE Runbooks', 'Incident Knowledge', 'War Room Channels', 'Telemetry Traces'],
    restrictedKnowledge: ['HR Confidential', 'Executive Private', 'Customer PII'],
    minClearance: 'L4',
    status: 'available',
    lastRun: '2 hours ago',
    accessExplanation: {
      organization: 'AUREN Enterprise Organization',
      organizationAllowed: true,
      department: 'Operations & SRE',
      departmentAllowed: true,
      clearance: 'L4_Senior Engineer minimum',
      clearanceAllowed: true,
      policy: 'Incident Response & Postmortem Policy #27',
      policyAllowed: true,
      allowedToolCount: 8,
      restrictedToolCount: 3,
      decision: 'ACCESS GRANTED',
    },
    tools: [
      {
        id: 'tool_inc_search_knowledge',
        name: 'Search Incident Knowledge',
        description: 'Search historical postmortems, recurring outage patterns, and root cause analyses.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_inc_search_messages',
        name: 'Search Messages',
        description: 'Index incident war-room channels (#incident-retrieval, #infra-alerts) in real time.',
        status: 'allowed',
        category: 'search',
      },
      {
        id: 'tool_inc_search_runbooks',
        name: 'Search Runbooks',
        description: 'Retrieve verified emergency runbooks, failover procedures, and rollback playbooks.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_inc_read_documents',
        name: 'Read Documents',
        description: 'Inspect service architecture diagrams, dependency trees, and cluster configurations.',
        status: 'allowed',
        category: 'read',
      },
      {
        id: 'tool_inc_build_timeline',
        name: 'Build Incident Timeline',
        description: 'Synthesize verified chronological timeline from chat timestamps and deployment logs.',
        status: 'allowed',
        category: 'create',
      },
      {
        id: 'tool_inc_create_action_item',
        name: 'Create Action Item',
        description: 'Assign urgent preventative follow-up actions with owners and target SLAs.',
        status: 'allowed',
        category: 'create',
      },
      {
        id: 'tool_inc_create_postmortem',
        name: 'Create Postmortem',
        description: 'Generate structured blameless postmortem draft containing timeline, impact, and RCA.',
        status: 'allowed',
        category: 'create',
      },
      {
        id: 'tool_inc_link_knowledge',
        name: 'Link Knowledge',
        description: 'Connect resolved incidents to relevant architecture documentation in the knowledge graph.',
        status: 'allowed',
        category: 'modify',
      },
    ],
    restrictedTools: [
      {
        id: 'tool_inc_trigger_pager',
        name: 'Trigger PagerDuty Escalation',
        description: 'Page the executive on-call rotation.',
        status: 'approval_required',
        category: 'create',
      },
      {
        id: 'tool_inc_restart_cluster',
        name: 'Restart Production Ingress Pods',
        description: 'Execute rolling restarts on primary production cluster.',
        status: 'restricted',
        category: 'modify',
      },
      {
        id: 'tool_inc_delete_logs',
        name: 'Delete Audit Incident Logs',
        description: 'Remove telemetry from compliance storage.',
        status: 'restricted',
        category: 'modify',
      },
    ],
    approvalActions: [
      'Publish company-wide incident postmortem',
      'Trigger multi-tier executive escalation',
      'Approve architectural deviation under incident state',
    ],
  },
];

// ============================================================================
// 2. REALISTIC DETERMINISTIC EXECUTION TRACES & RESULTS
// ============================================================================

export interface AgentExecutionSimulation {
  agentId: string;
  targetName: string;
  targetType: string;
  targetId: string;
  steps: AgentExecutionTraceStep[];
  result: {
    status: 'NEEDS_REVIEW' | 'APPROVED' | 'CONFLICT_DETECTED' | 'COMPLIANT' | 'RESOLVED';
    statusLabel: string;
    summary: string;
    findings: {
      type: 'success' | 'warning' | 'error';
      title: string;
      description: string;
    }[];
    risks: {
      level: 'High' | 'Medium' | 'Low';
      title: string;
      impact: string;
    }[];
    recommendations: string[];
    evidence: {
      id: string;
      type: 'document' | 'decision' | 'meeting' | 'policy';
      title: string;
      reference: string;
    }[];
    availableActions: {
      id: string;
      label: string;
      icon: string;
      requiresApproval: boolean;
      primary?: boolean;
    }[];
  };
}

export const MOCK_AGENT_EXECUTIONS: Record<string, AgentExecutionSimulation> = {
  'architecture-reviewer': {
    agentId: 'architecture-reviewer',
    targetName: 'Architecture Proposal v4 (AUREN Multi-Tenant Retrieval Engine)',
    targetType: 'Document',
    targetId: 'doc_arch_001',
    steps: [
      {
        id: 's1',
        toolName: 'Search Knowledge',
        status: 'completed',
        message: 'Searching architecture knowledge & repository specifications...',
        detail: '12 relevant technical design docs and RFCs retrieved',
        durationMs: 420,
      },
      {
        id: 's2',
        toolName: 'Read Document',
        status: 'completed',
        message: 'Reading Architecture Proposal v4...',
        detail: 'Analyzed 4,200 words across 8 sections, 3 network topology charts',
        durationMs: 380,
      },
      {
        id: 's3',
        toolName: 'Get Policy',
        status: 'completed',
        message: 'Checking organizational policies...',
        detail: '3 active governing policies loaded (Zero-Trust #12, Encryption #05, Multi-Tenant #02)',
        durationMs: 310,
      },
      {
        id: 's4',
        toolName: 'Search Decisions',
        status: 'completed',
        message: 'Searching previous ratified decisions...',
        detail: 'Decision #042 found: Zero-Trust Client Certificate Rotation Schedule',
        durationMs: 460,
      },
      {
        id: 's5',
        toolName: 'Compare Documents',
        status: 'warning',
        message: 'Comparing related architecture documents...',
        detail: '1 direct policy conflict detected between ingress specification and Security Policy #12',
        durationMs: 520,
      },
      {
        id: 's6',
        toolName: 'Create Review Task',
        status: 'completed',
        message: 'Synthesizing structured architectural review...',
        detail: 'Review artifact compiled with 3 actionable remediation steps',
        durationMs: 290,
      },
    ],
    result: {
      status: 'NEEDS_REVIEW',
      statusLabel: 'NEEDS REVIEW • POLICY CONFLICT DETECTED',
      summary:
        'Architecture Proposal v4 provides strong multi-tenant collection sharding, but contains an unauthenticated webhook ingress path that directly violates Security Policy #12 and lacks client certificate verification mandated by Decision #042.',
      findings: [
        {
          type: 'success',
          title: 'Architecture Alignment',
          description:
            'Vector sharding and Qdrant tenant partition strategy cleanly align with Decision #001 (Tenant-Level Sharding Strategy).',
        },
        {
          type: 'warning',
          title: 'Authentication Requirement Missing',
          description:
            'Production webhook endpoint ingress is specified with bearer auth, but fails to mandate hardware-bound mTLS authentication for cross-service calls.',
        },
        {
          type: 'error',
          title: 'Policy Conflict with Security Policy #12',
          description:
            'Section 4.2 permits unauthenticated HTTP webhook ingress for fallback webhook webhooks. Security Policy #12 explicitly forbids cleartext/unauthenticated HTTP ingress across all environments.',
        },
      ],
      risks: [
        {
          level: 'Medium',
          title: 'Cross-Service Ingress Exposure',
          impact: 'Unauthenticated fallback webhook ingress affects 4 core downstream microservices.',
        },
        {
          level: 'Low',
          title: 'Cache Invalidation Latency',
          impact: 'Distributed vector segment invalidation may experience up to 450ms drift under peak ingestion.',
        },
      ],
      recommendations: [
        'Mandate mutual TLS (mTLS) with hardware-bound certificates on all webhook ingress handlers.',
        'Reference Security Policy #12 explicitly in Section 4.2 of Architecture Proposal v4.',
        'Confirm automated canary rollback strategy in the event of Qdrant shard partition timeout.',
      ],
      evidence: [
        {
          id: 'doc_arch_001',
          type: 'document',
          title: 'Architecture Proposal v4',
          reference: 'Section 4.2 (Ingress & Webhook Gateways)',
        },
        {
          id: 'doc_sec_002',
          type: 'policy',
          title: 'Security Policy #12 (Zero-Trust Access)',
          reference: 'Clause 3.1: Mandatory Mutual TLS (mTLS)',
        },
        {
          id: 'dec_002',
          type: 'decision',
          title: 'Decision #042: Zero-Trust Client Cert Rotation',
          reference: 'Ratified by Elena Vance (CISO)',
        },
        {
          id: 'meet_eng_alignment',
          type: 'meeting',
          title: 'Architecture Review Summit',
          reference: 'Transcript segment at 24:18 (Ingress discussion)',
        },
      ],
      availableActions: [
        {
          id: 'action_create_review_task',
          label: 'Create Review Task',
          icon: 'CheckSquare',
          requiresApproval: false,
          primary: true,
        },
        {
          id: 'action_request_waiver',
          label: 'Request CISO Policy Waiver',
          icon: 'Shield',
          requiresApproval: true,
        },
      ],
    },
  },

  'meeting-agent': {
    agentId: 'meeting-agent',
    targetName: 'Architecture Review & Multi-Tenant Retrieval Engine Alignment',
    targetType: 'Meeting',
    targetId: 'meet_eng_alignment',
    steps: [
      {
        id: 'm1',
        toolName: 'Search Transcript',
        status: 'completed',
        message: 'Searching audio transcript & speech diarization segments...',
        detail: '48 minutes of audio processed; 6 key deliberation clusters indexed',
        durationMs: 390,
      },
      {
        id: 'm2',
        toolName: 'Get Meeting Messages',
        status: 'completed',
        message: 'Retrieving meeting side-channel chat & Q&A...',
        detail: '14 messages analyzed with 3 inline code snippets and 2 RFC links',
        durationMs: 270,
      },
      {
        id: 'm3',
        toolName: 'Get Participants',
        status: 'completed',
        message: 'Extracting verified participants and voting quorum...',
        detail: 'Marcus Vance (Lead), Elena Vance (CISO), Chloe Zhang (Staff SRE), David Kim (VP Eng)',
        durationMs: 250,
      },
      {
        id: 'm4',
        toolName: 'Search Knowledge',
        status: 'completed',
        message: 'Cross-referencing specs cited during deliberation...',
        detail: 'Retrieved Architecture Proposal v4 and Decision #001',
        durationMs: 340,
      },
      {
        id: 'm5',
        toolName: 'Create Decision',
        status: 'completed',
        message: 'Formulating ratified consensus decision...',
        detail: 'Decision candidate drafted: "Vector Collection Tenant-Level Sharding Strategy"',
        durationMs: 410,
      },
      {
        id: 'm6',
        toolName: 'Create Action Item',
        status: 'completed',
        message: 'Generating owner-assigned action items...',
        detail: '2 action items synthesized with explicit due dates and priorities',
        durationMs: 320,
      },
    ],
    result: {
      status: 'APPROVED',
      statusLabel: 'SYNTHESIS COMPLETE • 1 DECISION & 2 ACTION ITEMS EXTRACTED',
      summary:
        'The team reached consensus to adopt Qdrant tenant-level sharding on staging clusters by 3:00 PM today. Elena Vance ratified the certificate rotation requirements, and Chloe Zhang was assigned the p99 latency benchmark.',
      findings: [
        {
          type: 'success',
          title: 'Consensus Reached on Vector Partitioning',
          description:
            'Marcus Vance and Elena Vance agreed to enforce tenant isolation at the Qdrant collection segment boundary with hardware-accelerated AVX-512 cosine quantization.',
        },
        {
          type: 'success',
          title: 'Unanimous Staging Rollout Schedule',
          description:
            'Staging deployment approved for canary roll with 10% query mirroring before full production rollout.',
        },
      ],
      risks: [
        {
          level: 'Low',
          title: 'Canary Latency Monitoring',
          impact: 'Ensure Datadog alerting monitors p99 tail latency during tenant shard cold-starts.',
        },
      ],
      recommendations: [
        'Push the synthesized Decision #001 to the official Collaboration Decision ledger.',
        'Assign staging canary deployment task to Marcus Vance.',
        'Schedule follow-up benchmarking review for tomorrow morning.',
      ],
      evidence: [
        {
          id: 'meet_eng_alignment',
          type: 'meeting',
          title: 'Architecture Review & Alignment Summit',
          reference: 'Timestamp 18:42: "We officially agree to tenant-level sharding on Qdrant"',
        },
        {
          id: 'doc_arch_001',
          type: 'document',
          title: 'Architecture Proposal v4',
          reference: 'Referenced by Marcus Vance during screen share',
        },
        {
          id: 'dec_001',
          type: 'decision',
          title: 'Decision #001: Vector Collection Sharding',
          reference: 'Ratified by Lead Marcus Vance & CISO Elena Vance',
        },
      ],
      availableActions: [
        {
          id: 'action_publish_decision',
          label: 'Create Ratified Decision',
          icon: 'Scale',
          requiresApproval: true,
          primary: true,
        },
        {
          id: 'action_create_action_items',
          label: 'Create Action Items',
          icon: 'ListTodo',
          requiresApproval: false,
        },
      ],
    },
  },

  'knowledge-curator': {
    agentId: 'knowledge-curator',
    targetName: 'Organization Knowledge Base (All Vaults)',
    targetType: 'Vault Collection',
    targetId: 'vault_all',
    steps: [
      {
        id: 'kc1',
        toolName: 'List Documents',
        status: 'completed',
        message: 'Enumerating vault documents across all departments...',
        detail: '42 canonical documents, 18 spec RFCs, and 12 policy files scanned',
        durationMs: 380,
      },
      {
        id: 'kc2',
        toolName: 'Search Knowledge',
        status: 'completed',
        message: 'Building semantic clustering index...',
        detail: 'Constructed dense vector graph across 384 knowledge topics',
        durationMs: 440,
      },
      {
        id: 'kc3',
        toolName: 'Find Duplicates',
        status: 'warning',
        message: 'Searching for redundant and near-duplicate documentation...',
        detail: '4 duplicate clusters found; 89% cosine similarity between vector ingestion guides',
        durationMs: 510,
      },
      {
        id: 'kc4',
        toolName: 'Find Stale Documents',
        status: 'warning',
        message: 'Evaluating document update freshness against 90-day baseline...',
        detail: '12 documents flagged with verification older than 90 days',
        durationMs: 360,
      },
      {
        id: 'kc5',
        toolName: 'Find Conflicts',
        status: 'warning',
        message: 'Extracting cross-document factual assertions...',
        detail: '3 direct conflicting statements detected between active architecture docs and security guidelines',
        durationMs: 490,
      },
      {
        id: 'kc6',
        toolName: 'Mark Superseded',
        status: 'completed',
        message: 'Preparing automated curation remediation plan...',
        detail: 'Identified 4 superseded documents recommended for immediate deprecation banner',
        durationMs: 290,
      },
    ],
    result: {
      status: 'NEEDS_REVIEW',
      statusLabel: 'CORPUS AUDIT COMPLETE • 4 DUPLICATES & 3 CONFLICTS IDENTIFIED',
      summary:
        'Knowledge Curator analyzed 42 active organization documents. Found 4 redundant duplicate pairs, 12 stale specs lacking recent owner verification, and 4 obsolete documents that should be marked superseded by newer approved versions.',
      findings: [
        {
          type: 'warning',
          title: 'Duplicate Vector Ingestion Documentation',
          description:
            '"Vector Embedding Ingestion Pipeline v1" (Platform) has 89% content overlap with "High-Throughput Stream Ingestion Engine v2" (Core Architecture).',
        },
        {
          type: 'error',
          title: 'Stale Authentication Guidance',
          description:
            '"Legacy Webhook Callback Guide" contains instructions for shared secrets, which violates Security Policy #12.',
        },
        {
          type: 'warning',
          title: 'Missing Owner on High-Traffic Spec',
          description:
            '"SSE Streaming Protocol v1" has an inactive owner (Sarah Lin) with no verified department lead review in 140 days.',
        },
      ],
      risks: [
        {
          level: 'Medium',
          title: 'Developer Confusion from Duplicate Specs',
          impact: 'Engineers onboarding may implement deprecated webhook mechanisms instead of approved mTLS.',
        },
      ],
      recommendations: [
        'Mark 4 legacy documents as Superseded with canonical redirect banners.',
        'Reassign ownership of "SSE Streaming Protocol v1" to Core Platform Lead Marcus Vance.',
        'Dispatch automated verification reminders to 7 stale document authors.',
      ],
      evidence: [
        {
          id: 'doc_arch_001',
          type: 'document',
          title: 'Architecture Proposal v4',
          reference: 'Active canonical architecture doc',
        },
        {
          id: 'doc_sec_002',
          type: 'policy',
          title: 'Security Policy #12',
          reference: 'Active zero-trust baseline policy',
        },
        {
          id: 'doc_eng_003',
          type: 'document',
          title: 'High-Throughput Stream Ingestion Engine',
          reference: 'Canonical replacement for legacy ingestion guides',
        },
      ],
      availableActions: [
        {
          id: 'action_mark_superseded',
          label: 'Mark 4 Documents as Superseded',
          icon: 'Archive',
          requiresApproval: true,
          primary: true,
        },
        {
          id: 'action_create_curator_tasks',
          label: 'Create Verification Review Tasks',
          icon: 'CheckSquare',
          requiresApproval: false,
        },
      ],
    },
  },

  'security-analyst': {
    agentId: 'security-analyst',
    targetName: 'Zero-Trust Multi-Tenant Ingress Audit',
    targetType: 'Security Perimeter',
    targetId: 'sec_perimeter_01',
    steps: [
      {
        id: 'sec1',
        toolName: 'Search Security Knowledge',
        status: 'completed',
        message: 'Querying vulnerability databases & SOC2 control matrix...',
        detail: '14 compliance controls verified across tenant data isolation & mTLS boundaries',
        durationMs: 380,
      },
      {
        id: 'sec2',
        toolName: 'Read Document',
        status: 'completed',
        message: 'Inspecting Architecture Proposal v4 & auth middleware...',
        detail: 'Evaluated cryptographic suite, TLS ciphers, and webhook signature verifiers',
        durationMs: 420,
      },
      {
        id: 'sec3',
        toolName: 'Search Policies',
        status: 'completed',
        message: 'Cross-checking with Security Policy #12 and IAM mandates...',
        detail: 'Security Policy #12 strictly requires mTLS on all inter-service connectors',
        durationMs: 290,
      },
      {
        id: 'sec4',
        toolName: 'Check Compliance',
        status: 'warning',
        message: 'Evaluating SOC2 Type II Trust Principle CC6.6 & CC6.7...',
        detail: '1 violation detected: fallback HTTP webhook ingress lacks mutual cryptographic attestation',
        durationMs: 480,
      },
      {
        id: 'sec5',
        toolName: 'Create Security Review',
        status: 'completed',
        message: 'Compiling formal CISO compliance audit docket...',
        detail: 'Risk assessment rated as HIGH exposure on fallback endpoints',
        durationMs: 340,
      },
    ],
    result: {
      status: 'CONFLICT_DETECTED',
      statusLabel: 'COMPLIANCE VIOLATION • 1 CRITICAL POLICY GAP FOUND',
      summary:
        'Security Analyst identified a direct compliance violation in Architecture Proposal v4. The proposal permits unauthenticated fallback HTTP webhooks, creating a remote spoofing vector that fails SOC2 CC6.6 and violates Security Policy #12.',
      findings: [
        {
          type: 'error',
          title: 'Unauthenticated Webhook Fallback Path',
          description:
            'Section 4.2 permits unauthenticated HTTP ingress when client certs are missing. This exposes tenant retrieval nodes to forged payload injection.',
        },
        {
          type: 'success',
          title: 'At-Rest Hardware Encryption Verified',
          description:
            'Vector sharding adheres to AES-256-GCM hardware-accelerated envelope encryption with KMS-managed customer keys.',
        },
      ],
      risks: [
        {
          level: 'High',
          title: 'Tenant Boundary Cross-Contamination',
          impact: 'Malicious webhooks could trigger vector segment re-indexing without tenant authorization.',
        },
      ],
      recommendations: [
        'Immediately remove the unauthenticated fallback webhook ingress clause from Architecture Proposal v4.',
        'Enforce mutual TLS (mTLS) with bi-weekly certificate rotation as specified in Decision #042.',
        'Require CISO (Elena Vance) sign-off prior to merging the engineering RFC.',
      ],
      evidence: [
        {
          id: 'doc_sec_002',
          type: 'policy',
          title: 'Security Policy #12 (Zero-Trust Access)',
          reference: 'Clause 3.1 & 3.4 (Strict mTLS Mandate)',
        },
        {
          id: 'doc_arch_001',
          type: 'document',
          title: 'Architecture Proposal v4',
          reference: 'Section 4.2: Fallback Webhook Ingress',
        },
        {
          id: 'dec_002',
          type: 'decision',
          title: 'Decision #042',
          reference: 'CISO Ratified Certificate Rotation Directive',
        },
      ],
      availableActions: [
        {
          id: 'action_file_ciso_review',
          label: 'File Formal CISO Review Ticket',
          icon: 'ShieldAlert',
          requiresApproval: false,
          primary: true,
        },
        {
          id: 'action_request_security_waiver',
          label: 'Request CISO Temporary Waiver',
          icon: 'Lock',
          requiresApproval: true,
        },
      ],
    },
  },

  'incident-assistant': {
    agentId: 'incident-assistant',
    targetName: 'Incident #INC-892: Staging Retrieval Gateway Latency Spike',
    targetType: 'Incident War Room',
    targetId: 'inc_892',
    steps: [
      {
        id: 'inc1',
        toolName: 'Search Incident Knowledge',
        status: 'completed',
        message: 'Querying historical postmortems for vector latency degradation...',
        detail: 'Matched Postmortem #2026-08-14: Qdrant HNSW segment compaction lock contention',
        durationMs: 340,
      },
      {
        id: 'inc2',
        toolName: 'Search Messages',
        status: 'completed',
        message: 'Analyzing #incident-retrieval war room conversation logs...',
        detail: '124 messages synthesized across 3 on-call engineers (Chloe, Marcus, Elena)',
        durationMs: 410,
      },
      {
        id: 'inc3',
        toolName: 'Search Runbooks',
        status: 'completed',
        message: 'Retrieving active SRE runbook for vector node failover...',
        detail: 'Found Runbook SRE-041: Graceful Pod Drain & Qdrant Read-Replica Promotion',
        durationMs: 290,
      },
      {
        id: 'inc4',
        toolName: 'Build Incident Timeline',
        status: 'completed',
        message: 'Constructing verified incident chronological timeline...',
        detail: 'Timeline generated: 09:14 (Spike to 1,200ms) -> 09:22 (Replica spin-up) -> 09:35 (Recovery)',
        durationMs: 450,
      },
      {
        id: 'inc5',
        toolName: 'Create Postmortem',
        status: 'completed',
        message: 'Synthesizing blameless postmortem draft & action items...',
        detail: 'Draft compiled with root cause analysis and 2 preventative action items',
        durationMs: 380,
      },
    ],
    result: {
      status: 'RESOLVED',
      statusLabel: 'INCIDENT RESOLVED • POSTMORTEM DRAFT READY FOR REVIEW',
      summary:
        'Incident Assistant reconstructed the complete incident timeline for INC-892. Staging p99 latency spiked to 1,240ms due to unquantized vector collection compaction lock contention during tenant migration. Resolved by promoting read-replica with AVX-512 quantization enabled.',
      findings: [
        {
          type: 'success',
          title: 'Root Cause Identified',
          description:
            'Qdrant collection segment compaction locked write threads for 18 minutes due to unindexed scalar filters during tenant creation.',
        },
        {
          type: 'success',
          title: 'Failover Executed Under SLA',
          description:
            'Chloe Zhang executed Runbook SRE-041, restoring p99 latency to 42ms within 21 minutes of trigger.',
        },
      ],
      risks: [
        {
          level: 'Low',
          title: 'Production Migration Pre-Requisite',
          impact: 'Production cluster must ensure scalar index creation precedes vector segment population.',
        },
      ],
      recommendations: [
        'Adopt Decision #001 requirement for pre-compaction scalar index builds.',
        'Publish Postmortem INC-892 to Organization Knowledge Base.',
        'Assign preventative automated test verification to Marcus Vance.',
      ],
      evidence: [
        {
          id: 'doc_arch_001',
          type: 'document',
          title: 'Architecture Proposal v4',
          reference: 'Section 3.1: Vector Storage Engine',
        },
        {
          id: 'meet_eng_alignment',
          type: 'meeting',
          title: 'Architecture Review Summit',
          reference: 'Transcript discussion on compaction thread locks',
        },
      ],
      availableActions: [
        {
          id: 'action_publish_postmortem',
          label: 'Publish Postmortem Draft',
          icon: 'FileText',
          requiresApproval: true,
          primary: true,
        },
        {
          id: 'action_create_incident_actions',
          label: 'Create Remediation Action Items',
          icon: 'ListTodo',
          requiresApproval: false,
        },
      ],
    },
  },
};

// ============================================================================
// 3. AGENT ACTIVITY LOG / LEDGER (ORGANIZATION-WIDE & AGENT-LEVEL)
// ============================================================================

export const INITIAL_AGENT_ACTIVITIES: AgentActivityItem[] = [
  {
    id: 'act_01',
    agentId: 'architecture-reviewer',
    agentName: 'Architecture Reviewer',
    action: 'Detected policy conflict in Architecture Proposal v4',
    target: 'Architecture Proposal v4',
    targetType: 'document',
    department: 'Engineering',
    timestamp: '10:18 AM',
    status: 'needs_review',
    evidenceDocId: 'doc_arch_001',
  },
  {
    id: 'act_02',
    agentId: 'meeting-agent',
    agentName: 'Meeting Agent',
    action: 'Extracted Decision #001 & 2 action items from Summit',
    target: 'Architecture Review Summit',
    targetType: 'meeting',
    department: 'Engineering',
    timestamp: '10:42 AM',
    status: 'approved',
    meetingId: 'meet_eng_alignment',
    decisionId: 'dec_001',
  },
  {
    id: 'act_03',
    agentId: 'knowledge-curator',
    agentName: 'Knowledge Curator',
    action: 'Identified 4 duplicate vector ingestion documents',
    target: 'Organization Knowledge Base',
    targetType: 'document',
    department: 'Organization',
    timestamp: '09:50 AM',
    status: 'needs_review',
  },
  {
    id: 'act_04',
    agentId: 'security-analyst',
    agentName: 'Security Analyst',
    action: 'Flagged unauthenticated fallback webhook ingress in Proposal v4',
    target: 'Security Policy #12',
    targetType: 'security_policy',
    department: 'Security & Compliance',
    timestamp: '09:15 AM',
    status: 'completed',
    evidenceDocId: 'doc_sec_002',
  },
  {
    id: 'act_05',
    agentId: 'incident-assistant',
    agentName: 'Incident Assistant',
    action: 'Compiled chronological timeline for Incident #INC-892',
    target: 'Incident #INC-892 War Room',
    targetType: 'channel',
    department: 'Operations',
    timestamp: '08:45 AM',
    status: 'completed',
  },
  {
    id: 'act_06',
    agentId: 'knowledge-curator',
    agentName: 'Knowledge Curator',
    action: 'Proposed deprecation of 4 superseded documents',
    target: 'Legacy Webhook Guides',
    targetType: 'document',
    department: 'Organization',
    timestamp: 'Yesterday, 04:30 PM',
    status: 'pending_approval',
  },
  {
    id: 'act_07',
    agentId: 'meeting-agent',
    agentName: 'Meeting Agent',
    action: 'Created action items for staging canary deployment',
    target: 'Marcus Vance',
    targetType: 'action_item',
    department: 'Engineering',
    timestamp: 'Yesterday, 03:15 PM',
    status: 'completed',
  },
  {
    id: 'act_08',
    agentId: 'architecture-reviewer',
    agentName: 'Architecture Reviewer',
    action: 'Verified vector collection tenant sharding against Decision #001',
    target: 'Decision #001',
    targetType: 'decision',
    department: 'Engineering',
    timestamp: 'Yesterday, 01:20 PM',
    status: 'completed',
    decisionId: 'dec_001',
  },
];

// ============================================================================
// 4. SENSITIVE AGENT APPROVAL REQUESTS (WORKFLOW)
// ============================================================================

export const INITIAL_APPROVAL_REQUESTS: AgentApprovalRequest[] = [
  {
    id: 'appr_01',
    agentId: 'knowledge-curator',
    agentName: 'Knowledge Curator',
    title: 'Mark 4 Documents as Superseded',
    reason: 'Newer approved versions exist in Canonical Architecture Vault.',
    affectedCount: 4,
    affectedItems: [
      'Legacy Webhook Callback Guide v1',
      'Vector Ingestion Pipeline Draft (Oct 2025)',
      'SSE Streaming Protocol v1 (Deprecated)',
      'Staging Ingress Architecture Notes',
    ],
    risk: 'Medium',
    status: 'pending',
    createdAt: '15 minutes ago',
    requiresRole: 'Lead or Department Head',
  },
  {
    id: 'appr_02',
    agentId: 'meeting-agent',
    agentName: 'Meeting Agent',
    title: 'Publish Ratified Decision #001 to Organization Ledger',
    reason: 'Unanimous consensus achieved in Architecture Review Summit.',
    affectedCount: 1,
    affectedItems: ['Decision #001: Vector Collection Tenant-Level Sharding Strategy'],
    risk: 'Low',
    status: 'pending',
    createdAt: '35 minutes ago',
    requiresRole: 'Engineering Lead (Marcus Vance) or CISO',
  },
  {
    id: 'appr_03',
    agentId: 'architecture-reviewer',
    agentName: 'Architecture Reviewer',
    title: 'Publish Organization-Wide Architecture Mandate',
    reason: 'Mandatory migration of all webhooks to mTLS authenticated channels.',
    affectedCount: 14,
    affectedItems: ['All 14 connected backend services'],
    risk: 'High',
    status: 'pending',
    createdAt: '1 hour ago',
    requiresRole: 'Super Admin approval (Elena Vance)',
  },
];
