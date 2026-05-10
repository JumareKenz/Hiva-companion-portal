import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://admin-api.hiva.chat'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const qs = request.nextUrl.searchParams.toString()
    const url = `${API_URL}/api/v1/chat/${params.slug}/conversations${qs ? `?${qs}` : ''}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      return NextResponse.json(error, { status: response.status })
    }

    return NextResponse.json(await response.json())
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
  try {
    const qs = request.nextUrl.searchParams.toString()
    const url = `${API_URL}/api/v1/chat/${params.slug}/conversations${qs ? `?${qs}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      return NextResponse.json(error, { status: response.status })
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Proxy error' },
      { status: 500 }
    )
  }
}
