import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Users,
  MessageSquare,
  FileText,
  Sparkles,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import type { AurenDocument } from '../../types';
import { MeetingAgentModal } from '../agents/MeetingAgentModal';

interface MeetingRoomProps {
  documents: AurenDocument[];
  onOpenDocument?: (docId: string) => void;
  onAskAuren?: (prompt: string) => void;
}

type MeetingSidebarTab = 'chat' | 'knowledge' | 'notes' | null;

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  documents,
  onOpenDocument,
  onAskAuren,
}) => {
  const {
    activeMeeting,
    leaveMeeting,
    endMeetingAndGenerateSummary,
    sendAurenInquiry,
  } = useCollaboration();
  const { user } = useAuth();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<MeetingSidebarTab>('knowledge');
  const [meetingDuration, _setMeetingDuration] = useState('24:18');
  const [meetingChatInput, setMeetingChatInput] = useState('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [meetingChatMessages, setMeetingChatMessages] = useState<
    { sender: string; text: string; time: string }[]
  >([
    { sender: 'Elena Vance', text: 'Confirmed: West node TLS cache patched.', time: '5:32 PM' },
    { sender: 'Praman Singh Bhogal', text: 'Sharing vector sharding benchmarks now.', time: '5:34 PM' },
  ]);

  if (!activeMeeting) return null;

  const handleSendMeetingChat = () => {
    if (!meetingChatInput.trim()) return;
    setMeetingChatMessages((prev) => [
      ...prev,
      {
        sender: user?.name || 'Praman Singh Bhogal',
        text: meetingChatInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setMeetingChatInput('');
  };

  const attachedDocs = (documents || []).filter((d) =>
    (activeMeeting.attachedDocumentIds || []).includes(d.id)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0B0E] text-white select-none overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="h-14 px-4 border-b border-neutral-800 bg-[#0E1015]/90 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              REC • {meetingDuration}
            </span>
          </div>
          <div className="h-4 w-px bg-neutral-800" />
          <h2 className="text-sm font-semibold text-neutral-100 truncate max-w-md">
            {activeMeeting.title}
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700">
            {activeMeeting.department || 'Organizational Summit'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Analyze with AUREN Agent Button */}
          <Button
            variant="outline"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            onClick={() => setIsAgentModalOpen(true)}
            className="border-purple-500/40 text-purple-300 hover:bg-purple-950/40 hover:text-purple-200"
          >
            Analyze with AUREN
          </Button>

          {/* End Meeting & Generate Post-Meeting Summary Button */}
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => {
              endMeetingAndGenerateSummary(activeMeeting.id);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            End & Generate Summary
          </Button>

          {/* Leave Meeting Button */}
          <button
            type="button"
            onClick={leaveMeeting}
            className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Center Stage & Contextual Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Stage: Video Grid or Screen Share View */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden bg-[#0A0B0E]">
          {isScreenSharing ? (
            /* Screen Share Mode with Stage Diagram and PiP Video Tiles */
            <div className="flex-1 flex flex-col rounded-2xl bg-[#12141A] border border-neutral-800 overflow-hidden relative shadow-2xl">
              {/* Screen Share Status Bar */}
              <div className="px-4 py-2 border-b border-neutral-800 bg-[#161820] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <ScreenShare className="w-4 h-4" />
                  <span>You are presenting: AUREN Distributed Consensus & Vector Topology</span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">1080p60 • Lossless Ingress</span>
              </div>

              {/* Realistic Interactive Architecture Topology & Code Canvas */}
              <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-neutral-300 space-y-4">
                <div className="p-4 rounded-xl bg-[#0B0C10] border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-emerald-400 font-bold">
                      // AUREN MULTI-TENANT SHARDING & RETRIEVAL ENGINE v3.4
                    </span>
                    <span className="text-neutral-500 text-[10px]">Active Node: ingress-west-01</span>
                  </div>
                  <pre className="text-neutral-300 text-[11px] leading-relaxed">
{`+-------------------------------------------------------------------------+
|                  Nginx Edge Ingress (Hardware TLS Term.)                |
+------------------------------------+------------------------------------+
                                     | (mTLS stream / gRPC)
                                     v
+------------------------------------+------------------------------------+
|               AUREN Semantic Router & RBAC Authorization                |
+------------------------------------+------------------------------------+
                   |                                    |
     [Tenant Shard A: Core Arch]          [Tenant Shard B: Security]
                   |                                    |
                   v                                    v
+------------------+-----------------+  +---------------+-----------------+
| Qdrant Cosine Vector Segments     |  | Zero-Trust Cryptographic Vault   |
| (AVX-512 Scalar Quantization)     |  | (Hardware FIDO2 Envelope Seals)  |
+------------------------------------+  +---------------------------------+`}
                  </pre>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    ✓ Shard boundary enforced via HMAC-SHA256 envelope keys • Zero cross-tenant memory leakage.
                  </p>
                </div>
              </div>

              {/* Picture-in-Picture Mini Video Tiles */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
                {activeMeeting.participants.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="w-28 h-20 rounded-xl bg-neutral-900 border border-neutral-700 overflow-hidden relative shadow-lg"
                  >
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[9px] text-white bg-black/60 px-1 py-0.5 rounded backdrop-blur-xs">
                      <span className="truncate">{p.name.split(' ')[0]}</span>
                      {p.isSpeaking && <Volume2 className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Video Tiles Grid Mode */
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
              {activeMeeting.participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`rounded-2xl bg-[#13151B] border overflow-hidden relative flex flex-col justify-between p-3 group transition-all shadow-md ${
                    participant.isSpeaking
                      ? 'border-emerald-500/80 ring-2 ring-emerald-500/30'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {/* Top Overlay: Name & Speaking indicator */}
                  <div className="flex items-center justify-between z-10">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-md flex items-center gap-1.5">
                      {participant.isSpeaking && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      )}
                      <span>{participant.name}</span>
                    </span>

                    {participant.isMuted ? (
                      <span className="p-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <MicOff className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Mic className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Center Video/Avatar Feed */}
                  <div className="flex-1 flex items-center justify-center my-4">
                    <div className="relative">
                      <img
                        src={participant.avatarUrl}
                        alt={participant.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-neutral-700 shadow-xl"
                      />
                      {participant.isSpeaking && (
                        <div className="absolute -inset-2 rounded-full border-2 border-emerald-500 animate-pulse pointer-events-none" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Overlay: Role & Department */}
                  <div className="text-[10px] text-neutral-400 bg-black/40 px-2 py-1 rounded backdrop-blur-xs flex items-center justify-between z-10">
                    <span className="truncate">{participant.title}</span>
                    <span className="font-mono text-neutral-500">{participant.department}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meeting Contextual Sidebar (Chat / Knowledge / Notes) */}
        {sidebarTab && (
          <aside className="w-80 lg:w-88 h-full bg-[#111217] border-l border-neutral-800 flex flex-col shrink-0 z-20">
            {/* Sidebar Tabs */}
            <div className="h-11 px-3 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSidebarTab('knowledge')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    sidebarTab === 'knowledge'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Knowledge ({attachedDocs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('notes')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    sidebarTab === 'notes'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Notes
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('chat')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    sidebarTab === 'chat'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Meeting Chat
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSidebarTab(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Sidebar Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {sidebarTab === 'knowledge' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Attached Meeting Artifacts:
                  </span>
                  {attachedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{doc.title}</h4>
                          <p className="text-[10px] text-neutral-400 font-mono truncate">{doc.filename}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
                        {onOpenDocument && (
                          <button
                            type="button"
                            onClick={() => onOpenDocument(doc.id)}
                            className="flex-1 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition-colors cursor-pointer"
                          >
                            Open Document
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            sendAurenInquiry(`Summarize the meeting implications of ${doc.title}`)
                          }
                          className="px-2 py-1 rounded bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Ask AUREN</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sidebarTab === 'notes' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Live Meeting Notes</span>
                    </span>
                    <ul className="text-xs text-neutral-300 space-y-1.5 pl-3 list-disc">
                      {activeMeeting.notes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                    <span className="text-xs font-bold text-neutral-200">Agenda</span>
                    <ul className="text-xs text-neutral-400 space-y-1">
                      {activeMeeting.agenda.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {sidebarTab === 'chat' && (
                <div className="flex flex-col h-full justify-between">
                  <div className="space-y-2">
                    {meetingChatMessages.map((msg, i) => (
                      <div key={i} className="p-2 rounded-lg bg-neutral-900/60 text-xs space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-neutral-400">
                          <span className="font-semibold text-neutral-200">{msg.sender}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p className="text-neutral-300">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-neutral-800 mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Message meeting..."
                      value={meetingChatInput}
                      onChange={(e) => setMeetingChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMeetingChat()}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendMeetingChat}
                      className="px-3 py-1.5 rounded-lg bg-white text-neutral-900 text-xs font-semibold"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="h-16 px-6 border-t border-neutral-800 bg-[#0E1015] flex items-center justify-between shrink-0 z-10">
        {/* Left Side Info */}
        <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
          <Users className="w-4 h-4" />
          <span>{activeMeeting.participants.length} Participants in Room</span>
        </div>

        {/* Center Primary Controls */}
        <div className="flex items-center gap-3 mx-auto md:mx-0">
          {/* Mute/Unmute */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera On/Off */}
          <button
            type="button"
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              !isVideoOn
                ? 'bg-rose-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
            }`}
            title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share Toggle */}
          <button
            type="button"
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-500/40'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
            }`}
            title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          {/* End Call for User */}
          <button
            type="button"
            onClick={leaveMeeting}
            className="p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side Sidebar Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarTab(sidebarTab === 'knowledge' ? null : 'knowledge')}
            className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              sidebarTab === 'knowledge'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Meeting Knowledge Documents"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden lg:inline">Knowledge</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarTab(sidebarTab === 'notes' ? null : 'notes')}
            className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              sidebarTab === 'notes'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Collaborative Meeting Notes"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden lg:inline">Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarTab(sidebarTab === 'chat' ? null : 'chat')}
            className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              sidebarTab === 'chat'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Meeting Chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden lg:inline">Chat</span>
          </button>
        </div>
      </div>

      {/* Meeting Agent Synthesis Modal */}
      <MeetingAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        meeting={activeMeeting}
        documents={documents}
        onOpenDocument={(doc) => onOpenDocument?.(doc.id)}
        onAskAuren={onAskAuren}
      />
    </div>
  );
};
