import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProjectsPage() {
  // Fetch projects from API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      redirect('/login');
    }
    return <div style={{ color: 'var(--lrgex-error)', padding: 'var(--space-lg)' }}>Error loading projects</div>;
  }

  const projects = await response.json();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <main id="main-content" style={{ minHeight: '100vh', background: 'var(--lrgex-background)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--space-lg)', width: '100%' }}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)', paddingTop: 'var(--space-xl)' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '0.5em', color: 'var(--lrgex-text-white)' }}>
                Projects
              </h1>
              <p style={{ color: 'var(--lrgex-text-muted)', marginTop: 'var(--space-sm)' }}>
                Manage your Kanban boards
              </p>
            </div>
            <button
              onClick={async () => {
                const name = prompt('Project name:');
                if (!name) return;
                const description = prompt('Description (optional):') || '';

                const res = await fetch('/api/projects', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, description }),
                });

                if (res.ok) {
                  window.location.reload();
                } else {
                  alert('Failed to create project');
                }
              }}
              className="btn-primary"
            >
              + New Project
            </button>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-4xl) 0' }}>
              <p style={{ color: 'var(--lrgex-text-muted)', marginBottom: 'var(--space-lg)' }}>
                No projects yet
              </p>
              <button
                onClick={async () => {
                  const name = prompt('Project name:');
                  if (!name) return;
                  const description = prompt('Description (optional):') || '';

                  const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description }),
                  });

                  if (res.ok) {
                    window.location.reload();
                  } else {
                    alert('Failed to create project');
                  }
                }}
                className="btn-primary"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
              {projects.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="card"
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        backgroundColor: project.color || '#3B82F6',
                        flexShrink: 0
                      }}
                    />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--lrgex-text-white)', margin: 0 }}>
                      {project.name}
                    </h2>
                  </div>
                  {project.description && (
                    <p style={{ color: 'var(--lrgex-text-light)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 'var(--space-sm)' }}>
                      {project.description}
                    </p>
                  )}
                  <div style={{ fontSize: '0.875rem', color: 'var(--lrgex-text-muted)' }}>
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
