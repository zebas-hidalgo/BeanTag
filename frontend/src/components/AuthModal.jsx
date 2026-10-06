import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, Sparkles, AlertCircle, KeyRound } from 'lucide-react';
import { apiUrl } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onSuccess, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleOnlyError, setIsGoogleOnlyError] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('167578250344-6e3dbkah789lpad56abbijv4j6vcb9jt.apps.googleusercontent.com');
  const googleBtnContainerRef = useRef(null);

  const renderNativeBtn = () => {
    if (googleBtnContainerRef.current && window.google?.accounts?.id) {
      try {
        googleBtnContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: 'es',
          width: 300,
          logo_alignment: 'left'
        });
      } catch (e) {
        console.warn("Error rendering Google button:", e);
      }
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
        renderNativeBtn();
        setTimeout(renderNativeBtn, 150);
        setTimeout(renderNativeBtn, 500);
      } catch (e) {
        console.warn("Google Auth Init error:", e);
      }
    }
  };

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

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setIsGoogleOnlyError(false);

    const defaultCId = '167578250344-6e3dbkah789lpad56abbijv4j6vcb9jt.apps.googleusercontent.com';

    fetch(apiUrl('api/auth/config'))
      .then(res => res.json())
      .then(data => {
        const cId = data.googleClientId || defaultCId;
        setGoogleClientId(cId);
        loadAndInitGoogle(cId);
      })
      .catch(() => {
        loadAndInitGoogle(defaultCId);
      });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && googleInitialized) {
      renderNativeBtn();
      const t = setTimeout(renderNativeBtn, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen, googleInitialized, mode]);

  const handlePromptFallback = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn("Google prompt skipped:", notification.getNotDisplayedReason());
          if (showToast) showToast('Google One-Tap no disponible en este navegador. Usa correo y contraseña abajo.', { type: 'info' });
        }
      });
    } else {
      if (showToast) showToast('Cargando servicio Google, un momento...', { type: 'info' });
    }
  };

  const handleGoogleCallback = (response) => {
    if (!response || !response.credential) return;
    setLoading(true);
    setErrorMsg('');
    setIsGoogleOnlyError(false);

    fetch(apiUrl('api/auth/google'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.token) {
        localStorage.setItem('beantag-token', data.token);
        localStorage.setItem('beantag-user', JSON.stringify(data.user));
        if (showToast) showToast(`¡Bienvenido, ${data.user.name}! ☕`, { type: 'success', duration: 3000 });
        if (onSuccess) onSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMsg(data.error || 'Error al iniciar sesión con Google.');
      }
    })
    .catch(() => {
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
    setIsGoogleOnlyError(false);

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
        localStorage.setItem('beantag-token', data.token);
        localStorage.setItem('beantag-user', JSON.stringify(data.user));
        const toastMsg = data.linked
          ? `¡Contraseña vinculada a tu cuenta con éxito! Sesión iniciada como ${data.user.name} ☕`
          : (mode === 'login' ? `¡Sesión iniciada como ${data.user.name}! ☕` : '¡Cuenta creada con éxito! ☕');
        if (showToast) showToast(toastMsg, { type: 'success', duration: 3000 });
        if (onSuccess) onSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMsg(data.error || 'Error al procesar la solicitud.');
        if (data.isGoogleOnly) {
          setIsGoogleOnlyError(true);
        }
      }
    })
    .catch(() => {
      setErrorMsg('Error al conectar con el servidor.');
    })
    .finally(() => setLoading(false));
  };

  if (!isOpen) return null;

  return (
    <div className="bento-modal-overlay" onClick={onClose} style={{ zIndex: 11000 }} role="dialog" aria-modal="true" aria-label="Iniciar sesión" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} tabIndex={-1} ref={(el) => el && el.focus()}>
      <div className="candy-card animate-entrance" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '100%', padding: '20px 18px', margin: 'auto', background: 'var(--color-surface, #FFFFFF)', boxSizing: 'border-box' }}>
        
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
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', marginBottom: '14px', fontWeight: '600', border: '1px solid #FECACA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
            {isGoogleOnlyError && (
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setIsGoogleOnlyError(false);
                }}
                className="btn-candy secondary"
                style={{ width: '100%', marginTop: '8px', fontSize: '11.5px', padding: '8px 10px', background: '#FFFFFF', color: '#991B1B', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <KeyRound size={14} />
                <span>Asignar contraseña a este correo en "Crear Cuenta"</span>
              </button>
            )}
          </div>
        )}

        {/* HERO: Google Sign-In Container */}
        <div style={{ background: 'var(--color-bg, #F9FAFB)', border: '1.5px solid var(--color-border, #E5E7EB)', borderRadius: '16px', padding: '16px 14px', textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text)' }}>
            Acceso Rápido con tu Cuenta de Google
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '44px', width: '100%' }}>
            <div ref={googleBtnContainerRef} id="google-btn-container" style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '40px' }}></div>
          </div>

          {!googleInitialized && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Cargando Google Sign-In... o ingresa con tu correo abajo.
            </div>
          )}

          {googleInitialized && (
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={handlePromptFallback}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                ¿No puedes hacer clic? Abrir selector Google One-Tap
              </button>
            </div>
          )}
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
            onClick={() => { setMode('login'); setErrorMsg(''); setIsGoogleOnlyError(false); }}
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
            onClick={() => { setMode('register'); setErrorMsg(''); setIsGoogleOnlyError(false); }}
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
