import { useEffect, useRef } from 'react'
import './Dialog.css'

/**
 * Dialog Component
 * Unified modal dialog with backdrop blur and accessibility
 *
 * @param {boolean} isOpen - Whether the dialog is open
 * @param {Function} onClose - Callback to close the dialog
 * @param {string} title - Dialog title (optional)
 * @param {ReactNode} children - Dialog content
 * @param {boolean} showCloseButton - Whether to show close button (default: true)
 * @param {boolean} fullscreenOnMobile - Whether dialog should be fullscreen on mobile (default: true)
 * @param {string} className - Additional CSS classes
 * @param {Object} style - Additional inline styles
 */
function Dialog({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  fullscreenOnMobile = true,
  className = '',
  style = {}
}) {
  const dialogRef = useRef(null)
  const previousFocus = useRef(null)

  // Handle ESC key and focus management
  useEffect(() => {
    if (!isOpen) return

    // Store previous focus
    previousFocus.current = document.activeElement

    // Focus dialog
    if (dialogRef.current) {
      dialogRef.current.focus()
    }

    // Handle ESC key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    // Cleanup
    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)

      // Restore focus
      if (previousFocus.current && previousFocus.current.focus) {
        previousFocus.current.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const dialogClasses = [
    'dialog',
    fullscreenOnMobile && 'dialog--fullscreen-mobile',
    className
  ].filter(Boolean).join(' ')

  return (
    <>
      {/* Backdrop */}
      <div
        className="dialog__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={dialogClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        tabIndex={-1}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="dialog__header">
            {title && (
              <h2 id="dialog-title" className="dialog__title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="dialog__close-button"
                onClick={onClose}
                aria-label="Dialog schließen"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="dialog__content">
          {children}
        </div>
      </div>
    </>
  )
}

export default Dialog
