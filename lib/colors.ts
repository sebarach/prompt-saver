export const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string; ring: string; shadow: string; glow: string }> = {
  'general': { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', ring: 'ring-indigo-500', shadow: 'shadow-indigo-500/20', glow: 'bg-indigo-500/20' },
  'azure': { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', ring: 'ring-blue-500', shadow: 'shadow-blue-500/20', glow: 'bg-blue-500/20' },
  'npm': { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', ring: 'ring-red-500', shadow: 'shadow-red-500/20', glow: 'bg-red-500/20' },
  'react': { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', ring: 'ring-cyan-500', shadow: 'shadow-cyan-500/20', glow: 'bg-cyan-500/20' },
  'supabase': { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', ring: 'ring-emerald-500', shadow: 'shadow-emerald-500/20', glow: 'bg-emerald-500/20' },
  'git': { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', ring: 'ring-orange-500', shadow: 'shadow-orange-500/20', glow: 'bg-orange-500/20' },
  'javascript': { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', ring: 'ring-yellow-500', shadow: 'shadow-yellow-500/20', glow: 'bg-yellow-500/20' },
  'python': { text: 'text-blue-300', bg: 'bg-blue-400/10', border: 'border-blue-400/30', ring: 'ring-blue-400', shadow: 'shadow-blue-400/20', glow: 'bg-blue-400/20' },
  'docker': { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', ring: 'ring-sky-500', shadow: 'shadow-sky-500/20', glow: 'bg-sky-500/20' },
  'secrets': { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', ring: 'ring-rose-500', shadow: 'shadow-rose-500/20', glow: 'bg-rose-500/20' },
  'api': { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', ring: 'ring-violet-500', shadow: 'shadow-violet-500/20', glow: 'bg-violet-500/20' },
};

const COLOR_KEYS = Object.keys(CATEGORY_COLORS);
const STORAGE_KEY_CUSTOM_COLORS = 'devvault_custom_colors';

export const getCustomColors = (): Record<string, string> => {
  const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_COLORS);
  return stored ? JSON.parse(stored) : {};
};

export const saveCustomColor = (category: string, colorKey: string) => {
  const customColors = getCustomColors();
  customColors[category.toLowerCase().trim()] = colorKey;
  localStorage.setItem(STORAGE_KEY_CUSTOM_COLORS, JSON.stringify(customColors));
};

export const getColorForCategory = (category: string) => {
  const normalized = category.toLowerCase().trim();
  
  // 1. Check custom overrides
  const customColors = getCustomColors();
  if (customColors[normalized] && CATEGORY_COLORS[customColors[normalized]]) {
    return CATEGORY_COLORS[customColors[normalized]];
  }

  // 2. Check predefined mapping
  if (CATEGORY_COLORS[normalized]) {
    return CATEGORY_COLORS[normalized];
  }

  // 3. Fallback: Pick a color based on string hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % COLOR_KEYS.length;
  return CATEGORY_COLORS[COLOR_KEYS[index]];
};
