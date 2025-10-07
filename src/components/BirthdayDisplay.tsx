interface BirthdayDisplayProps {
    birthMonth: number;
    birthDay: number;
    birthYear: number;
}

export default function BirthdayDisplay({ birthMonth, birthDay, birthYear }: BirthdayDisplayProps) {
    return (
        <div className='birthday-display'>
            <div>Month: <strong>{birthMonth || '-'}</strong></div>
            <div>Day: <strong>{birthDay || '-'}</strong></div>
            <div>Year: <strong>{birthYear || '-'}</strong></div>
        </div>
    );
}
