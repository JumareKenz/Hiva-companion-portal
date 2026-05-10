'use client'

import { ChatInterface } from '@/components/chat/ChatInterface'
import { LogoBackground } from '@/components/ui/LogoBackground'

export default function PublicChatPage({ params }: { params: { slug: string } }) {
  return (
    <div className="relative min-h-screen">
      <LogoBackground size={600} opacity={0.02} fixed={false} spin={false} breathe={false} />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <ChatInterface 
          slug={params.slug}
          showHeader={true}
          compact={false}
        />
      </div>
    </div>
  )
}