'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import ColumnModal from '@/components/ColumnModal';

interface Column {
  id: string;
  name: string;
  position: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  column_id: string;
}

export default function KanbanBoard({ params }: { params: { id: string } }) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadBoard();
  }, [params.id]);

  async function loadBoard() {
    try {
      // Fetch columns
      const colsRes = await fetch(`/api/columns?project_id=${params.id}`);
      if (colsRes.ok) {
        const cols = await colsRes.json();
        setColumns(cols);
      }

      // Fetch tasks
      const tasksRes = await fetch(`/api/tasks?project_id=${params.id}`);
      if (tasksRes.ok) {
        const tsks = await tasksRes.json();
        setTasks(tsks);
      }

      // Fetch project info
      const projectRes = await fetch(`/api/projects`);
      if (projectRes.ok) {
        const projects = await projectRes.json();
        const project = projects.find((p: any) => p.id === params.id);
        if (project) {
          setProjectName(project.name);
        }
      }
    } catch (error) {
      console.error('Error loading board:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newColumnId = over.id as string;

    // Get the task
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // If dropped in same column, just reorder
    if (task.column_id === newColumnId) {
      return;
    }

    // Move to new column
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: newColumnId }),
      });

      if (res.ok) {
        // Update local state
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, column_id: newColumnId } : t
          )
        );
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  }

  function openAddColumnModal() {
    setEditingColumn(null);
    setIsColumnModalOpen(true);
  }

  function openEditColumnModal(column: Column) {
    setEditingColumn(column);
    setIsColumnModalOpen(true);
  }

  async function handleSaveColumn(columnData: Partial<Column>) {
    try {
      if (editingColumn) {
        // Update existing column
        const res = await fetch(`/api/columns/${editingColumn.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(columnData),
        });

        if (res.ok) {
          const updated = await res.json();
          setColumns((prev) =>
            prev.map((c) => (c.id === editingColumn.id ? { ...c, ...updated } : c))
          );
        }
      } else {
        // Create new column
        const res = await fetch('/api/columns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: params.id,
            name: columnData.name,
            position: columns.length,
          }),
        });

        if (res.ok) {
          const newColumn = await res.json();
          setColumns((prev) => [...prev, newColumn]);
        }
      }

      setIsColumnModalOpen(false);
    } catch (error) {
      console.error('Error saving column:', error);
    }
  }

  async function handleDeleteColumn() {
    if (!editingColumn) return;

    try {
      const res = await fetch(`/api/columns/${editingColumn.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setColumns((prev) => prev.filter((c) => c.id !== editingColumn.id));
        setTasks((prev) => prev.filter((t) => t.column_id !== editingColumn.id));
        setIsColumnModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  }

  function openAddTaskModal(columnId: string) {
    setEditingTask(null);
    setSelectedColumnId(columnId);
    setIsTaskModalOpen(true);
  }

  function openEditTaskModal(task: Task) {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }

  async function handleSaveTask(taskData: Partial<Task>) {
    try {
      if (editingTask) {
        // Update existing task
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });

        if (res.ok) {
          const updated = await res.json();
          setTasks((prev) =>
            prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated } : t))
          );
        }
      } else {
        // Create new task
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: params.id,
            column_id: taskData.column_id,
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            position: tasks.filter((t) => t.column_id === taskData.column_id).length,
          }),
        });

        if (res.ok) {
          const newTask = await res.json();
          setTasks((prev) => [...prev, newTask]);
        }
      }

      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }

  async function handleDeleteTask() {
    if (!editingTask) return;

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== editingTask.id));
        setIsTaskModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--lrgex-background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--lrgex-text-muted)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <main id="main-content" style={{ minHeight: '100vh', background: 'var(--lrgex-background)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 var(--space-lg)', width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)', paddingTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <Link
                href="/projects"
                style={{ color: 'var(--lrgex-orange)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s ease' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--lrgex-orange-hover)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--lrgex-orange)'}
              >
                ← Back
              </Link>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', margin: 0, color: 'var(--lrgex-text-white)' }}>
                {projectName}
              </h1>
            </div>
            <button
              onClick={openAddColumnModal}
              className="btn-primary"
            >
              + Add Column
            </button>
          </div>

          {/* Kanban Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div style={{ display: 'flex', gap: 'var(--space-lg)', overflowX: 'auto', paddingBottom: 'var(--space-md)' }}>
              {columns.map((column) => {
                const columnTasks = tasks
                  .filter((t) => t.column_id === column.id)
                  .sort((a, b) => a.position - b.position);

                return (
                  <div
                    key={column.id}
                    style={{
                      flexShrink: 0,
                      width: '320px',
                      background: 'var(--lrgex-panel-gray)',
                      borderRadius: '0.5rem',
                      padding: 'var(--space-lg)',
                    }}
                  >
                    {/* Column Header */}
                    <div
                      onClick={() => openEditColumnModal(column)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', cursor: 'pointer' }}
                      title="Click to edit column"
                    >
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--lrgex-text-white)', margin: 0 }}>
                        {column.name}
                      </h3>
                      <span style={{ fontSize: '0.875rem', color: 'var(--lrgex-text-muted)', fontWeight: 500 }}>
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Tasks */}
                    <SortableContext
                      items={columnTasks.map((t) => t.id)}
                      id={column.id}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {columnTasks.map((task) => (
                          <div key={task.id} onClick={() => openEditTaskModal(task)} style={{ cursor: 'pointer' }}>
                            <TaskCard task={task} />
                          </div>
                        ))}
                      </div>
                    </SortableContext>

                    {/* Add Task Button */}
                    <button
                      onClick={() => openAddTaskModal(column.id)}
                      style={{
                        width: '100%',
                        marginTop: 'var(--space-lg)',
                        padding: 'var(--space-md) var(--space-lg)',
                        border: '2px dashed var(--lrgex-border)',
                        borderRadius: '0.375rem',
                        background: 'transparent',
                        color: 'var(--lrgex-text-muted)',
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--lrgex-text-muted)';
                        e.currentTarget.style.color = 'var(--lrgex-text-light)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--lrgex-border)';
                        e.currentTarget.style.color = 'var(--lrgex-text-muted)';
                      }}
                    >
                      + Add Task
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask ? (
                <div
                  style={{
                    width: '288px',
                    padding: 'var(--space-lg)',
                    background: 'var(--lrgex-panel-gray)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    opacity: 0.5,
                  }}
                >
                  <p style={{ fontWeight: 500, color: 'var(--lrgex-text-white)', margin: 0 }}>
                    {activeTask.title}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Task Modal */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          task={editingTask}
          columns={columns}
          columnId={selectedColumnId}
        />

        {/* Column Modal */}
        <ColumnModal
          isOpen={isColumnModalOpen}
          onClose={() => setIsColumnModalOpen(false)}
          onSave={handleSaveColumn}
          onDelete={handleDeleteColumn}
          column={editingColumn}
        />
      </main>
    </>
  );
}
