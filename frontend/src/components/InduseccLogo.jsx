export default function InduseccLogo({ className, style, alt = 'Indusecc' }) {
  const src = `${import.meta.env.BASE_URL}logo%20(1).png`
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
