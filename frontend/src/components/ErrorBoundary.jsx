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
        <div style={{ padding: '30px', textAlign: 'center', background: '#FFF5F5', border: '4px solid #000', margin: '20px', boxShadow: '8px 8px 0px #000' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>⚠️ ¡ALGO SE ROMPIÓ EN EL FILTRO!</h2>
          <p style={{ margin: '10px 0', fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-candy primary"
            style={{ marginTop: '15px', padding: '10px 20px', fontWeight: '900', border: '3px solid #000', cursor: 'pointer', boxShadow: '4px 4px 0 #000' }}
          >
            Reintentar Extracción (Recargar)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
