import { getAdminTutorsAction } from "@/lib/actions/admin";
import { AdminTutorsClient } from "./AdminTutorsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "إدارة المدرسين" };

export default async function AdminTutorsPage() {
  const [approvedRes, pendingRes] = await Promise.all([
    getAdminTutorsAction("approved"),
    getAdminTutorsAction("pending"),
  ]);

  return (
    <AdminTutorsClient
      initialApproved={approvedRes.data ?? []}
      initialPending={pendingRes.data ?? []}
    />
  );
}
