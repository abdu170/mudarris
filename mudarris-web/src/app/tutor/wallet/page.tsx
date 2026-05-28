import type { Metadata } from "next";
import TutorWalletClient from "./TutorWalletClient";
import { getTutorWalletAction, getTutorWithdrawalsAction } from "@/lib/actions/wallet";

export const metadata: Metadata = { title: "المحفظة" };

export default async function TutorWalletPage() {
  const [walletRes, withdrawalsRes] = await Promise.all([
    getTutorWalletAction(),
    getTutorWithdrawalsAction(),
  ]);

  if (walletRes.error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-headline-lg">المحفظة</h1>
        <div className="card p-6 text-center">
          <p className="text-label-md text-[var(--color-error)]">{walletRes.error}</p>
        </div>
      </div>
    );
  }

  return (
    <TutorWalletClient
      initialData={walletRes.data!}
      initialWithdrawals={withdrawalsRes.data ?? []}
    />
  );
}
