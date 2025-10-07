import { useCallback, useEffect, useRef } from 'react';

import { JumpingJackDetector } from '../utils/poseDetection';
import type { RefObject } from 'react';

interface UsePoseDetectionProps {
    isDetecting: boolean;
    videoRef: RefObject<HTMLVideoElement | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    onJumpCompleted: (newCount: number) => void;
}

interface UsePoseDetectionReturn {
    detectorRef: RefObject<JumpingJackDetector | null>;
    initializePoseDetector: () => Promise<void>;
    resetDetector: () => void;
}

export function usePoseDetection({
    isDetecting,
    videoRef,
    canvasRef,
    onJumpCompleted
}: UsePoseDetectionProps): UsePoseDetectionReturn {
    const detectorRef = useRef<JumpingJackDetector | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const initializePoseDetector = async () => {
        try {
            detectorRef.current = new JumpingJackDetector();
            await detectorRef.current.initialize();
            console.log('Pose detector initialized successfully');
        } catch (error) {
            console.error('Failed to initialize pose detector:', error);
            throw error;
        }
    };

    const resetDetector = () => {
        if (detectorRef.current) {
            detectorRef.current.reset();
        }
    };

    const detectPose = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !detectorRef.current || !isDetecting) {
            return;
        }

        if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            animationFrameRef.current = requestAnimationFrame(detectPose);
            return;
        }

        let result;
        try {
            result = await detectorRef.current.detectJumpingJack(videoRef.current);
        } catch (err) {
            console.warn('Pose detection error (skipping frame):', err);
            animationFrameRef.current = requestAnimationFrame(detectPose);
            return;
        }

        if (result.completed) {
            onJumpCompleted(1);
        }

        const ctx = canvasRef.current.getContext('2d');
        if (ctx && videoRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

            if (result.valid) {
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 4;
                ctx.strokeRect(10, 10, canvasRef.current.width - 20, canvasRef.current.height - 20);
            }
        }

        animationFrameRef.current = requestAnimationFrame(detectPose);
    }, [isDetecting, onJumpCompleted, videoRef, canvasRef]);

    useEffect(() => {
        if (isDetecting) {
            detectPose();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, [isDetecting, detectPose]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (detectorRef.current) {
                detectorRef.current.dispose();
            }
        };
    }, []);

    return {
        detectorRef,
        initializePoseDetector,
        resetDetector
    };
}
