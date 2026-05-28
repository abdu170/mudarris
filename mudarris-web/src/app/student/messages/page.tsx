import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { getConversationsAction } from "@/lib/actions/messages";
import MessagesClient from "./MessagesClient";

export const metadata: Metadata = { title: "الرسائل" };

export default async function StudentMessagesPage() {
  const user = await requireAuth();
  const res = await getConversationsAction();

  return (
    <MessagesClient
      initialConversations={res.data ?? []}
      currentUserId={user.id}
    />
  );
}
