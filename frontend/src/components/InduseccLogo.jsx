export default function InduseccLogo({ className, style, alt = 'Indusecc', file = 'logo (1).png' }) {
  const encodedFile = encodeURIComponent(file)
  const src = `${import.meta.env.BASE_URL}${encodedFile}`
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      draggable="false"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        ...style,
      }}
    />
  )
}
