'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import type {
  MeaningCategory,
  PlateAnalysis,
  PlateAnalysisContext,
  PlateMeaning,
} from '@/lib/plate-intelligence';

type AiPlateAnalysis = {
  summary: string;
  hiddenMeanings: string[];
  collectorAppeal: string;
  suggestions: string[];
  confidence: 'low' | 'medium' | 'high';
};

type PlateAnalysisResponse = {
  ok: boolean;
  plate?: string;
  normalizedPlate?: string;
  ruleAnalysis?: PlateAnalysis;
  aiAnalysis?: AiPlateAnalysis | null;
  usedAi?: boolean;
  context?: PlateAnalysisContext;
  message?: string;
  authRequired?: boolean;
};

const examples = ['DOM455', 'BMW530', 'M4T45', 'AMG063', 'RS6', 'AAA111'];
const TELEGRAM_URL = 'https://t.me/+xweru-k3heRlMjY0';
const automotiveCategories = new Set<MeaningCategory>(['CAR_MODEL', 'CAR_BRAND', 'PERFORMANCE', 'LUXURY']);

const confidenceLabels: Record<AiPlateAnalysis['confidence'], string> = {
  low: 'Atsargi',
  medium: 'Vidutinė',
  high: 'Gana aiški',
};

const dimensionLabels = {
  memorability: 'Įsimenamumas',
  patternStrength: 'Rašto stiprumas',
  hiddenMeaning: 'Paslėpta reikšmė',
  automotiveAppeal: 'Automobilių patrauklumas',
  collectorAppeal: 'Kolekcinis įdomumas',
} as const;

const meaningCategoryLabels: Record<MeaningCategory, string> = {
  PERSON_NAME: 'Vardas',
  CAR_MODEL: 'Modelis',
  CAR_BRAND: 'Markė',
  CITY: 'Miestas',
  BUSINESS: 'Verslas',
  COMMON_WORD: 'Žodis',
  PERFORMANCE: 'Performance',
  NUMBER_PATTERN: 'Raštas',
  LUXURY: 'Premium',
};

function buildAnalysisRedirectPath(plate: string, symbol?: string, plateType?: string) {
  const params = new URLSearchParams({ plate, auto: '1' });
  if (symbol) params.set('symbol', symbol);
  if (plateType) params.set('type', plateType);
  return `/numerio-analize?${params.toString()}`;
}

function buildLoginHref(plate: string, symbol?: string, plateType?: string) {
  return `/prisijungti?redirect=${encodeURIComponent(buildAnalysisRedirectPath(plate, symbol, plateType))}`;
}

function buildSellHref(plate: string) {
  const params = new URLSearchParams({ plate });
  return `/parduoti?${params.toString()}`;
}

type PlateAnalysisToolProps = {
  isAuthenticated: boolean;
};

type AuthTeaserState = {
  plate: string;
  loginHref: string;
};

