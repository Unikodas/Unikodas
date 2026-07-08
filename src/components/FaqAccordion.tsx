'use client';

import { useId, useState } from 'react';

type FaqItem = {
  question: string;
  answer: string;
};

function AccordionIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      {!isOpen && <path d="M12 5v14" />}
    </svg>
  );
}

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-faq-panel-${index}`;
        const buttonId = `${baseId}-faq-button-${index}`;

        return (
          <div
            key={item.question}
            className={index > 0 ? 'border-t border-[var(--border)]' : undefined}
          >
            <button
              id={buttonId}
              type="button"
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)] sm:px-5"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="leading-5">{item.question}</span>
              <span
                className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition',
                  isOpen
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-contrast)]'
                    : 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-foreground)]',
                ].join(' ')}
              >
                <AccordionIcon isOpen={isOpen} />
              </span>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-4 pb-5 pt-1 sm:px-5"
              >
                <div className="faq-answer max-w-3xl space-y-3 text-sm leading-6">
                  {item.answer.split(/\n\n+/).map((paragraph) => (
                    <p key={paragraph} className="faq-answer__paragraph">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
