import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CollaborationChannel,
  CollaborationMessage,
  CollaborationDecision,
  CollaborationActionItem,
  CollaborationMeeting,
  UserPresence,
  AttachedKnowledgeItem,
  BroadcastMeta,
} from '../types/collaboration';
import { MeetingAgentAnalysis } from '../types/agents';
import { generateMeetingAnalysis } from '../services/agentData';
import {
  INITIAL_CHANNELS,
  INITIAL_MESSAGES,
  INITIAL_DECISIONS,
  INITIAL_ACTION_ITEMS,
  INITIAL_MEETINGS,
  INITIAL_PRESENCE,
} from '../services/collaborationData';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { AurenDocument } from '../types';

interface CollaborationContextType {
  channels: CollaborationChannel[];
  activeChannelId: string;
  activeChannel: CollaborationChannel | undefined;
  messages: CollaborationMessage[];
  threadMessages: CollaborationMessage[];
  activeThreadRootMessage: CollaborationMessage | null;
  decisions: CollaborationDecision[];
  actionItems: CollaborationActionItem[];
  meetings: CollaborationMeeting[];
  activeMeeting: CollaborationMeeting | null;
  presence: Record<string, UserPresence>;
  savedMessages: CollaborationMessage[];
  isPinnedKnowledgeOpen: boolean;
  isDecisionsOpen: boolean;
  channelSearchQuery: string;

  // Actions
  selectChannel: (channelId: string) => void;
  sendMessage: (
    content: string,
    attachedKnowledge?: AttachedKnowledgeItem[],
    mentions?: CollaborationMessage['mentions']
  ) => void;
  sendThreadReply: (
    rootMessageId: string,
    content: string,
    attachedKnowledge?: AttachedKnowledgeItem[]
  ) => void;
  sendAurenInquiry: (
    prompt: string,
    targetChannelId?: string,
    contextMessage?: CollaborationMessage
  ) => Promise<void>;
  acknowledgeBroadcast: (messageId: string) => void;
  publishBroadcast: (data: {
    title: string;
    message: string;
    priority: BroadcastMeta['priority'];
    requiresAcknowledgement: boolean;
    attachedDocs: AttachedKnowledgeItem[];
    audience?: string;
  }) => void;
  createDecision: (data: {
    title: string;
    decisionText: string;
    sources?: { id: string; title: string }[];
    status?: CollaborationDecision['status'];
    meetingId?: string;
    meetingTitle?: string;
  }) => void;
  createActionItem: (data: {
    title: string;
    assignedTo: string;
    assignedToDepartment?: string;
    dueDate: string;
    priority?: 'High' | 'Medium' | 'Low';
    meetingId?: string;
    meetingTitle?: string;
  }) => void;
  toggleActionItemComplete: (actionId: string) => void;
  toggleSaveMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  openThread: (message: CollaborationMessage) => void;
  closeThread: () => void;
  joinMeeting: (meetingId: string) => void;
  leaveMeeting: () => void;
  endMeetingAndGenerateSummary: (meetingId: string) => void;
  selectedMeetingId: string | null;
  setSelectedMeetingId: (id: string | null) => void;
  analyzeMeetingWithAuren: (meetingId: string) => Promise<MeetingAgentAnalysis>;
  isAnalyzingMeeting: boolean;
  pinKnowledgeToChannel: (channelId: string, docId: string) => void;
  unpinKnowledgeFromChannel: (channelId: string, docId: string) => void;
  createChannel: (data: {
    name: string;
    description: string;
    category: CollaborationChannel['category'];
    department?: string;
    type?: CollaborationChannel['type'];
    minClearance?: CollaborationChannel['minClearance'];
  }) => void;
  setChannelSearchQuery: (query: string) => void;
  setIsPinnedKnowledgeOpen: (isOpen: boolean) => void;
  setIsDecisionsOpen: (isOpen: boolean) => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{
  children: React.ReactNode;
  documents: AurenDocument[];
  onOpenDocument: (doc: AurenDocument) => void;
}> = ({ children, documents, onOpenDocument }) => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [channels, setChannels] = useState<CollaborationChannel[]>(INITIAL_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>('org_broadcast');
  const [messages, setMessages] = useState<CollaborationMessage[]>(INITIAL_MESSAGES);
  const [decisions, setDecisions] = useState<CollaborationDecision[]>(INITIAL_DECISIONS);
  const [actionItems, setActionItems] = useState<CollaborationActionItem[]>(INITIAL_ACTION_ITEMS);
  const [meetings, setMeetings] = useState<CollaborationMeeting[]>(INITIAL_MEETINGS);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isAnalyzingMeeting, setIsAnalyzingMeeting] = useState(false);
  const [presence] = useState<Record<string, UserPresence>>(INITIAL_PRESENCE);
  const [activeThreadRootMessage, setActiveThreadRootMessage] = useState<CollaborationMessage | null>(null);
  const [isPinnedKnowledgeOpen, setIsPinnedKnowledgeOpen] = useState(false);
  const [isDecisionsOpen, setIsDecisionsOpen] = useState(false);
  const [channelSearchQuery, setChannelSearchQuery] = useState('');

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeMeeting = meetings.find((m) => m.id === activeMeetingId) || null;

