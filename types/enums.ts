export type DocumentStatus =
  | 'pending_review'
  | 'in_review'
  | 'ready_to_compile'
  | 'compiling'
  | 'compiled'
  | 'failed'

export type BlockType = 'paragraph' | 'heading' | 'table' | 'image_placeholder'
export type BlockStatus = 'pending' | 'approved' | 'flagged'

export type JobStatus = 'queued' | 'running' | 'complete' | 'failed'
export type JobStep =
  | 'chunk'
  | 'deduplicate'
  | 'process'
  | 'tone'
  | 'rule_compile'
  | 'translate'
  | 'validate'
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
