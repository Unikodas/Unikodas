import { z } from 'zod';

export const REPORT_TARGET_TYPES = ['listing', 'wanted', 'message'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_REASONS = ['spam', 'scam', 'inappropriate', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const ReportInputSchema = z.object({
  target_type: z.enum(REPORT_TARGET_TYPES, {
    errorMap: () => ({ message: 'invalid_target' }),
  }),
  target_id: z.string().uuid('invalid_target'),
  reason: z.enum(REPORT_REASONS, {
    errorMap: () => ({ message: 'invalid_reason' }),
  }),
  details: z.string().max(1000, 'details_too_long').nullable(),
});

export type ReportInput = z.infer<typeof ReportInputSchema>;

export function parseReportFormData(formData: FormData): ReportInput {
  const target_type = String(formData.get('target_type') ?? '').trim();
  const target_id = String(formData.get('target_id') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  const detailsRaw = String(formData.get('details') ?? '').trim();
  const details = detailsRaw.length === 0 ? null : detailsRaw;

  return ReportInputSchema.parse({
    target_type,
    target_id,
    reason,
    details,
  });
}
