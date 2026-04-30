import { useEffect } from 'react'

export default function Modal({ id, title, children, footer, open = true, onClose }) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" id={id}>
        <div className="modal-hd">
          <span className="modal-ttl">{title}</span>
          <button className="modal-close" onClick={onClose}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
