/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://admin-api.hiva.chat'
    const compilerUrl = process.env.NEXT_PUBLIC_COMPILER_URL || 'https://compiler.hiva.chat'
    const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL || 'https://api.hiva.chat'
    return [
      // api.hiva.chat hosts chatbot document endpoints; must come before the general /api/v1 rule
      // Note: /api/v1/chat/* is handled by the Next.js route handler at app/api/v1/chat/[slug]/route.ts
      {
        source: '/api/v1/chatbots/:path*',
        destination: `${chatUrl}/api/v1/chatbots/:path*`,
      },
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
