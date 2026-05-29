import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/student", "/tutor", "/admin"] as const;
const ADMIN_PREFIXES = ["/admin"] as const;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run on protected routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  let response = NextResponse.next({ request });

  // Build a Supabase client that can refresh session cookies inline
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — required to keep auth alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated — redirect to login, preserve intended destination
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.app_metadata?.role as string | undefined;

  // Admin routes require admin role verified from JWT app_metadata
  const isAdminRoute = ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAdminRoute) {
    if (role !== "admin") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname =
        role === "tutor" ? "/tutor/dashboard" : "/student/dashboard";
      dashboardUrl.searchParams.delete("next");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Tutor routes: redirect unapproved tutors to /tutor/pending
  // Skip the pending page itself to avoid infinite redirect
  if (role === "tutor" && pathname.startsWith("/tutor") && pathname !== "/tutor/pending") {
    const { data: tutor } = await supabase
      .from("tutors")
      .select("status")
      .eq("id", user.id)
      .single();

    if (!tutor || tutor.status !== "approved") {
      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = "/tutor/pending";
      pendingUrl.searchParams.delete("next");
      return NextResponse.redirect(pendingUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all protected routes but exclude static files and Next.js internals
    "/(student|tutor|admin)/:path*",
  ],
};
