import './BadDatePicker.scss';

import { AlertCircle, Camera, Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { JumpingJackDetector } from '../utils/poseDetection';

type Stage = 'month' | 'day' | 'year' | 'complete';

export default function BadDatePicker() {
    const [stage, setStage] = useState<Stage>('month');
    const [count, setCount] = useState(0);
    const [isDetecting, setIsDetecting] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showYearError, setShowYearError] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const detectorRef = useRef<JumpingJackDetector | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [birthMonth, setBirthMonth] = useState(0);
    const [birthDay, setBirthDay] = useState(0);
    const [birthYear, setBirthYear] = useState(0);

    useEffect(() => {
        initializeCamera();
        initializePoseDetector();

        return () => {
            cleanup();
        };
    }, []);




    useEffect(() => {
        const tryAttach = () => {
            if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
                console.log('Attaching existing media stream to video element');
                try {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.play().then(() => {
                        console.log('Video playback started after attaching stream');
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

    const initializePoseDetector = async () => {
        try {
            detectorRef.current = new JumpingJackDetector();
            await detectorRef.current.initialize();
            console.log('Pose detector initialized successfully');
        } catch (error) {
            console.error('Failed to initialize pose detector:', error);
            setErrorMessage('Failed to initialize pose detection. The app may not work properly.');
        }
    };

    const initializeCamera = async () => {
        try {
            console.log('Requesting camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            console.log('Camera access granted, stream obtained');

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraReady(true);

                const handleLoadedMetadata = () => {
                    console.log('Video metadata loaded');
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

    const cleanup = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (detectorRef.current) {
            detectorRef.current.dispose();
        }
    };

    const startDetection = () => {
        if (stage === 'complete') return;

        if (!detectorRef.current) {
            console.error('Cannot start detection: pose detector not initialized');
            setErrorMessage('Pose detector not ready. Try refreshing the page.');
            return;
        }

        // Ensure video is playing before starting detection
        if (videoRef.current && streamRef.current) {
            if (!videoRef.current.srcObject) {
                videoRef.current.srcObject = streamRef.current;
            }
            videoRef.current.play().catch(err => {
                console.warn('Failed to play video before detection:', err);
            });
        }

        setIsDetecting(true);
        setCount(0);
        setErrorMessage('');
        setShowYearError(false);

        if (detectorRef.current) {
            detectorRef.current.reset();
        }

        console.log('Starting detection loop');
        detectPose();
    };

    const finishDetection = () => {

        setIsDetecting(false);

        if (stage === 'month') {
            setBirthMonth(count);
        } else if (stage === 'day') {
            setBirthDay(count);
        } else if (stage === 'year') {
            setBirthYear(count);
            if (count < 1909) {
                setErrorMessage('Year must be at least 1909!');
                setShowYearError(true);
                return;
            }
        }

        setErrorMessage('');
        setShowYearError(false);


        if (stage === 'month') setStage('day');
        else if (stage === 'day') setStage('year');
        else if (stage === 'year') setStage('complete');
    };

    const detectPose = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !detectorRef.current || !isDetecting) {
            return;
        }

        // Check if video has actual frame data to prevent TensorFlow GPU errors
        if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            // Video not ready yet, skip this frame and try again
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
            setCount(prevCount => {
                const newCount = prevCount + 1;

                if (stage === 'year' && newCount < 1909) {
                    setShowYearError(true);
                } else {
                    setShowYearError(false);
                }

                return newCount;
            });
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
    }, [isDetecting, stage]);

    useEffect(() => {
        if (isDetecting) {
            detectPose();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, [isDetecting, detectPose]);

    const handleNext = () => {

        if (stage === 'month' && birthMonth < 1) {
            setErrorMessage('Please complete at least 1 jumping jack to set your month.');
            return;
        }
        if (stage === 'day' && birthDay < 1) {
            setErrorMessage('Please complete at least 1 jumping jack to set your day.');
            return;
        }
        if (stage === 'year' && birthYear < 1909) {
            setErrorMessage('Year must be at least 1909!');
            return;
        }

        setIsDetecting(false);
        setErrorMessage('');
        setShowYearError(false);

        if (stage === 'month') {
            setStage('day');
        } else if (stage === 'day') {
            setStage('year');
        } else if (stage === 'year') {
            setStage('complete');
        }
    };

    const handleSubmit = () => {
        const formattedDate = `${String(birthMonth).padStart(2, '0')}/${String(birthDay).padStart(2, '0')}/${birthYear}`;
        alert(`Thanks for entering your age!\n\nYour birthday: ${formattedDate}`);
    };

    const getStageName = () => {
        if (stage === 'month') return 'Birth Month';
        if (stage === 'day') return 'Birth Day';
        if (stage === 'year') return 'Birth Year';
        return 'Complete';
    };



    return (
        <div className="bad-date-picker">
            <div className="container">
                <h1 className="title">World's Most Secure Date Picker</h1>
                <p className="subtitle">Prove you're human by doing jumping jacks for each date component</p>

                {stage !== 'complete' ? (
                    <>
                        <div className="stage-indicator">
                            <div className={`stage-step ${stage === 'month' ? 'active' : birthMonth > 0 ? 'completed' : ''}`}>
                                {birthMonth > 0 ? <Check size={20} /> : '1'}
                            </div>
                            <div className="stage-line"></div>
                            <div className={`stage-step ${stage === 'day' ? 'active' : birthDay > 0 ? 'completed' : ''}`}>
                                {birthDay > 0 ? <Check size={20} /> : '2'}
                            </div>
                            <div className="stage-line"></div>
                            <div className={`stage-step ${stage === 'year' ? 'active' : birthYear > 0 ? 'completed' : ''}`}>
                                {birthYear > 0 ? <Check size={20} /> : '3'}
                            </div>
                        </div>

                        <div className="stage-info">
                            <h2 className="stage-title">{getStageName()}</h2>
                            {!isDetecting && (
                                <button
                                    onClick={startDetection}
                                    className="start-button"
                                    disabled={!cameraReady}
                                >
                                    <Camera size={20} />
                                    Start Jumping Jack Challenge
                                </button>
                            )}

                            <div className='birthday-display'>
                                <div>Month: <strong>{birthMonth || '-'}</strong></div>
                                <div>Day: <strong>{birthDay || '-'}</strong></div>
                                <div>Year: <strong>{birthYear || '-'}</strong></div>
                            </div>
                            {isDetecting && (
                                <>
                                    <p className="stage-description">Tracking jumps... {count}</p>
                                    <button
                                        onClick={finishDetection}
                                        className="next-button"
                                        style={{ marginTop: 10 }}
                                        disabled={stage === 'year' && count < 1909}
                                    >
                                        Finish Stage
                                    </button>
                                </>
                            )}
                        </div>

                        {isDetecting && (
                            <div className="counter-section">
                                <div className={`counter ${showYearError ? 'error' : ''}`}>
                                    <span className="counter-current">{count}</span>
                                    <span className="counter-separator"> </span>
                                    <span className="counter-target">tracked</span>
                                </div>
                                {showYearError && (
                                    <div className="year-error">
                                        <AlertCircle size={20} />
                                        <span>Year must be at least 1909! Keep going...</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="next-button"
                                    disabled={
                                        (stage === 'year' && birthYear < 1909) ||
                                        (stage === 'month' && birthMonth < 1) ||
                                        (stage === 'day' && birthDay < 1)
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="error-message">
                                <AlertCircle size={20} />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {cameraReady && (
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
                        )}


                    </>
                ) : (
                    <div className="complete-section">
                        <div className="success-icon">
                            <Check size={64} />
                        </div>
                        <h2 className="complete-title">Congratulations!</h2>
                        <p className="complete-subtitle">You've completed all the jumping jacks!</p>
                        <div className="date-display">
                            <span className="date-value">{String(birthMonth).padStart(2, '0')}</span>
                            <span className="date-separator">/</span>
                            <span className="date-value">{String(birthDay).padStart(2, '0')}</span>
                            <span className="date-separator">/</span>
                            <span className="date-value">{birthYear}</span>
                        </div>
                        <button onClick={handleSubmit} className="submit-button">
                            Submit Birthday
                        </button>
                    </div>
                )}
                {/* Debug info */}
                <div className='debug-info' >
                    Debug: cameraReady = {cameraReady.toString()}, isDetecting = {isDetecting.toString()}, trackedJumps = {count}
                    <br />
                    Video readyState: {videoRef.current ? videoRef.current.readyState : 'no-video'}, srcObject: {videoRef.current && videoRef.current.srcObject ? 'attached' : 'none'}
                    <br />
                    <button className='force-enable-camera'
                        onClick={() => setCameraReady(true)}
                    >
                        Force Enable Camera
                    </button>
                    <button className='open-camera'
                        onClick={async () => {
                            console.log('Open Camera debug button clicked');
                            await initializeCamera();
                        }}
                    >
                        Open Camera
                    </button>
                    <button
                        onClick={async () => {
                            if (streamRef.current && videoRef.current) {
                                try {
                                    videoRef.current.srcObject = streamRef.current;
                                    await videoRef.current.play();
                                    console.log('Manual attach & play succeeded');
                                    setCameraReady(true);
                                } catch (err) {
                                    console.error('Manual attach & play failed:', err);
                                }
                            } else {
                                console.log('No stream or video to attach');
                            }
                        }}
                        style={{ fontSize: '10px', padding: '2px 6px', marginLeft: 8 }}
                    >
                        Attach & Play
                    </button>
                </div>
            </div>

        </div>
    );
}
