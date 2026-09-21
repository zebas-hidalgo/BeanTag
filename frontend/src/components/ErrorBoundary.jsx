import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', textAlign: 'center', background: 'var(--bg-card, #FFF5F5)', border: '2px solid var(--border-color, #E5E7EB)', borderRadius: 'var(--barista-radius-md, 12px)', margin: '20px', boxShadow: 'var(--barista-shadow-elevated, 0 8px 24px rgba(0,0,0,0.08))' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '10px', fontFamily: 'var(--font-heading)', color: 'var(--barista-accent-danger, #EF4444)' }}>⚠️ ¡Algo se rompió!</h2>
          <p style={{ margin: '10px 0', fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-candy primary"
            style={{ marginTop: '15px', padding: '10px 20px', fontWeight: '900', cursor: 'pointer' }}
          >
            Reintentar Extracción (Recargar)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
