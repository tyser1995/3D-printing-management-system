import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ['@prisma/adapter-better-sqlite3', '@prisma/adapter-pg'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
