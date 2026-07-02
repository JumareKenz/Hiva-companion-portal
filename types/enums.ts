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

export type BundleJobStatus = 'queued' | 'running' | 'awaiting_review' | 'complete' | 'failed'

export type PipelineStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export const PIPELINE_STAGES: { stage: PipelineStage; label: string; description: string }[] = [
  { stage: 0, label: 'Upload & OCR', description: 'Document ingestion and text extraction' },
  { stage: 1, label: 'Chunking', description: 'Identifying logical content boundaries' },
  { stage: 2, label: 'Semantic Review', description: 'Repairing broken chunk boundaries' },
  { stage: 3, label: 'LLM Processing', description: 'Extracting Q&A and medical terms' },
  { stage: 4, label: 'Tone Variants', description: 'Generating formal/reassuring/urgent versions' },
  { stage: 5, label: 'Rule Extraction', description: 'Building decision trees and calculators' },
  { stage: 6, label: 'Human Review', description: 'Domain expert approval of clinical rules' },
  { stage: 7, label: 'Translation', description: 'Translating into target languages' },
  { stage: 8, label: 'Packaging', description: 'Creating signed .hiv bundle' },
]

export type ReviewDecision = 'APPROVED' | 'EDITED' | 'REJECTED'
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'EDITED' | 'REJECTED'

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
