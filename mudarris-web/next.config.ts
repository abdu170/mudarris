import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // XSS protection for legacy browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Referrer policy — don't leak path to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed for this app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Content Security Policy
  // Merithub sessions open in new tab (target="_blank") — no embed needed.
  // Supabase Realtime uses WSS — covered by connect-src.
  // Tap checkout opens in new tab — no iframe needed (frame-ancestors DENY).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + client-side hydration
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind CSS v4 + inline styles from React
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Supabase storage for avatars + tutor docs + randomuser.me for mock data
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://randomuser.me",
      // Supabase API + Realtime WSS + Tap API (for future inline Tap SDK if needed)
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://api.tap.company",
      // No iframes allowed
      "frame-src 'none'",
      "frame-ancestors 'none'",
      // No plugins
      "object-src 'none'",
      // Upgrade insecure requests in production
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Images from Supabase Storage (avatars, public assets) + randomuser.me for mock data
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
};

export default nextConfig;
