import type { CompileStatus } from '../types/resume.ts'

interface PdfPreviewProps {
  fileUrl: string | null
  status: CompileStatus
  errorMessage: string | null
}

export function PdfPreview({
  fileUrl,
  status,
  errorMessage,
}: PdfPreviewProps) {
  const previewUrl = fileUrl ? `${fileUrl}#toolbar=0&navpanes=0&view=FitH` : null

  return (
    <section className="workbench-pane surface-flat preview-shell">
      <div className="preview-header">
        <div className="pane-header-copy">
          <h2>Preview</h2>
          <p>Current PDF output.</p>
        </div>
      </div>

      <div className="preview-scroll">
        {previewUrl ? (
          <div className="preview-frame">
            <iframe
              key={previewUrl}
              src={previewUrl}
              title="Resume PDF preview"
            />
          </div>
        ) : (
          <div className="preview-empty">
            <strong>
              {status === 'compiling' ? 'Compiling the current draft.' : 'No PDF preview yet.'}
            </strong>
            <p>
              {errorMessage ||
                'Recompile after editing the source to render the current version of the document.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
