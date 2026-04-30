import { useState, useRef, useEffect } from 'react'

let _setToasts = null

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  const setToastsRef = useRef(setToasts)

  useEffect(() => {
    setToastsRef.current = setToasts
    _setToasts = setToasts
  }, [setToasts])

  function remove(id) {
    setToasts(t => t.filter(x => x.id !== id))
  }

  const Icon = ({ type }) => {
    if (type === 'ok') return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
    if (type === 'err') return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    if (type === 'warn') return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
    return <svg fill="currentColor" viewBox="0 0 24 24" width="8"><circle cx="12" cy="12" r="12"/></svg>
  }

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item${t.type && t.type !== 'n' ? ' toast-' + t.type : ''}`}>
          <Icon type={t.type} />
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button
            onClick={() => remove(t.id)}
            style={{ background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',padding:'0 0 0 8px',fontSize:'1.2rem',lineHeight:1,flexShrink:0 }}
            title="Cerrar"
          >×</button>
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function toast(msg, type = 'n') {
  if (!_setToasts) return
  const id = Date.now() + Math.random()
  _setToasts(t => [...t.slice(-4), { id, msg, type }])
  setTimeout(() => {
    if (_setToasts) _setToasts(t => t.filter(x => x.id !== id))
  }, 4000)
}
