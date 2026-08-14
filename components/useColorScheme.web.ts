// Server-rendered styles must not change between the first HTML render and
// the first client render, so the web build pins a single scheme rather than
// reading the OS preference. CalSnap is a fixed dark theme.
export function useColorScheme(): 'light' | 'dark' {
  return 'dark';
}
