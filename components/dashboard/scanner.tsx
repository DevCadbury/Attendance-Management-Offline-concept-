'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle } from 'lucide-react';

interface ScannerProps {
    onScan: (data: string) => void;
    active: boolean;
}

export function Scanner({ onScan, active }: ScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Check camera permission on mount
        checkCameraPermission();
        
        // Cleanup scanner on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    const checkCameraPermission = async () => {
        try {
            // Try to get camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Permission granted, stop the stream
            stream.getTracks().forEach(track => track.stop());
            setHasPermission(true);
            setPermissionError(null);
        } catch (error: any) {
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                setHasPermission(false);
                setPermissionError('Camera permission denied. Please allow camera access in your browser settings.');
            } else if (error.name === 'NotFoundError') {
                setHasPermission(false);
                setPermissionError('No camera found on this device.');
            } else {
                setHasPermission(false);
                setPermissionError('Error accessing camera: ' + error.message);
            }
        }
    };

    const requestPermission = async () => {
        await checkCameraPermission();
    };

    const startScanning = () => {
        if (hasPermission === false) {
            requestPermission();
            return;
        }
        
        setScanning(true);
        // Small delay to ensure DOM element exists
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    // Use back camera (environment) for QR scanning
                    videoConstraints: {
                        facingMode: { ideal: "environment" }
                    }
                },
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
            {hasPermission === false && permissionError && (
                <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Camera Access Required</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{permissionError}</p>
                            <Button 
                                onClick={requestPermission} 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 h-7 text-xs"
                            >
                                <Camera className="h-3 w-3 mr-1" />
                                Request Permission
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <div className="relative w-full aspect-square bg-black/5 rounded-lg overflow-hidden border-2 border-dashed border-zinc-700 flex items-center justify-center">
                {!scanning ? (
                    <div className="text-center p-6 space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center animate-pulse">
                            <Camera className="h-8 w-8 text-zinc-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {hasPermission === false ? 'Camera permission required' : 'Ready to scan QR code'}
                        </p>
                        <Button onClick={startScanning} disabled={!active}>
                            {active ? (hasPermission === false ? "Request Camera Access" : "Open Scanner") : "No Active Session"}
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
