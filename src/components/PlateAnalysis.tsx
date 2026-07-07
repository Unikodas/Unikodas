import type { ReactNode } from 'react';

import { analyzePlate, normalizePlate, type PlateAnalysisContext } from '@/lib/plate-intelligence';

type PlateAnalysisProps = {
  plate: string | null | undefined;
  symbol?: PlateAnalysisContext['symbol'];
  category?: PlateAnalysisContext['category'];
  type?: PlateAnalysisContext['type'];
};

const dimensionLabels = {
  memorability: 'Įsimenamumas',
  patternStrength: 'Rašto stiprumas',
  hiddenMeaning: 'Paslėpta reikšmė',
  automotiveAppeal: 'Automobilių patrauklumas',
  collectorAppeal: 'Kolekcinis įdomumas',
} as const;

export function PlateAnalysis({ plate, symbol, category, type }: PlateAnalysisProps) {
  if (!plate || !normalizePlate(plate)) return null;

  const analysis = analyzePlate(plate, { symbol, category, type });
  const primaryInsights = analysis.insights.slice(0, 4);
  const visibleFactors = analysis.factors.slice(0, 4);
  const contextInsights = analysis.symbolInsights.slice(0, 4);

  return (
    <section className="app-card p-5 sm:p-6" aria-labelledby="plate-analysis-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-[var(--primary)]">
            Unikodas įžvalgos
          </p>
          <h2 id="plate-analysis-title" className="mt-1 text-xl font-black text-[var(--foreground)]">
            Bendras įvertinimas
          </h2>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-right">
          <div className="text-2xl font-black text-[var(--primary)]">{analysis.score}/100</div>
          <div className="text-xs font-bold uppercase text-[var(--muted-soft)]">
            {analysis.label}
          </div>
        </div>
      </div>

      {analysis.badges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {analysis.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-bold text-[var(--foreground)]"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
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

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <InsightBlock title="Atpažintos reikšmės">
          {analysis.detectedMeanings.length > 0 ? (
            <InsightList items={analysis.detectedMeanings} />
          ) : (
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
              Ryškių automobilinių ar žodinių reikšmių neaptikta.
            </p>
          )}
        </InsightBlock>

        <InsightBlock title="Kodėl derinys gali būti įdomus?">
          <InsightList items={primaryInsights} />
        </InsightBlock>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {contextInsights.length > 0 && (
          <InsightBlock title="Simbolio / tipo įžvalgos">
            <InsightList items={contextInsights} />
          </InsightBlock>
        )}

        <InsightBlock title="Kam gali būti patrauklus?">
          <InsightList items={analysis.audienceInsights} />
        </InsightBlock>
      </div>

      {analysis.similarPlateIdeas.length > 0 && (
        <div className="mt-4 rounded-3xl bg-[var(--muted)] p-4">
          <h3 className="text-sm font-black text-[var(--foreground)]">Panašios idėjos</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.similarPlateIdeas.map((idea) => (
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

      {visibleFactors.length > 0 && (
        <div className="mt-4 grid gap-2">
          {visibleFactors.map((factor) => (
            <div
              key={`${factor.name}-${factor.description}`}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border)] px-3 py-2"
            >
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">{factor.name}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                  {factor.description}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--primary)] px-2 py-1 text-xs font-black text-[var(--primary-foreground)]">
                +{factor.scoreImpact}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs leading-5 text-[var(--muted-foreground)]">
        Tai nėra oficialus vertinimas ar garantuota rinkos kaina. Įžvalgos paremtos
        derinio raštais, galimomis reikšmėmis ir bendru patrauklumu.
      </p>
    </section>
  );
}

function InsightBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
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
