import './BadDatePicker.scss';

import { AlertCircle, Camera, Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { JumpingJackDetector } from '../utils/poseDetection';

type Stage = 'month' | 'day' | 'year' | 'complete';


//const TESTING_MODE = true;
//const MIN_YEAR = TESTING_MODE ? 5 : 1909;

export default function BadDatePicker() {
    const [stage, setStage] = useState<Stage>('month');
    const [count, setCount] = useState(0);
    const [isDetecting, setIsDetecting] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showMonthError, setShowMonthError] = useState(false);
    const [showDayError, setShowDayError] = useState(false);
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
        setShowMonthError(false);
        setShowDayError(false);
        setShowYearError(false);

        if (detectorRef.current) {
            detectorRef.current.reset();
        }

        console.log('Starting detection loop');
        detectPose();
    };

    const finishDetection = () => {
        if (stage === 'month') {
            setBirthMonth(count);
            if (count < 1 || count > 12) {
                setErrorMessage('Month must be between 1 and 12!');
                setShowMonthError(true);
                return;
            }
        } else if (stage === 'day') {
            setBirthDay(count);
            if (count < 1 || count > 31) {
                setErrorMessage('Day must be between 1 and 31!');
                setShowDayError(true);
                return;
            }
        } else if (stage === 'year') {
            setBirthYear(count);
            if (count < 1909) {
                setErrorMessage(`Year must be at least 1909!`);
                setShowYearError(true);
                return;
            }
        }

        setErrorMessage('');
        setShowMonthError(false);
        setShowDayError(false);
        setShowYearError(false);

        setCount(0);

        if (detectorRef.current) {
            detectorRef.current.reset();
        }

        if (stage === 'month') {
            setStage('day');
            setShowDayError(false);
        } else if (stage === 'day') {
            setStage('year');
            setShowYearError(false);
        } else if (stage === 'year') {
            setStage('complete');
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
            setCount(prevCount => {
                const newCount = prevCount + 1;

                if (stage === 'month') {
                    if (newCount > 0 && (newCount < 1 || newCount > 12)) {
                        setShowMonthError(true);
                    } else if (newCount >= 1 && newCount <= 12) {
                        setShowMonthError(false);
                    }
                } else if (stage === 'day') {
                    if (newCount > 0 && (newCount < 1 || newCount > 31)) {
                        setShowDayError(true);
                    } else if (newCount >= 1 && newCount <= 31) {
                        setShowDayError(false);
                    }
                } else if (stage === 'year') {
                    if (newCount > 0 && newCount < 1909) {
                        setShowYearError(true);
                    } else if (newCount >= 1909) {
                        setShowYearError(false);
                    }
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
                <h2>You want to verify your birthday? You're going to sweat.</h2>
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
                            <div className="stage-buttons">
                                {!isDetecting && (
                                    <>
                                        <button
                                            onClick={startDetection}
                                            className="start-button"
                                            disabled={!cameraReady && !streamRef.current}
                                        >
                                            <Camera size={20} />
                                            Start Jumping Jack Challenge
                                        </button>
                                        <button className='force-enable-camera'
                                            onClick={() => setCameraReady(true)}
                                        >
                                            Force Enable Camera
                                        </button>
                                    </>
                                )}
                            </div>

                            {isDetecting && (
                                <>
                                    <button
                                        onClick={finishDetection}
                                        className="next-button"
                                        style={{ marginTop: 10 }}
                                        disabled={
                                            (stage === 'month' && (count < 1 || count > 12)) ||
                                            (stage === 'day' && (count < 1 || count > 31)) ||
                                            (stage === 'year' && count < 1909)
                                        }
                                    >
                                        Finish Stage
                                    </button>
                                </>
                            )}
                        </div>

                        <div className='detection-section'>
                            {isDetecting && (
                                <div className="counter-section">
                                    <div className={`counter ${showMonthError || showDayError || showYearError ? 'error' : ''}`}>
                                        <span className="counter-current">{count}</span>
                                        <span className="counter-separator"> </span>
                                        <span className="counter-target">tracked</span>
                                    </div>
                                </div>
                            )}                            <div className='birthday-display'>
                                <div>Month: <strong>{birthMonth || '-'}</strong></div>
                                <div>Day: <strong>{birthDay || '-'}</strong></div>
                                <div>Year: <strong>{birthYear || '-'}</strong></div>
                            </div>

                            {showMonthError && (
                                <div className="month-error">
                                    <AlertCircle size={20} />
                                    <span>Month must be between 1 and 12!</span>
                                </div>
                            )}

                            {showDayError && (
                                <div className="day-error">
                                    <AlertCircle size={20} />
                                    <span>Day must be between 1 and 31!</span>
                                </div>
                            )}

                            {showYearError && (
                                <div className="year-error">
                                    <AlertCircle size={20} />
                                    <span>Year must be at least 1909! Keep going...</span>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="error-message">
                                    <AlertCircle size={20} />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {(cameraReady || streamRef.current) && (
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

                        </div>
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

                <div className='debug-info' >

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
                </div>
            </div>

        </div>
    );
}
