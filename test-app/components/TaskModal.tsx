'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  column_id: string;
}

interface Column {
  id: string;
  name: string;
  position: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: () => void;
  task?: Task | null;
  columns: Column[];
  columnId?: string;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  columns,
  columnId,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setSelectedColumnId(task.column_id);
      loadComments(task.id);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setSelectedColumnId(columnId || columns[0]?.id || '');
      setComments([]);
      setNewComment('');
    }
  }, [task, columnId, columns]);

  async function loadComments(taskId: string) {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?task_id=${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleAddComment() {
    if (!task || !newComment.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          content: newComment.trim(),
        }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      column_id: selectedColumnId,
    });
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this task?')) {
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)', padding: 'var(--space-xl) var(--space-xl) 0 var(--space-xl)' }}>
            <h2 id="modal-title" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--lrgex-text-white)', margin: 0 }}>
              {task ? 'Edit Task' : 'Create Task'}
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
            {/* Title */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label htmlFor="task-title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--lrgex-text-light)', marginBottom: 'var(--space-sm)' }}>
                Title <span style={{ color: 'var(--lrgex-orange)' }}>*</span>
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
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

            {/* Description */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label htmlFor="task-description" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--lrgex-text-light)', marginBottom: 'var(--space-sm)' }}>
                Description
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  background: 'var(--lrgex-dark-gray)',
                  border: '1px solid var(--lrgex-border)',
                  borderRadius: '0.375rem',
                  color: 'var(--lrgex-text-white)',
                  fontSize: '1rem',
                  resize: 'vertical',
                  minHeight: '100px',
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

            {/* Column */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label htmlFor="task-column" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--lrgex-text-light)', marginBottom: 'var(--space-sm)' }}>
                Column
              </label>
              <select
                id="task-column"
                value={selectedColumnId}
                onChange={(e) => setSelectedColumnId(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  background: 'var(--lrgex-dark-gray)',
                  border: '1px solid var(--lrgex-border)',
                  borderRadius: '0.375rem',
                  color: 'var(--lrgex-text-white)',
                  fontSize: '1rem',
                  cursor: 'pointer',
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
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label htmlFor="task-priority" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--lrgex-text-light)', marginBottom: 'var(--space-sm)' }}>
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  background: 'var(--lrgex-dark-gray)',
                  border: '1px solid var(--lrgex-border)',
                  borderRadius: '0.375rem',
                  color: 'var(--lrgex-text-white)',
                  fontSize: '1rem',
                  cursor: 'pointer',
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
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Comments Section (only for existing tasks) */}
            {task && (
              <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--lrgex-border)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--lrgex-text-white)', marginBottom: 'var(--space-lg)' }}>
                  Comments ({comments.length})
                </h3>

                {/* Comments List */}
                <div style={{ marginBottom: 'var(--space-lg)', maxHeight: '300px', overflowY: 'auto' }}>
                  {loadingComments ? (
                    <p style={{ color: 'var(--lrgex-text-muted)', textAlign: 'center', padding: 'var(--space-lg)' }}>
                      Loading comments...
                    </p>
                  ) : comments.length === 0 ? (
                    <p style={{ color: 'var(--lrgex-text-muted)', textAlign: 'center', padding: 'var(--space-lg)' }}>
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          style={{
                            background: 'var(--lrgex-dark-gray)',
                            border: '1px solid var(--lrgex-border)',
                            borderRadius: '0.375rem',
                            padding: 'var(--space-md)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--lrgex-text-white)' }}>
                                  {comment.user.name || comment.user.email}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--lrgex-text-muted)' }}>
                                  {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.875rem', color: 'var(--lrgex-text-light)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                                {comment.content}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              aria-label="Delete comment"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--lrgex-text-muted)',
                                cursor: 'pointer',
                                padding: 'var(--space-xs)',
                                fontSize: '1rem',
                                transition: 'color 0.2s ease',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = 'var(--lrgex-error)'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'var(--lrgex-text-muted)'}
                              title="Delete comment"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Comment */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Add a comment... (Press Enter to submit)"
                    disabled={!task}
                    style={{
                      flex: 1,
                      padding: 'var(--space-md)',
                      background: 'var(--lrgex-dark-gray)',
                      border: '1px solid var(--lrgex-border)',
                      borderRadius: '0.375rem',
                      color: 'var(--lrgex-text-white)',
                      fontSize: '0.875rem',
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
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || !task}
                    className="btn-primary"
                    style={{
                      padding: 'var(--space-md) var(--space-lg)',
                      opacity: !newComment.trim() || !task ? 0.5 : 1,
                      cursor: !newComment.trim() || !task ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--lrgex-border)' }}>
              {onDelete && task && (
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
                disabled={!title.trim()}
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  opacity: !title.trim() ? 0.5 : 1,
                  cursor: !title.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