  // Filter messages for active channel (or search filtered)
  const channelMessages = (messages || []).filter((m) => m.channelId === activeChannelId && !m.threadId);
  const threadMessages = activeThreadRootMessage
    ? (messages || []).filter((m) => m.threadId === activeThreadRootMessage.id)
    : [];

  const savedMessages = (messages || []).filter((m) => m.isSaved);

  const selectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    setActiveThreadRootMessage(null);
    setIsPinnedKnowledgeOpen(false);
    setIsDecisionsOpen(false);
    setChannelSearchQuery('');
    // Mark channel unread count as 0
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const sendMessage = (
    content: string,
    attachedKnowledge?: AttachedKnowledgeItem[],
    mentions?: CollaborationMessage['mentions']
  ) => {
    if (!content.trim() && (!attachedKnowledge || attachedKnowledge.length === 0)) return;

    const newMsg: CollaborationMessage = {
      id: `msg_${Date.now()}`,
      channelId: activeChannelId,
      senderId: user?.id || 'usr_praman_101',
      senderName: user?.name || 'Praman Singh Bhogal',
      senderRole: user?.role === 'super_admin' ? 'Super Admin' : user?.title || 'Core Architecture Lead',
      senderDepartment: user?.department || 'Core Architecture',
      senderAvatar:
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      timestamp: 'Just now',
      content,
      attachedKnowledge,
      mentions,
      reactions: [],
      replyCount: 0,
    };

    setMessages((prev) => [...prev, newMsg]);

    // If message mentions @AUREN or is sent to dm_auren_ai, auto-trigger AI assistant response!
    const mentionsAuren =
      activeChannelId === 'dm_auren_ai' ||
      mentions?.some((m) => m.type === 'ai' || m.label.toLowerCase().includes('auren')) ||
      content.toLowerCase().includes('@auren');

    if (mentionsAuren) {
      setTimeout(() => {
        sendAurenInquiry(content, activeChannelId, newMsg);
      }, 700);
    }
  };

  const sendThreadReply = (
    rootMessageId: string,
    content: string,
    attachedKnowledge?: AttachedKnowledgeItem[]
  ) => {
    if (!content.trim() && (!attachedKnowledge || attachedKnowledge.length === 0)) return;

    const replyMsg: CollaborationMessage = {
      id: `reply_${Date.now()}`,
      channelId: activeChannelId,
      threadId: rootMessageId,
      senderId: user?.id || 'usr_praman_101',
      senderName: user?.name || 'Praman Singh Bhogal',
      senderRole: user?.role === 'super_admin' ? 'Super Admin' : user?.title || 'Core Architecture Lead',
      senderDepartment: user?.department || 'Core Architecture',
      senderAvatar:
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      timestamp: 'Just now',
      content,
      attachedKnowledge,
      reactions: [],
    };

    setMessages((prev) => {
      // update root message replyCount
      return prev
        .map((m) => (m.id === rootMessageId ? { ...m, replyCount: (m.replyCount || 0) + 1 } : m))
        .concat(replyMsg);
    });

    if (content.toLowerCase().includes('@auren')) {
      setTimeout(() => {
        sendAurenInquiry(content, activeChannelId, replyMsg);
      }, 700);
    }
  };

