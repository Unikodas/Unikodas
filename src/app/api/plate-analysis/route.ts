import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateAiPlateAnalysis, hasOpenAiPlateAnalysisConfig } from '@/lib/ai-plate-analysis';
import { analyzePlate, normalizePlate } from '@/lib/plate-intelligence';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const PlateAnalysisRequestSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, 'Įveskite numerio derinį.')
    .max(15, 'Numerio derinys gali būti iki 15 simbolių.')
    .regex(/^[A-Za-z0-9 -]+$/, 'Naudokite tik raides, skaičius, tarpus arba brūkšnius.'),
  symbol: z.string().trim().max(32).nullable().optional(),
  category: z.string().trim().max(32).nullable().optional(),
  type: z.string().trim().max(32).nullable().optional(),
});

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof PlateAnalysisRequestSchema>;

  try {
    parsed = PlateAnalysisRequestSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_plate',
        message: getValidationMessage(error),
      },
      { status: 400 },
    );
  }

  const plate = parsed.plate;
  const context = {
    symbol: parsed.symbol,
    category: parsed.category,
    type: parsed.type,
  };
  const normalizedPlate = normalizePlate(plate);
  if (!normalizedPlate || normalizedPlate.length > 15) {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_plate',
        message: 'Įveskite 1-15 raidžių arba skaičių derinį.',
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json(
      {
        ok: false,
        authRequired: true,
        plate,
        normalizedPlate,
        message: 'Prisijunkite nemokamai, kad pamatytumėte visas Unikodas įžvalgas.',
      },
      { status: 401 },
    );
  }

  const ruleAnalysis = analyzePlate(plate, context);
  let aiAnalysis = null;
  let usedAi = false;

  if (hasOpenAiPlateAnalysisConfig()) {
    try {
      aiAnalysis = await generateAiPlateAnalysis({
        plate,
        normalizedPlate,
        ruleAnalysis,
        context,
      });
      usedAi = Boolean(aiAnalysis);
    } catch (error) {
      console.error('[plate-analysis] AI explanation failed:', error);
    }
  }

  await recordPlateAnalysisEvent({
    plate,
    normalizedPlate,
    score: ruleAnalysis.score,
    usedAi,
    metadata: {
      source: 'public_tool',
      label: ruleAnalysis.label,
      symbol: parsed.symbol ?? null,
      category: parsed.category ?? null,
      type: parsed.type ?? null,
      aiConfigured: hasOpenAiPlateAnalysisConfig(),
      aiConfidence: aiAnalysis?.confidence ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    plate,
    normalizedPlate,
    ruleAnalysis,
    aiAnalysis,
    usedAi,
    context,
  });
}

function getValidationMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? 'Numerio formatas netinkamas.';
  }
  return 'Numerio formatas netinkamas.';
}

async function recordPlateAnalysisEvent({
  plate,
  normalizedPlate,
  score,
  usedAi,
  metadata,
}: {
  plate: string;
  normalizedPlate: string;
  score: number;
  usedAi: boolean;
  metadata: Record<string, unknown>;
}) {
  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.from('plate_analysis_events').insert({
      plate,
      normalized_plate: normalizedPlate,
      score,
      used_ai: usedAi,
      metadata,
    });

    if (error) {
      console.info('[plate-analysis] event tracking skipped:', error.message);
    }
  } catch (error) {
    console.info('[plate-analysis] event tracking unavailable:', error);
  }
}
