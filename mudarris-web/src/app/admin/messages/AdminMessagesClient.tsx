"use client";

import { useState } from "react";
import { MessageSquare, Flag, Eye, EyeOff, AlertTriangle, Loader2, UserX, UserCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getMessagesAction,
  adminHideMessageAction,
  reactivateUserAction,
  type AdminConversationItem,
  type MessageItem,
} from "@/lib/actions/messages";
import { suspendUserAction } from "@/lib/actions/admin";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ar-QA", {
    timeZone: "Asia/Qatar",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Conversation row ─────────────────────────────────────────────────────────

function ConvRow({
  conv,
  onSelect,
}: {
  conv: AdminConversationItem;
  onSelect: (c: AdminConversationItem) => void;
}) {
  return (
    <tr
      className="hover:bg-[var(--color-surface-low)] cursor-pointer transition-colors"
      onClick={() => onSelect(conv)}
    >
      <td className="px-4 py-3 text-label-md">{conv.studentName}</td>
      <td className="px-4 py-3 text-label-md">{conv.tutorName}</td>
      <td className="px-4 py-3 text-label-sm text-[var(--color-text-muted)]">
        {conv.lastMessageAt ? formatDate(conv.lastMessageAt) : "—"}
      </td>
      <td className="px-4 py-3">
        {conv.flaggedMessageCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)] text-label-sm font-semibold">
            <Flag className="w-3 h-3" />
            {conv.flaggedMessageCount}
          </span>
        ) : (
          <span className="text-label-sm text-[var(--color-text-muted)]">لا يوجد</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button className="text-label-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
          <Eye className="w-3 h-3" /> عرض
        </button>
      </td>
    </tr>
  );
}

// ─── Messages detail modal ────────────────────────────────────────────────────

