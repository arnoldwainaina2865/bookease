import { useEffect, useId, useRef } from 'react'
import { TriangleAlert, X } from 'lucide-react'

export default function ConfirmDialog({
  open,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current

    if (!open || !dialog) return

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow

    dialog.showModal()
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()

    return () => {
      if (dialog.open) dialog.close()

      document.body.style.overflow = previousOverflow

      if (previousFocus?.isConnected) {
        previousFocus.focus()
      }
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-card border border-border bg-surface p-0 text-foreground shadow-elevated backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              destructive
                ? 'bg-danger-soft text-danger-text'
                : 'bg-primary-soft text-primary'
            }`}
          >
            <TriangleAlert size={23} aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation"
            className="rounded-button p-2 text-muted hover:bg-surface-muted"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id={titleId}
          className="mt-5 text-xl font-bold tracking-tight"
        >
          {title}
        </h2>

        <p
          id={descriptionId}
          className="mt-3 text-sm leading-relaxed text-muted"
        >
          {message}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-button border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-11 rounded-button px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${
              destructive
                ? 'bg-danger-soft text-danger-text'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
