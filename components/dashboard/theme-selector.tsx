'use client';

import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, themes, Theme } from '@/lib/contexts/theme-context';

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Palette className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(themes).map(([key, value]) => (
                    <DropdownMenuItem
                        key={key}
                        onClick={() => setTheme(key as Theme)}
                        className="flex items-center justify-between cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-4 h-4 rounded-full border-2"
                                style={{ 
                                    backgroundColor: `hsl(${value.colors.primary})`,
                                    borderColor: `hsl(${value.colors.primaryForeground})`
                                }}
                            />
                            <span>{value.name}</span>
                        </div>
                        {theme === key && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
