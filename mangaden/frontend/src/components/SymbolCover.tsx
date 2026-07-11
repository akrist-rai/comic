import { useMemo } from 'react';
import type { MediaType } from '../types';

interface SymbolCoverProps {
  title: string;
  type:  MediaType;
}

const CYRILLIC  = ['Д', 'Ж', 'Ф', 'Ц', 'Ш', 'Щ', 'Ъ', 'Ы', 'Э', 'Ю', 'Я', 'Б', 'Г', 'Л', 'И', 'П'];
const JAPANESE  = ['メ', 'ガ', '書', '巻', '影', '魂', '剣', '夢', '運', '光', '道', '戦', '神', '力', '空', '花'];
const GREEK     = ['Ω', 'Ψ', 'Φ', 'Ξ', 'Θ', 'Σ', 'Δ', 'Λ', 'Γ', 'Π', 'Ξ', 'Υ', 'Φ', 'χ', 'Ψ', 'ω'];
const RUNES     = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'];
const ACCENTS   = ['Æ', 'Œ', 'Ø', 'Þ', 'Ð', 'ß', 'Ä', 'Ö', 'Ü', 'Â', 'Ê', 'Î', 'Ô', 'Û', 'Ç', 'Ë'];
const ALCHEMICAL = ['∞', '∇', '∂', '☼', '☾', '⌬', '⚗', '⚛', '⚜', '☯', '☸', '⚡', '⚙', '⚓', '⚖', '♠'];

const GRADIENTS = [
  'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)', // Midnight Purple
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', // Deep Ocean
  'linear-gradient(135deg, #3a1c1c 0%, #5c2c2c 50%, #8c3f3f 100%)', // Dark Crimson
  'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)', // Tech Blue
  'linear-gradient(135deg, #13221c 0%, #223e36 50%, #3f6c5f 100%)', // Jade Emerald
  'linear-gradient(135deg, #2c0c30 0%, #4d1c52 50%, #7d3384 100%)', // Neon Plum
  'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)', // Onyx
];

const TYPE_ICONS: Record<MediaType, string> = {
  manga:      '📖',
  anime:      '🎬',
  web_series: '📺',
  movie:      '🎥',
  book:       '📘',
  game:       '🎮',
};

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function SymbolCover({ title, type }: SymbolCoverProps) {
  const hash = useMemo(() => getHash(title), [title]);

  const { gradient, symbol, icon } = useMemo(() => {
    const absHash = Math.abs(hash);
    
    // Choose gradient
    const gradient = GRADIENTS[absHash % GRADIENTS.length];
    
    // Choose symbol set
    const symbolSets = [CYRILLIC, JAPANESE, GREEK, RUNES, ACCENTS, ALCHEMICAL];
    const setIndex = absHash % symbolSets.length;
    const selectedSet = symbolSets[setIndex];
    
    // Choose symbol
    const symbol = selectedSet[(absHash * 31) % selectedSet.length];
    
    // Choose type icon
    const icon = TYPE_ICONS[type] ?? '❓';

    return { gradient, symbol, icon };
  }, [hash, type]);

  return (
    <div 
      className="symbol-cover"
      style={{ background: gradient }}
    >
      <div className="symbol-cover__accent-glow" />
      <div className="symbol-cover__symbol">{symbol}</div>
      <div className="symbol-cover__meta">
        <span className="symbol-cover__icon">{icon}</span>
        <span className="symbol-cover__type">{type.replace('_', ' ')}</span>
      </div>
    </div>
  );
}
