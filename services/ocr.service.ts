import { compilerApi } from './compilerHttp'

export interface OcrJob {
  id: string
  status: 'queued' | 'running' | 'complete' | 'failed'
  filename: string
  progress: number
  error: string | null
  created_at: string
  document_id: string | null
  has_output: boolean
  output_chars: number | null
}

export interface OcrExtractResponse {
  job_id: string
  status: string
  message: string
}

export const ocrService = {
  async extract(formData: FormData): Promise<OcrExtractResponse> {
    return compilerApi.upload<OcrExtractResponse>('/ocr/extract', formData)
  },

  async getJob(jobId: string): Promise<OcrJob> {
    return compilerApi.get<OcrJob>(`/ocr/${jobId}`)
  },

  async listJobs(): Promise<OcrJob[]> {
    return compilerApi.get<OcrJob[]>('/ocr')
  },

  async download(jobId: string): Promise<Blob> {
    return compilerApi.download(`/ocr/${jobId}/download`)
  },

  async createDocument(
    jobId: string,
    data: { name: string; source: string; year: string }
  ): Promise<{ document_id: string }> {
    return compilerApi.post<{ document_id: string }>(`/ocr/${jobId}/create-document`, data)
  },
}