  // Ask AUREN directly inside chat/threads
  const sendAurenInquiry = async (
    prompt: string,
    targetChannelId?: string,
    contextMessage?: CollaborationMessage
  ) => {
    const chanId = targetChannelId || activeChannelId;

    // Build synthesized AI answer grounded in AUREN documentation
    let answer = `**AUREN Synthesis & Knowledge Verification**\n\n`;

    if (prompt.toLowerCase().includes('summarize') || prompt.toLowerCase().includes('decision')) {
      answer += `I have reviewed the conversation thread and organizational policies:\n\n` +
        `• **Consensus Reached**: The team agreed on tenant-level sharding for vector retrieval to optimize p99 latency by ~38%.\n` +
        `• **Security Verification**: Zero-trust HMAC envelope keys strictly partition memory segments to prevent cross-tenant leakage.\n` +
        `• **Active Action Items**: Staging cluster canary deployment is assigned to Marcus Vance, with performance verification by Chloe Zhang.`;
    } else if (prompt.toLowerCase().includes('explain') || prompt.toLowerCase().includes('security') || prompt.toLowerCase().includes('policy')) {
      answer += `According to §2.4 of the **Zero-Trust Enterprise Vault Specification v4.2**:\n\n` +
        `1. Hardware security keys (FIDO2 WebAuthn) are mandatory for all production ingress nodes.\n` +
        `2. Department clearance policies enforce cryptographic token segregation at the kernel memory barrier.\n` +
        `3. All cross-department data sharing requires either explicit Super Admin clearance override or certified Department Head sign-off.`;
    } else {
      answer += `Based on the attached knowledge context and our system architecture standards:\n\n` +
        `• The proposed approach complies with AUREN multi-tenant sharding guidelines.\n` +
        `• Latency and throughput parameters remain well within our SLA target (<50ms p99 at 50,000 QPS).\n` +
        `• Recommended next step: ratify the decision and track execution status in the channel decisions ledger.`;
    }

    const aurenMsg: CollaborationMessage = {
      id: `auren_${Date.now()}`,
      channelId: chanId,
      threadId: contextMessage?.threadId ? contextMessage.threadId : (contextMessage?.id && contextMessage.channelId !== 'dm_auren_ai' ? contextMessage.id : undefined),
      senderId: 'auren_ai',
      senderName: 'AUREN',
      senderRole: 'AI Knowledge Engine',
      senderDepartment: 'Autonomous Intelligence',
      senderAvatar: '',
      timestamp: 'Just now',
      isAurenAi: true,
      content: answer,
      sources: [
        {
          id: 'src_auto_001',
          type: 'internal_document',
          title: 'AUREN System Architecture & Multi-Tenant Retrieval Engine',
          documentId: 'doc_arch_001',
          snippet: 'Tenant collections are partitioned with distinct envelope keys derived via HMAC-SHA256 from the master secret.',
          confidence: 0.96,
        },
        {
          id: 'src_auto_002',
          type: 'internal_document',
          title: 'Zero-Trust Enterprise Vault Specification',
          documentId: 'doc_sec_002',
          snippet: 'Access is evaluated on every segment retrieval against the active RBAC matrix.',
          confidence: 0.94,
        },
      ],
      reactions: [
        { emoji: '💡', count: 2, users: ['usr_praman_101'] },
      ],
    };

    setMessages((prev) => {
      if (aurenMsg.threadId) {
        return prev
          .map((m) => (m.id === aurenMsg.threadId ? { ...m, replyCount: (m.replyCount || 0) + 1 } : m))
          .concat(aurenMsg);
      }
      return [...prev, aurenMsg];
    });
  };

