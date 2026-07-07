import 'server-only';

import type { PlateAnalysis, PlateAnalysisContext } from '@/lib/plate-intelligence';

export type AiPlateAnalysis = {
  summary: string;
  hiddenMeanings: string[];
  collectorAppeal: string;
  suggestions: string[];
  confidence: 'low' | 'medium' | 'high';
};

type GenerateAiPlateAnalysisInput = {
  plate: string;
  normalizedPlate: string;
  ruleAnalysis: PlateAnalysis;
  context?: PlateAnalysisContext;
};

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_MODEL = 'gpt-5.4-nano';

const AI_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: {
      type: 'string',
      description: 'Trumpa, atsargi numerio derinio santrauka lietuviškai.',
    },
    hiddenMeanings: {
      type: 'array',
      items: { type: 'string' },
      description: 'Galimos paslėptos reikšmės, vardai ar žodžiai.',
    },
    collectorAppeal: {
      type: 'string',
      description: 'Kodėl derinys gali būti įdomus entuziastams, be kainos vertinimo.',
    },
    suggestions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Trumpi, saugūs pasiūlymai naudotojui.',
    },
    confidence: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
    },
  },
  required: ['summary', 'hiddenMeanings', 'collectorAppeal', 'suggestions', 'confidence'],
} as const;

export function hasOpenAiPlateAnalysisConfig(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function generateAiPlateAnalysis({
  plate,
  normalizedPlate,
  ruleAnalysis,
  context,
}: GenerateAiPlateAnalysisInput): Promise<AiPlateAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_PLATE_ANALYSIS_MODEL?.trim() || DEFAULT_OPENAI_MODEL;

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      model,
      instructions: [
        'Atsakyk tik lietuviškai.',
        'Kuri Unikodas įžvalgas apie Lietuvos transporto numerio derinį pagal pateiktą taisyklėmis paremtą analizę.',
        'Paaiškink paslėptas reikšmes, automobilių nuorodas, simbolio ar tipo kontekstą, kam derinys gali patikti ir kodėl jis gali būti įsimenamas.',
        'Būk įdomus ir draugiškas, bet atsargus: naudok formuluotes „gali būti įdomus“, „gali priminti“, „kolekcininkams gali patikti“, „vertė priklauso nuo pirkėjo“.',
        'Niekada nepateik tikslios kainos, kainų intervalo ar garantuotos rinkos vertės.',
        'Nesakyk, kad numeris tikrai vertingas ar brangus.',
        'Neteigk, kad panašūs numeriai yra laisvi ar parduodami.',
        'Neteik teisinės garantijos ir neragink apeiti oficialių procedūrų.',
        'Jei reikšmė neaiški, taip ir pasakyk.',
        'Skatink įkelti skelbimą tik tada, jei derinys turi atpažįstamų bruožų.',
        'Laikyk atsakymą trumpą.',
      ].join('\n'),
      input: JSON.stringify({
        plate,
        normalizedPlate,
        context: context ?? null,
        ruleAnalysis: {
          score: ruleAnalysis.score,
          label: ruleAnalysis.label,
          badges: ruleAnalysis.badges,
          detectedMeanings: ruleAnalysis.detectedMeanings,
          insights: ruleAnalysis.insights.slice(0, 6),
          symbolInsights: ruleAnalysis.symbolInsights,
          audienceInsights: ruleAnalysis.audienceInsights,
          similarPlateIdeas: ruleAnalysis.similarPlateIdeas,
          dimensions: ruleAnalysis.dimensions,
          factors: ruleAnalysis.factors.slice(0, 6),
        },
      }),
      max_output_tokens: 500,
      text: {
        format: {
          type: 'json_schema',
          name: 'plate_ai_analysis',
          strict: true,
          schema: AI_ANALYSIS_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`OpenAI plate analysis failed: ${response.status} ${message.slice(0, 240)}`);
  }

  const data = (await response.json()) as unknown;
  const outputText = extractOutputText(data);
  if (!outputText) {
    throw new Error('OpenAI plate analysis returned no text output.');
  }

  return sanitizeAiAnalysis(JSON.parse(stripJsonFence(outputText)));
}

function extractOutputText(data: unknown): string | null {
  if (!isRecord(data)) return null;
  if (typeof data.output_text === 'string') return data.output_text;

  const output = data.output;
  if (!Array.isArray(output)) return null;

  const chunks: string[] = [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content)) continue;
      if (typeof content.text === 'string') chunks.push(content.text);
    }
  }

  return chunks.length > 0 ? chunks.join('\n') : null;
}

function sanitizeAiAnalysis(value: unknown): AiPlateAnalysis {
  if (!isRecord(value)) {
    throw new Error('OpenAI plate analysis returned invalid JSON.');
  }

  const confidence = value.confidence;
  return {
    summary: sanitizeText(value.summary, 420),
    hiddenMeanings: sanitizeTextArray(value.hiddenMeanings, 4, 160),
    collectorAppeal: sanitizeText(value.collectorAppeal, 360),
    suggestions: sanitizeTextArray(value.suggestions, 3, 160),
    confidence: confidence === 'high' || confidence === 'medium' || confidence === 'low' ? confidence : 'low',
  };
}

function sanitizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function sanitizeTextArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function stripJsonFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}
