export function downloadBlob(blob, filename) {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadCSV(rows, filename) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return
  }
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(key => JSON.stringify(row[key] ?? '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

export function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  downloadBlob(blob, filename)
}
