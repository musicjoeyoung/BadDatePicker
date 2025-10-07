import { Check } from 'lucide-react';

interface CompletionScreenProps {
    birthMonth: number;
    birthDay: number;
    birthYear: number;
    onSubmit: () => void;
}

export default function CompletionScreen({ birthMonth, birthDay, birthYear, onSubmit }: CompletionScreenProps) {
    return (
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
            <button onClick={onSubmit} className="submit-button">
                Submit Birthday
            </button>
        </div>
    );
}
