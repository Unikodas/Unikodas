import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PRODUCT_URLS = {
  magnetiniai_numeriu_laikikliai:
    'https://nightriderslt.shop/product/nightriders-magnetiniai-numeriu-laikikliai-1-puses/',
  magnetiniai_numeriu_laikikliai_2_puses:
    'https://nightriderslt.shop/product/nightriders-magnetiniai-numeriu-laikikliai-2-puses/',
} as const;

const ProductSchema = z.union([
  z.literal('magnetiniai_numeriu_laikikliai'),
  z.literal('magnetiniai_numeriu_laikikliai_2_puses'),
]);

const BodySchema = z
  .object({
    partner: z.literal('nightriders'),
    product: ProductSchema,
    destination: z.string().url(),
    placement: z.literal('home'),
  })
  .superRefine((body, ctx) => {
    if (body.destination !== PRODUCT_URLS[body.product]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'destination does not match product',
        path: ['destination'],
      });
    }
  });

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  console.info('[partner-product-click]', parsed);

  return NextResponse.json({ ok: true });
}
