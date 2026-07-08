export type DocumentStatus =
  | 'uploaded'
  | 'pending_review'
  | 'in_review'
  | 'ready_to_compile'
  | 'compiling'
  | 'compiled'
  | 'failed'

export type BlockType = 'paragraph' | 'heading' | 'table' | 'image_placeholder'
export type BlockStatus = 'pending' | 'approved' | 'flagged'

export type BundleJobStatus = 'queued' | 'running' | 'complete' | 'failed'

export type PipelineStage = 0 | 1 | 2 | 3 | 4

export const PIPELINE_STAGES: { stage: PipelineStage; label: string; description: string }[] = [
  { stage: 0, label: 'Chunk', description: 'Splitting source text into logical content blocks' },
  { stage: 1, label: 'Deduplicate', description: 'Removing duplicate and redundant chunks' },
  { stage: 2, label: 'Translate', description: 'LLM translation into target languages' },
  { stage: 3, label: 'Package & Embed', description: 'Embedding vectors and packaging bundle' },
  { stage: 4, label: 'Sign', description: 'Cryptographically signing the .hiv bundle' },
]

export type JobStatus = 'queued' | 'running' | 'complete' | 'failed'
export type JobStep =
  | 'chunk'
  | 'deduplicate'
  | 'translate'
  | 'package'
  | 'sign'
  | 'complete'

export type ChunkType = 'drug_table' | 'danger_sign' | 'decision_tree' | 'protocol' | 'faq'
export type Language = 'en' | 'ha' | 'yo' | 'ig' | 'pcm'
export type Role = 'admin' | 'reviewer'
export type LogLevel = 'info' | 'warn' | 'error'

export type ChatbotStatus = 'draft' | 'active' | 'paused' | 'archived'
export type AgentMode = 'auto' | 'force_agentic' | 'force_passive'
export type PersonaTemplate = 'friendly' | 'formal' | 'empathetic' | 'technical' | 'custom'
export type ChatbotDocumentStatus = 'pending' | 'processing' | 'ready' | 'error'
