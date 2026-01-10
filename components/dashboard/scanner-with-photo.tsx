'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, Scan } from 'lucide-react';

interface ScannerProps {
    onScan: (data: string, photo?: string) => void;
    active: boolean;
    requirePhoto?: boolean;
}

export function ScannerWithPhoto({ onScan, active, requirePhoto = true }: ScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [photoCapture, setPhotoCapture] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [scannedQR, setScannedQR] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startPhotoCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: 640, height: 480 } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setPhotoCapture(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please check permissions.');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const photoData = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedPhoto(photoData);
                
                // Stop video stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                setPhotoCapture(false);
            }
        }
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        startPhotoCapture();
    };

    const startScanning = () => {
        setScanning(true);
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );
            scannerRef.current = scanner;

            scanner.render(
                (decodedText) => {
                    scanner.clear().then(() => {
                        setScanning(false);
                        setScannedQR(decodedText);
                        
                        // If photo is not required or already captured, submit immediately
                        if (!requirePhoto || capturedPhoto) {
                            onScan(decodedText, capturedPhoto || undefined);
                            setCapturedPhoto(null);
                            setScannedQR(null);
                        }
                    }).catch(console.error);
                },
                (errorMessage) => {
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

    const submitAttendance = () => {
        if (scannedQR) {
            onScan(scannedQR, capturedPhoto || undefined);
            setCapturedPhoto(null);
            setScannedQR(null);
        }
    };

    // If we need both photo and QR, and have scanned QR but no photo yet
    const needsPhoto = requirePhoto && scannedQR && !capturedPhoto;

    return (
        <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-md mx-auto">
            {/* Photo Capture UI */}
            {photoCapture && (
                <div className="w-full">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-blue-500">
                        <video ref={videoRef} className="w-full h-full object-cover" />
                    </div>
                    <Button onClick={capturePhoto} className="w-full mt-4">
                        <Camera className="mr-2 h-4 w-4" /> Capture Photo
                    </Button>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}

            {/* Photo Preview */}
            {capturedPhoto && !photoCapture && (
                <div className="w-full space-y-2">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-green-500">
                        <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={retakePhoto} variant="outline" className="flex-1">
                            Retake Photo
                        </Button>
                        {scannedQR && (
                            <Button onClick={submitAttendance} className="flex-1">
                                Submit Attendance
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* QR Scanner UI */}
            {!photoCapture && !needsPhoto && (
                <div className="w-full">
                    <div className="relative w-full aspect-square bg-black/5 rounded-lg overflow-hidden border-2 border-dashed border-zinc-700 flex items-center justify-center">
                        {!scanning && !scannedQR ? (
                            <div className="text-center p-6 space-y-4">
                                <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center animate-pulse">
                                    <Scan className="h-8 w-8 text-zinc-500" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {capturedPhoto ? 'Now scan the QR code' : 'Ready to scan'}
                                </p>
                                <div className="space-y-2">
                                    {requirePhoto && !capturedPhoto && (
                                        <Button onClick={startPhotoCapture} disabled={!active} className="w-full">
                                            {active ? "📷 Take Photo First" : "No Active Session"}
                                        </Button>
                                    )}
                                    {(!requirePhoto || capturedPhoto) && (
                                        <Button onClick={startScanning} disabled={!active} className="w-full">
                                            {active ? "Scan QR Code" : "No Active Session"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : scanning ? (
                            <div id="qr-reader" className="w-full h-full"></div>
                        ) : scannedQR ? (
                            <div className="text-center p-6 space-y-4">
                                <div className="mx-auto w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                                    <span className="text-3xl">✓</span>
                                </div>
                                <p className="text-sm font-medium">QR Code Scanned!</p>
                                {requirePhoto && !capturedPhoto && (
                                    <Button onClick={startPhotoCapture} className="w-full">
                                        📷 Take Your Photo
                                    </Button>
                                )}
                            </div>
                        ) : null}

                        {scanning && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-scan-line"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {capturedPhoto && !scannedQR && !scanning && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ Photo captured! Now scan the QR code.
                </p>
            )}
        </div>
    );
}
