/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'books.google.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Blocks the app from being loaded in an iframe on another
          // site (clickjacking).
          { key: 'X-Frame-Options', value: 'DENY' },
          // Stops the browser guessing content types away from what
          // the server actually declared.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak the full URL (which can contain query params) to
          // third-party sites linked from this app.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features this app never uses.
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
