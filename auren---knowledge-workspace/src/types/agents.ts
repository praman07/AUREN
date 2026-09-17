export interface MeetingTranscriptEntry {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerRole: string;
  speakerAvatar: string;
  speakerDept: string;
  timestamp: string;
  text: string;
  linkedCitation?: { title: string; docId?: string };
}

export interface MeetingDecisionCandidate {
  id: string;
  title: string;
  context: string;
  evidence: string;
  evidenceDocId?: string;
}

export interface MeetingActionItemCandidate {
  id: string;
  task: string;
  owner: string;
  ownerDepartment: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface MeetingAgentAnalysis {
  executiveSummary: string;
  keyDecisions: MeetingDecisionCandidate[];
  actionItems: MeetingActionItemCandidate[];
  openQuestions: string[];
  risks: {
    risk: string;
    severity: 'High' | 'Medium' | 'Low';
    mitigation: string;
  }[];
  referencedKnowledge: {
    id: string;
    title: string;
    type?: string;
    snippet?: string;
  }[];
  analyzedAt: string;
}

export type ReviewStatus = 'APPROVED' | 'NEEDS_REVIEW' | 'CONFLICT';

export interface ArchitectureReviewEvidence {
  type: 'document' | 'policy' | 'decision' | 'meeting' | 'discussion';
  title: string;
  id: string;
  snippet?: string;
}

export interface ArchitectureReviewFinding {
  id: string;
  type: 'alignment' | 'concern' | 'conflict';
  title: string;
  description: string;
  evidence: ArchitectureReviewEvidence[];
}

export interface ArchitectureReviewRisk {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  impact: string;
}

export interface ArchitectureReviewResult {
  documentId: string;
  documentTitle: string;
  overallStatus: ReviewStatus;
  statusSummary: string;
  findings: ArchitectureReviewFinding[];
  risks: ArchitectureReviewRisk[];
  recommendations: string[];
  reviewedAt: string;
  analyzedAgainst: {
    relatedDocs: number;
    policies: number;
    decisions: number;
    discussions: number;
    meetings: number;
  };
}

export type KnowledgeIssueCategory =
  | 'duplicates'
  | 'stale'
  | 'conflicts'
  | 'missing_owners'
  | 'superseded'
  | 'disconnected';

export interface KnowledgeCuratorIssue {
  id: string;
  category: KnowledgeIssueCategory;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  primaryDoc: {
    id: string;
    title: string;
    updatedAt?: string;
    department?: string;
  };
  relatedDoc?: {
    id: string;
    title: string;
    updatedAt?: string;
  };
  conflictDetail?: string;
  suggestedAction: string;
}

export interface KnowledgeAuditResult {
  scope: 'all' | 'department' | 'collection';
  scopeLabel: string;
  healthScore: number;
  analyzedDocumentsCount: number;
  issuesSummary: {
    duplicates: number;
    stale: number;
    conflicts: number;
    missingOwners: number;
    superseded: number;
    disconnected: number;
  };
  issues: KnowledgeCuratorIssue[];
  auditedAt: string;
}

export interface MemoryDocumentNode {
  id: string;
  title: string;
  type: string;
  scope: string;
  clearance?: string;
  relationship: string;
}

export interface MemoryMessageNode {
  id: string;
  channelId: string;
  channelName: string;
  senderName: string;
  timestamp: string;
  snippet: string;
}

export interface MemoryThreadNode {
  id: string;
  channelId: string;
  topic: string;
  replyCount: number;
  participants: string[];
}

export interface MemoryMeetingNode {
  id: string;
  title: string;
  date: string;
  participantsCount: number;
}

export interface MemoryTranscriptNode {
  meetingId: string;
  speakerName: string;
  quote: string;
  timestamp: string;
}

export interface MemoryDecisionNode {
  id: string;
  title: string;
  status: string;
  owner: string;
  date: string;
  decisionText: string;
}

export interface MemoryActionItemNode {
  id: string;
  title: string;
  assignedTo: string;
  status: string;
  dueDate: string;
  priority?: string;
}

export interface KnowledgeAuditItem {
  id: string;
  type: 'duplicate' | 'stale' | 'conflict' | 'unverified';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  documentId: string;
  documentTitle: string;
  relatedDocId?: string;
  relatedDocTitle?: string;
  similarityScore?: number;
  lastUpdatedDaysAgo?: number;
  owner?: string;
  department?: string;
  conflictDetails?: string;
  status: 'active' | 'resolved' | 'dismissed';
}

export type AgentToolStatus = 'allowed' | 'restricted' | 'approval_required';

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  status: AgentToolStatus;
  category?: 'search' | 'read' | 'create' | 'modify' | 'compliance';
}

export interface AgentExecutionTraceStep {
  id: string;
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'warning' | 'error';
  message: string;
  detail?: string;
  durationMs?: number;
}

export interface AgentActivityItem {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  target: string;
  targetType: 'document' | 'meeting' | 'decision' | 'channel' | 'security_policy' | 'action_item';
  department: string;
  timestamp: string;
  status: 'completed' | 'needs_review' | 'pending_approval' | 'approved' | 'rejected';
  evidenceDocId?: string;
  decisionId?: string;
  meetingId?: string;
}

export interface AgentApprovalRequest {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  reason: string;
  affectedCount: number;
  affectedItems?: string[];
  risk: 'Low' | 'Medium' | 'High';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  requiresRole: string;
  payload?: any;
}

export interface AgentAccessExplanation {
  organization: string;
  organizationAllowed: boolean;
  department: string;
  departmentAllowed: boolean;
  clearance: string;
  clearanceAllowed: boolean;
  policy: string;
  policyAllowed: boolean;
  allowedToolCount: number;
  restrictedToolCount: number;
  decision: 'ACCESS GRANTED' | 'ACCESS DENIED';
  denialReason?: string;
}

export interface GovernedAgent {
  id: string;
  name: string;
  role: string;
  avatarIcon: string;
  purpose: string;
  departmentScope: string;
  knowledgeScope: string[];
  restrictedKnowledge: string[];
  minClearance: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  status: 'available' | 'restricted' | 'paused';
  tools: AgentTool[];
  restrictedTools: AgentTool[];
  approvalActions: string[];
  lastRun?: string;
  accessExplanation: AgentAccessExplanation;
}

export interface OrganizationalMemoryNode {
  id: string;
  type: 'document' | 'decision' | 'meeting' | 'thread' | 'message' | 'policy' | 'action_item';
  title: string;
  description: string;
  date?: string;
  timestamp?: string;
  author?: string;
  department?: string;
  clearance?: string;
  status?: string;
  relatedDocId?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface OrganizationalMemoryConnection {
  fromNodeId: string;
  toNodeId: string;
  source?: string;
  target?: string;
  relationship: string;
  label?: string;
}

export interface OrganizationalMemoryTrace {
  id?: string;
  rootObjectId: string;
  rootObjectType: 'document' | 'meeting' | 'decision';
  title: string;
  summary: string;
  description?: string;
  nodes?: OrganizationalMemoryNode[];
  connections?: OrganizationalMemoryConnection[];
  documents?: MemoryDocumentNode[];
  messages?: MemoryMessageNode[];
  threads?: MemoryThreadNode[];
  meetings?: MemoryMeetingNode[];
  transcripts?: MemoryTranscriptNode[];
  decisions?: MemoryDecisionNode[];
  actionItems?: MemoryActionItemNode[];
}
