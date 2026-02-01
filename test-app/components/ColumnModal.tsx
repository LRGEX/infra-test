'use client';

import { useState, useEffect } from 'react';

interface Column {
  id: string;
  name: string;
  position: number;
}

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (columnData: Partial<Column>) => void;
  onDelete?: () => void;
  column?: Column | null;
}

export default function ColumnModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  column,
}: ColumnModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (column) {
      setName(column.name);
    } else {
      setName('');
    }
  }, [column]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
    });
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this column? All tasks in this column will also be deleted.')) {
      onDelete();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-lg)',
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            background: 'var(--lrgex-panel-gray)',
            border: '1px solid var(--lrgex-border)',
            borderRadius: '0.5rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)', padding: 'var(--space-xl) var(--space-xl) 0 var(--space-xl)' }}>
            <h2 id="modal-title" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--lrgex-text-white)', margin: 0 }}>
              {column ? 'Edit Column' : 'Add Column'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--lrgex-text-muted)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: 'var(--space-sm)',
                lineHeight: 1,
                transition: 'color 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--lrgex-text-white)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--lrgex-text-muted)'}
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '0 var(--space-xl) var(--space-xl) var(--space-xl)' }}>
            {/* Name */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label htmlFor="column-name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--lrgex-text-light)', marginBottom: 'var(--space-sm)' }}>
                Column Name <span style={{ color: 'var(--lrgex-orange)' }}>*</span>
              </label>
              <input
                id="column-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="e.g., To Do, In Progress, Done"
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  background: 'var(--lrgex-dark-gray)',
                  border: '1px solid var(--lrgex-border)',
                  borderRadius: '0.375rem',
                  color: 'var(--lrgex-text-white)',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lrgex-orange)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(203, 128, 60, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lrgex-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--lrgex-border)' }}>
              {onDelete && column && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-danger"
                  style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    marginRight: 'auto',
                  }}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  background: 'transparent',
                  border: '1px solid var(--lrgex-border)',
                  borderRadius: '0.375rem',
                  color: 'var(--lrgex-text-light)',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lrgex-text-muted)';
                  e.currentTarget.style.color = 'var(--lrgex-text-white)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lrgex-border)';
                  e.currentTarget.style.color = 'var(--lrgex-text-light)';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!name.trim()}
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  opacity: !name.trim() ? 0.5 : 1,
                  cursor: !name.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {column ? 'Save Changes' : 'Add Column'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
