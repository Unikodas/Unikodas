import { lt } from '@/lib/i18n/lt';
import { FaqAccordion } from '@/components/FaqAccordion';

type StepIconName = 'message' | 'contacts' | 'price' | 'meet' | 'office' | 'transfer';

const STEP_ICONS: StepIconName[] = [
  'message',
  'contacts',
  'price',
  'meet',
  'office',
  'transfer',
];

function StepIcon({ name }: { name: StepIconName }) {
  const commonProps = {
    className: 'h-5 w-5',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'message':
      return (
        <svg {...commonProps}>
          <path d="M4 5h16v10H8l-4 4V5z" />
          <path d="M8 9h8" />
          <path d="M8 12h5" />
        </svg>
      );
    case 'contacts':
      return (
        <svg {...commonProps}>
          <path d="M16 11a4 4 0 1 0-8 0" />
          <path d="M4 20a8 8 0 0 1 16 0" />
          <path d="M19 8h2" />
          <path d="M20 7v2" />
        </svg>
      );
    case 'price':
      return (
        <svg {...commonProps}>
          <path d="M20 7v10a2 2 0 0 1-2 2H6L4 17V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
      );
    case 'meet':
      return (
        <svg {...commonProps}>
          <path d="M12 21s7-4.7 7-11a7 7 0 0 0-14 0c0 6.3 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'office':
      return (
        <svg {...commonProps}>
          <path d="M4 20h16" />
          <path d="M6 20V6l6-3 6 3v14" />
          <path d="M9 9h1" />
          <path d="M14 9h1" />
          <path d="M9 13h1" />
          <path d="M14 13h1" />
        </svg>
      );
    case 'transfer':
      return (
        <svg {...commonProps}>
          <path d="M7 7h12l-3-3" />
          <path d="M19 7l-3 3" />
          <path d="M17 17H5l3 3" />
          <path d="M5 17l3-3" />
        </svg>
      );
  }
}

export function HomeInfoSections() {
  return (
    <div className="space-y-8 border-t border-[var(--border)] pt-8">
      <section className="space-y-3" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-semibold text-[var(--text)]">
          {lt.home.how.title}
        </h2>

        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lt.home.how.steps.map((step, index) => (
            <li
              key={step}
              className="flex min-h-20 gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text)]">
                <StepIcon name={STEP_ICONS[index]} />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase text-[var(--muted-soft)]">
                  {index + 1}
                </span>
                <p className="mt-1 text-sm font-semibold leading-5 text-[var(--text)]">{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="grid gap-5 border-y border-[var(--border)] py-6 lg:grid-cols-[0.9fr_1.1fr]"
        aria-labelledby="safety-title"
      >
        <div>
          <h2 id="safety-title" className="text-2xl font-semibold text-[var(--text)]">
            {lt.home.safety.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{lt.home.safety.intro}</p>
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2">
          {lt.home.safety.items.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm font-medium leading-5 text-[var(--text)]"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-2xl font-semibold text-[var(--text)]">
          {lt.home.faq.title}
        </h2>

        <FaqAccordion items={lt.home.faq.items} />
      </section>
    </div>
  );
}
