import type { FlagType, PlateType } from '@/lib/validation/listing';

type PlatePreviewType = PlateType | 'square';
type PlatePreviewSize = 'sm' | 'md' | 'lg';
type PlatePreviewIcon = 'motorcycle';

const SYMBOL_CONFIG: Record<
  FlagType,
  { src: string | null; stripClass: string; label: string }
> = {
  eu_symbol: {
    src: '/symbols/Flag_of_Europe.svg',
    stripClass: 'plate-preview__strip--eu',
    label: 'ES simbolis',
  },
  vytis: {
    src: '/symbols/Coat_of_arms_of_Lithuania.svg',
    stripClass: 'plate-preview__strip--vytis',
    label: 'Vytis',
  },
  lithuanian_flag: {
    src: null,
    stripClass: 'plate-preview__strip--lithuanian',
    label: 'Lietuvos vėliava',
  },
};

interface PlatePreviewProps {
  plateText: string;
  plateType: PlatePreviewType;
  flagType: FlagType;
  icon?: PlatePreviewIcon;
  size?: PlatePreviewSize;
  className?: string;
}

function isSquarePlate(plateType: PlatePreviewType): boolean {
  return plateType === 'motorcycle' || plateType === 'square';
}

function splitMotorcycleText(plateText: string): [string, string] {
  const compactText = plateText.replace(/[^A-Z0-9]/g, '');
  return [compactText.slice(0, 3), compactText.slice(3, 5)];
}

export function PlatePreview({
  plateText,
  plateType,
  flagType,
  icon,
  size = 'md',
  className = '',
}: PlatePreviewProps) {
  const normalizedText = plateText.trim().toUpperCase() || '---';
  const square = isSquarePlate(plateType);
  const motorcycle = plateType === 'motorcycle';
  const compact = normalizedText.length > (square ? 6 : 8);
  const symbol = SYMBOL_CONFIG[flagType] ?? SYMBOL_CONFIG.eu_symbol;
  const [motorcycleTop, motorcycleBottom] = splitMotorcycleText(normalizedText);
  const classes = [
    'plate-preview',
    `plate-preview--${size}`,
    square ? 'plate-preview--square' : '',
    compact ? 'plate-preview--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const accessibleLabel =
    icon === 'motorcycle'
      ? `Motociklo numeris, ${symbol.label}`
      : `Numeris ${normalizedText}, ${symbol.label}`;

  return (
    <div className={classes} aria-label={accessibleLabel}>
      <div className={`plate-preview__strip ${symbol.stripClass}`} aria-hidden="true">
        {symbol.src && (
          <span className="plate-preview__symbol-frame">
            <img className="plate-preview__symbol-image" src={symbol.src} alt="" />
          </span>
        )}
      </div>
      <div
        className={[
          'plate-preview__text',
          icon ? 'plate-preview__text--icon' : '',
          motorcycle && !icon ? 'plate-preview__text--motorcycle' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {icon === 'motorcycle' ? (
          <MotorcycleIcon />
        ) : motorcycle ? (
          <>
            <span>{motorcycleTop}</span>
            <span>{motorcycleBottom}</span>
          </>
        ) : (
          normalizedText
        )}
      </div>
    </div>
  );
}

function MotorcycleIcon() {
  return (
    <svg
      className="plate-preview__motorcycle-icon"
      viewBox="0 0 96 56"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="40" r="10" stroke="currentColor" strokeWidth="5" />
      <circle cx="72" cy="40" r="10" stroke="currentColor" strokeWidth="5" />
      <path
        d="M25 40h14l10-17h12l11 17M40 40l-9-16h15M52 23l-6-10h12M65 19h13l6 8"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M58 14h9" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
