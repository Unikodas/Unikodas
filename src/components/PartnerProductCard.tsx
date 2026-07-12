'use client';

import { useCallback } from 'react';

const PRODUCTS = [
  {
    name: 'Magnetiniai numerių laikikliai',
    variant: '1 pusė',
    price: '26,99 €',
    imageSrc: '/partners/nightriders-magnetiniai-numeriu-laikikliai.jpg',
    imageAlt: 'Night Riders magnetiniai numerių laikikliai vienai automobilio pusei pakuotėje',
    trackingProduct: 'magnetiniai_numeriu_laikikliai',
    url: 'https://nightriderslt.shop/product/nightriders-magnetiniai-numeriu-laikikliai-1-puses/',
  },
  {
    name: 'Magnetiniai numerių laikikliai',
    variant: '2 pusės',
    price: '41,99 €',
    imageSrc: '/partners/nightriders-magnetiniai-numeriu-laikikliai.jpg',
    imageAlt: 'Night Riders magnetinių numerių laikiklių komplektas dviem automobilio pusėms',
    trackingProduct: 'magnetiniai_numeriu_laikikliai_2_puses',
    url: 'https://nightriderslt.shop/product/nightriders-magnetiniai-numeriu-laikikliai-2-puses/',
  },
] as const;

type PartnerProduct = (typeof PRODUCTS)[number];

type GtagWindow = Window & {
  gtag?: (
    command: 'event',
    eventName: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) => void;
};

type PartnerProductCardProps = {
  className?: string;
};

export function PartnerProductCard({ className = '' }: PartnerProductCardProps) {
  const trackClick = useCallback((product: PartnerProduct) => {
    const trackingPayload = {
      partner: 'nightriders',
      product: product.trackingProduct,
      destination: product.url,
      placement: 'home',
    };

    (window as GtagWindow).gtag?.('event', 'partner_product_click', trackingPayload);

    const body = JSON.stringify(trackingPayload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/partner-product-click', new Blob([body], { type: 'application/json' }));
      return;
    }

    fetch('/api/partner-product-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Partner tracking must never block navigation to the external shop.
    });
  }, []);

  return (
    <aside
      className={className}
      aria-label="Partnerio pasiūlymas: NIGHTRIDERS magnetiniai numerių laikikliai"
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-[#d6a935]/70 bg-[#071126] p-3 text-white shadow-[0_18px_46px_rgba(0,0,0,0.26)]">
        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-1">
          <p className="text-[0.68rem] font-black uppercase leading-4 text-[#f2c84b] [overflow-wrap:anywhere]">
            Partnerio pasiūlymas
          </p>
          <p className="text-xs font-black uppercase leading-4 text-slate-300 [overflow-wrap:anywhere]">
            NIGHTRIDERS
          </p>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {PRODUCTS.map((product) => (
            <a
              key={product.url}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(product)}
              className="group/product grid min-w-0 grid-cols-[4.75rem,minmax(0,1fr)] gap-3 rounded-[1.15rem] border border-white/10 bg-[#0b162c] p-2.5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#0d1a33] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[#071126]"
            >
              <div className="aspect-square overflow-hidden rounded-[0.9rem] border border-white/10 bg-white/95">
                <img
                  src={product.imageSrc}
                  alt={product.imageAlt}
                  width="600"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-200 group-hover/product:scale-[1.03]"
                />
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-1">
                <h2 className="text-sm font-black leading-5 text-white [overflow-wrap:anywhere]">
                  {product.name}
                </h2>
                <p className="text-xs font-bold leading-4 text-slate-300 [overflow-wrap:anywhere]">{product.variant}</p>
                <p className="text-lg font-black leading-none text-white">{product.price}</p>
                <span className="app-button-primary mt-1 min-h-9 w-full gap-1.5 px-2.5 py-2 text-center text-[0.7rem] sm:w-fit sm:px-3 sm:text-xs">
                  <span className="min-w-0">Peržiūrėti prekę</span>
                  <svg
                    className="h-3.5 w-3.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
