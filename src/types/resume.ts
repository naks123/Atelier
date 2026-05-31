export interface ResumeRecord {
  id: string
  title: string
  latexSource: string
  createdAt: Date | null
  updatedAt: Date | null
  lastCompiledAt: Date | null
}

export type ResumeSort = 'updated' | 'title'

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error'

export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error'
