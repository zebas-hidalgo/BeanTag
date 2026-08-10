import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, Lock, User, LogIn, UserPlus, ShieldCheck, Snowflake, Coffee, ChevronRight, ReceiptText } from 'lucide-react';
import { apiUrl } from '../utils/api';

export default function AuthView({ onSuccess, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setErrorMsg('');

    // Fetch Google Client ID from server or use fallback
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
  }, [mode]);

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

        const renderNativeBtn = () => {
          const btnContainer = document.getElementById('auth-view-google-container');
          if (btnContainer) {
            btnContainer.innerHTML = '';
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'filled_blue',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              locale: 'es',
              width: 320,
              logo_alignment: 'left'
            });
          }
        };

        renderNativeBtn();
        setTimeout(renderNativeBtn, 150);
        setTimeout(renderNativeBtn, 500);
      } catch (e) {
        console.warn("Google Auth Init error:", e);
      }
    }
  };

  const handleCustomGoogleClick = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      const btnContainer = document.getElementById('auth-view-google-container');
      const iframeOrBtn = btnContainer ? btnContainer.querySelector('iframe, div[role="button"]') : null;
      if (iframeOrBtn) {
        iframeOrBtn.click();
        return;
      }
      window.google.accounts.id.prompt();
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
      } else {
        setErrorMsg(data.error || 'Error al iniciar sesión con Google.');
      }
    })
    .catch(() => setErrorMsg('Error de red al autenticar con Google.'))
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
      } else {
        setErrorMsg(data.error || 'Error al procesar la solicitud.');
      }
    })
    .catch(() => setErrorMsg('Error al conectar con el servidor.'))
    .finally(() => setLoading(false));
  };

  return (
    <div style={{
      height: '100dvh',
      maxHeight: '100dvh',
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      background: 'var(--bg-card, #ECFDF5)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflowY: 'auto',
      position: 'relative',
      fontFamily: 'var(--font-body, system-ui, sans-serif)',
      borderLeft: '1.5px solid var(--border-color, #A7F3D0)',
      borderRight: '1.5px solid var(--border-color, #A7F3D0)'
    }}>
      
      {/* Top Decorative Header Accent */}
      <div style={{
        height: '6px',
        width: '100%',
        background: 'linear-gradient(90deg, var(--color-crimson, #059669) 0%, var(--color-honey, #D97706) 50%, var(--color-crimson, #059669) 100%)'
      }} />

      {/* Main Content Area */}
      <div className="animate-entrance" style={{
        flex: 1,
        padding: '24px 20px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        justifyContent: 'space-between'
      }}>

        {/* Top Header Section */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Logo & Brand Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
            background: 'var(--bg-header, #D1FAE5)',
            padding: '6px 14px',
            borderRadius: '30px',
            border: '1px solid var(--border-color, #A7F3D0)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style={{ width: '24px', height: '24px' }}>
              <rect x="35" y="15" width="135" height="175" rx="10" fill="#000000"/>
              <rect x="30" y="10" width="135" height="175" rx="10" fill="var(--color-honey, #E9C46A)" stroke="#000000" strokeWidth="6"/>
              <circle cx="97" cy="30" r="10" fill="#FFFFFF" stroke="#000000" strokeWidth="4"/>
              <g transform="translate(68, 60)">
                <path d="M5 5 H 35 C 50 5, 50 30, 35 30 C 50 30, 50 55, 30 55 H 5 Z" fill="none" stroke="#000000" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round"/>
                <path d="M5 5 V 55" fill="none" stroke="#000000" strokeWidth="12" strokeLinecap="round"/>
                <path d="M55 40 C 63 40, 68 45, 68 52 C 68 60, 63 65, 55 65 C 47 65, 42 60, 55 40 Z" fill="var(--color-crimson, #059669)" stroke="#000000" strokeWidth="3"/>
                <line x1="51" y1="61" x2="59" y2="44" stroke="#000000" strokeWidth="3"/>
              </g>
            </svg>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              fontWeight: '900',
              letterSpacing: '0.8px',
              color: 'var(--color-text, #064E3B)'
            }}>BeanTag</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '20px',
            fontWeight: '900',
            color: 'var(--color-text, #064E3B)',
            margin: '6px 0 4px 0',
            lineHeight: '1.2'
          }}>
            Tu Inventario de Café Specialty
          </h1>

          <p style={{
            fontSize: '12px',
            color: 'var(--color-text-muted, #047857)',
            margin: '0 0 14px 0',
            maxWidth: '320px',
            lineHeight: '1.35'
          }}>
            Dosis de café congelado, bitácoras de extracción y recetas de barista.
          </p>

          {/* Compact Feature Badges */}
          <div style={{
            display: 'flex',
            gap: '6px',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--bg-header, #D1FAE5)',
              border: '1px solid var(--border-color, #A7F3D0)',
              padding: '4px 10px',
              borderRadius: '16px'
            }}>
              <Snowflake size={12} color="var(--color-crimson, #059669)" />
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text, #064E3B)' }}>Congelados</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--bg-header, #D1FAE5)',
              border: '1px solid var(--border-color, #A7F3D0)',
              padding: '4px 10px',
              borderRadius: '16px'
            }}>
              <Coffee size={12} color="var(--color-crimson, #059669)" />
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text, #064E3B)' }}>Bitácoras</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--bg-header, #D1FAE5)',
              border: '1px solid var(--border-color, #A7F3D0)',
              padding: '4px 10px',
              borderRadius: '16px'
            }}>
              <ReceiptText size={12} color="var(--color-crimson, #059669)" />
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text, #064E3B)' }}>Recibos POS</span>
            </div>
          </div>
        </div>

        {/* Center Auth Card */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {errorMsg && (
            <div style={{
              background: '#FEE2E2',
              color: '#991B1B',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '11.5px',
              marginBottom: '12px',
              fontWeight: '700',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Primary Hero Google Button Box */}
          <div style={{
            width: '100%',
            background: '#FFFFFF',
            border: '1.5px solid var(--border-color, #A7F3D0)',
            borderRadius: '16px',
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
            boxSizing: 'border-box',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text, #064E3B)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Acceso Rápido Instantáneo
            </div>

            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '290px',
              minHeight: '44px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div id="auth-view-google-container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}></div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '14px', color: 'var(--color-text-muted, #047857)', fontSize: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #A7F3D0)' }}></div>
            <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '800' }}>o con correo electrónico</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #A7F3D0)' }}></div>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', width: '100%', background: '#FFFFFF', borderRadius: '12px', padding: '3px', marginBottom: '12px', border: '1.5px solid var(--border-color, #A7F3D0)' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '7px',
                border: 'none',
                borderRadius: '9px',
                background: mode === 'login' ? 'var(--color-crimson, #059669)' : 'transparent',
                color: mode === 'login' ? '#FFFFFF' : 'var(--color-text-muted, #047857)',
                fontWeight: '800',
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '7px',
                border: 'none',
                borderRadius: '9px',
                background: mode === 'register' ? 'var(--color-crimson, #059669)' : 'transparent',
                color: mode === 'register' ? '#FFFFFF' : 'var(--color-text-muted, #047857)',
                fontWeight: '800',
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            {mode === 'register' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-text, #064E3B)' }}>Nombre Barista</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted, #047857)' }} />
                  <input
                    type="text" className="candy-input" placeholder="Tu Nombre"
                    style={{ paddingLeft: '34px', fontSize: '13px', padding: '10px 10px 10px 34px' }} value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-text, #064E3B)' }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted, #047857)' }} />
                <input
                  type="email" className="candy-input" placeholder="barista@ejemplo.com" required
                  style={{ paddingLeft: '34px', fontSize: '13px', padding: '10px 10px 10px 34px' }} value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-text, #064E3B)' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted, #047857)' }} />
                <input
                  type="password" className="candy-input" placeholder="••••••••" required
                  style={{ paddingLeft: '34px', fontSize: '13px', padding: '10px 10px 10px 34px' }} value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit" className="btn-candy primary" disabled={loading}
              style={{ width: '100%', marginTop: '4px', padding: '11px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--color-crimson, #059669)', color: '#FFFFFF', border: '1.5px solid var(--color-crimson, #059669)' }}
            >
              {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {loading ? 'Procesando...' : (mode === 'login' ? 'Entrar con Correo' : 'Crear mi Cuenta Gratis')}
            </button>
          </form>
        </div>

        {/* Security Footer */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--color-text-muted, #047857)' }}>
          <ShieldCheck size={13} color="var(--color-crimson, #059669)" />
          <span>Tus datos de recetas y dosis están protegidos</span>
        </div>

      </div>
    </div>
  );
}
