export type Scope = 'all' | 'personal' | 'departmental' | 'enterprise' | 'organization';
export type KnowledgeScope = Scope;

export type NavigationTab =
  | 'library'
  | 'chat'
  | 'collaboration'
  | 'meetings'
  | 'agents'
  | 'organizational-memory'
  | 'memory'
  | 'architecture-reviewer'
  | 'knowledge-curator'
  | 'search'
  | 'connectors'
  | 'connectors/github'
  | 'rbac'
  | 'super_admin'
  | 'super-admin'
  | 'settings'
  | 'profile';

export * from './agents';

export type UserRole = 'member' | 'engineer' | 'lead' | 'admin' | 'super_admin' | 'dept_head';

export interface DepartmentInfo {
  id: string;
  name: string;
  head: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    title: string;
  };
  memberCount: number;
  documentCount: number;
  storageUsed: string;
  subfields: string[];
  status: 'active' | 'review' | 'locked';
  lastUpdatedByAdmin?: string;
  lastAdminAction?: string;
}

export interface SuperAdminActionItem {
  id: string;
  actionType: 'publish_enterprise_doc' | 'override_department_policy' | 'broadcast_directive' | 'reassign_head' | 'security_lockdown';
  targetDepartment?: string;
  title: string;
  description: string;
  executedBy: string;
  timestamp: string;
  notifiedHeads: string[];
  acknowledged?: boolean;
}

export type DepartmentSubgroup = 'senior' | 'mid_senior' | 'junior' | 'intern' | 'trainee' | 'no_access';

export interface DepartmentMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  department: string;
  departments: string[]; // Supports multiple departments
  subgroup: DepartmentSubgroup;
  domain?: string; // Specific domain/specialization (especially for interns/trainees)
  subfields?: string[]; // Dynamic subfields created by department head
  title: string;
  joinedAt: string;
  status: 'active' | 'on_leave' | 'inactive';
  clearanceLevel: 'L1_Trainee' | 'L2_Intern' | 'L3_Junior' | 'L4_Senior' | 'L5_Principal';
  assignedProjects: string[];
}

export interface AllowedSpecificMember {
  id: string;
  name: string;
  department: string;
  email?: string;
  avatarUrl?: string;
}

export interface RbacAuditLogItem {
  id: string;
  action: 'grant_doc_access' | 'revoke_doc_access' | 'add_member' | 'remove_member' | 'shift_department' | 'shift_subgroup' | 'create_subfield' | 'batch_clearance';
  target: string;
  actor: string;
  actorRole: string;
  details: string;
  timestamp: string;
}

export type DocumentType = 'pdf' | 'markdown' | 'code' | 'text' | 'spec';

export type ProcessingState =
  | 'uploading'
  | 'processing'
  | 'extracting'
  | 'building_knowledge'
  | 'generating_overview'
  | 'ready'
  | 'failed';

export interface UserProfile {
  id: string;
  name: string;
  firstName: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  title?: string;
  department: string;
  isSuperAdmin?: boolean;
  isDepartmentHead?: boolean;
  organization: {
    id: string;
    name: string;
    domain: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultScope: 'personal' | 'organization';
    defaultChatBehavior: 'concise' | 'in_depth' | 'technical';
    realtimeSync: boolean;
    notifyOnDocumentReady: boolean;
    notifyOnConnectorSync: boolean;
  };
  personalContext?: {
    preferredLanguage: string;
    currentProject: string;
    recentInterests: string[];
  };
}

export interface DocumentSection {
  title: string;
  summary: string;
  page?: number;
}

export interface DocumentIntelligence {
  documentType: string;
  executiveSummary: string;
  keyTopics: string[];
  readingTimeMinutes: number;
  technologies: string[];
  entities: string[];
  aiTags: string[];
  documentPurpose: string;
  importantSections: DocumentSection[];
  pageCount?: number;
  headingsCount?: number;
  tablesCount?: number;
  visualSummary?: string;
  codeDetails?: {
    language: string;
    framework: string;
    architectureConcepts: string[];
    majorComponents: string[];
    importantFiles: string[];
    projectOverview: string;
  };
}

export interface DocumentAccessPolicy {
  ownerId: string;
  ownerName: string;
  scope: 'personal' | 'organization';
  allowedRoles: UserRole[];
  allowedDepartments: string[];
  allowedSubgroups?: DepartmentSubgroup[];
  minSubgroupLevel?: DepartmentSubgroup;
  allowedSubfields?: string[]; // Allowed departmental subfields / subcategories
  allowedDomains?: string[]; // Allowed intern domain specializations
  allowedSpecificMembers?: AllowedSpecificMember[]; // Specific individual members from any department
  isRestricted: boolean;
}

