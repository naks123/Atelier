import { BusyTexRunner, PdfLatex, clearAllPackageCache } from 'texlyre-busytex'
import { getErrorMessage } from './utils.ts'

const busyTexBasePath =
  (import.meta.env.VITE_BUSYTEX_BASE_PATH as string | undefined)?.trim() ||
  '/core/busytex'

const basicManifest = `${busyTexBasePath}/texlive-basic.js`
const recommendedManifest = `${busyTexBasePath}/texlive-recommended.js`
const extraManifest = `${busyTexBasePath}/texlive-extra.js`

const dataPackages = [basicManifest, recommendedManifest, extraManifest]

const runner = new BusyTexRunner({
  busytexBasePath: busyTexBasePath,
  engineMode: 'combined',
  preloadDataPackages: dataPackages,
  catalogDataPackages: dataPackages,
})

const compiler = new PdfLatex(runner)

let initializationPromise: Promise<void> | null = null
let compileQueue: Promise<void> = Promise.resolve()

const BUSYTEX_CACHE_REPAIR_KEY = 'resume-manager.busytex-cache-repair.v2'

function readCacheRepairMarker() {
  try {
    return window.localStorage.getItem(BUSYTEX_CACHE_REPAIR_KEY)
  } catch {
    return null
  }
}

function writeCacheRepairMarker(value: string) {
  try {
    window.localStorage.setItem(BUSYTEX_CACHE_REPAIR_KEY, value)
  } catch {
    // Ignore localStorage failures and keep runtime usable.
  }
}

async function resetBusyTexRuntime(clearCache: boolean) {
  runner.terminate()
  initializationPromise = null

  if (clearCache) {
    await clearAllPackageCache()
    writeCacheRepairMarker('done')
  }
}

async function repairBusyTexCacheIfNeeded() {
  if (readCacheRepairMarker() === 'done') {
    return
  }

  await resetBusyTexRuntime(true)
}

async function ensureRuntimeReady() {
  if (!initializationPromise) {
    initializationPromise = repairBusyTexCacheIfNeeded()
      .then(() => runner.initialize(true))
      .catch((error) => {
        initializationPromise = null
        throw error
      })
  }

  await initializationPromise
}

function isSuccessfulCompile(exitCode: number, success: boolean) {
  return success || exitCode === 0
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

function basename(path: string) {
  const pieces = path.split('/')
  return pieces[pieces.length - 1] ?? path
}

function extractPdfFilenameFromLog(log: string) {
  const match = log.match(/Output written on ([^\s)]+\.pdf)\b/i)
  return match?.[1] ? basename(match[1]) : null
}

function toPdfBytes(content: string | Uint8Array | ArrayBuffer | ArrayLike<number>) {
  if (typeof content === 'string') {
    const bytes = new Uint8Array(content.length)

    for (let index = 0; index < content.length; index += 1) {
      bytes[index] = content.charCodeAt(index) & 0xff
    }

    return bytes
  }

  if (content instanceof Uint8Array) {
    const bytes = new Uint8Array(content.byteLength)
    bytes.set(content)
    return bytes
  }

  if (content instanceof ArrayBuffer) {
    return new Uint8Array(content)
  }

  return Uint8Array.from(content)
}

function createPdfBlob(content: string | Uint8Array | ArrayBuffer | ArrayLike<number>) {
  return new Blob([toPdfBytes(content)], { type: 'application/pdf' })
}

async function readCompiledPdfFromProject(expectedFilename?: string | null) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const files = await runner.readProjectFiles()
    const pdfFile = [...files].reverse().find((file) => {
      if (!file.path.toLowerCase().endsWith('.pdf')) {
        return false
      }

      if (!expectedFilename) {
        return true
      }

      return basename(file.path) === expectedFilename
    })

    if (pdfFile) {
      return createPdfBlob(pdfFile.content)
    }

    await sleep(60 * (attempt + 1))
  }

  return null
}

function hasMissingPackageError(log: string) {
  return /LaTeX Error: File [`'"][^`'"]+\.sty[`'"] not found\./i.test(log)
}

function shouldRetryCompile({
  succeeded,
  pdf,
  log,
}: {
  succeeded: boolean
  pdf: Blob | null
  log: string
}) {
  if (hasMissingPackageError(log)) {
    return true
  }

  return succeeded && !pdf
}

async function executeCompile(source: string) {
  await ensureRuntimeReady()

  const result = await compiler.compile({
    input: source,
    rerun: true,
    verbose: 'info',
    dataPackagesJs: dataPackages,
  })

  const succeeded = isSuccessfulCompile(result.exitCode, result.success)
  const expectedPdfFilename = extractPdfFilenameFromLog(result.log)
  let pdf = succeeded && result.pdf ? createPdfBlob(result.pdf) : null

  if (!pdf && succeeded) {
    pdf = await readCompiledPdfFromProject(expectedPdfFilename)
  }

  return {
    result,
    pdf,
    succeeded,
  }
}

async function compileWithRecovery(source: string) {
  let firstAttempt = await executeCompile(source)

  if (
    shouldRetryCompile({
      succeeded: firstAttempt.succeeded,
      pdf: firstAttempt.pdf,
      log: firstAttempt.result.log,
    })
  ) {
    await resetBusyTexRuntime(true)
    firstAttempt = await executeCompile(source)
  }

  return {
    result: firstAttempt.result,
    pdf: firstAttempt.pdf,
    succeeded: firstAttempt.succeeded,
  }
}

export async function compileResumePdf(source: string) {
  const previousCompile = compileQueue

  let releaseQueue: () => void = () => {}
  compileQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve
  })

  await previousCompile

  try {
    return await compileWithRecovery(source)
  } finally {
    releaseQueue()
  }
}

export function explainLatexRuntimeError(error: unknown) {
  const message = getErrorMessage(error)

  if (
    /busytex_worker|busytex\.js|busytex\.wasm|404|Failed to initialize BusyTeX/i.test(
      message,
    )
  ) {
    return 'LaTeX assets are missing. Run `npm run latex:assets` or point `VITE_BUSYTEX_BASE_PATH` at a hosted BusyTeX asset folder.'
  }

  return message
}

export function getLatexRuntimeBasePath() {
  return busyTexBasePath
}
