export default function NotificationsPanel({ title, badgeLabel, items, onViewAll, panelStyle, badgeStyle }) {
  return (
    <div className="notif-panel" style={{ width: 320, minWidth: 320, ...panelStyle }}>
      <div style={{ padding: '.95rem 1.1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{title}</span>
        <span className="badge" style={{ fontSize: '.62rem', ...badgeStyle }}>{badgeLabel}</span>
      </div>
      <div style={{ padding: '.4rem' }}>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: 10, padding: '10px 11px', borderRadius: 6, cursor: 'pointer', background: item.bg || 'transparent', marginBottom: index < items.length - 1 ? 6 : 0 }}>
            <div style={{ width: 8, height: 8, background: item.color || 'var(--ink)', borderRadius: '50%', marginTop: 5, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '.8rem', fontWeight: 600, color: item.titleColor || 'var(--ink)' }}>{item.title}</div>
              {item.subtitle && <div style={{ fontSize: '.72rem', color: 'var(--ash)', marginTop: 3 }}>{item.subtitle}</div>}
              {item.time && <div style={{ fontSize: '.68rem', color: 'var(--ash)', marginTop: 4 }}>{item.time}</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '.7rem 1.1rem', borderTop: '1px solid var(--border)', textAlign: 'center', cursor: 'pointer' }} onClick={onViewAll}>
        <span style={{ fontSize: '.75rem', color: 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          Ver todas <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </span>
      </div>
    </div>
  )
}