export interface VersionHistoryItem {
  version: string;
  timestamp: string;
  author: string;
  changeSummary: string;
  commitSha?: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

export interface RelatedDocument {
  id: string;
  title: string;
  scope: 'personal' | 'organization';
  similarityScore: number;
  reason: string;
  type: DocumentType;
}

export interface AurenDocument {
  id: string;
  title: string;
  filename: string;
  type: DocumentType;
  scope: Scope;
  knowledgeTier?: 'personal' | 'departmental' | 'enterprise';
  department?: string; // Specific department (e.g. 'Core Architecture', 'Security & Compliance', or 'Global / Enterprise')
  isEnterpriseSuperOrg?: boolean;
  managedByRole?: 'super_admin' | 'dept_head' | 'member';
  source: 'direct_upload' | 'github' | 'google_drive' | 'notion' | 'slack';
  sourceMetadata?: {
    repo?: string;
    branch?: string;
    commitSha?: string;
    externalUrl?: string;
  };
  fileSize: string;
  updatedAt: string;
  createdAt: string;
  status: ProcessingState;
  statusDetail?: string;
  intelligence?: DocumentIntelligence;
  accessPolicy: DocumentAccessPolicy;
  versionHistory: VersionHistoryItem[];
  activityLog: ActivityLogItem[];
  relatedDocuments?: RelatedDocument[];
  rawContent?: string;
}

export type SourceType = 'internal_document' | 'github' | 'web' | 'visual';

export interface SourceCitation {
  id: string;
  type: SourceType;
  title: string;
  scope?: 'personal' | 'organization';
  documentId?: string;
  sourceUrl?: string;
  repo?: string;
  commitSha?: string;
  snippet: string;
  confidence: number;
  timestamp?: string;
}

export interface WebSourceSuggestion {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  favicon?: string;
}

export interface KnowledgeBaseImage {
  id: string;
  title: string;
  caption?: string;
  imageUrl: string;
  sourceDocId?: string;
  sourceDocTitle?: string;
  dimensions?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceCitation[];
  webSuggestions?: WebSourceSuggestion[];
  orgImages?: KnowledgeBaseImage[];
  groundingScope?: 'personal' | 'organization' | 'hybrid' | 'web';
  attachedDocumentIds?: string[];
  suggestedFollowUps?: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  scope: 'personal' | 'organization' | 'hybrid';
  pinned?: boolean;
  messages: ChatMessage[];
  attachedDocuments?: { id: string; title: string; type: DocumentType }[];
}

export interface ConnectorPolicy {
  allowedUsers: string[];
  allowedRoles: UserRole[];
  allowedDepartments: string[];
  allowAllOrg: boolean;
}

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  lastCommitSha: string;
  lastCommitMessage: string;
  lastSyncAt: string;
  syncedFilesCount: number;
  status: 'synced' | 'syncing' | 'error';
}

export interface Connector {
  id: string;
  type:
    | 'github'
    | 'google_drive'
    | 'gmail'
    | 'notion'
    | 'slack'
    | 'jira'
    | 'linear'
    | 'figma'
    | 'onedrive';
  name: string;
  scope: 'personal' | 'organization';
  connected: boolean;
  account?: string;
  resourceCount: number;
  lastSyncAt?: string;
  status: 'active' | 'syncing' | 'disconnected' | 'error';
  policy: ConnectorPolicy;
  githubDetails?: {
    organization: string;
    repositories: GitHubRepo[];
    webhookActive: boolean;
    webhookUrl: string;
    lastWebhookEvent?: {
      event: string;
      repo: string;
      commitSha: string;
      timestamp: string;
    };
  };
}

export type ConnectorItemType =
  | 'repository'
  | 'pull_request'
  | 'file'
  | 'document'
  | 'page'
  | 'email'
  | 'issue'
  | 'message'
  | 'board';

export interface ConnectorDataItem {
  id: string;
  connectorId: string;
  connectorName: string;
  connectorType: Connector['type'];
  title: string;
  itemType: ConnectorItemType;
  scope: 'personal' | 'organization';
  parentGroup: string; // e.g. "auren-core/retrieval-service", "Engineering Architecture", "Personal Vault", "#arch-review"
  nestedPath?: string; // e.g. "src/vector/qdrant.ts", "2026/Q2-Roadmap.gdoc"
  author: string;
  syncedAt: string;
  status: 'synced' | 'syncing' | 'error' | 'pending';
  sizeOrCount?: string;
  tags?: string[];
  summary: string;
  externalUrl?: string;
  metadata?: {
    commitSha?: string;
    branch?: string;
    issueKey?: string;
    priority?: string;
    assignee?: string;
    channel?: string;
    labels?: string[];
  };
}

export interface NotificationItem {
  id: string;
  type:
    | 'document_ready'
    | 'document_failed'
    | 'github_sync'
    | 'connector_connected'
    | 'document_shared'
    | 'permission_updated'
    | 'super_admin_action'
    | 'department_directive';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  entityId?: string;
  entityType?: 'document' | 'connector' | 'chat' | 'department' | 'super_admin';
  actionUrl?: string;
  priority?: 'normal' | 'high' | 'urgent';
  actor?: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  type: 'document' | 'code' | 'conversation' | 'source';
  scope: 'personal' | 'organization';
  sourceName: string;
  updatedAt: string;
  documentId?: string;
  url?: string;
}
