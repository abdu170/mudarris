"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/Button";

/**
 * Temporary page for verifying the PostHog integration:
 * - Pageview: visiting this page should already send a $pageview event.
 * - Custom event: button below sends a "test_button_clicked" event.
 * - Session recording: navigate around this page; a recording should
 *   appear under PostHog → Session Replay within a minute or two.
 * - Error tracking: button below throws an uncaught error, which
 *   `capture_exceptions: true` should report under PostHog → Error Tracking.
 *
 * Safe to delete once verified in the PostHog dashboard.
 */
export default function PostHogTestPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [distinctId, setDistinctId] = useState("—");

  useEffect(() => {
    const id = setInterval(() => {
      if (posthog.__loaded) {
        setDistinctId(posthog.get_distinct_id());
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">PostHog Test Page</h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Distinct ID: <code>{distinctId}</code>
      </p>

      <Button
        onClick={() => {
          posthog.capture("test_button_clicked", { source: "posthog-test-page" });
          setStatus("✅ Sent 'test_button_clicked' event — check PostHog Activity tab.");
        }}
      >
        Send test event
      </Button>

      <Button
        variant="secondary"
        onClick={() => {
          posthog.identify("test-user-123", { email: "test@mudarris.qa" });
          setStatus("✅ Identified as 'test-user-123' — check PostHog Persons tab.");
        }}
      >
        Identify test user
      </Button>

      <Button
        variant="danger"
        onClick={() => {
          throw new Error("PostHog test error — safe to ignore");
        }}
      >
        Trigger test error
      </Button>

      {status && <p className="text-sm">{status}</p>}

      <ol className="list-decimal space-y-2 ps-5 text-sm text-[var(--color-text-secondary)]">
        <li>افتح PostHog → Activity: يجب أن تظهر أحداث $pageview عند فتح هذه الصفحة وعند التنقل بين الصفحات.</li>
        <li>اضغط &quot;Send test event&quot; وتأكد من ظهور حدث test_button_clicked.</li>
        <li>اضغط &quot;Identify test user&quot; وتأكد من ظهور المستخدم test-user-123 في Persons.</li>
        <li>اضغط &quot;Trigger test error&quot; وتأكد من ظهور الخطأ في Error Tracking خلال دقيقة أو دقيقتين.</li>
        <li>افتح PostHog → Session Replay وتأكد من ظهور تسجيل لهذه الجلسة.</li>
      </ol>
    </main>
  );
}
