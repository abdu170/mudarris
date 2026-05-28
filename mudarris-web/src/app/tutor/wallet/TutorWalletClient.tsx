"use client";

import { useState } from "react";
import { Wallet, ArrowDownCircle, Clock, TrendingUp, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatQAR, formatQatarDate } from "@/lib/utils";
import {
  requestWithdrawalAction,
  type TutorWalletData,
  type WithdrawalItem,
} from "@/lib/actions/wallet";

// ─── Transaction type labels ──────────────────────────────────────────────────

const TX_LABELS: Record<string, string> = {
  credit_pending: "مستحقات معلقة",
  credit_available: "إيرادات محررة",
  debit_withdrawal: "سحب رصيد",
  debit_refund: "استرداد",
};

const TX_SIGN: Record<string, string> = {
  credit_pending: "+",
  credit_available: "+",
  debit_withdrawal: "−",
  debit_refund: "−",
};

const TX_COLOR: Record<string, string> = {
  credit_pending: "text-[var(--color-text-muted)]",
  credit_available: "text-[var(--color-success)]",
  debit_withdrawal: "text-[var(--color-error)]",
  debit_refund: "text-[var(--color-error)]",
};

// ─── Withdrawal status helpers ────────────────────────────────────────────────

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    pending: "قيد المراجعة",
    approved: "تم الاعتماد",
    rejected: "مرفوض",
    processing: "قيد المعالجة",
    completed: "مكتمل",
  };
  return m[s] ?? s;
}

function statusColor(s: string): string {
  if (s === "approved" || s === "completed") return "text-[var(--color-success)]";
  if (s === "rejected") return "text-[var(--color-error)]";
  return "text-[var(--color-text-muted)]";
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialData: TutorWalletData;
  initialWithdrawals: WithdrawalItem[];
}

export default function TutorWalletClient({ initialData, initialWithdrawals }: Props) {
  const [walletData] = useState(initialData);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState(false);

  const { balance, recentTransactions } = walletData;

  async function handleWithdrawal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitErr(null);
    const fd = new FormData(e.currentTarget);
    const res = await requestWithdrawalAction(fd);
    setSubmitting(false);
    if (res.error) { setSubmitErr(res.error); return; }
    setSubmitOk(true);
    setShowModal(false);
    setWithdrawals((prev) => [
      {
        id: res.data!.withdrawalId,
        amount: Number(fd.get("amount")),
        bankName: String(fd.get("bankName")),
        iban: String(fd.get("iban")).toUpperCase(),
        accountHolderName: String(fd.get("accountHolderName")),
        status: "pending",
        adminNote: null,
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      },
      ...prev,
    ]);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg">المحفظة</h1>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)]">
            <Wallet className="w-4 h-4" />
            <p className="text-label-md">الرصيد المتاح</p>
          </div>
          <p className="text-headline-lg text-[var(--color-brand-primary)] font-bold">
            {formatQAR(balance.availableBalance)}
          </p>
          <p className="text-label-sm text-[var(--color-text-muted)] mt-1">قابل للسحب</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)]">
            <Clock className="w-4 h-4" />
            <p className="text-label-md">رصيد معلق</p>
          </div>
          <p className="text-headline-lg text-[var(--color-text-main)] font-bold">
            {formatQAR(balance.pendingBalance)}
          </p>
          <p className="text-label-sm text-[var(--color-text-muted)] mt-1">يُحرر بعد اكتمال الحصة</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)]">
            <TrendingUp className="w-4 h-4" />
            <p className="text-label-md">إجمالي الأرباح</p>
          </div>
          <p className="text-headline-lg text-[var(--color-success)] font-bold">
            {formatQAR(balance.totalEarned)}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)]">
            <ArrowDownCircle className="w-4 h-4" />
            <p className="text-label-md">إجمالي المسحوب</p>
          </div>
          <p className="text-headline-lg text-[var(--color-text-main)] font-bold">
            {formatQAR(balance.totalWithdrawn)}
          </p>
        </div>
      </div>

      {/* Withdraw button */}
      <div className="flex justify-end">
        {submitOk && (
          <span className="flex items-center gap-1 text-label-md text-[var(--color-success)] ms-auto me-4">
            <CheckCircle className="w-4 h-4" />تم تقديم طلب السحب
          </span>
        )}
        <Button
          onClick={() => { setShowModal(true); setSubmitOk(false); }}
          disabled={balance.availableBalance < 100}
        >
          <ArrowDownCircle className="w-4 h-4" />طلب سحب
        </Button>
      </div>
      {balance.availableBalance < 100 && (
        <p className="text-label-sm text-[var(--color-text-muted)] text-end -mt-4">
          الحد الأدنى للسحب هو 100 ر.ق
        </p>
      )}

      {/* Recent transactions */}
      <div className="card">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-headline-sm">آخر المعاملات</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-label-md text-[var(--color-text-muted)]">لا توجد معاملات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-label-md font-medium">{TX_LABELS[tx.type] ?? tx.type}</p>
                  <p className="text-label-sm text-[var(--color-text-muted)]">{tx.description}</p>
                  <p className="text-label-sm text-[var(--color-text-muted)]">
                    {formatQatarDate(tx.createdAt)}
                  </p>
                </div>
                <p className={`text-label-md font-semibold ${TX_COLOR[tx.type]}`}>
                  {TX_SIGN[tx.type]}{formatQAR(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div className="card">
          <div className="p-5 border-b border-[var(--color-border)]">
            <h2 className="text-headline-sm">طلبات السحب</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-label-md font-medium">{w.bankName} — {w.iban}</p>
                  <p className="text-label-sm text-[var(--color-text-muted)]">
                    {formatQatarDate(w.createdAt)}
                    {w.reviewedAt && ` · مراجعة: ${formatQatarDate(w.reviewedAt)}`}
                  </p>
                  {w.adminNote && (
                    <p className="text-label-sm text-[var(--color-error)] mt-0.5">{w.adminNote}</p>
                  )}
                </div>
                <div className="text-end">
                  <p className="text-label-md font-semibold">{formatQAR(w.amount)}</p>
                  <p className={`text-label-sm ${statusColor(w.status)}`}>{statusLabel(w.status)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdrawal modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSubmitErr(null); }}
        title="طلب سحب رصيد"
        size="sm"
      >
        <form onSubmit={handleWithdrawal} className="flex flex-col gap-4">
          <p className="text-label-sm text-[var(--color-text-muted)]">
            الرصيد المتاح: <strong>{formatQAR(balance.availableBalance)}</strong>
          </p>

          <Input
            label="المبلغ (ر.ق)"
            name="amount"
            type="number"
            min={100}
            max={balance.availableBalance}
            step={0.01}
            placeholder="100"
            required
          />
          <Input
            label="اسم البنك"
            name="bankName"
            placeholder="بنك قطر الوطني"
            required
          />
          <Input
            label="رقم IBAN"
            name="iban"
            placeholder="QA57QNBA000000000000693123456"
            required
            dir="ltr"
            className="font-mono text-sm"
          />
          <Input
            label="اسم صاحب الحساب"
            name="accountHolderName"
            placeholder="الاسم الكامل كما في البنك"
            required
          />

          {submitErr && (
            <p className="text-label-sm text-[var(--color-error)] text-center">{submitErr}</p>
          )}

          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => { setShowModal(false); setSubmitErr(null); }}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              تقديم الطلب
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
