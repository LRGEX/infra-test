'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  title: string;
  description: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface TaskCardProps {
  task: Task;
}

const priorityColors = {
  low: 'var(--lrgex-info)',
  medium: 'var(--lrgex-warning)',
  high: '#f97316',
  critical: 'var(--lrgex-error)',
};

export default function TaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card"
      {...attributes}
      {...listeners}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--lrgex-text-white)', margin: 0, flex: 1 }}>
          {task.title}
        </h4>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '0.25rem',
            backgroundColor: priorityColors[task.priority],
            color: 'white',
            fontWeight: 500,
            textTransform: 'uppercase',
            marginLeft: 'var(--space-sm)',
          }}
        >
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--lrgex-text-muted)', lineHeight: 1.5, margin: '0 0 var(--space-sm) 0' }}>
          {task.description}
        </p>
      )}
    </div>
  );
}