export function PlateAnalysisTool({ isAuthenticated }: PlateAnalysisToolProps) {
  const [plate, setPlate] = useState('');
  const [symbol, setSymbol] = useState('');
  const [plateType, setPlateType] = useState('');
  const [result, setResult] = useState<PlateAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authTeaser, setAuthTeaser] = useState<AuthTeaserState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedQuery = useRef(false);
  const automotiveMeanings =
    result?.ruleAnalysis?.topMeanings.filter((meaning) => automotiveCategories.has(meaning.category)) ?? [];
  const activePlate = result?.normalizedPlate ?? plate.trim().toUpperCase();

  useEffect(() => {
    if (hasLoadedQuery.current) return;
    hasLoadedQuery.current = true;

    const params = new URLSearchParams(window.location.search);
    const queryPlate = (params.get('plate') ?? '').trim().toUpperCase().slice(0, 15);
    const querySymbol = (params.get('symbol') ?? '').trim();
    const queryType = (params.get('type') ?? '').trim();

    if (!queryPlate) return;

    setPlate(queryPlate);
    setSymbol(querySymbol);
    setPlateType(queryType);

    if (params.get('auto') !== '1') return;

    if (!isAuthenticated) {
      setAuthTeaser({
        plate: queryPlate,
        loginHref: buildLoginHref(queryPlate, querySymbol, queryType),
      });
      return;
    }

    void analyze({
      plateValue: queryPlate,
      symbolValue: querySymbol,
      plateTypeValue: queryType,
    });
  }, [isAuthenticated]);

  async function analyze({
    plateValue = plate,
    symbolValue = symbol,
    plateTypeValue = plateType,
  }: {
    plateValue?: string;
    symbolValue?: string;
    plateTypeValue?: string;
  } = {}) {
    const trimmed = plateValue.trim();
    setError(null);
    setResult(null);
    setAuthTeaser(null);

    if (!trimmed) {
      setError('Įveskite numerio derinį.');
      return;
    }

    if (!isAuthenticated) {
      setAuthTeaser({
        plate: trimmed.toUpperCase(),
        loginHref: buildLoginHref(trimmed, symbolValue, plateTypeValue),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/plate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: trimmed,
          symbol: symbolValue || undefined,
          type: plateTypeValue || undefined,
        }),
      });
      const data = (await response.json()) as PlateAnalysisResponse;

      if (response.status === 401 && data.authRequired) {
        setAuthTeaser({
          plate: trimmed.toUpperCase(),
          loginHref: buildLoginHref(trimmed, symbolValue, plateTypeValue),
        });
        return;
      }

      if (!response.ok || !data.ok) {
        setError(data.message ?? 'Įžvalgų parengti nepavyko. Patikrinkite numerio formatą.');
        return;
      }

      setResult(data);
    } catch {
      setError('Įžvalgų parengti nepavyko. Pabandykite dar kartą.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void analyze();
  }

  function analyzeExample(example: string) {
    setPlate(example);
    void analyze({ plateValue: example });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="app-card p-5 sm:p-6" aria-labelledby="plate-analysis-form-title">
        <div>
          <p className="text-sm font-black uppercase text-[var(--primary)]">Nemokamas įrankis</p>
          <h2 id="plate-analysis-form-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
            Unikodas įžvalgos
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Įveskite numerį ir, jei žinote, pasirinkite simbolį ar tipą. AI paaiškinimas
            įjungiamas tik tada, kai jis sukonfigūruotas serveryje.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase text-[var(--muted-soft)]">
              Numerio derinys
            </span>
            <input
              value={plate}
              onChange={(event) => setPlate(event.target.value.toUpperCase())}
              className="app-search-field min-h-[56px] w-full px-3 text-base font-extrabold uppercase tracking-normal outline-none placeholder:font-bold placeholder:normal-case focus:border-[var(--ring)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--ring)_34%,transparent)] sm:px-4 sm:text-lg"
              placeholder="Pvz. DOM455"
              maxLength={15}
              autoComplete="off"
              inputMode="text"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase text-[var(--muted-soft)]">
                Simbolis
              </span>
              <select
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                className="app-search-field min-h-[52px] w-full px-4 text-sm font-bold outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--ring)_34%,transparent)]"
              >
                <option value="">Nežinau</option>
                <option value="eu">ES</option>
                <option value="vytis">Vytis</option>
                <option value="flag">Lietuvos vėliava</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase text-[var(--muted-soft)]">
                Tipas
              </span>
              <select
                value={plateType}
                onChange={(event) => setPlateType(event.target.value)}
                className="app-search-field min-h-[52px] w-full px-4 text-sm font-bold outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--ring)_34%,transparent)]"
              >
                <option value="">Nežinau</option>
                <option value="car">Automobilio</option>
                <option value="motorcycle">Motociklo</option>
                <option value="personalized">Vardinis</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="app-button-primary min-h-[56px] w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Rengiamos įžvalgos...' : 'Analizuoti numerį'}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => analyzeExample(example)}
              className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs font-black text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              {example}
            </button>
          ))}
        </div>

        <p className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs leading-5 text-[var(--muted-foreground)]">
          Tai nėra oficialus vertinimas ar garantuota rinkos kaina. Įžvalgos paremtos
          derinio raštais, galimomis reikšmėmis ir bendru patrauklumu.
        </p>
      </section>

      <section className="app-card min-h-[26rem] p-5 sm:p-6" aria-live="polite">
        {error && (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold leading-6 text-red-200">
            {error}
          </div>
        )}

        {!error && authTeaser && <AuthRequiredTeaser teaser={authTeaser} />}

        {!error && !authTeaser && !result && (
          <div className="flex h-full min-h-[20rem] flex-col justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-5 text-center">
            <p className="text-2xl font-black text-[var(--foreground)]">Unikodas įžvalgos pasirodys čia</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
              Išbandykite vardinį derinį, automobilio modelio nuorodą arba trumpą skaičių seką.
            </p>
          </div>
        )}

        {result?.ruleAnalysis && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">
                  {result.normalizedPlate}
                </p>
                <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  Bendras įvertinimas
                </h2>
                <p className="mt-1 text-sm font-bold text-[var(--muted-foreground)]">
                  {result.ruleAnalysis.label}
                </p>
              </div>
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-right">
                <div className="text-3xl font-black text-[var(--primary)]">
                  {result.ruleAnalysis.score}/100
                </div>
                <div className="text-xs font-bold uppercase text-[var(--muted-soft)]">
                  Taisyklėmis paremta
                </div>
              </div>
            </div>

            {result.ruleAnalysis.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.ruleAnalysis.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-bold text-[var(--foreground)]"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <DimensionsGrid analysis={result.ruleAnalysis} />

            <div className="grid gap-4 sm:grid-cols-2">
              <InsightBlock title="Atpažintos reikšmės">
                {result.ruleAnalysis.topMeanings.length > 0 ? (
                  <MeaningList meanings={result.ruleAnalysis.topMeanings} />
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                    Ryškių reikšmių neaptikta, bet derinį vis tiek verta vertinti pagal kontekstą.
                  </p>
                )}
              </InsightBlock>

              <InsightBlock title="Kodėl derinys gali būti įdomus?">
                <InsightList items={result.ruleAnalysis.collectorInsights.slice(0, 5)} />
              </InsightBlock>
            </div>

            {automotiveMeanings.length > 0 && (
              <InsightBlock title="Automobilių asociacijos">
                <MeaningList meanings={automotiveMeanings} />
              </InsightBlock>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {result.ruleAnalysis.symbolInsights.length > 0 && (
                <InsightBlock title="Simbolio / tipo įžvalgos">
                  <InsightList items={result.ruleAnalysis.symbolInsights} />
                </InsightBlock>
              )}

              <InsightBlock title="Kam gali būti patrauklus?">
                <InsightList items={result.ruleAnalysis.audienceInsights} />
              </InsightBlock>
            </div>

            {result.ruleAnalysis.similarPlateIdeas.length > 0 && (
              <div className="rounded-3xl bg-[var(--muted)] p-4">
                <h3 className="text-sm font-black text-[var(--foreground)]">Panašios idėjos</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.ruleAnalysis.similarPlateIdeas.map((idea) => (
                    <span
                      key={idea}
                      className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-black text-[var(--foreground)]"
                    >
                      {idea}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
                  Panašios idėjos nereiškia, kad šie numeriai yra laisvi ar parduodami.
                </p>
              </div>
            )}

            {result.aiAnalysis ? (
              <div className="rounded-3xl border border-[var(--primary)]/30 bg-[color:color-mix(in_srgb,var(--primary)_10%,var(--card))] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-black text-[var(--foreground)]">AI paaiškinimas</h3>
                  <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-black text-[var(--primary-foreground)]">
                    {confidenceLabels[result.aiAnalysis.confidence]} įžvalga
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--card-foreground)]">
                  {result.aiAnalysis.summary}
                </p>
                {result.aiAnalysis.hiddenMeanings.length > 0 && (
                  <InsightList items={result.aiAnalysis.hiddenMeanings} />
                )}
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {result.aiAnalysis.collectorAppeal}
                </p>
                {result.aiAnalysis.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.aiAnalysis.suggestions.map((suggestion) => (
                      <span
                        key={suggestion}
                        className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--foreground)]"
                      >
                        {suggestion}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs leading-5 text-[var(--muted-foreground)]">
                AI paaiškinimas šiuo metu nepasiekiamas, bet pateikiama taisyklėmis paremta analizė.
              </p>
            )}

            <AnalysisFunnelActions plate={activePlate} />
          </div>
        )}
      </section>
    </div>
  );
}

function AuthRequiredTeaser({ teaser }: { teaser: AuthTeaserState }) {
  return (
    <div className="flex h-full min-h-[20rem] flex-col justify-center rounded-3xl border border-[var(--primary)]/30 bg-[color:color-mix(in_srgb,var(--primary)_10%,var(--card))] p-5 text-center">
      <p className="text-sm font-black uppercase text-[var(--primary)]">{teaser.plate}</p>
      <h2 className="mt-3 text-2xl font-black text-[var(--foreground)]">
        Aptiktos galimos įžvalgos.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
        Prisijunkite nemokamai, kad pamatytumėte visas Unikodas įžvalgas.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link href={teaser.loginHref} className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm">
          Prisijungti
        </Link>
        <Link href={teaser.loginHref} className="app-button-secondary min-h-[52px] px-5 py-3 text-center text-sm">
          Registruotis
        </Link>
      </div>
      <p className="mx-auto mt-4 max-w-md text-xs leading-5 text-[var(--muted-soft)]">
        Numeris bus išsaugotas ir analizė bus pratęsta po prisijungimo.
      </p>
    </div>
  );
}

function AnalysisFunnelActions({ plate }: { plate: string }) {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4">
        <h3 className="text-lg font-black text-[var(--foreground)]">
          Kiek gali būti vertas jūsų numeris?
        </h3>
        <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--muted-foreground)]">
          <p>Automatinis numerių vertinimas dar kuriamas.</p>
          <p>
            Kol kas geriausią nuomonę dažnai pateikia automobilių entuziastų bendruomenė.
          </p>
          <p>
            Prisijunkite prie Unikodas Telegram grupės, parodykite savo numerį ir gaukite kitų narių
            įžvalgas.
          </p>
        </div>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="app-button-secondary mt-4 min-h-[52px] w-full px-5 py-3 text-center text-sm sm:w-auto"
        >
          Prisijungti prie Telegram
        </a>
      </section>

      <section className="rounded-3xl border border-[var(--primary)]/30 bg-[color:color-mix(in_srgb,var(--primary)_10%,var(--card))] p-4">
        <h3 className="text-lg font-black text-[var(--foreground)]">Turite šį numerį?</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          Įkelkite jį į Unikodas ir leiskite pirkėjams jus surasti.
        </p>
        <Link
          href={plate ? buildSellHref(plate) : '/parduoti'}
          className="app-button-primary mt-4 min-h-[52px] w-full px-5 py-3 text-center text-sm sm:w-auto"
        >
          Parduoti šį numerį
        </Link>
      </section>

      <p className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs leading-5 text-[var(--muted-foreground)]">
        Ateityje Unikodas planuoja pasiūlyti duomenimis pagrįstą numerių vertinimą, paremtą
        realiais pardavimais ir rinkos aktyvumu.
      </p>
    </div>
  );
}

