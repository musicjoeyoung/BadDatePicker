import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
    showMonthError: boolean;
    showDayError: boolean;
    showYearError: boolean;
    errorMessage: string;
}

export default function ErrorDisplay({
    showMonthError,
    showDayError,
    showYearError,
    errorMessage
}: ErrorDisplayProps) {
    return (
        <>
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
        </>
    );
}
