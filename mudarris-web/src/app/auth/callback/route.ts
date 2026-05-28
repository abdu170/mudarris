import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles Supabase Auth email confirmation and password-reset redirects.
// Supabase sends the user to this URL with a `code` query param after clicking
// the verification link in their email.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "recovery" | "signup" | null
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (type === "recovery") {
        // Password reset — send to update-password page (stub for Phase 3)
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }

      // Email confirmation — get role and redirect to appropriate dashboard
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = user.app_metadata?.role as string | undefined;
        if (role === "admin") return NextResponse.redirect(`${origin}/admin`);
        if (role === "tutor") return NextResponse.redirect(`${origin}/tutor/pending`);
        return NextResponse.redirect(`${origin}/student/dashboard`);
      }
    }
  }

  // Fallback — redirect to login with error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
