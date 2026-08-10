import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, Sparkles, Key, CheckCircle } from 'lucide-react';
import { apiUrl } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onSuccess, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('google-client-id') || '');
  const [showConfigInput, setShowConfigInput] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');

    // Fetch Google Client ID configuration from backend
    fetch(apiUrl('api/auth/config'))
      .then(res => res.json())
      .then(data => {
        const activeClientId = data.googleClientId || localStorage.getItem('google-client-id') || '';
        if (activeClientId) {
          setGoogleClientId(activeClientId);
          loadAndInitGoogle(activeClientId);
        }
      })
      .catch(() => {
        const localCId = localStorage.getItem('google-client-id');
        if (localCId) loadAndInitGoogle(localCId);
      });
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
      } catch (e) {
        console.warn("Google Auth Init error:", e);
      }
    }
  };

  const handleSaveGoogleClientId = () => {
    if (!googleClientId.trim()) return;
    const cleanId = googleClientId.trim();
    localStorage.setItem('google-client-id', cleanId);
    setShowConfigInput(false);
    if (showToast) showToast('Google Client ID guardado correctamente.', { type: 'success' });
    loadAndInitGoogle(cleanId);
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

        {/* HERO: Primary Google Login Option */}
        <div style={{ background: 'var(--color-bg, #F9FAFB)', border: '1.5px solid var(--color-border, #E5E7EB)', borderRadius: '16px', padding: '16px', textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--color-text)' }}>
            🌐 Inicio de Sesión Oficial con Google
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '44px', width: '100%' }}>
            <div id="google-btn-container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}></div>
          </div>

          {!googleClientId && !showConfigInput && (
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="btn-candy primary"
                onClick={() => setShowConfigInput(true)}
                style={{ fontSize: '11px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0 }}
              >
                <Key size={14} />
                Ingresar Google Client ID
              </button>
            </div>
          )}

          {showConfigInput && (
            <div style={{ marginTop: '12px', textAlign: 'left', background: '#FFF', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
              <label style={{ fontSize: '10.5px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                Google OAuth Client ID:
              </label>
              <input
                type="text"
                className="candy-input"
                placeholder="12345-abc.apps.googleusercontent.com"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                style={{ fontSize: '11px', padding: '6px 8px', marginBottom: '8px' }}
              />
              <button
                type="button"
                className="btn-candy primary"
                onClick={handleSaveGoogleClientId}
                style={{ width: '100%', fontSize: '11px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <CheckCircle size={14} /> Guardar e Iniciar con Google
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: 'var(--color-text-muted)', fontSize: '11px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border, #E5E7EB)' }}></div>
          <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>o con correo electrónico</span>
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
