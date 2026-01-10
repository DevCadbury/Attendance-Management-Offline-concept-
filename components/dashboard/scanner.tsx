'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';

interface ScannerProps {
    onScan: (data: string) => void;
    active: boolean;
}

export function Scanner({ onScan, active }: ScannerProps) {
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Cleanup scanner on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    const startScanning = () => {
        setScanning(true);
        // Small delay to ensure DOM element exists
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
            );
            scannerRef.current = scanner;

            scanner.render(
                (decodedText) => {
                    scanner.clear().then(() => {
                        setScanning(false);
                        onScan(decodedText);
                    }).catch(console.error);
                },
                (errorMessage) => {
                    // parse error, ignore it.
                    // "NotFoundException" is thrown when no QR code is found in the frame (very common)
                    // "No MultiFormat Readers" is also common when initializing or between frames
                    if (
                        errorMessage.includes("NotFoundException") ||
                        errorMessage.includes("No MultiFormat Readers")
                    ) {
                        return;
                    }
                    console.log(errorMessage);
                }
            );
        }, 100);
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-md mx-auto">
            <div className="relative w-full aspect-square bg-black/5 rounded-lg overflow-hidden border-2 border-dashed border-zinc-700 flex items-center justify-center">
                {!scanning ? (
                    <div className="text-center p-6 space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center animate-pulse">
                            <div className="h-8 w-8 text-zinc-500">📷</div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Ready to scan.
                        </p>
                        <Button onClick={startScanning} disabled={!active}>
                            {active ? "Open Scanner" : "No Active Session"}
                        </Button>
                    </div>
                ) : (
                    <div id="reader" className="w-full h-full"></div>
                )}

                {/* Scan line animation overlay */}
                {scanning && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-scan-line"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
