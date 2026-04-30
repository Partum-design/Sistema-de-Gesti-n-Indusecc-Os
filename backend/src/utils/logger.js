const info = (message) => console.log(`[INFO] ${message}`)
const warn = (message) => console.warn(`[WARN] ${message}`)
const error = (message, err) => {
  console.error(`[ERROR] ${message}`)
  if (err) console.error(err)
}

module.exports = {
  info,
  warn,
  error,
}
