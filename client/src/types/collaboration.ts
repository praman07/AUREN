import type { DepartmentSubgroup, SourceCitation } from './index';
import type { MeetingTranscriptEntry, MeetingAgentAnalysis } from './agents';


export type ChannelCategory = 'organization' | 'department' | 'direct' | 'meetings';

export type ChannelType =
  | 'broadcast'
  | 'announcement'
  | 'general'
  | 'department'
  | 'direct'
  | 'meeting'
  | 'incident'
  | 'restricted';

export interface ChannelIncidentState {
  id: string;
  status: 'Investigating' | 'Mitigated' | 'Resolved';
  severity: 'P0 - Critical' | 'P1 - High' | 'P2 - Moderate';
  incidentLead: string;
  startedAt: string;
  timeline: {
    time: string;
    event: string;
    actor: string;
  }[];
}

export interface CollaborationChannel {
  id: string;
  name: string;
  description: string;
  category: ChannelCategory;
  type: ChannelType;
  department?: string;
  minClearance?: DepartmentSubgroup;
  isRestricted?: boolean;
  memberCount: number;
  members?: string[];
  pinnedDocumentIds: string[];
  dmUserId?: string; // If it's a DM with a specific colleague or AUREN
  incidentState?: ChannelIncidentState;
  unreadCount?: number;
}

export interface AttachedKnowledgeItem {
  id: string;
  title: string;
  filename: string;
  type: string;
  department?: string;
  minClearance?: string;
  summary?: string;
  connectorType?: string;
  fileSize?: string;
}

export interface BroadcastMeta {
  title: string;
  priority: 'critical_alert' | 'policy_update' | 'announcement' | 'required_acknowledgement';
  audience: string;
  requiresAcknowledgement: boolean;
  acknowledgedCount: number;
  totalTargetCount: number;
  acknowledgedUserIds: string[];
  publishedBy: string;
  publishedRole: string;
  publishedAt: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface MessageMention {
  type: 'user' | 'department' | 'knowledge' | 'ai';
  targetId: string;
  label: string;
}

export interface CollaborationMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderDepartment: string;
  senderAvatar: string;
  senderClearance?: string;
  timestamp: string;
  content: string;
  isAurenAi?: boolean;
  isBroadcast?: boolean;
  broadcastMeta?: BroadcastMeta;
  attachedKnowledge?: AttachedKnowledgeItem[];
  mentions?: MessageMention[];
  reactions?: MessageReaction[];
  replyCount?: number;
  threadId?: string; // If this message belongs to a thread
  decisionId?: string;
  actionItemId?: string;
  isSaved?: boolean;
  sources?: SourceCitation[];
}

export interface CollaborationDecision {
  id: string;
  channelId: string;
  messageId?: string;
  meetingId?: string;
  meetingTitle?: string;
  title: string;
  decisionText: string;
  status: 'Approved' | 'In Review' | 'Implemented' | 'Proposed';
  owner: string;
  ownerDepartment: string;
  date: string;
  sources: { id: string; title: string }[];
  actionItemIds: string[];
}

export interface CollaborationActionItem {
  id: string;
  channelId: string;
  messageId?: string;
  meetingId?: string;
  meetingTitle?: string;
  title: string;
  assignedTo: string;
  assignedToAvatar?: string;
  assignedToDepartment: string;
  dueDate: string;
  status: 'Open' | 'Completed';
  completedAt?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export interface MeetingParticipant {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  department: string;
  isMuted?: boolean;
  isVideoOn?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
}

export interface PostMeetingSummary {
  summary: string;
  keyDecisions: string[];
  actionItems: { assignee: string; task: string }[];
  referencedKnowledge: string[];
  generatedAt: string;
}

export interface CollaborationMeeting {
  id: string;
  title: string;
  channelId?: string;
  department?: string;
  scheduledTime: string;
  status: 'upcoming' | 'active' | 'completed';
  participants: MeetingParticipant[];
  attachedDocumentIds: string[];
  agenda: string[];
  notes: string[];
  postMeetingSummary?: PostMeetingSummary;
  transcript?: MeetingTranscriptEntry[];
  meetingAnalysis?: MeetingAgentAnalysis;
}

export type UserPresence = 'online' | 'away' | 'in_meeting' | 'offline';
