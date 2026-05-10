import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.hiva.chat'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  
  try {
    const body = await request.json()

    // Handle /conversations and other sub-paths
    const path = request.nextUrl.pathname.replace(`/api/chat/${slug}`, '')
    const endpoint = path ? `/api/v1/chat/${slug}${path}` : `/api/v1/chat/${slug}`
    const qs = request.nextUrl.searchParams.toString()
    const fullUrl = `${API_URL}${endpoint}${qs ? `?${qs}` : ''}`

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Chat request failed' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Proxy error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  
  try {
    const path = request.nextUrl.pathname.replace(`/api/chat/${slug}`, '')
    const endpoint = path ? `/api/v1/chat/${slug}${path}` : `/api/v1/chat/${slug}`
    const qs = request.nextUrl.searchParams.toString()
    const fullUrl = `${API_URL}${endpoint}${qs ? `?${qs}` : ''}`

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Proxy error' },
      { status: 500 }
    )
  }
}