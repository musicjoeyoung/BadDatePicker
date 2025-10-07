import { useEffect, useRef, useState } from 'react';

import type { RefObject } from 'react';

interface UseCameraReturn {
    videoRef: RefObject<HTMLVideoElement | null>;
    streamRef: RefObject<MediaStream | null>;
    cameraReady: boolean;
    errorMessage: string;
    setCameraReady: (ready: boolean) => void;
    setErrorMessage: (message: string) => void;
    initializeCamera: () => Promise<void>;
}

export function useCamera(): UseCameraReturn {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const initializeCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraReady(true);

                const handleLoadedMetadata = () => {
                    videoRef.current?.play().catch((error) => {
                        console.error('Error starting video playback:', error);
                    });
                };

                videoRef.current.onloadedmetadata = handleLoadedMetadata;
            }
        } catch (error: unknown) {
            console.error('Camera access error:', error);
            setErrorMessage('Camera access denied. Please allow camera access to use this date picker.');
        }
    };

    useEffect(() => {
        const tryAttach = () => {
            if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
                try {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.play().then(() => {
                    }).catch(err => {
                        console.error('Error starting playback after attaching stream:', err);
                    });
                    setCameraReady(true);
                    return true;
                } catch (err) {
                    console.error('Failed to attach stream to video element:', err);
                }
            }
            return false;
        };

        if (tryAttach()) return;

        const interval = setInterval(() => {
            if (tryAttach()) {
                clearInterval(interval);
            }
        }, 300);

        const timeout = setTimeout(() => clearInterval(interval), 10000);
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return {
        videoRef,
        streamRef,
        cameraReady,
        errorMessage,
        setCameraReady,
        setErrorMessage,
        initializeCamera
    };
}
