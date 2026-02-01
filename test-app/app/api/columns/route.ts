import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { columns, tasks, projectMembers } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
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

    const projectColumns = await db
      .select()
      .from(columns)
      .where(eq(columns.projectId, projectId))
      .orderBy(columns.position);

    const columnsWithTasks = await Promise.all(
      projectColumns.map(async (column) => {
        const columnTasks = await db
          .select()
          .from(tasks)
          .where(eq(tasks.columnId, column.id))
          .orderBy(tasks.position);

        return {
          ...column,
          tasks: columnTasks,
        };
      })
    );

    return NextResponse.json(columnsWithTasks);
  } catch (error) {
    console.error('Failed to fetch columns:', error);
    return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, name, position } = body;

    if (!projectId || !name) {
      return NextResponse.json({ error: 'Project ID and name are required' }, { status: 400 });
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

    const newColumn = await db
      .insert(columns)
      .values({
        projectId,
        name,
        position: position || 0,
      })
      .returning();

    return NextResponse.json(newColumn[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create column:', error);
    return NextResponse.json({ error: 'Failed to create column' }, { status: 500 });
  }
}
