import { useTheme } from '@/context/ThemeContext';
import { themeColors } from '@/config/themeColors';

/**
 * Hook customizado para obter as cores do tema Tailwind com base no tema atual (claro/escuro).
 */
export const useThemeColors = () => {
    const { theme } = useTheme();

    return {
        primary: themeColors.primary.DEFAULT,
        secondary: themeColors.secondary.DEFAULT,
        foreground: theme === 'dark' ? themeColors['dark-foreground'] : themeColors.foreground,
        border: theme === 'dark' ? themeColors['dark-border-default'] : themeColors['border-default'],
    };
};