import type { Metadata } from "next";
import AdminMessagesClient from "./AdminMessagesClient";
import { getAdminConversationsAction } from "@/lib/actions/messages";

export const metadata: Metadata = { title: "إشراف المحادثات" };

export default async function AdminMessagesPage() {
  const res = await getAdminConversationsAction();

  if (res.error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-headline-lg">إشراف المحادثات</h1>
        <div className="card p-6 text-center">
          <p className="text-label-md text-[var(--color-error)]">{res.error}</p>
        </div>
      </div>
    );
  }

  return <AdminMessagesClient conversations={res.data ?? []} />;
}
