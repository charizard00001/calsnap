import { useColorScheme as useColorSchemeCore } from 'react-native';

// The OS hook can return null/undefined when no preference is available.
// CalSnap renders a fixed dark theme, so fall back to 'dark' and always
// hand callers a valid key to index the palette with.
export const useColorScheme = (): 'light' | 'dark' => useColorSchemeCore() ?? 'dark';
