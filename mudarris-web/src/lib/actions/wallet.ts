"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import type { WalletTransactionType } from "@/lib/supabase/types";

export type ActionResult<T = void> = { data: T; error?: never } | { data?: never; error: string };

// ─── Types ────────────────────────────────────────────────────────────────────

export type WalletBalance = {
  id: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
};

export type WalletTransactionItem = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  bookingId: string | null;
  withdrawalId: string | null;
  createdAt: string;
};

export type TutorWalletData = {
  balance: WalletBalance;
  recentTransactions: WalletTransactionItem[];
};

export type WithdrawalItem = {
  id: string;
  amount: number;
  bankName: string;
  iban: string;
  accountHolderName: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

// ─── Get tutor wallet ─────────────────────────────────────────────────────────

export async function getTutorWalletAction(): Promise<ActionResult<TutorWalletData>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  // Ensure wallet exists (creates if not yet created)
  const { data: walletId, error: ensureErr } = await admin.rpc("ensure_wallet_exists", {
    p_tutor_id: user.id,
  });

  if (ensureErr || !walletId) {
    console.error("[getTutorWallet] ensure_wallet:", ensureErr?.message);
    return { error: "تعذّر تحميل بيانات المحفظة" };
  }

  const [balanceRes, txRes] = await Promise.all([
    admin
      .from("wallet_accounts")
      .select("id, available_balance, pending_balance, total_earned, total_withdrawn")
      .eq("tutor_id", user.id)
      .single(),
    admin
      .from("wallet_transactions")
      .select("id, type, amount, balance_after, description, booking_id, withdrawal_id, created_at")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (balanceRes.error || !balanceRes.data) {
    console.error("[getTutorWallet] balance:", balanceRes.error?.message);
    return { error: "تعذّر تحميل الرصيد" };
  }

  const b = balanceRes.data;
  const balance: WalletBalance = {
    id: b.id,
    availableBalance: b.available_balance,
    pendingBalance: b.pending_balance,
    totalEarned: b.total_earned,
    totalWithdrawn: b.total_withdrawn,
  };

  const recentTransactions: WalletTransactionItem[] = (txRes.data ?? []).map((t: any) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    balanceAfter: t.balance_after,
    description: t.description,
    bookingId: t.booking_id,
    withdrawalId: t.withdrawal_id,
    createdAt: t.created_at,
  }));

  return { data: { balance, recentTransactions } };
}

// ─── Get tutor withdrawal history ────────────────────────────────────────────

export async function getTutorWithdrawalsAction(): Promise<ActionResult<WithdrawalItem[]>> {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("withdrawal_requests")
    .select("id, amount, bank_name, iban, account_holder_name, status, admin_note, created_at, reviewed_at")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getTutorWithdrawals]", error.message);
    return { error: "تعذّر تحميل طلبات السحب" };
  }

  const withdrawals: WithdrawalItem[] = (data ?? []).map((w: any) => ({
    id: w.id,
    amount: w.amount,
    bankName: w.bank_name,
    iban: w.iban,
    accountHolderName: w.account_holder_name,
    status: w.status,
    adminNote: w.admin_note,
    createdAt: w.created_at,
    reviewedAt: w.reviewed_at,
  }));

  return { data: withdrawals };
}

// ─── Request withdrawal ───────────────────────────────────────────────────────

const withdrawalSchema = z.object({
  amount: z.coerce
    .number()
    .min(100, "الحد الأدنى للسحب هو 100 ر.ق")
    .max(100000, "الحد الأقصى للسحب هو 100,000 ر.ق"),
  bankName: z.string().min(2, "اسم البنك مطلوب").max(100),
  iban: z
    .string()
    .min(15, "رقم IBAN غير صحيح")
    .max(34, "رقم IBAN غير صحيح")
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, "رقم IBAN يجب أن يبدأ بحرفين ثم أرقام"),
  accountHolderName: z.string().min(2, "اسم صاحب الحساب مطلوب").max(100),
});

export async function requestWithdrawalAction(
  formData: FormData,
): Promise<ActionResult<{ withdrawalId: string }>> {
  const user = await requireAuth();

  const parsed = withdrawalSchema.safeParse({
    amount: formData.get("amount"),
    bankName: formData.get("bankName"),
    iban: String(formData.get("iban") ?? "").toUpperCase().replace(/\s/g, ""),
    accountHolderName: formData.get("accountHolderName"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { amount, bankName, iban, accountHolderName } = parsed.data;

  // Verify user is a tutor
  const admin = createAdminClient();
  const { data: tutor } = await admin
    .from("tutors")
    .select("id")
    .eq("id", user.id)
    .single();
  if (!tutor) return { error: "يجب أن تكون مدرساً لطلب السحب" };

  const { data: withdrawalId, error } = await admin.rpc("create_withdrawal_request", {
    p_tutor_id: user.id,
    p_amount: amount,
    p_bank_name: bankName,
    p_iban: iban,
    p_account_holder_name: accountHolderName,
  });

  if (error) {
    console.error("[requestWithdrawal]", error.message);
    if (error.message.includes("Insufficient")) {
      return { error: "الرصيد المتاح غير كافٍ لإتمام طلب السحب" };
    }
    if (error.message.includes("Minimum")) {
      return { error: "الحد الأدنى للسحب هو 100 ر.ق" };
    }
    return { error: "تعذّر تقديم طلب السحب. يرجى المحاولة لاحقاً" };
  }

  return { data: { withdrawalId: withdrawalId as string } };
}
