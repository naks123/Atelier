import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { DEFAULT_LATEX_TEMPLATE, DEFAULT_RESUME_TITLE } from '../data/defaultResume.ts'
import { assertFirebaseReady } from './firebase.ts'
import type { ResumeRecord } from '../types/resume.ts'

function coerceDate(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()
  }

  return null
}

function mapResume(id: string, data: DocumentData): ResumeRecord {
  return {
    id,
    title:
      typeof data.title === 'string' && data.title.trim().length > 0
        ? data.title
        : DEFAULT_RESUME_TITLE,
    latexSource:
      typeof data.latexSource === 'string'
        ? data.latexSource
        : DEFAULT_LATEX_TEMPLATE,
    createdAt: coerceDate(data.createdAt),
    updatedAt: coerceDate(data.updatedAt),
    lastCompiledAt: coerceDate(data.lastCompiledAt),
  }
}

function resumesCollection(userId: string) {
  const { db } = assertFirebaseReady()
  return collection(db, 'users', userId, 'resumes')
}

function resumeReference(userId: string, resumeId: string) {
  const { db } = assertFirebaseReady()
  return doc(db, 'users', userId, 'resumes', resumeId)
}

export function subscribeToResumes(
  userId: string,
  onData: (resumes: ResumeRecord[]) => void,
  onError: (error: Error) => void,
) {
  const resumeQuery = query(resumesCollection(userId), orderBy('updatedAt', 'desc'))

  return onSnapshot(
    resumeQuery,
    (snapshot) => {
      onData(snapshot.docs.map((item) => mapResume(item.id, item.data())))
    },
    (error) => {
      onError(error)
    },
  )
}

export function subscribeToResume(
  userId: string,
  resumeId: string,
  onData: (resume: ResumeRecord) => void,
  onMissing: () => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    resumeReference(userId, resumeId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onMissing()
        return
      }

      onData(mapResume(snapshot.id, snapshot.data()))
    },
    (error) => {
      onError(error)
    },
  )
}

export async function createResume(userId: string) {
  const created = await addDoc(resumesCollection(userId), {
    title: DEFAULT_RESUME_TITLE,
    latexSource: DEFAULT_LATEX_TEMPLATE,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastCompiledAt: null,
  })

  return created.id
}

export async function updateResumeDraft(
  userId: string,
  resumeId: string,
  payload: Pick<ResumeRecord, 'title' | 'latexSource'>,
) {
  await updateDoc(resumeReference(userId, resumeId), {
    title: payload.title.trim() || DEFAULT_RESUME_TITLE,
    latexSource: payload.latexSource,
    updatedAt: serverTimestamp(),
  })
}

export async function renameResume(
  userId: string,
  resumeId: string,
  title: string,
) {
  await updateDoc(resumeReference(userId, resumeId), {
    title: title.trim() || DEFAULT_RESUME_TITLE,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteResume(userId: string, resumeId: string) {
  await deleteDoc(resumeReference(userId, resumeId))
}

export async function duplicateResume(userId: string, resume: ResumeRecord) {
  const created = await addDoc(resumesCollection(userId), {
    title: `${resume.title} (Copy)`,
    latexSource: resume.latexSource,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastCompiledAt: null,
  })

  return created.id
}

export async function touchCompiledAt(userId: string, resumeId: string) {
  await updateDoc(resumeReference(userId, resumeId), {
    lastCompiledAt: serverTimestamp(),
  })
}
