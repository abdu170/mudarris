"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";

/**
 * Initializes PostHog once on the client and wraps the app with the
 * PostHog React context. Pageviews are captured manually (see
 * PostHogPageView below) since PostHog's automatic pageview capture
 * does not account for Next.js App Router client-side navigation.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!apiKey || posthog.__loaded) return;

    posthog.init(apiKey, {
      api_host: apiHost || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      capture_exceptions: true,
      session_recording: {
        maskAllInputs: true,
      },
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = usePostHog();

  useEffect(() => {
    if (!pathname || !client) return;

    let url = window.origin + pathname;
    const search = searchParams.toString();
    if (search) {
      url += `?${search}`;
    }

    client.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, client]);

  return null;
}
