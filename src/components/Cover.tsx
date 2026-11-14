/**
 * Affiches dessinées pour les réalisations, à partir des deux formes du logo : l'arche et le point.
 * Ce ne sont pas des captures d'écran. Pour une vraie capture, remplace <Poster> par une image.
 */
export type CoverId = 'jappo' | 'eco' | 'teranga' | 'smart' | 'shop';

const LAGOON = '#006989';
const SUN = '#FFB400';
const DEEP = '#0B1F2A';
const SKY = '#DCEAEE';
const PAPER = '#F5F2EC';

/** Une arche pleine : rectangle au sommet arrondi. */
const arch = (x: number, bottom: number, w: number, h: number) =>
  `M${x} ${bottom}V${bottom - h + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${bottom}Z`;

export function Poster({ id }: { id: CoverId }) {
  const common = {
    className: 'cover',
    viewBox: '0 0 400 500',
    preserveAspectRatio: 'xMidYMid meet',
    overflow: 'visible',
    'aria-hidden': true,
  } as const;

  switch (id) {
    // JAPPO : une cohorte qui progresse, arche après arche.
    case 'jappo':
      return (
        <svg {...common}>
          <rect x="-2000" y="-2000" width="4400" height="4500" fill={LAGOON} />
          {[70, 100, 134, 170, 208].map((h, i) => (
            <path key={h} d={arch(62 + i * 58, 350, 44, h)} fill="#fff" opacity={0.16 + i * 0.2} />
          ))}
          <circle cx="316" cy="118" r="13" fill={SUN} />
          <path d="M40 350h320" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
        </svg>
      );
    // Eco-Stock : un entrepôt vu de dessus, un transfert entre deux emplacements.
    case 'eco':
      return (
        <svg {...common}>
          <rect x="-2000" y="-2000" width="4400" height="4500" fill={DEEP} />
          {Array.from({ length: 20 }, (_, i) => {
            const col = i % 5;
            const row = Math.floor(i / 5);
            const filled = [0, 1, 2, 5, 6, 8, 11, 12, 13, 17, 19].includes(i);
            return (
              <rect
                key={i}
                x={66 + col * 56}
                y={142 + row * 56}
                width="44"
                height="44"
                rx="12"
                fill={i === 8 ? SUN : filled ? '#4DB4D4' : 'none'}
                fillOpacity={i === 8 ? 1 : filled ? 0.25 + ((i * 7) % 5) * 0.15 : 1}
                stroke="#4DB4D4"
                strokeOpacity={filled ? 0 : 0.35}
                strokeWidth="1.5"
              />
            );
          })}
          <path d="M256 164q60 60 -56 168" fill="none" stroke={SUN} strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
          <circle cx="200" cy="332" r="6" fill={SUN} />
        </svg>
      );
    // TerangaScan : un acte d'état civil sous le faisceau du scan.
    case 'teranga':
      return (
        <svg {...common}>
          <rect x="-2000" y="-2000" width="4400" height="4500" fill={SUN} />
          <g transform="rotate(-5 200 250)">
            <rect x="118" y="132" width="164" height="232" rx="12" fill={PAPER} />
            <circle cx="158" cy="184" r="20" fill={SKY} />
            <path d="M192 174h66M192 194h44M142 236h116M142 258h116M142 280h80M142 318h52" stroke={DEEP} strokeOpacity=".3" strokeWidth="6" strokeLinecap="round" />
          </g>
          <rect x="70" y="244" width="260" height="12" rx="6" fill={LAGOON} />
          <rect x="70" y="256" width="260" height="46" fill={LAGOON} opacity=".14" />
          <path d="M84 150v-24a14 14 0 0 1 14-14h24M278 112h24a14 14 0 0 1 14 14v24M316 350v24a14 14 0 0 1-14 14h-24M122 388H98a14 14 0 0 1-14-14v-24" fill="none" stroke={DEEP} strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    // SmartHelp : une note vocale, une photo, un diagnostic.
    case 'smart':
      return (
        <svg {...common}>
          <rect x="-2000" y="-2000" width="4400" height="4500" fill={SKY} />
          {[22, 46, 30, 70, 104, 58, 88, 40, 64, 28, 50, 20].map((h, i) => (
            <rect key={i} x={62 + i * 16} y={222 - h / 2} width="8" height={h} rx="4" fill={LAGOON} opacity={i < 7 ? 1 : 0.35} />
          ))}
          <rect x="268" y="176" width="92" height="92" rx="20" fill={PAPER} />
          <path d="M280 250l22-26 16 16 12-10 18 20Z" fill={LAGOON} opacity=".35" />
          <circle cx="338" cy="200" r="8" fill={SUN} />
          <rect x="62" y="300" width="298" height="48" rx="24" fill={PAPER} />
          <circle cx="86" cy="324" r="8" fill={SUN} />
          <path d="M106 324h120" stroke={DEEP} strokeOpacity=".35" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    // Refonte e-commerce : l'ancienne page derrière, la nouvelle devant.
    default:
      return (
        <svg {...common}>
          <rect x="-2000" y="-2000" width="4400" height="4500" fill="#EAE4D9" />
          <rect x="56" y="140" width="200" height="170" rx="14" fill="none" stroke={DEEP} strokeOpacity=".3" strokeWidth="2" />
          <path d="M74 166h60M74 196h164M74 222h164M74 248h100" stroke={DEEP} strokeOpacity=".22" strokeWidth="8" strokeLinecap="round" />
          <rect x="140" y="192" width="208" height="176" rx="16" fill={PAPER} />
          <path d={arch(160, 296, 64, 84)} fill={LAGOON} />
          <rect x="240" y="216" width="88" height="10" rx="5" fill={DEEP} opacity=".75" />
          <rect x="240" y="238" width="60" height="10" rx="5" fill={DEEP} opacity=".25" />
          <rect x="240" y="268" width="70" height="28" rx="14" fill={SUN} />
          <rect x="160" y="316" width="50" height="34" rx="9" fill={SKY} />
          <rect x="219" y="316" width="50" height="34" rx="9" fill={SKY} />
          <rect x="278" y="316" width="50" height="34" rx="9" fill={SKY} />
        </svg>
      );
  }
}
