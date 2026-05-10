import { NextRequest, NextResponse } from 'next/server'
import { getCompilerToken } from '@/lib/auth'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const token = getCompilerToken()

  const response = await fetch(`${BACKEND_URL}/app/storage/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    return new NextResponse('File not found', { status: 404 })
  }

  const headers = new Headers()
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'transfer-encoding') {
      headers.set(key, value)
    }
  })

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  })
}