import { Camera } from 'lucide-react';
import type { RefObject } from 'react';

type Stage = 'month' | 'day' | 'year' | 'complete';

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1909;

interface StageControlsProps {
    stage: Stage;
    isDetecting: boolean;
    count: number;
    cameraReady: boolean;
    streamRef: RefObject<MediaStream | null>;
    onStartDetection: () => void;
    onFinishDetection: () => void;
    onForceEnableCamera: () => void;
}

export default function StageControls({
    stage,
    isDetecting,
    count,
    cameraReady,
    streamRef,
    onStartDetection,
    onFinishDetection,
    onForceEnableCamera
}: StageControlsProps) {
    const getStageName = () => {
        if (stage === 'month') return 'Birth Month';
        if (stage === 'day') return 'Birth Day';
        if (stage === 'year') return 'Birth Year';
        return 'Complete';
    };

    const isFinishDisabled = () => {
        if (stage === 'month') return count < 1 || count > 12;
        if (stage === 'day') return count < 1 || count > 31;
        if (stage === 'year') return count < MIN_YEAR || count > CURRENT_YEAR;
        return false;
    };

    return (
        <div className="stage-info">
            <h2 className="stage-title">{getStageName()}</h2>
            <div className="stage-buttons">
                {!isDetecting && (
                    <>
                        <button
                            onClick={onStartDetection}
                            className="start-button"
                            disabled={!cameraReady && !streamRef.current}
                        >
                            <Camera size={20} />
                            Start Jumping Jack Challenge
                        </button>
                        <button className='force-enable-camera' onClick={onForceEnableCamera}>
                            Force Enable Camera
                        </button>
                    </>
                )}
            </div>

            {isDetecting && (
                <button
                    onClick={onFinishDetection}
                    className="next-button"
                    style={{ marginTop: 10 }}
                    disabled={isFinishDisabled()}
                >
                    Finish Stage
                </button>
            )}
        </div>
    );
}
