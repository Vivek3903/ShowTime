import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: 'black', height: '100vh', fontFamily: 'monospace' }}>
          <h2>Frontend Crashed</h2>
          <p style={{ color: 'red' }}>{this.state.error && this.state.error.toString()}</p>
          <pre style={{ color: 'gray', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '20px', padding: '10px', background: '#333', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Clear Data & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
