import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { taskComments, users, tasks, projectMembers } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, content } = body;

    if (!taskId || !content) {
      return NextResponse.json({ error: 'Task ID and content are required' }, { status: 400 });
    }

    const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

    if (task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, task[0].projectId),
          eq(projectMembers.userId, session.userId as string)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Not a member of this project' }, { status: 403 });
    }

    const newComment = await db
      .insert(taskComments)
      .values({
        taskId,
        userId: session.userId as string,
        content,
      })
      .returning();

    const commentWithUser = await db
      .select({
        comment: taskComments,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(taskComments)
      .innerJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.id, newComment[0].id))
      .limit(1);

    return NextResponse.json(commentWithUser[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
