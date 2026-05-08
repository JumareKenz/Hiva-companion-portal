/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://admin-api.hiva.chat'
    const compilerUrl = process.env.NEXT_PUBLIC_COMPILER_URL || 'https://compiler.hiva.chat'
    return [
      {
        source: '/api/v1/:path*',
        destination: `${platformUrl}/api/v1/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${compilerUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
