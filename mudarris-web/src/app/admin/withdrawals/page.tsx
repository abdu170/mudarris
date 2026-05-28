import { getAdminWithdrawalsAction } from "@/lib/actions/admin";
import { AdminWithdrawalsClient } from "./AdminWithdrawalsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "طلبات السحب" };

export default async function AdminWithdrawalsPage() {
  const res = await getAdminWithdrawalsAction();
  return <AdminWithdrawalsClient initialWithdrawals={res.data ?? []} />;
}
