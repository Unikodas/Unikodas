import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { normalizePlate } from '@/lib/plate-intelligence';
import { createServiceRoleClient } from '@/lib/supabase/server';

const EventSchema = z.object({
  plate: z.string().trim().min(1).max(20),
  eventType: z.enum(['page_view', 'analysis_open', 'sell_click', 'telegram_click']),
  score: z.number().int().min(0).max(100).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof EventSchema>;

  try {
    parsed = EventSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const normalizedPlate = normalizePlate(parsed.plate);
  if (!normalizedPlate || normalizedPlate.length > 15) {
    return NextResponse.json({ ok: false, error: 'invalid_plate' }, { status: 400 });
  }

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.from('plate_analysis_events').insert({
      plate: parsed.plate,
      normalized_plate: normalizedPlate,
      score: parsed.score ?? null,
      used_ai: false,
      metadata: {
        source: 'plate_page',
        event_type: parsed.eventType,
        ...(parsed.metadata ?? {}),
      },
    });

    if (error) {
      console.info('[plate-page-event] tracking skipped:', error.message);
    }
  } catch (error) {
    console.info('[plate-page-event] tracking unavailable:', error);
  }

  return NextResponse.json({ ok: true });
}
