import './BadDatePicker.scss';

import { useCallback, useRef, useState } from 'react';

import BirthdayDisplay from './BirthdayDisplay';
import CompletionScreen from './CompletionScreen';
import ErrorDisplay from './ErrorDisplay';
import JumpCounter from './JumpCounter';
import StageControls from './StageControls';
import StageIndicator from './StageIndicator';
import VideoFeed from './VideoFeed';
import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';

type Stage = 'month' | 'day' | 'year' | 'complete';

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1909;

export default function BadDatePicker() {
    const [stage, setStage] = useState<Stage>('month');
    const [count, setCount] = useState(0);
    const [isDetecting, setIsDetecting] = useState(false);
    const [showMonthError, setShowMonthError] = useState(false);
    const [showDayError, setShowDayError] = useState(false);
    const [showYearError, setShowYearError] = useState(false);

    const [birthMonth, setBirthMonth] = useState(0);
    const [birthDay, setBirthDay] = useState(0);
    const [birthYear, setBirthYear] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const {
        videoRef,
        streamRef,
        cameraReady,
        errorMessage,
        setCameraReady,
        setErrorMessage,
        initializeCamera
    } = useCamera();

    const handleJumpCompleted = useCallback((increment: number) => {
        setCount(prevCount => {
            const newCount = prevCount + increment;

            // console.log('handleJumpCompleted:', { stage, prevCount, newCount });

            if (stage === 'month') {
                if (newCount > 0 && (newCount < 1 || newCount > 12)) {
                    // console.log('Setting showMonthError to TRUE');
                    setShowMonthError(true);
                } else if (newCount >= 1 && newCount <= 12) {
                    // console.log('Setting showMonthError to FALSE');
                    setShowMonthError(false);
                }
            } else if (stage === 'day') {
                if (newCount > 0 && (newCount < 1 || newCount > 31)) {
                    // console.log('Setting showDayError to TRUE');
                    setShowDayError(true);
                } else if (newCount >= 1 && newCount <= 31) {
                    // console.log('Setting showDayError to FALSE');
                    setShowDayError(false);
                }
            } else if (stage === 'year') {
                // console.log('Year stage check:', { newCount, willShowError: newCount > 0 && (newCount < MIN_YEAR || newCount > CURRENT_YEAR) });
                if (newCount > 0 && (newCount < MIN_YEAR || newCount > CURRENT_YEAR)) {
                    // console.log('Setting showYearError to TRUE');
                    setShowYearError(true);
                } else if (newCount >= MIN_YEAR && newCount <= CURRENT_YEAR) {
                    // console.log('Setting showYearError to FALSE');
                    setShowYearError(false);
                }
            }

            return newCount;
        });
    }, [stage]);

    const { detectorRef, initializePoseDetector, resetDetector } = usePoseDetection({
        isDetecting,
        videoRef,
        canvasRef,
        onJumpCompleted: handleJumpCompleted
    });

    useState(() => {
        initializeCamera();
        initializePoseDetector().catch(() => {
            setErrorMessage('Failed to initialize pose detection. The app may not work properly.');
        });
    });

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

        resetDetector();
        // console.log('Starting detection loop');
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
            if (count < MIN_YEAR) {
                setErrorMessage(`Year must be at least ${MIN_YEAR}!`);
                setShowYearError(true);
                return;
            }
            if (count > CURRENT_YEAR) {
                setErrorMessage(`Year cannot be greater than ${CURRENT_YEAR}!`);
                setShowYearError(true);
                return;
            }

            const birthDate = new Date(count, birthMonth - 1, birthDay);
            const today = new Date();
            if (birthDate > today) {
                setErrorMessage('Birthday cannot be in the future!');
                setShowYearError(true);
                return;
            }
        }

        setErrorMessage('');
        setShowMonthError(false);
        setShowDayError(false);
        setShowYearError(false);
        setCount(0);
        resetDetector();

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

    const handleSubmit = () => {
        const formattedDate = `${String(birthMonth).padStart(2, '0')}/${String(birthDay).padStart(2, '0')}/${birthYear}`;
        alert(`Thanks for entering your age!\n\nYour birthday: ${formattedDate}`);
    };

    return (
        <div className="bad-date-picker">
            <div className="container">
                <h1 className="title">World's Most Secure Date Picker</h1>
                <h2>You want to verify your birthday? You're going to sweat.</h2>
                <p className="subtitle">Prove you're human by doing jumping jacks for each date component</p>

                {stage !== 'complete' ? (
                    <>
                        <StageIndicator
                            currentStage={stage}
                            birthMonth={birthMonth}
                            birthDay={birthDay}
                            birthYear={birthYear}
                        />

                        <StageControls
                            stage={stage}
                            isDetecting={isDetecting}
                            count={count}
                            cameraReady={cameraReady}
                            streamRef={streamRef}
                            onStartDetection={startDetection}
                            onFinishDetection={finishDetection}
                            onForceEnableCamera={() => setCameraReady(true)}
                        />

                        <div className='detection-section'>
                            {isDetecting && (
                                <JumpCounter
                                    count={count}
                                    hasError={showMonthError || showDayError || showYearError}
                                />
                            )}

                            <BirthdayDisplay
                                birthMonth={birthMonth}
                                birthDay={birthDay}
                                birthYear={birthYear}
                            />

                            <ErrorDisplay
                                showMonthError={showMonthError}
                                showDayError={showDayError}
                                showYearError={showYearError}
                                errorMessage={errorMessage}
                            />

                            <VideoFeed
                                videoRef={videoRef}
                                canvasRef={canvasRef}
                                cameraReady={cameraReady}
                                streamRef={streamRef}
                            />
                        </div>
                    </>
                ) : (
                    <CompletionScreen
                        birthMonth={birthMonth}
                        birthDay={birthDay}
                        birthYear={birthYear}
                        onSubmit={handleSubmit}
                    />
                )}

                <div className='debug-info'>
                    <button className='force-enable-camera' onClick={() => setCameraReady(true)}>
                        Force Enable Camera
                    </button>
                    <button className='open-camera' onClick={initializeCamera}>
                        Open Camera
                    </button>

                </div>
            </div>
        </div>
    );
}
