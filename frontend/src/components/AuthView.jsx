import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, Lock, User, LogIn, UserPlus, ShieldCheck, Snowflake, Coffee, ChevronRight } from 'lucide-react';
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
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(145deg, #FFF5F5 0%, #FDFBF7 50%, #FAF0E6 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-body, system-ui, sans-serif)'
    }}>
      
      {/* Genjutsu Hero Card */}
      <div className="candy-card animate-entrance" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '36px 28px 32px 28px',
        background: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(231,111,81,0.08), 0 4px 12px rgba(0,0,0,0.04)',
        border: '1.5px solid var(--color-border, #E5E7EB)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* Decorative Top Accent Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #E76F51 0%, #F4A261 50%, #E53E3E 100%)'
        }} />

        {/* Logo & Brand Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
          background: 'var(--color-surface-soft, #FFF0ED)',
          padding: '8px 16px',
          borderRadius: '30px',
          border: '1px solid rgba(231,111,81,0.2)'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style={{ width: '28px', height: '28px' }}>
            <rect x="35" y="15" width="135" height="175" rx="10" fill="#000000"/>
            <rect x="30" y="10" width="135" height="175" rx="10" fill="#F4A261" stroke="#000000" strokeWidth="6"/>
            <circle cx="97" cy="30" r="10" fill="#FFF5F5" stroke="#000000" strokeWidth="4"/>
            <g transform="translate(68, 60)">
              <path d="M5 5 H 35 C 50 5, 50 30, 35 30 C 50 30, 50 55, 30 55 H 5 Z" fill="none" stroke="#000000" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round"/>
              <path d="M5 5 V 55" fill="none" stroke="#000000" strokeWidth="12" strokeLinecap="round"/>
              <path d="M55 40 C 63 40, 68 45, 68 52 C 68 60, 63 65, 55 65 C 47 65, 42 60, 55 40 Z" fill="#E76F51" stroke="#000000" strokeWidth="3"/>
              <line x1="51" y1="61" x2="59" y2="44" stroke="#000000" strokeWidth="3"/>
            </g>
          </svg>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '20px',
            fontWeight: '900',
            letterSpacing: '1px',
            color: '#1A202C'
          }}>BeanTag</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '22px',
          fontWeight: '900',
          color: '#2D3748',
          margin: '12px 0 6px 0',
          lineHeight: '1.2'
        }}>
          Tu Inventario de Café Specialty
        </h1>

        <p style={{
          fontSize: '13px',
          color: '#718096',
          margin: '0 0 20px 0',
          maxWidth: '340px',
          lineHeight: '1.4'
        }}>
          Gestiona tus dosis de café congelado, sincroniza bitácoras de extracción y comparte tus recetas.
        </p>

        {/* Feature Badges Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          width: '100%',
          marginBottom: '22px'
        }}>
          <div style={{ background: '#FAF5F0', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Snowflake size={18} color="#319795" />
            <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#2D3748' }}>Congelados</span>
          </div>
          <div style={{ background: '#FAF5F0', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Coffee size={18} color="#E76F51" />
            <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#2D3748' }}>Bitácoras</span>
          </div>
          <div style={{ background: '#FAF5F0', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={18} color="#D69E2E" />
            <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#2D3748' }}>Recibos POS</span>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            marginBottom: '16px',
            fontWeight: 'bold',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Primary Hero Google Button */}
        <div style={{
          width: '100%',
          background: 'var(--color-bg, #F8FAFC)',
          border: '1.5px solid var(--color-border, #E2E8F0)',
          borderRadius: '18px',
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4A5568' }}>
            Acceso Rápido Instantáneo
          </div>

          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '320px',
            minHeight: '44px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div id="auth-view-google-container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}></div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '18px', color: '#A0AEC0', fontSize: '11px' }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
          <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>o con correo electrónico</span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', width: '100%', background: '#EDF2F7', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
              background: mode === 'login' ? '#FFFFFF' : 'transparent',
              color: mode === 'login' ? '#E76F51' : '#718096',
              boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
              background: mode === 'register' ? '#FFFFFF' : 'transparent',
              color: mode === 'register' ? '#E76F51' : '#718096',
              boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
          {mode === 'register' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4A5568' }}>Nombre Barista</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
                <input
                  type="text" className="candy-input" placeholder="Tu Nombre"
                  style={{ paddingLeft: '36px', fontSize: '13px' }} value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4A5568' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
              <input
                type="email" className="candy-input" placeholder="barista@ejemplo.com" required
                style={{ paddingLeft: '36px', fontSize: '13px' }} value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#4A5568' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} />
              <input
                type="password" className="candy-input" placeholder="••••••••" required
                style={{ paddingLeft: '36px', fontSize: '13px' }} value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit" className="btn-candy primary" disabled={loading}
            style={{ width: '100%', marginTop: '6px', padding: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? 'Procesando...' : (mode === 'login' ? 'Entrar con Correo' : 'Crear mi Cuenta Gratis')}
          </button>
        </form>

        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#718096' }}>
          <ShieldCheck size={14} color="#38A169" />
          <span>Tus datos de recetas y dosis están protegidos</span>
        </div>

      </div>
    </div>
  );
}