function DimensionsGrid({ analysis }: { analysis: PlateAnalysis }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(dimensionLabels).map(([key, label]) => {
        const value = analysis.dimensions[key as keyof typeof analysis.dimensions];
        return (
          <div key={key} className="rounded-2xl bg-[var(--muted)] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase text-[var(--muted-soft)]">{label}</span>
              <span className="text-sm font-black text-[var(--foreground)]">{value}/100</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--background)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl bg-[var(--muted)] p-4">
      <h3 className="text-sm font-black text-[var(--foreground)]">{title}</h3>
      {children}
    </div>
  );
}

function InsightList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function MeaningList({ meanings }: { meanings: PlateMeaning[] }) {
  return (
    <div className="mt-3 space-y-2">
      {meanings.map((meaning) => (
        <div
          key={`${meaning.category}-${meaning.text}`}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-[var(--foreground)]">{meaning.text}</p>
            <span className="rounded-full bg-[var(--primary)] px-2 py-1 text-xs font-black text-[var(--primary-foreground)]">
              {meaning.confidence}%
            </span>
          </div>
          <p className="mt-1 text-xs font-bold uppercase text-[var(--muted-soft)]">
            {meaningCategoryLabels[meaning.category]}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
            {meaning.reason}
          </p>
        </div>
      ))}
    </div>
  );
}
