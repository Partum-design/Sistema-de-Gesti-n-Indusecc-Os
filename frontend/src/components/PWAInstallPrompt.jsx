import React, { useEffect, useState } from 'react';
import { getPushPublicKey, sendPushTest, subscribeToPush } from '../api/api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [canNotify, setCanNotify] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    });

    setCanNotify('serviceWorker' in navigator && 'PushManager' in window);

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleEnablePush = async () => {
    if (!canNotify || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setMessage('Permiso de notificaciones denegado.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const keyResponse = await getPushPublicKey();
      const vapidKey = keyResponse?.data?.publicKey;
      if (!vapidKey) {
        setMessage('No hay llave publica VAPID configurada.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await subscribeToPush(subscription);
      setMessage('Notificaciones activadas.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'No se pudieron activar notificaciones.');
    } finally {
      setBusy(false);
    }
  };

  const handlePushTest = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await sendPushTest({ title: 'Prueba Push', body: 'Tu dispositivo ya recibe notificaciones.' });
      setMessage('Notificacion de prueba enviada.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'No se pudo enviar la prueba.');
    } finally {
      setBusy(false);
    }
  };

  if (!showInstall && !canNotify) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <img src="/Logotipo-07.png" alt="Logo" style={styles.logo} />
        <div>
          <div style={styles.title}>INDUSECC PWA</div>
          <div style={styles.subtitle}>Instala y activa notificaciones push</div>
        </div>
      </div>

      <div style={styles.actions}>
        {showInstall && (
          <button type="button" onClick={handleInstall} style={styles.primary} disabled={busy}>
            Instalar app
          </button>
        )}
        {canNotify && (
          <button type="button" onClick={handleEnablePush} style={styles.secondary} disabled={busy}>
            Activar notificaciones
          </button>
        )}
        {canNotify && (
          <button type="button" onClick={handlePushTest} style={styles.ghost} disabled={busy}>
            Enviar prueba
          </button>
        )}
      </div>

      {message ? <div style={styles.message}>{message}</div> : null}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'fixed',
    right: 16,
    bottom: 16,
    zIndex: 10000,
    width: 'min(340px, calc(100vw - 24px))',
    background: '#4c0910',
    color: '#fff',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 18px 30px rgba(0,0,0,0.25)',
    padding: 14,
  },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  logo: { width: 38, height: 38, objectFit: 'cover', borderRadius: 8, background: '#fff' },
  title: { fontWeight: 700, fontSize: 14 },
  subtitle: { fontSize: 12, opacity: 0.88 },
  actions: { display: 'grid', gap: 8 },
  primary: {
    border: 'none',
    borderRadius: 8,
    padding: '8px 10px',
    background: '#d7b15c',
    color: '#4c0910',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondary: {
    border: 'none',
    borderRadius: 8,
    padding: '8px 10px',
    background: '#fff',
    color: '#4c0910',
    fontWeight: 700,
    cursor: 'pointer',
  },
  ghost: {
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: 8,
    padding: '8px 10px',
    background: 'transparent',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  message: { marginTop: 10, fontSize: 12, opacity: 0.92 },
};
