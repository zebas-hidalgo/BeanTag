import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { apiUrl } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onSuccess, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');

    const defaultCId = '167578250344-6e3dbkah789lpad56abbijv4j6vcb9jt.apps.googleusercontent.com';
    loadAndInitGoogle(defaultCId);

    fetch(apiUrl('api/auth/config'))
      .then(res => res.json())
      .then(data => {
        if (data.googleClientId && data.googleClientId !== defaultCId) {
          loadAndInitGoogle(data.googleClientId);
        }
      })
      .catch(() => {});
  }, [isOpen, mode]);

  const loadAndInitGoogle = (cId) => {
    if (!cId) return;
    if (!window.google && !document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleAuth(cId);
      document.body.appendChild(script);
    } else if (window.google) {
      initGoogleAuth(cId);
    }
  };

  const initGoogleAuth = (cId) => {
    if (!cId) return;
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: cId,
          callback: handleGoogleCallback,
          auto_select: false,
          ux_mode: 'popup'
        });
        setGoogleInitialized(true);

        // Try rendering official button into container with retries to ensure DOM readiness
        const renderNativeBtn = () => {
          const btnContainer = document.getElementById('google-btn-container');
          if (btnContainer) {
            btnContainer.innerHTML = '';
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'filled_blue',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              locale: 'es',
              width: 300,
              logo_alignment: 'left'
            });
          }
        };

        renderNativeBtn();
        setTimeout(renderNativeBtn, 100);
        setTimeout(renderNativeBtn, 500);

      } catch (e) {
        console.warn("Google Auth Init error:", e);
      }
    }
  };

  const handleCustomGoogleClick = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // 1. Try clicking Google rendered iframe if available
      const btnContainer = document.getElementById('google-btn-container');
      const iframeOrBtn = btnContainer ? btnContainer.querySelector('iframe, div[role="button"]') : null;
      if (iframeOrBtn) {
        iframeOrBtn.click();
        return;
      }
      
      // 2. Fallback to Google One-Tap prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn("Google prompt skipped or not displayed:", notification.getNotDisplayedReason());
        }
      });
    } else {
      if (showToast) showToast('Cargando Google Sign-In, reintenta en un segundo...', { type: 'info' });
    }
  };

  const handleGoogleCallback = (response) => {
    if (!response || !response.credential) return;
    setLoading(true);
    setErrorMsg('');

    fetch(apiUrl('api/auth/google'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.token) {
        if (showToast) showToast(`¡Bienvenido, ${data.user.name}! ☕`, { type: 'success', duration: 3000 });
        onSuccess(data);
        onClose();
      } else {
        setErrorMsg(data.error || 'Error al iniciar sesión con Google.');
      }
    })
    .catch(err => {
      setErrorMsg('Error de red al autenticar con Google.');
    })
    .finally(() => setLoading(false));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const endpoint = mode === 'login' ? 'api/auth/login' : 'api/auth/register';
    const payload = mode === 'login' ? { email, password } : { email, password, name };

    fetch(apiUrl(endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.token) {
        if (showToast) showToast(mode === 'login' ? `¡Sesión iniciada como ${data.user.name}! ☕` : '¡Cuenta creada con éxito! ☕', { type: 'success', duration: 3000 });
        onSuccess(data);
        onClose();
      } else {
        setErrorMsg(data.error || 'Error al procesar la solicitud.');
      }
    })
    .catch(() => {
      setErrorMsg('Error al conectar con el servidor.');
    })
    .finally(() => setLoading(false));
  };

  if (!isOpen) return null;

  return (
    <div className="bento-modal-overlay" onClick={onClose} style={{ zIndex: 11000 }}>
      <div className="candy-card animate-entrance" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '92%', padding: '24px', margin: 'auto', background: 'var(--color-surface, #FFFFFF)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={24} color="var(--color-crimson, #E53E3E)" />
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', margin: 0, fontWeight: '900' }}>
                Acceso a BeanTag
              </h3>
              <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: 'var(--color-text-muted)' }}>
                Sincroniza tus dosis de café congelado y bitácoras
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="var(--color-text-muted)" />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', marginBottom: '14px', fontWeight: 'bold' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* HERO: Custom React Google Sign-In Button with 4-Color Google Icon */}
        <div style={{ background: 'var(--color-bg, #F9FAFB)', border: '1.5px solid var(--color-border, #E5E7EB)', borderRadius: '16px', padding: '16px 14px', textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text)' }}>
            Acceso Rápido con tu Cuenta de Google
          </div>

          {/* Primary Custom React Button */}
          <button
            type="button"
            onClick={handleCustomGoogleClick}
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: '26px',
              border: '1.5px solid #DADCE0',
              background: '#FFFFFF',
              color: '#3C4043',
              fontWeight: '700',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(60,64,67,0.12)',
              transition: 'all 0.15s ease'
            }}
          >
            <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Hidden Container for GSI Rendered Button */}
          <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px', overflow: 'hidden' }}>
            <div id="google-btn-container"></div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: 'var(--color-text-muted)', fontSize: '11px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border, #E5E7EB)' }}></div>
          <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>o continuar con correo</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border, #E5E7EB)' }}></div>
        </div>

        {/* Tab Switcher for Email Auth */}
        <div style={{ display: 'flex', background: 'var(--color-bg, #F3F4F6)', borderRadius: '12px', padding: '4px', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              flex: 1, padding: '7px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer',
              background: mode === 'login' ? 'var(--color-surface, #FFF)' : 'transparent',
              color: mode === 'login' ? 'var(--color-crimson, #E53E3E)' : 'var(--color-text-muted)',
              boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            style={{
              flex: 1, padding: '7px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer',
              background: mode === 'register' ? 'var(--color-surface, #FFF)' : 'transparent',
              color: mode === 'register' ? 'var(--color-crimson, #E53E3E)' : 'var(--color-text-muted)',
              boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mode === 'register' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '10.5px' }}>Nombre Barista</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text" className="candy-input" placeholder="Tu Nombre"
                  style={{ paddingLeft: '34px', fontSize: '12px' }} value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '10.5px' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="email" className="candy-input" placeholder="barista@ejemplo.com" required
                style={{ paddingLeft: '34px', fontSize: '12px' }} value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '10.5px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="password" className="candy-input" placeholder="••••••••" required
                style={{ paddingLeft: '34px', fontSize: '12px' }} value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit" className="btn-candy primary" disabled={loading}
            style={{ width: '100%', marginTop: '4px', padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {loading ? 'Procesando...' : (mode === 'login' ? 'Entrar con Correo' : 'Registrar Cuenta Gratis')}
          </button>
        </form>

      </div>
    </div>
  );
}
