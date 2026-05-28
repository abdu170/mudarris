import type { Metadata } from "next";
import StudentWalletClient from "./StudentWalletClient";
import { getStudentPaymentsAction } from "@/lib/actions/payments";

export const metadata: Metadata = { title: "المحفظة" };

export default async function StudentWalletPage() {
  const res = await getStudentPaymentsAction();

  if (res.error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-headline-lg">المحفظة</h1>
        <div className="card p-6 text-center">
          <p className="text-label-md text-[var(--color-error)]">{res.error}</p>
        </div>
      </div>
    );
  }

  return <StudentWalletClient payments={res.data ?? []} />;
}
