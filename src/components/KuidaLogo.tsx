interface Props {
  size?: number;
  dark?: boolean;
}

export function KuidaIcon({ size = 56, dark = false }: Props) {
  const bg = dark ? '#0D1117' : '#0CCEDD';
  const leaf = dark ? '#0CCEDD' : 'white';
  const vein = dark ? '#0D1117' : '#0CCEDD';
  const r = size * 0.2;

  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="56" rx={r} fill={bg} />
      <path
        d="M28 10 C28 10 10 20 10 34 C10 43 18 50 28 50 C38 50 46 43 46 34 C46 20 28 10 28 10 Z"
        fill={leaf}
        opacity="0.97"
      />
      <line x1="28" y1="14" x2="28" y2="46" stroke={vein} strokeWidth="2" strokeLinecap="round" />
      <line x1="28" y1="28" x2="20" y2="35" stroke={vein} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="34" x2="20" y2="41" stroke={vein} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="28" x2="36" y2="35" stroke={vein} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="34" x2="36" y2="41" stroke={vein} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function KuidaLogo({ subtitle, dark = false }: { subtitle?: string; dark?: boolean }) {
  const textColor = dark ? 'white' : '#0D1117';
  const subColor = dark ? 'rgba(255,255,255,0.4)' : '#888';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <KuidaIcon size={56} dark={dark} />
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Arial Black', 'Arial Bold', sans-serif",
          fontWeight: 900,
          fontSize: 26,
          letterSpacing: '-0.5px',
          color: textColor,
          lineHeight: 1,
        }}>
          kuida
        </div>
        {subtitle && (
          <div style={{
            fontFamily: 'sans-serif',
            fontSize: 12,
            color: subColor,
            marginTop: 4,
            letterSpacing: '0.01em',
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function KuidaCompact({ dark = false }: { dark?: boolean }) {
  const textColor = dark ? 'white' : '#0D1117';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <KuidaIcon size={28} dark={dark} />
      <span style={{
        fontFamily: "'Arial Black', 'Arial Bold', sans-serif",
        fontWeight: 900,
        fontSize: 15,
        letterSpacing: '-0.3px',
        color: textColor,
      }}>
        kuida
      </span>
    </div>
  );
}