function MessagesModal({
  conv,
  onClose,
}: {
  conv: AdminConversationItem;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiding, setHiding] = useState<string | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [targetMsg, setTargetMsg] = useState<MessageItem | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{ userId: string; name: string; isActive: boolean } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actioning, setActioning] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  useState(() => {
    getMessagesAction(conv.id).then((res) => {
      setMessages(res.data ?? []);
      setLoading(false);
    });
  });

  async function handleHide() {
    if (!targetMsg || !hideReason.trim()) return;
    setHiding(targetMsg.id);
    const res = await adminHideMessageAction(targetMsg.id, hideReason.trim());
    setHiding(null);
    if (res.error) { setActionErr(res.error); return; }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === targetMsg.id ? { ...m, hiddenByAdmin: true, hiddenAt: new Date().toISOString() } : m,
      ),
    );
    setTargetMsg(null);
    setHideReason("");
  }

  async function handleSuspend() {
    if (!suspendTarget || !suspendReason.trim()) return;
    setActioning(true);
    setActionErr(null);
    const res = suspendTarget.isActive
      ? await suspendUserAction(suspendTarget.userId, suspendReason.trim())
      : await reactivateUserAction(suspendTarget.userId, suspendReason.trim());
    setActioning(false);
    if (res.error) { setActionErr(res.error); return; }
    setSuspendTarget(null);
    setSuspendReason("");
  }

  return (
    <Modal open onClose={onClose} title={`محادثة: ${conv.studentName} ↔ ${conv.tutorName}`} size="lg">
      <div className="flex flex-col gap-4">
        {/* User action buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSuspendTarget({ userId: conv.studentId, name: conv.studentName, isActive: true })}
          >
            <UserX className="w-4 h-4" /> إيقاف الطالب
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSuspendTarget({ userId: conv.tutorId, name: conv.tutorName, isActive: true })}
          >
            <UserX className="w-4 h-4" /> إيقاف المدرس
          </Button>
        </div>

        {/* Messages list */}
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-[var(--color-text-muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState title="لا توجد رسائل" description="هذه المحادثة فارغة" />
        ) : (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 p-3 rounded-[var(--radius-md)] ${
                  m.isFlagged
                    ? "bg-[var(--color-error)]/10 border border-[var(--color-error)]/20"
                    : m.hiddenByAdmin
                    ? "bg-[var(--color-surface-low)] opacity-60"
                    : "bg-[var(--color-surface-container)]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-label-sm font-semibold">{m.senderName}</span>
                    {m.isFlagged && (
                      <span className="flex items-center gap-1 text-[var(--color-error)] text-label-xs">
                        <Flag className="w-3 h-3" /> مبلغ عنها
                      </span>
                    )}
                    {m.hiddenByAdmin && (
                      <span className="flex items-center gap-1 text-[var(--color-text-muted)] text-label-xs">
                        <EyeOff className="w-3 h-3" /> مخفية
                      </span>
                    )}
                    <span className="text-label-xs text-[var(--color-text-muted)] mr-auto">
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-label-md break-words text-right" style={{ direction: "rtl" }}>
                    {m.content}
                  </p>
                </div>
                {!m.hiddenByAdmin && (
                  <button
                    onClick={() => setTargetMsg(m)}
                    disabled={hiding === m.id}
                    className="flex-shrink-0 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                    title="إخفاء الرسالة"
                  >
                    {hiding === m.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {actionErr && (
          <p className="text-label-sm text-[var(--color-error)] text-center">{actionErr}</p>
        )}
      </div>

      {/* Hide message confirm */}
      <Modal
        open={!!targetMsg}
        onClose={() => { setTargetMsg(null); setHideReason(""); }}
        title="إخفاء الرسالة"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-body-md text-[var(--color-text-muted)]">أدخل سبب الإخفاء (للسجل الإداري):</p>
          <textarea
            value={hideReason}
            onChange={(e) => setHideReason(e.target.value)}
            placeholder="سبب الإخفاء..."
            rows={2}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-low)] px-3 py-2 text-label-md resize-none focus:outline-none w-full text-right"
            style={{ direction: "rtl" }}
          />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setTargetMsg(null); setHideReason(""); }}>
              إلغاء
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleHide} disabled={!hideReason.trim()}>
              تأكيد الإخفاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspend user confirm */}
      <Modal
        open={!!suspendTarget}
        onClose={() => { setSuspendTarget(null); setSuspendReason(""); setActionErr(null); }}
        title={suspendTarget?.isActive ? `إيقاف ${suspendTarget?.name}` : `تفعيل ${suspendTarget?.name}`}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-error)]/10">
            <AlertTriangle className="w-5 h-5 text-[var(--color-error)]" />
            <p className="text-label-sm text-[var(--color-error)]">
              سيؤثر هذا الإجراء فوراً على قدرة المستخدم على الرسائل والحجوزات والسحب
            </p>
          </div>
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="سبب الإجراء..."
            rows={2}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-low)] px-3 py-2 text-label-md resize-none focus:outline-none w-full text-right"
            style={{ direction: "rtl" }}
          />
          {actionErr && <p className="text-label-sm text-[var(--color-error)]">{actionErr}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setSuspendTarget(null)} disabled={actioning}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleSuspend}
              loading={actioning}
              disabled={!suspendReason.trim()}
            >
              {suspendTarget?.isActive ? (
                <><UserX className="w-4 h-4" /> إيقاف الحساب</>
              ) : (
                <><UserCheck className="w-4 h-4" /> تفعيل الحساب</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminMessagesClient({
  conversations,
}: {
  conversations: AdminConversationItem[];
}) {
  const [selected, setSelected] = useState<AdminConversationItem | null>(null);
  const [search, setSearch] = useState("");

  const flaggedOnly = conversations.filter((c) => c.flaggedMessageCount > 0);
  const filtered = conversations.filter(
    (c) =>
      c.studentName.includes(search) ||
      c.tutorName.includes(search),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-headline-lg">إشراف المحادثات</h1>
        {flaggedOnly.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)] text-label-sm font-semibold">
            {flaggedOnly.length} محادثة تحتاج مراجعة
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card p-4 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-[var(--color-text-muted)]" />
          <div>
            <p className="text-label-sm text-[var(--color-text-muted)]">إجمالي المحادثات</p>
            <p className="text-headline-sm font-bold">{conversations.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <Flag className="w-6 h-6 text-[var(--color-error)]" />
          <div>
            <p className="text-label-sm text-[var(--color-text-muted)]">رسائل مبلغ عنها</p>
            <p className="text-headline-sm font-bold text-[var(--color-error)]">
              {conversations.reduce((s, c) => s + c.flaggedMessageCount, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث باسم الطالب أو المدرس..."
        className="input-field w-full max-w-sm"
        style={{ direction: "rtl" }}
      />

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="لا توجد محادثات" description="لم يتم العثور على محادثات" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-low)]">
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">الطالب</th>
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">المدرس</th>
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">آخر رسالة</th>
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">رسائل مبلغ عنها</th>
                  <th className="px-4 py-3 text-label-sm text-[var(--color-text-muted)] font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((c) => (
                  <ConvRow key={c.id} conv={c} onSelect={setSelected} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <MessagesModal conv={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
