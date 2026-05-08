import type {
  DocumentStatus,
  BlockType,
  BlockStatus,
  JobStatus,
  JobStep,
  ChunkType,
  Language,
  Role,
  LogLevel,
  ChatbotStatus,
  AgentMode,
  PersonaTemplate,
  ChatbotDocumentStatus,
} from './enums'

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

export interface ApiError {
  status: number
  message: string
  detail: string | Record<string, unknown>
}

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  is_active?: boolean
  created_at?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Document {
  id: string
  name: string
  source: string
  year: string
  origin_language: string
  status: DocumentStatus
  file_path: string
  file_extension: '.pdf' | '.docx'
  created_by: { id: string; full_name: string }
  created_at: string
  updated_at: string
  block_count?: number
  approved_block_count?: number
}

export interface Block {
  id: string
  document_id: string
  block_index: number
  block_type: BlockType
  raw_content: string
  structured_content: Record<string, unknown> | null
  confidence_score: number
  status: BlockStatus
  reviewer_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface CompileJob {
  id: string
  document_id: string
  document_name?: string
  languages: Language[]
  status: JobStatus
  current_step: JobStep | null
  started_at: string | null
  completed_at: string | null
  hiv_file_size_kb: number | null
  chunk_count: number | null
  reused_chunk_count: number | null
  validation_warnings: string[] | null
  error_message: string | null
  created_by: { id: string; full_name: string }
  created_at: string
}

export interface HivRelease {
  id: string
  version: string
  sha256: string
  size_kb: number
  chunk_count: number
  languages: Language[]
  is_active: boolean
  needs_review: boolean
  created_at: string
}

export interface ChunkLibraryEntry {
  id: string
  content_hash: string
  chunk_type?: ChunkType
  compiled_en_preview: string | null
  tone_applied: boolean
  translations_available: string[]
  created_at: string
  last_used_at: string
}

export interface ChunkStats {
  total: number
  compiled: number
  tone_applied: number
  translated_by_lang: Record<string, number>
  reuse_rate: number
}

export interface LogEvent {
  timestamp: string
  step: JobStep | 'complete' | 'failed'
  level: LogLevel
  message: string
  progress_pct: number
}

export interface HivVersion {
  version: string
  size_kb: number
  sha256: string
  languages: Language[]
  chunk_count: number
  created_at: string
}

export interface ChatbotTone {
  formality: number
  verbosity: number
  empathy: number
}

export interface ChatbotGuidelines {
  citeSources: boolean
  includePolicyNumbers: boolean
  allowOffTopic: boolean
  escalateComplex: boolean
}

export interface AgencyChatbot {
  id: string
  organization_id: string
  name: string
  slug: string
  description: string | null
  status: ChatbotStatus
  system_prompt: string | null
  welcome_message: string
  fallback_message: string | null
  brand_color: string
  temperature: number
  top_k: number
  min_confidence: number
  enable_citations: boolean
  enable_grounding: boolean
  strict_domain: boolean
  domain_keywords: string[] | null
  agent_mode: AgentMode
  primary_language: Language
  secondary_languages: Language[]
  persona_template: PersonaTemplate
  document_count: number
  created_at: string
  updated_at: string
}

export interface ChatbotDocument {
  id: string
  filename: string
  content_type: string
  size_bytes: number
  status: ChatbotDocumentStatus
  progress_percent: number
  chunk_count: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface EmbedCode {
  script_tag: string
  iframe_code: string
  direct_url: string
}

export interface ChatbotStats {
  total_conversations: number
  total_messages: number
  average_conversation_length: number
  satisfaction_rate: number
  top_queries: { query: string; count: number }[]
  daily_stats: { date: string; conversations: number; messages: number }[]
}

export interface HealthCheck {
  status: 'ok' | 'degraded'
  version: string
  db: string
  redis: string
  worker_queues: { restructure: number; compile: number }
}

export interface AccessCode {
  id: string
  server_code: string
  name: string
  max_users: number | null
  auth_count: number
  is_active: boolean
  expires_at: string | null
  last_used_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
