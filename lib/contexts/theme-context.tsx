'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink' | 'teal' | 'amber' | 'indigo' | 'custom';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    setCustomColor: (primaryColor: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = {
    default: {
        name: 'Default Dark',
        colors: {
            background: '224 71% 4%',
            foreground: '213 31% 91%',
            card: '224 71% 4%',
            cardForeground: '213 31% 91%',
            popover: '224 71% 4%',
            popoverForeground: '213 31% 91%',
            primary: '210 40% 98%',
            primaryForeground: '222.2 47.4% 11.2%',
            secondary: '217.2 32.6% 17.5%',
            secondaryForeground: '210 40% 98%',
            muted: '217.2 32.6% 17.5%',
            mutedForeground: '215 20.2% 65.1%',
            accent: '217.2 32.6% 17.5%',
            accentForeground: '210 40% 98%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            border: '217.2 32.6% 17.5%',
            input: '217.2 32.6% 17.5%',
            ring: '212.7 26.8% 83.9%',
        }
    },
    blue: {
        name: 'Ocean Blue',
        colors: {
            background: '222 47% 11%',
            foreground: '210 40% 98%',
            card: '222 47% 11%',
            cardForeground: '210 40% 98%',
            popover: '222 47% 11%',
            popoverForeground: '210 40% 98%',
            primary: '217 91% 60%',
            primaryForeground: '222 47% 11%',
            secondary: '217 32.6% 17.5%',
            secondaryForeground: '210 40% 98%',
            muted: '217 32.6% 17.5%',
            mutedForeground: '215 20.2% 65.1%',
            accent: '217 91% 60%',
            accentForeground: '222 47% 11%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            border: '217 32.6% 17.5%',
            input: '217 32.6% 17.5%',
            ring: '217 91% 60%',
        }
    },
    green: {
        name: 'Forest Green',
        colors: {
            background: '140 40% 8%',
            foreground: '138 62% 96%',
            card: '140 40% 8%',
            cardForeground: '138 62% 96%',
            popover: '140 40% 8%',
            popoverForeground: '138 62% 96%',
            primary: '142 71% 45%',
            primaryForeground: '140 40% 8%',
            secondary: '140 20% 15%',
            secondaryForeground: '138 62% 96%',
            muted: '140 20% 15%',
            mutedForeground: '138 40% 65%',
            accent: '142 71% 45%',
            accentForeground: '140 40% 8%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '138 62% 96%',
            border: '140 20% 15%',
            input: '140 20% 15%',
            ring: '142 71% 45%',
        }
    },
    purple: {
        name: 'Royal Purple',
        colors: {
            background: '265 50% 8%',
            foreground: '270 60% 96%',
            card: '265 50% 8%',
            cardForeground: '270 60% 96%',
            popover: '265 50% 8%',
            popoverForeground: '270 60% 96%',
            primary: '263 70% 60%',
            primaryForeground: '265 50% 8%',
            secondary: '265 30% 15%',
            secondaryForeground: '270 60% 96%',
            muted: '265 30% 15%',
            mutedForeground: '270 40% 65%',
            accent: '263 70% 60%',
            accentForeground: '265 50% 8%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '270 60% 96%',
            border: '265 30% 15%',
            input: '265 30% 15%',
            ring: '263 70% 60%',
        }
    },
    orange: {
        name: 'Sunset Orange',
        colors: {
            background: '20 60% 8%',
            foreground: '33 100% 96%',
            card: '20 60% 8%',
            cardForeground: '33 100% 96%',
            popover: '20 60% 8%',
            popoverForeground: '33 100% 96%',
            primary: '25 95% 55%',
            primaryForeground: '20 60% 8%',
            secondary: '20 30% 15%',
            secondaryForeground: '33 100% 96%',
            muted: '20 30% 15%',
            mutedForeground: '33 60% 65%',
            accent: '25 95% 55%',
            accentForeground: '20 60% 8%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '33 100% 96%',
            border: '20 30% 15%',
            input: '20 30% 15%',
            ring: '25 95% 55%',
        }
    },
    red: {
        name: 'Crimson Red',
        colors: {
            background: '0 40% 8%',
            foreground: '0 85% 96%',
            card: '0 40% 8%',
            cardForeground: '0 85% 96%',
            popover: '0 40% 8%',
            popoverForeground: '0 85% 96%',
            primary: '0 72% 55%',
            primaryForeground: '0 40% 8%',
            secondary: '0 25% 15%',
            secondaryForeground: '0 85% 96%',
            muted: '0 25% 15%',
            mutedForeground: '0 50% 65%',
            accent: '0 72% 55%',
            accentForeground: '0 40% 8%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '0 85% 96%',
            border: '0 25% 15%',
            input: '0 25% 15%',
            ring: '0 72% 55%',
        }
    },
    pink: {
        name: 'Rose Pink',
        colors: {
            background: '330 40% 8%',
            foreground: '330 85% 96%',
            card: '330 40% 8%',
            cardForeground: '330 85% 96%',
            popover: '330 40% 8%',
            popoverForeground: '330 85% 96%',
            primary: '330 81% 60%',
            primaryForeground: '330 40% 8%',
            secondary: '330 25% 15%',
            secondaryForeground: '330 85% 96%',
            muted: '330 25% 15%',
            mutedForeground: '330 50% 65%',
            accent: '330 81% 60%',
            accentForeground: '330 40% 8%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '330 85% 96%',
            border: '330 25% 15%',
            input: '330 25% 15%',
            ring: '330 81% 60%',
        }
    },
    teal: {
        name: 'Ocean Teal',
        colors: {
            background: '180 45% 8%',
            foreground: '180 70% 96%',
            card: '180 45% 8%',
            cardForeground: '180 70% 96%',
            popover: '180 45% 8%',
            popoverForeground: '180 70% 96%',
            primary: '180 77% 45%',
            primaryForeground: '180 45% 8%',
            secondary: '180 25% 15%',
            secondaryForeground: '180 70% 96%',
            muted: '180 25% 15%',
            mutedForeground: '180 45% 65%',
            accent: '180 77% 45%',
            accentForeground: '180 45% 8%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '180 70% 96%',
            border: '180 25% 15%',
            input: '180 25% 15%',
            ring: '180 77% 45%',
        }
    },
    amber: {
        name: 'Golden Amber',
        colors: {
            background: '45 45% 8%',
            foreground: '45 85% 96%',
            card: '45 45% 8%',
            cardForeground: '45 85% 96%',
            popover: '45 45% 8%',
            popoverForeground: '45 85% 96%',
            primary: '45 93% 53%',
            primaryForeground: '45 45% 8%',
            secondary: '45 25% 15%',
            secondaryForeground: '45 85% 96%',
            muted: '45 25% 15%',
            mutedForeground: '45 50% 65%',
            accent: '45 93% 53%',
            accentForeground: '45 45% 8%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '45 85% 96%',
            border: '45 25% 15%',
            input: '45 25% 15%',
            ring: '45 93% 53%',
        }
    },
    indigo: {
        name: 'Deep Indigo',
        colors: {
            background: '240 50% 8%',
            foreground: '240 70% 96%',
            card: '240 50% 8%',
            cardForeground: '240 70% 96%',
            popover: '240 50% 8%',
            popoverForeground: '240 70% 96%',
            primary: '240 78% 60%',
            primaryForeground: '240 50% 8%',
            secondary: '240 30% 15%',
            secondaryForeground: '240 70% 96%',
            muted: '240 30% 15%',
            mutedForeground: '240 45% 65%',
            accent: '240 78% 60%',
            accentForeground: '240 50% 8%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '240 70% 96%',
            border: '240 30% 15%',
            input: '240 30% 15%',
            ring: '240 78% 60%',
        }
    },
    custom: {
        name: 'Custom',
        colors: {
            background: '224 71% 4%',
            foreground: '213 31% 91%',
            card: '224 71% 4%',
            cardForeground: '213 31% 91%',
            popover: '224 71% 4%',
            popoverForeground: '213 31% 91%',
            primary: '210 40% 98%',
            primaryForeground: '222.2 47.4% 11.2%',
            secondary: '217.2 32.6% 17.5%',
            secondaryForeground: '210 40% 98%',
            muted: '217.2 32.6% 17.5%',
            mutedForeground: '215 20.2% 65.1%',
            accent: '217.2 32.6% 17.5%',
            accentForeground: '210 40% 98%',
            destructive: '0 62.8% 30.6%',
            destructiveForeground: '210 40% 98%',
            border: '217.2 32.6% 17.5%',
            input: '217.2 32.6% 17.5%',
            ring: '212.7 26.8% 83.9%',
        }
    }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('default');

    useEffect(() => {
        // Load theme from localStorage on mount
        const savedTheme = localStorage.getItem('app-theme') as Theme;
        if (savedTheme && themes[savedTheme]) {
            setThemeState(savedTheme);
            applyTheme(savedTheme);
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('app-theme', newTheme);
        applyTheme(newTheme);
    };

    const applyTheme = (themeName: Theme) => {
        const root = document.documentElement;
        const themeColors = themes[themeName].colors;

        // Apply all color variables
        Object.entries(themeColors).forEach(([key, value]) => {
            // Convert camelCase to kebab-case (e.g., primaryForeground -> primary-foreground)
            const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(`--${cssVarName}`, value);
        });
    };

    const setCustomColor = (primaryColor: string) => {
        // Update custom theme with new primary color
        const customTheme = { ...themes.custom };
        customTheme.colors.primary = primaryColor;
        
        // Calculate complementary colors
        const [h, s, l] = primaryColor.split(' ').map(v => parseFloat(v));
        customTheme.colors.accent = primaryColor;
        customTheme.colors.ring = primaryColor;
        
        // Save to localStorage
        localStorage.setItem('custom-primary-color', primaryColor);
        
        // Apply immediately
        const root = document.documentElement;
        root.style.setProperty('--primary', primaryColor);
        root.style.setProperty('--accent', primaryColor);
        root.style.setProperty('--ring', primaryColor);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, setCustomColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
