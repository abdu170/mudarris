"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageSquare, Loader2, AlertTriangle, Flag } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/browser";
import {
  getMessagesAction,
  markConversationReadAction,
  sendMessageAction,
  submitReportAction,
  type ConversationSummary,
  type MessageItem,
} from "@/lib/actions/messages";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ar-QA", {
    timeZone: "Asia/Qatar",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-QA", {
    timeZone: "Asia/Qatar",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ─── Conversation List ────────────────────────────────────────────────────────

function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        title="لا توجد محادثات"
        description="ستظهر محادثاتك مع المدرسين هنا بعد الحجز"
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-[var(--color-border)]">
      {conversations.map((c) => {
        const isStudent = c.studentId === currentUserId;
        const otherName = isStudent ? c.tutorName : c.studentName;
        const otherAvatar = isStudent ? c.tutorAvatar : c.studentAvatar;
        const isActive = c.id === activeId;

        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`flex items-center gap-3 px-4 py-3 text-right transition-colors ${
              isActive
                ? "bg-[var(--color-surface-container)]"
                : "hover:bg-[var(--color-surface-low)]"
            }`}
          >
            <div className="relative flex-shrink-0">
              <Avatar name={otherName} src={otherAvatar ?? undefined} size="md" />
              {c.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center font-bold">
                  {c.unreadCount > 9 ? "9+" : c.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-label-md font-semibold truncate">{otherName}</p>
              {c.lastMessagePreview && (
                <p className="text-label-sm text-[var(--color-text-muted)] truncate">
                  {c.lastMessagePreview}
                </p>
              )}
            </div>
            {c.lastMessageAt && (
              <span className="text-label-xs text-[var(--color-text-muted)] flex-shrink-0">
                {formatTime(c.lastMessageAt)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isMine,
  onReport,
}: {
  message: MessageItem;
  isMine: boolean;
  onReport: (m: MessageItem) => void;
}) {
  return (
    <div className={`flex ${isMine ? "justify-start flex-row-reverse" : "justify-start"} gap-2 group`}>
      <div
        className={`max-w-[70%] rounded-[var(--radius-md)] px-4 py-2 text-label-md leading-relaxed ${
          isMine
            ? "bg-[var(--color-primary)] text-white rounded-tr-none"
            : "bg-[var(--color-surface-container)] text-[var(--color-text-main)] rounded-tl-none"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-[10px] mt-1 ${isMine ? "text-white/70 text-left" : "text-[var(--color-text-muted)] text-right"}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
      {!isMine && (
        <button
          onClick={() => onReport(message)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
          title="الإبلاغ عن الرسالة"
        >
          <Flag className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  conversationId,
  currentUserId,
  onMarkRead,
}: {
  conversationId: string;
  currentUserId: string;
  onMarkRead: (id: string) => void;
}) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<MessageItem | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportErr, setReportErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadMessages = useCallback(async () => {
    const res = await getMessagesAction(conversationId);
    if (res.data) {
      setMessages(res.data);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      onMarkRead(conversationId);
    }
  }, [conversationId, onMarkRead]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadMessages();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, loadMessages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);

    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("content", trimmed);

    const res = await sendMessageAction(fd);
    setSending(false);

    if (res.error) {
      setSendError(res.error);
      return;
    }

    setInput("");
    // Message will arrive via realtime
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleReport() {
    if (!reportTarget || !reportReason.trim()) return;
    setReporting(true);
    setReportErr(null);

    const fd = new FormData();
    fd.set("messageId", reportTarget.id);
    fd.set("conversationId", conversationId);
    fd.set("reason", reportReason.trim());

    const res = await submitReportAction(fd);
    setReporting(false);

    if (res.error) {
      setReportErr(res.error);
      return;
    }

    setReportTarget(null);
    setReportReason("");
  }

  // Group messages by day
  const grouped: { day: string; messages: MessageItem[] }[] = [];
  for (const m of messages) {
    const day = formatDay(m.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.day === day) {
      last.messages.push(m);
    } else {
      grouped.push({ day, messages: [m] });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-[var(--color-text-muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-label-md text-[var(--color-text-muted)]">لا توجد رسائل بعد. ابدأ المحادثة!</p>
          </div>
        ) : (
          grouped.map((g) => (
            <div key={g.day} className="flex flex-col gap-3">
              <div className="text-center">
                <span className="text-label-xs text-[var(--color-text-muted)] bg-[var(--color-surface-low)] px-3 py-1 rounded-full">
                  {g.day}
                </span>
              </div>
              {g.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isMine={m.senderId === currentUserId}
                  onReport={setReportTarget}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {sendError && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-error)]/10 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--color-error)] flex-shrink-0 mt-0.5" />
          <p className="text-label-sm text-[var(--color-error)]">{sendError}</p>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-[var(--color-border)] px-4 py-3 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setSendError(null); }}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالتك هنا..."
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-low)] px-3 py-2 text-label-md placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-right min-h-[40px] max-h-[120px] overflow-y-auto"
          style={{ direction: "rtl" }}
        />
        <Button size="sm" onClick={handleSend} loading={sending} disabled={!input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Report modal */}
      <Modal
        open={!!reportTarget}
        onClose={() => { setReportTarget(null); setReportReason(""); setReportErr(null); }}
        title="الإبلاغ عن رسالة"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-body-md text-[var(--color-text-muted)]">
            يرجى توضيح سبب الإبلاغ عن هذه الرسالة:
          </p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="سبب الإبلاغ..."
            rows={3}
            maxLength={1000}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-low)] px-3 py-2 text-label-md resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-right w-full"
            style={{ direction: "rtl" }}
          />
          {reportErr && <p className="text-label-sm text-[var(--color-error)]">{reportErr}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setReportTarget(null); setReportReason(""); }}>
              إلغاء
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleReport} loading={reporting} disabled={!reportReason.trim()}>
              إرسال البلاغ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Main MessagesClient ──────────────────────────────────────────────────────

export default function MessagesClient({
  initialConversations,
  currentUserId,
}: {
  initialConversations: ConversationSummary[];
  currentUserId: string;
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const supabase = createClient();

  // Realtime: listen for conversation updates (new messages → last_message_at changes)
  useEffect(() => {
    const channel = supabase
      .channel("conversations:user")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const updated = payload.new as { id: string; last_message_at: string };
          setConversations((prev) =>
            prev
              .map((c) =>
                c.id === updated.id
                  ? { ...c, lastMessageAt: updated.last_message_at }
                  : c,
              )
              .sort((a, b) => {
                if (!a.lastMessageAt) return 1;
                if (!b.lastMessageAt) return -1;
                return b.lastMessageAt.localeCompare(a.lastMessageAt);
              }),
          );
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  function handleMarkRead(conversationId: string) {
    markConversationReadAction(conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 className="text-headline-lg">الرسائل</h1>
        {totalUnread > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-label-sm font-bold">
            {totalUnread}
          </span>
        )}
      </div>

      <div className="card overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        {/* Sidebar: conversation list */}
        <div className="w-72 flex-shrink-0 border-l border-[var(--color-border)] overflow-y-auto">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="text-label-md font-semibold text-[var(--color-text-muted)]">المحادثات</p>
          </div>
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageSquare className="w-8 h-8 mx-auto text-[var(--color-text-muted)] mb-2" />
              <p className="text-label-sm text-[var(--color-text-muted)]">لا توجد محادثات بعد</p>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              currentUserId={currentUserId}
              onSelect={setActiveId}
            />
          )}
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col">
          {activeId ? (
            <ChatPanel
              conversationId={activeId}
              currentUserId={currentUserId}
              onMarkRead={handleMarkRead}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
              <MessageSquare className="w-10 h-10" />
              <p className="text-body-md">اختر محادثة للبدء</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
