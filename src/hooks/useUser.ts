import { useTheme } from '@/lib/ThemeContext';

export function useUser() {
  const { userData, loading } = useTheme();
  return { userData, loading };
}
