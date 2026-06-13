interface Props {
  size?: number;
  dark?: boolean;
}

export function KuidaIcon({ size = 56 }: { size?: number }) {
  const r = size * 0.22;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="56" rx={r} fill="#0CCEDD" />
      <path d="M28 8 C18 14 8 22 8 33 C8 43 17 50 28 50 C39 50 48 43 48 33 C48 22 38 14 28 8 Z" fill="white" />
      <line x1="28" y1="12" x2="28" y2="38" stroke="#0CCEDD" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="28" y1="38" x2="20" y2="47" stroke="#0CCEDD" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="28" y1="38" x2="36" y2="47" stroke="#0CCEDD" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function KuidaLogo({ subtitle, dark = false }: { subtitle?: string; dark?: boolean }) {
  const textColor = dark ? 'white' : '#0D1117';
  const subColor = dark ? 'rgba(255,255,255,0.4)' : '#888';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <KuidaIcon size={56} />
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
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
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
      <KuidaIcon size={28} />
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
