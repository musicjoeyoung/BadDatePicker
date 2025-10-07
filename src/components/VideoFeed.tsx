import type { RefObject } from 'react';

interface VideoFeedProps {
    videoRef: RefObject<HTMLVideoElement | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    cameraReady: boolean;
    streamRef: RefObject<MediaStream | null>;
}

export default function VideoFeed({ videoRef, canvasRef, cameraReady, streamRef }: VideoFeedProps) {
    if (!cameraReady && !streamRef.current) {
        return null;
    }

    return (
        <div className="video-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <video
                ref={videoRef}
                className="video-feed"
                autoPlay
                playsInline
                muted
                style={{ width: 640, height: 480, background: '#000', border: '2px solid #ddd' }}
            />
            {!videoRef.current || !videoRef.current.srcObject ? (
                <div style={{ color: '#999', marginTop: 10 }}>
                    Camera stream not attached to video yet.
                </div>
            ) : null}
            <canvas
                ref={canvasRef}
                className="video-canvas"
                width={640}
                height={480}
                style={{ display: 'none' }}
            />
        </div>
    );
}