  // Acknowledge official broadcast
  const acknowledgeBroadcast = (messageId: string) => {
    const currentUserId = user?.id || 'usr_praman_101';
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.broadcastMeta) {
          const alreadyAcked = msg.broadcastMeta.acknowledgedUserIds.includes(currentUserId);
          const newAcked = alreadyAcked
            ? msg.broadcastMeta.acknowledgedUserIds.filter((id) => id !== currentUserId)
            : [...msg.broadcastMeta.acknowledgedUserIds, currentUserId];

          return {
            ...msg,
            broadcastMeta: {
              ...msg.broadcastMeta,
              acknowledgedUserIds: newAcked,
              acknowledgedCount: newAcked.length,
            },
          };
        }
        return msg;
      })
    );
  };

  // Publish official Super Admin broadcast
  const publishBroadcast = (data: {
    title: string;
    message: string;
    priority: BroadcastMeta['priority'];
    requiresAcknowledgement: boolean;
    attachedDocs: AttachedKnowledgeItem[];
    audience?: string;
  }) => {
    const newBroadcastMsg: CollaborationMessage = {
      id: `broadcast_${Date.now()}`,
      channelId: 'org_broadcast',
      senderId: user?.id || 'usr_super_admin_elena',
      senderName: user?.name || 'Elena Vance',
      senderRole: 'Super Admin',
      senderDepartment: 'Executive Security & Governance',
      senderAvatar:
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      senderClearance: 'L5_Principal',
      timestamp: 'Just now',
      content: data.message,
      isBroadcast: true,
      broadcastMeta: {
        title: data.title,
        priority: data.priority,
        audience: data.audience || 'All Organizational Personnel',
        requiresAcknowledgement: data.requiresAcknowledgement,
        acknowledgedCount: 1,
        totalTargetCount: 58,
        acknowledgedUserIds: [user?.id || 'usr_super_admin_elena'],
        publishedBy: `${user?.name || 'Elena Vance'} (Super Admin)`,
        publishedRole: 'Executive Security & Governance',
        publishedAt: `${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC`,
      },
      attachedKnowledge: data.attachedDocs,
      reactions: [{ emoji: '🔒', count: 1, users: [user?.id || 'usr_super_admin_elena'] }],
      replyCount: 0,
    };

    setMessages((prev) => [newBroadcastMsg, ...prev]);

    // Send notification to all departments
    refreshNotifications();
  };

  // Create lightweight Decision
  const createDecision = (data: {
    title: string;
    decisionText: string;
    sources?: { id: string; title: string }[];
    status?: CollaborationDecision['status'];
    meetingId?: string;
    meetingTitle?: string;
  }) => {
    const newDecision: CollaborationDecision = {
      id: `dec_${Date.now()}`,
      channelId: activeChannelId,
      title: data.title,
      decisionText: data.decisionText,
      status: data.status || 'Approved',
      owner: user?.name || 'Core Architecture Team',
      ownerDepartment: user?.department || 'Core Architecture',
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      sources: data.sources || [],
      actionItemIds: [],
      meetingId: data.meetingId,
      meetingTitle: data.meetingTitle,
    };

    setDecisions((prev) => [newDecision, ...prev]);

    // Also inject a notification-like decision card into the channel
    const decMsg: CollaborationMessage = {
      id: `msg_dec_${Date.now()}`,
      channelId: activeChannelId,
      senderId: user?.id || 'usr_praman_101',
      senderName: user?.name || 'Praman Singh Bhogal',
      senderRole: user?.role === 'super_admin' ? 'Super Admin' : user?.title || 'Core Architecture Lead',
      senderDepartment: user?.department || 'Core Architecture',
      senderAvatar:
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      timestamp: 'Just now',
      content: `Recorded organizational decision: **${data.title}**\n\n*${data.decisionText}*${data.meetingTitle ? `\n\n*(Ratified during meeting: ${data.meetingTitle})*` : ''}`,
      decisionId: newDecision.id,
      reactions: [{ emoji: '⚖️', count: 1, users: [user?.id || 'usr_praman_101'] }],
    };

    setMessages((prev) => [...prev, decMsg]);
  };

  // Create lightweight Action Item
  const createActionItem = (data: {
    title: string;
    assignedTo: string;
    assignedToDepartment?: string;
    dueDate: string;
    priority?: 'High' | 'Medium' | 'Low';
    meetingId?: string;
    meetingTitle?: string;
  }) => {
    const newAction: CollaborationActionItem = {
      id: `act_${Date.now()}`,
      channelId: activeChannelId,
      title: data.title,
      assignedTo: data.assignedTo,
      assignedToDepartment: data.assignedToDepartment || user?.department || 'Core Architecture',
      dueDate: data.dueDate,
      status: 'Open',
      priority: data.priority || 'Medium',
      meetingId: data.meetingId,
      meetingTitle: data.meetingTitle,
    };

    setActionItems((prev) => [newAction, ...prev]);

    const actMsg: CollaborationMessage = {
      id: `msg_act_${Date.now()}`,
      channelId: activeChannelId,
      senderId: user?.id || 'usr_praman_101',
      senderName: user?.name || 'Praman Singh Bhogal',
      senderRole: user?.role === 'super_admin' ? 'Super Admin' : user?.title || 'Core Architecture Lead',
      senderDepartment: user?.department || 'Core Architecture',
      senderAvatar:
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      timestamp: 'Just now',
      content: `Created action item: **${data.title}** (Assigned to: ${data.assignedTo}, Due: ${data.dueDate}, Priority: ${newAction.priority})${data.meetingTitle ? `\n*(From meeting: ${data.meetingTitle})*` : ''}`,
      actionItemId: newAction.id,
      reactions: [{ emoji: '📋', count: 1, users: [user?.id || 'usr_praman_101'] }],
    };

    setMessages((prev) => [...prev, actMsg]);
  };

  const toggleActionItemComplete = (actionId: string) => {
    setActionItems((prev) =>
      prev.map((act) => {
        if (act.id === actionId) {
          const isCompleted = act.status === 'Completed';
          return {
            ...act,
            status: isCompleted ? 'Open' : 'Completed',
            completedAt: isCompleted ? undefined : 'Just now',
          };
        }
        return act;
      })
    );
  };

  const toggleSaveMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isSaved: !msg.isSaved } : msg))
    );
  };

  const addReaction = (messageId: string, emoji: string) => {
    const currentUserId = user?.id || 'usr_praman_101';
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find((r) => r.emoji === emoji);
          let newReactions = [...(msg.reactions || [])];

          if (existingReaction) {
            const hasReacted = existingReaction.users.includes(currentUserId);
            if (hasReacted) {
              // remove reaction
              const updatedUsers = existingReaction.users.filter((u) => u !== currentUserId);
              if (updatedUsers.length === 0) {
                newReactions = newReactions.filter((r) => r.emoji !== emoji);
              } else {
                newReactions = newReactions.map((r) =>
                  r.emoji === emoji ? { ...r, count: updatedUsers.length, users: updatedUsers } : r
                );
              }
            } else {
              // add user to reaction
              newReactions = newReactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, users: [...r.users, currentUserId] }
                  : r
              );
            }
          } else {
            // new reaction
            newReactions.push({ emoji, count: 1, users: [currentUserId] });
          }

          return { ...msg, reactions: newReactions };
        }
        return msg;
      })
    );
  };

  const openThread = (message: CollaborationMessage) => {
    setActiveThreadRootMessage(message);
    setIsPinnedKnowledgeOpen(false);
    setIsDecisionsOpen(false);
  };

  const closeThread = () => {
    setActiveThreadRootMessage(null);
  };

  const joinMeeting = (meetingId: string) => {
    setActiveMeetingId(meetingId);
  };

  const leaveMeeting = () => {
    setActiveMeetingId(null);
  };

  const analyzeMeetingWithAuren = async (meetingId: string): Promise<MeetingAgentAnalysis> => {
    setIsAnalyzingMeeting(true);
    const targetMeeting = meetings.find((m) => m.id === meetingId);
    if (!targetMeeting) {
      setIsAnalyzingMeeting(false);
      throw new Error(`Meeting ${meetingId} not found`);
    }

    // Realistic agent analysis latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const analysis = generateMeetingAnalysis(targetMeeting);

    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, meetingAnalysis: analysis } : m))
    );

    setIsAnalyzingMeeting(false);
    return analysis;
  };

  const endMeetingAndGenerateSummary = (meetingId: string) => {
    const summaryArtifact = {
      summary:
        'The architecture team completed review of vector sharding topology, client TLS session buffers, and verified zero-trust memory segmentation. All key decisions ratified unanimously.',
      keyDecisions: [
        'Partition Qdrant collection segments by organization tenant ID with AVX-512 quantization (38% latency drop).',
        'Enforce FIDO2 client certificate rotation bi-weekly with zero-knowledge envelope isolation.',
        'Deploy ring-buffer hot patch across Cloud Run worker pool 3.',
      ],
      actionItems: [
        { assignee: 'Marcus Vance', task: 'Deploy Nginx session buffer patch to West ingress node' },
        { assignee: 'Chloe Zhang', task: 'Run automated concurrency benchmarks under 100 concurrent SSE streams' },
        { assignee: 'Aarav Patel', task: 'Submit SOC2 compliance audit evidence for hardware key distribution' },
      ],
      referencedKnowledge: [
        'AUREN System Architecture & Multi-Tenant Retrieval Engine',
        'Zero-Trust Enterprise Vault & Multi-Dept RBAC Specification',
        'Qdrant Vector Indexing Implementation Spec',
      ],
      generatedAt: 'Just now • Certified by AUREN AI',
    };

    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              status: 'completed',
              postMeetingSummary: summaryArtifact,
            }
          : m
      )
    );

    // Also share summary to active channel
    const summaryMsg: CollaborationMessage = {
      id: `msg_summary_${Date.now()}`,
      channelId: activeChannelId,
      senderId: 'auren_ai',
      senderName: 'AUREN Meeting Synthesis',
      senderRole: 'AI Knowledge Engine',
      senderDepartment: 'Autonomous Intelligence',
      senderAvatar: '',
      timestamp: 'Just now',
      isAurenAi: true,
      content: `**Post-Meeting Executive Summary Ratified**\n\n${summaryArtifact.summary}\n\n**Key Decisions:**\n${summaryArtifact.keyDecisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n**Action Items:**\n${summaryArtifact.actionItems.map((a) => `• **${a.assignee}**: ${a.task}`).join('\n')}`,
      reactions: [{ emoji: '📝', count: 5, users: ['usr_praman_101', 'usr_marcus_203'] }],
    };

    setMessages((prev) => [...prev, summaryMsg]);
  };

  const pinKnowledgeToChannel = (channelId: string, docId: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId && !c.pinnedDocumentIds.includes(docId)
          ? { ...c, pinnedDocumentIds: [...c.pinnedDocumentIds, docId] }
          : c
      )
    );
  };

  const unpinKnowledgeFromChannel = (channelId: string, docId: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId
          ? { ...c, pinnedDocumentIds: c.pinnedDocumentIds.filter((id) => id !== docId) }
          : c
      )
    );
  };

  const createChannel = (data: {
    name: string;
    description: string;
    category: CollaborationChannel['category'];
    department?: string;
    type?: CollaborationChannel['type'];
    minClearance?: CollaborationChannel['minClearance'];
  }) => {
    const cleanName = data.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const newChan: CollaborationChannel = {
      id: `chan_${cleanName}_${Date.now()}`,
      name: cleanName,
      description: data.description,
      category: data.category,
      department: data.department,
      type: data.type || (data.category === 'department' ? 'department' : 'general'),
      minClearance: data.minClearance,
      isRestricted: Boolean(data.minClearance),
      memberCount: data.department ? 14 : 58,
      pinnedDocumentIds: [],
    };

    setChannels((prev) => [...prev, newChan]);
    setActiveChannelId(newChan.id);
  };

  return (
    <CollaborationContext.Provider
      value={{
        channels,
        activeChannelId,
        activeChannel,
        messages: channelMessages,
        threadMessages,
        activeThreadRootMessage,
        decisions: (decisions || []).filter((d) => d.channelId === activeChannelId || activeChannelId === 'org_general'),
        actionItems: (actionItems || []).filter((a) => a.channelId === activeChannelId || activeChannelId === 'org_general'),
        meetings,
        activeMeeting,
        selectedMeetingId,
        setSelectedMeetingId,
        analyzeMeetingWithAuren,
        isAnalyzingMeeting,
        presence,
        savedMessages,
        isPinnedKnowledgeOpen,
        isDecisionsOpen,
        channelSearchQuery,

        selectChannel,
        sendMessage,
        sendThreadReply,
        sendAurenInquiry,
        acknowledgeBroadcast,
        publishBroadcast,
        createDecision,
        createActionItem,
        toggleActionItemComplete,
        toggleSaveMessage,
        addReaction,
        openThread,
        closeThread,
        joinMeeting,
        leaveMeeting,
        endMeetingAndGenerateSummary,
        pinKnowledgeToChannel,
        unpinKnowledgeFromChannel,
        createChannel,
        setChannelSearchQuery,
        setIsPinnedKnowledgeOpen,
        setIsDecisionsOpen,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};
