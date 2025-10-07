import { AlertCircle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1909;

interface ErrorDisplayProps {
    showMonthError: boolean;
    showDayError: boolean;
    showYearError: boolean;
    errorMessage: string;
}

const ErrorDisplay = ({
    showMonthError,
    showDayError,
    showYearError,
    errorMessage
}: ErrorDisplayProps) => {
    //console.log('ErrorDisplay received:', { showMonthError, showDayError, showYearError, errorMessage });

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
                    <div className="year-error-content">
                        <AlertCircle size={20} />
                        <span>Year must be between {MIN_YEAR} and {CURRENT_YEAR}!</span>
                    </div>
                    <a href="https://www.bbc.com/news/articles/cy5p7xv4zeyo" target="_blank" >(You are not this old.)</a>

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

export default ErrorDisplay;
