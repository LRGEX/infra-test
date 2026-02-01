export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--lrgex-background)' }}>
      <div style={{ width: '100%', maxWidth: '400px', borderRadius: '0.5rem', backgroundColor: 'var(--lrgex-panel-gray)', padding: 'var(--space-xl)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)', border: '1px solid var(--lrgex-border)' }}>
        <div style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
          <img 
            src="https://download.lrgex.com/Dark%20Full%20Logo.png" 
            alt="LRGEX" 
            style={{ maxWidth: '180px', height: 'auto', display: 'block', margin: '0 auto var(--space-lg)' }}
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--lrgex-text-white)', marginBottom: 'var(--space-sm)' }}>
            LRGEX Kanban
          </h1>
          <p style={{ color: 'var(--lrgex-text-muted)', fontSize: '0.875rem' }}>
            Sign in to access your projects
          </p>
        </div>

        <a
          href="/api/auth/login"
          className="btn-primary"
          style={{ display: 'block', width: '100%' }}
        >
          Sign in with Authentik
        </a>

        <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center', fontSize: '0.875rem', color: 'var(--lrgex-text-muted)' }}>
          Powered by LRGEX Infrastructure
        </div>
      </div>
    </div>
  );
}
