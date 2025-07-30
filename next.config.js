/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Intentionally disabling security features
  headers: async () => {
    return []
  },
  poweredByHeader: true, // Expose Next.js version
}

module.exports = nextConfig