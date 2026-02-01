import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, tasks } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let testDataId: string | null = null;

  try {
    testDataId = crypto.randomUUID();

    const testProject = await db
      .insert(projects)
      .values({
        name: `Backup Test ${testDataId}`,
        description: 'Temporary project for WAL-G backup verification',
        color: '#FF0000',
        icon: '🧪',
        visibility: 'private',
        createdBy: session.userId as string,
      })
      .returning();

    const projectId = testProject[0].id;

    await db.insert(tasks).values([
      {
        projectId,
        columnId: crypto.randomUUID(),
        title: `Test Task 1 - ${testDataId}`,
        description: 'Backup verification task',
        priority: 'low',
        position: 0,
        createdBy: session.userId as string,
      },
      {
        projectId,
        columnId: crypto.randomUUID(),
        title: `Test Task 2 - ${testDataId}`,
        description: 'Another backup verification task',
        priority: 'medium',
        position: 1,
        createdBy: session.userId as string,
      },
    ]);

    // Execute WAL switch using Drizzle sql tag
    await db.execute(sql`SELECT pg_switch_wal()`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check WAL receiver status
    const walResult = await db.execute(sql`SELECT * FROM pg_stat_wal_receiver`);

    const backupLog = {
      testDataId,
      projectId,
      timestamp: new Date().toISOString(),
      walReceiver: walResult,
    };

    await db.delete(tasks).where(eq(tasks.projectId, projectId));
    await db.delete(projects).where(eq(projects.id, projectId));

    return NextResponse.json({
      success: true,
      message: 'WAL-G backup test completed successfully',
      ...backupLog,
    });
  } catch (error) {
    console.error('Backup verification error:', error);

    if (testDataId) {
      try {
        await db.execute(sql`DELETE FROM projects WHERE name LIKE ${`%${testDataId}%`}`);
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Backup verification failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
