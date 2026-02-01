import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectMembers, users } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProjects = await db
      .select({
        project: projects,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(eq(projectMembers.userId, session.userId as string))
      .orderBy(projects.createdAt);

    return NextResponse.json(userProjects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, color, icon, visibility } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newProject = await db
      .insert(projects)
      .values({
        name,
        description: description || null,
        color: color || '#3B82F6',
        icon: icon || null,
        visibility: visibility || 'private',
        createdBy: session.userId as string,
      })
      .returning();

    await db.insert(projectMembers).values({
      projectId: newProject[0].id,
      userId: session.userId as string,
      role: 'owner',
    });

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
