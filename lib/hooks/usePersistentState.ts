'use client';

import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, initialValue: T) {
    // Initialize state from localStorage if available
    const [state, setState] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    // Update localStorage when state changes
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
            // Dispatch a custom event for same-tab sync if needed, 
            // but 'storage' event handles cross-tab.
            // For same-tab, we might need a custom event or just rely on React state.
        } catch (error) {
            console.error(error);
        }
    }, [key, state]);

    // Listen for changes from other tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setState(JSON.parse(e.newValue));
                } catch (error) {
                    console.error(error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [state, setState] as const;
}
