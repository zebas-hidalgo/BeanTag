import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { apiUrl } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onSuccess, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('google-client-id') || '');
  const [showGoogleConfig, setShowGoogleConfig] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');

    const savedClientId = localStorage.getItem('google-client-id');
    if (savedClientId && window.google) {
      initGoogleAuth(savedClientId);
    } else if (savedClientId && !window.google && !document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleAuth(savedClientId);
      document.body.appendChild(script);
    }
  }, [isOpen, mode]);

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

        const btnContainer = document.getElementById('google-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            locale: 'es',
            width: 280
          });
        }
      } catch (e) {
        console.warn("Google Auth Init error:", e);
      }
    }
  };

  const handleSaveGoogleClientId = () => {
    if (!googleClientId.trim()) return;
    localStorage.setItem('google-client-id', googleClientId.trim());
    setShowGoogleConfig(false);
    if (showToast) showToast('Google Client ID guardado.', { type: 'success' });
    initGoogleAuth(googleClientId.trim());
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
      setErrorMsg('Error de red al conectar con Google.');
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
      <div className="candy-card animate-entrance" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', width: '92%', padding: '24px', margin: 'auto', background: 'var(--color-surface, #FFFFFF)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} color="var(--color-crimson, #E53E3E)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', margin: 0, fontWeight: '900' }}>
              {mode === 'login' ? 'Iniciar Sesión en BeanTag' : 'Crear Cuenta en BeanTag'}
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="var(--color-text-muted)" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--color-bg, #F3F4F6)', borderRadius: '12px', padding: '4px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
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
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
              background: mode === 'register' ? 'var(--color-surface, #FFF)' : 'transparent',
              color: mode === 'register' ? 'var(--color-crimson, #E53E3E)' : 'var(--color-text-muted)',
              boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Registrarse
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', marginBottom: '14px', fontWeight: 'bold' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'register' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px' }}>Nombre</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text" className="candy-input" placeholder="Tu Nombre o Apodo Barista"
                  style={{ paddingLeft: '36px' }} value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="email" className="candy-input" placeholder="tu@correo.com" required
                style={{ paddingLeft: '36px' }} value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="password" className="candy-input" placeholder="••••••••" required
                style={{ paddingLeft: '36px' }} value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit" className="btn-candy primary" disabled={loading}
            style={{ width: '100%', marginTop: '6px', padding: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? 'Cargando...' : (mode === 'login' ? 'Entrar a mi Inventario' : 'Crear Cuenta Gratis')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 14px 0', color: 'var(--color-text-muted)', fontSize: '11px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border, #E5E7EB)' }}></div>
          <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>o continuar con</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border, #E5E7EB)' }}></div>
        </div>

        {/* Google Auth Container */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '44px', gap: '8px' }}>
          <div id="google-btn-container"></div>
          
          {!localStorage.getItem('google-client-id') && (
            <div style={{ fontSize: '11px', textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {!showGoogleConfig ? (
                <button
                  type="button"
                  onClick={() => setShowGoogleConfig(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-crimson, #E53E3E)', cursor: 'pointer', textDecoration: 'underline', fontSize: '11px', fontWeight: 'bold' }}
                >
                  ⚙️ Configurar Google Client ID para inicio con Google
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '6px' }}>
                  <input
                    type="text"
                    className="candy-input"
                    placeholder="Tu Client ID (ej. 123...apps.googleusercontent.com)"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    style={{ fontSize: '10.5px', flex: 1, padding: '6px' }}
                  />
                  <button type="button" className="btn-candy primary" onClick={handleSaveGoogleClientId} style={{ fontSize: '10.5px', padding: '6px 10px', margin: 0 }}>
                    Guardar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
