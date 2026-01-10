'use client';

import { useState } from 'react';
import { Palette, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, themes, Theme } from '@/lib/contexts/theme-context';

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
}

// Helper function to convert RGB to HSL
function rgbToHSL(r: number, g: number, b: number): string {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
}

export function ThemeSelectorEnhanced() {
    const { theme, setTheme, setCustomColor } = useTheme();
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customColorInput, setCustomColorInput] = useState('#3b82f6');
    const [colorFormat, setColorFormat] = useState<'hex' | 'rgb'>('hex');
    const [rgbValues, setRgbValues] = useState({ r: 59, g: 130, b: 246 });

    const handleCustomColor = () => {
        let hslValue: string;
        
        if (colorFormat === 'hex') {
            hslValue = hexToHSL(customColorInput);
        } else {
            hslValue = rgbToHSL(rgbValues.r, rgbValues.g, rgbValues.b);
        }
        
        setCustomColor(hslValue);
        setTheme('custom');
        setShowCustomInput(false);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Palette className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="max-h-96 overflow-y-auto">
                    {Object.entries(themes).filter(([key]) => key !== 'custom').map(([key, value]) => (
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
                                        borderColor: `hsl(${value.colors.ring})`
                                    }}
                                />
                                <span>{value.name}</span>
                            </div>
                            {theme === key && <Check className="h-4 w-4" />}
                        </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    
                    {!showCustomInput ? (
                        <DropdownMenuItem
                            onClick={() => setShowCustomInput(true)}
                            className="flex items-center gap-3 cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Custom Color</span>
                        </DropdownMenuItem>
                    ) : (
                        <div className="p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                                <Button
                                    variant={colorFormat === 'hex' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setColorFormat('hex')}
                                    className="flex-1"
                                >
                                    HEX
                                </Button>
                                <Button
                                    variant={colorFormat === 'rgb' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setColorFormat('rgb')}
                                    className="flex-1"
                                >
                                    RGB
                                </Button>
                            </div>
                            
                            {colorFormat === 'hex' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="hex-input">Hex Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="hex-input"
                                            type="text"
                                            placeholder="#3b82f6"
                                            value={customColorInput}
                                            onChange={(e) => setCustomColorInput(e.target.value)}
                                            className="flex-1"
                                        />
                                        <div 
                                            className="w-10 h-10 rounded border-2"
                                            style={{ backgroundColor: customColorInput }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>RGB Values</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label htmlFor="r-input" className="text-xs">R</Label>
                                            <Input
                                                id="r-input"
                                                type="number"
                                                min="0"
                                                max="255"
                                                value={rgbValues.r}
                                                onChange={(e) => setRgbValues({...rgbValues, r: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="g-input" className="text-xs">G</Label>
                                            <Input
                                                id="g-input"
                                                type="number"
                                                min="0"
                                                max="255"
                                                value={rgbValues.g}
                                                onChange={(e) => setRgbValues({...rgbValues, g: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="b-input" className="text-xs">B</Label>
                                            <Input
                                                id="b-input"
                                                type="number"
                                                min="0"
                                                max="255"
                                                value={rgbValues.b}
                                                onChange={(e) => setRgbValues({...rgbValues, b: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                    </div>
                                    <div 
                                        className="w-full h-10 rounded border-2"
                                        style={{ backgroundColor: `rgb(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b})` }}
                                    />
                                </div>
                            )}
                            
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleCustomColor}
                                    className="flex-1"
                                >
                                    Apply
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCustomInput(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
