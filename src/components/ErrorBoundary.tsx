import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      // Clear potentially corrupt cached storage items
      localStorage.removeItem('naimshop_products_cache');
      localStorage.removeItem('naimshop_categories_cache');
    } catch (_) {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            maxWidth: '420px',
            width: '100%'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#ffe4e6',
              color: '#e11d48',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              !
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.5' }}>
              An unexpected display issue occurred. Please click below to refresh and restore the application view.
            </p>
            {this.state.error && (
              <div style={{
                backgroundColor: '#f3f4f6',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#374151',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '20px',
                fontFamily: 'monospace'
              }}>
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Refresh & Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
