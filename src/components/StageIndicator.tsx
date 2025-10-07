import { Check } from 'lucide-react';

type Stage = 'month' | 'day' | 'year' | 'complete';

interface StageIndicatorProps {
    currentStage: Stage;
    birthMonth: number;
    birthDay: number;
    birthYear: number;
}

export default function StageIndicator({ currentStage, birthMonth, birthDay, birthYear }: StageIndicatorProps) {
    return (
        <div className="stage-indicator">
            <div className={`stage-step ${currentStage === 'month' ? 'active' : birthMonth > 0 ? 'completed' : ''}`}>
                {birthMonth > 0 ? <Check size={20} /> : '1'}
            </div>
            <div className="stage-line"></div>
            <div className={`stage-step ${currentStage === 'day' ? 'active' : birthDay > 0 ? 'completed' : ''}`}>
                {birthDay > 0 ? <Check size={20} /> : '2'}
            </div>
            <div className="stage-line"></div>
            <div className={`stage-step ${currentStage === 'year' ? 'active' : birthYear > 0 ? 'completed' : ''}`}>
                {birthYear > 0 ? <Check size={20} /> : '3'}
            </div>
        </div>
    );
}
