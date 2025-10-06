import { useEffect, useRef, useState } from 'react';
import { JumpingJackDetector } from '../utils/poseDetection';
import { AlertCircle, Camera, Check } from 'lucide-react';
import './BadDatePicker.scss';

type Stage = 'month' | 'day' | 'year' | 'complete';

export default function BadDatePicker() {
    const [stage, setStage] = useState<Stage>('month');
    const [count, setCount] = useState(0);
    const [targetCount, setTargetCount] = useState(0);
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
        detectorRef.current = new JumpingJackDetector();
        detectorRef.current.initialize();

        return () => {
            cleanup();
        };
    }, []);

    const initializeCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setCameraReady(true);
                };
            }
        } catch (error) {
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

        setIsDetecting(true);
        setCount(0);
        setErrorMessage('');
        setShowYearError(false);

        if (stage === 'month') {
            const randomMonth = Math.floor(Math.random() * 12) + 1;
            setTargetCount(randomMonth);
            setBirthMonth(randomMonth);
        } else if (stage === 'day') {
            const randomDay = Math.floor(Math.random() * 31) + 1;
            setTargetCount(randomDay);
            setBirthDay(randomDay);
        } else if (stage === 'year') {
            const randomYear = Math.floor(Math.random() * (2024 - 1909 + 1)) + 1909;
            setTargetCount(randomYear);
            setBirthYear(randomYear);
        }

        if (detectorRef.current) {
            detectorRef.current.reset();
        }

        detectPose();
    };

    const detectPose = async () => {
        if (!videoRef.current || !canvasRef.current || !detectorRef.current || !isDetecting) {
            return;
        }

        const result = await detectorRef.current.detectJumpingJack(videoRef.current);

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
    };

    useEffect(() => {
        if (isDetecting) {
            detectPose();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, [isDetecting]);

    const handleNext = () => {
        if (count < targetCount) {
            setErrorMessage(`You need to complete ${targetCount} jumping jacks first!`);
            return;
        }

        if (stage === 'year' && count < 1909) {
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

    const getStageDescription = () => {
        if (stage === 'month') return `Do ${targetCount} jumping jacks to select month ${targetCount}`;
        if (stage === 'day') return `Do ${targetCount} jumping jacks to select day ${targetCount}`;
        if (stage === 'year') return `Do ${targetCount} jumping jacks to select year ${targetCount}`;
        return '';
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
                            {!isDetecting && targetCount === 0 && (
                                <button onClick={startDetection} className="start-button" disabled={!cameraReady}>
                                    <Camera size={20} />
                                    Start Jumping Jack Challenge
                                </button>
                            )}
                            {isDetecting && (
                                <p className="stage-description">{getStageDescription()}</p>
                            )}
                        </div>

                        {cameraReady && (
                            <div className="video-container">
                                <video
                                    ref={videoRef}
                                    className="video-feed"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="video-canvas"
                                    width={640}
                                    height={480}
                                />
                            </div>
                        )}

                        {isDetecting && (
                            <div className="counter-section">
                                <div className={`counter ${showYearError ? 'error' : ''}`}>
                                    <span className="counter-current">{count}</span>
                                    <span className="counter-separator">/</span>
                                    <span className="counter-target">{targetCount}</span>
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
                                    disabled={count < targetCount || (stage === 'year' && count < 1909)}
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
            </div>
        </div>
    );
}
