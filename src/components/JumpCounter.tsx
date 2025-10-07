interface JumpCounterProps {
    count: number;
    hasError: boolean;
}

export default function JumpCounter({ count, hasError }: JumpCounterProps) {
    return (
        <div className="counter-section">
            <div className={`counter ${hasError ? 'error' : ''}`}>
                <span className="counter-current">{count}</span>
                <span className="counter-separator"> </span>
                <span className="counter-target">tracked</span>
            </div>
        </div>
    );
}
