'use client';

import { useActionState, useState } from 'react';
import { lt } from '@/lib/i18n/lt';
import { PLATE_TYPES, FLAG_TYPES, type ListingInput } from '@/lib/validation/listing';
import { LITHUANIAN_CITIES } from '@/lib/locations/lithuania-cities';
import { PlatePreview } from '@/components/PlatePreview';

export type ListingFormState = { error: string | null };
export const initialListingFormState: ListingFormState = { error: null };

type ListingFormAction = (
  state: ListingFormState,
  formData: FormData,
) => Promise<ListingFormState>;

interface ListingFormProps {
  /** Pre-filled values when editing; left blank when creating. */
  initial?: Partial<ListingInput>;
  /** Bound Server Action. Both create + edit pages pass a function with this shape. */
  action: ListingFormAction;
  submitLabel: string;
}

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.listings.errors as Record<string, string>;
  return errs[code] ?? lt.listings.errors.server_error;
}

const sectionClassName =
  'rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg shadow-black/5 sm:p-5';

const fieldClassName =
  'w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] px-3 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:border-[var(--border)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)] disabled:opacity-100 read-only:border-[var(--border)] read-only:bg-[var(--muted)] read-only:text-[var(--muted-foreground)]';

const plateTextFieldClassName = `${fieldClassName} font-mono uppercase tracking-wider`;

const optionClassName = 'bg-[var(--input)] text-[var(--foreground)] disabled:text-[var(--muted-soft)]';

function StepHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)]">
        {number}
      </span>
      <h2 className="text-base font-black text-[var(--foreground)]">{title}</h2>
    </div>
  );
}

export function ListingForm({ initial, action, submitLabel }: ListingFormProps) {
  const [state, formAction, pending] = useActionState<ListingFormState, FormData>(
    action,
    initialListingFormState,
  );
  const [preview, setPreview] = useState({
    plateText: initial?.plate_text ?? 'UNIKODAS',
    plateType: initial?.plate_type ?? 'standard',
    flagType: initial?.flag_type ?? 'eu_symbol',
  });

  return (
    <form action={formAction} className="space-y-4">
      <section className={sectionClassName}>
        <StepHeader number={1} title={lt.listings.form.steps.number} />
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
              {lt.listings.form.plateText}
            </span>
            <input
              type="text"
              name="plate_text"
              defaultValue={initial?.plate_text ?? ''}
              maxLength={20}
              required
              autoComplete="off"
              placeholder={lt.listings.form.plateTextHint}
              className={plateTextFieldClassName}
              onChange={(event) =>
                setPreview((current) => ({
                  ...current,
                  plateText: event.target.value.trim().toUpperCase() || 'UNIKODAS',
                }))
              }
            />
            <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
              {lt.listings.form.plateTextHint}
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
              {lt.listings.form.plateType}
            </span>
            <select
              name="plate_type"
              defaultValue={initial?.plate_type ?? 'standard'}
              required
              className={fieldClassName}
              onChange={(event) =>
                setPreview((current) => ({
                  ...current,
                  plateType: event.target.value as ListingInput['plate_type'],
                }))
              }
            >
              {PLATE_TYPES.map((type) => (
                <option key={type} value={type} className={optionClassName}>
                  {lt.listings.types[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <StepHeader number={2} title={lt.listings.form.steps.details} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
              {lt.listings.flagType}
            </span>
            <select
              name="flag_type"
              defaultValue={initial?.flag_type ?? 'eu_symbol'}
              required
              className={fieldClassName}
              onChange={(event) =>
                setPreview((current) => ({
                  ...current,
                  flagType: event.target.value as ListingInput['flag_type'],
                }))
              }
            >
              {FLAG_TYPES.map((flag) => (
                <option key={flag} value={flag} className={optionClassName}>
                  {lt.listings.flagTypes[flag]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
              {lt.listings.form.city}
            </span>
            <select
              name="city"
              defaultValue={initial?.city ?? ''}
              required
              className={fieldClassName}
            >
              <option value="" disabled className={optionClassName}>
                —
              </option>
              {LITHUANIAN_CITIES.map((city) => (
                <option key={city} value={city} className={optionClassName}>
                  {city}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <StepHeader number={3} title={lt.listings.form.steps.price} />
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
              {lt.listings.form.price}
            </span>
            <input
              type="number"
              name="price_eur"
              defaultValue={initial?.price_eur ?? ''}
              min={0}
              max={999999}
              step={1}
              required
              inputMode="numeric"
              className={fieldClassName}
            />
            <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
              {lt.listings.form.priceHint}
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
              {lt.listings.form.description}
            </span>
            <textarea
              name="description"
              defaultValue={initial?.description ?? ''}
              maxLength={2000}
              rows={5}
              className={fieldClassName}
            />
            <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
              {lt.listings.form.descriptionHint}
            </span>
            <span className="mt-1 block text-xs font-medium text-amber-500">
              {lt.listings.form.descriptionPrivacyHint}
            </span>
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <StepHeader number={4} title={lt.listings.form.steps.preview} />
        <div className="mb-4 flex justify-center rounded-3xl bg-[var(--muted)] p-4">
          <PlatePreview
            plateText={preview.plateText}
            plateType={preview.plateType}
            flagType={preview.flagType}
            size="lg"
          />
        </div>

        {state.error && (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {errorMessage(state.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-[var(--primary)] px-4 py-3 font-bold text-[var(--primary-foreground)] shadow-lg shadow-blue-500/20 hover:bg-[var(--primary-hover)] disabled:opacity-60 sm:w-auto"
        >
          {pending ? lt.common.loading : submitLabel}
        </button>
      </section>
    </form>
  );
}
