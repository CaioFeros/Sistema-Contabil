import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react'; // Ícones para o botão

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-background text-muted hover:bg-border-default dark:bg-dark-background dark:text-dark-muted dark:hover:bg-dark-border-default transition-colors"
            aria-label="Alternar tema"
        >
            {theme === 'light' ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </button>
    );
}

export default ThemeToggle;