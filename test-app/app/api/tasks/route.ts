import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, projectMembers } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, columnId, title, description, assigneeId, priority, dueDate } = body;

    if (!projectId || !columnId || !title) {
      return NextResponse.json(
        { error: 'Project ID, column ID, and title are required' },
        { status: 400 }
      );
    }

    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, session.userId as string)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Not a member of this project' }, { status: 403 });
    }

    const maxPosition = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(${tasks.position}), 0)` })
      .from(tasks)
      .where(eq(tasks.columnId, columnId));

    const newTask = await db
      .insert(tasks)
      .values({
        projectId,
        columnId,
        title,
        description: description || null,
        assigneeId: assigneeId || null,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        position: (maxPosition[0]?.maxPos || 0) + 1,
        createdBy: session.userId as string,
      })
      .returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
