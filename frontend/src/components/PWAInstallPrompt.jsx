import React, { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevenir que el navegador muestre su propio prompt
      e.preventDefault();
      // Guardar el evento para dispararlo luego
      setDeferredPrompt(e);
      // Mostrar nuestro botón o aviso
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Verificar si ya está instalada
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('PWA instalada con éxito');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuario respondió a la instalación: ${outcome}`);
    
    // Limpiar el prompt guardado
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'linear-gradient(135deg, #8B0000 0%, #5E0000 100%)', // Vino
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '300px',
      border: '1px solid rgba(201, 168, 76, 0.3)', // Borde sutil dorado
      animation: 'slideUp 0.5s ease-out'
    }}>
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          background: 'var(--gold)', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#8B0000',
          fontSize: '1.2rem'
        }}>
          📲
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Instalar Indusecc OS</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Acceso rápido desde tu pantalla de inicio</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            padding: '8px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Después
        </button>
        <button 
          onClick={handleInstallClick}
          style={{
            flex: 2,
            background: 'var(--gold)', // Dorado
            border: 'none',
            color: '#8B0000',
            padding: '8px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(201, 168, 76, 0.4)'
          }}
        >
          Instalar Ahora
        </button>
      </div>
    </div>
  );
}
