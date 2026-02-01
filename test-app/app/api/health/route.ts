import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { sql } from 'drizzle-orm';

export async function GET() {
  const health = {
    status: 'healthy' as 'healthy' | 'unhealthy',
    services: {
      postgresql: { status: 'unknown' as string, responseTime: 0 },
      redis: { status: 'unknown' as string, responseTime: 0 },
      authentik: { status: 'unknown' as string, responseTime: 0 },
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    health.services.postgresql = {
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    health.services.postgresql = {
      status: 'unhealthy',
      responseTime: Date.now() - (health.services.postgresql.responseTime || Date.now()),
    };
    health.status = 'unhealthy';
  }

  try {
    const start = Date.now();
    await redis.ping();
    health.services.redis = {
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    health.services.redis = {
      status: 'unhealthy',
      responseTime: Date.now() - (health.services.redis.responseTime || Date.now()),
    };
    health.status = 'unhealthy';
  }

  try {
    const start = Date.now();
    const authentikUrl = process.env.AUTHENTIK_URL || 'http://authentik:9000';
    const response = await fetch(`${authentikUrl}/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    health.services.authentik = {
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    health.services.authentik = {
      status: 'unhealthy',
      responseTime: Date.now() - (health.services.authentik.responseTime || Date.now()),
    };
    health.status = 'unhealthy';
  }

  return NextResponse.json(health);
}
