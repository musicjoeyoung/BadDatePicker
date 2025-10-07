import { Check } from 'lucide-react';

interface CompletionScreenProps {
    birthMonth: number;
    birthDay: number;
    birthYear: number;
    onSubmit: () => void;
}

const CompletionScreen = ({ birthMonth, birthDay, birthYear, onSubmit }: CompletionScreenProps) => {
    const today = new Date();
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    const getAgeMessage = (age: number): string => {
        if (age >= 1 && age <= 3) {
            return `You're ${age} years old?! Are you a BABY?! Where are your adults?? HOW did you do this many jumping jacks?! That's impressive and incredibly troubling!! (...amazing job.)`;
        } else if (age >= 4 && age <= 10) {
            return `You're ${age}?! This is insane, but I guess little ones have infinite energy. I hope you're enrolled in some sort of sports. (...great job.)`;
        } else if (age >= 11 && age <= 18) {
            return `We get it, you're ${age} and you do sports in school. I'm sure you can repeat this again right now. (please don't) (...great job.)`;
        } else if (age >= 19 && age <= 38) {
            return `You're ${age}, so this is the last time your body will allow you to have done this many jumping jacks. Cherish it now because your body will become frail and weak as you walk into the valley of the shadow of death and simply sitting down will hurt. Best of luck. (...good job.)`;
        } else if (age >= 39 && age <= 55) {
            return `Ah yes, you're ${age}. I hope you take multivitamins. Now that you've successfully logged your birth date, go ice your legs. (...good job.)`;
        } else if (age >= 56 && age <= 80) {
            return `At the age of ${age}?? You know what, heck yes. Well done. No notes. (except for go drink a protein shake now, probably.) (...great job.)`;
        } else if (age >= 81 && age <= 90) {
            return `Seriously?? ${age} years old?? STOP. (...amazing job.)`;
        } else if (age >= 91 && age <= 100) {
            return `What are we doing. You're ${age} years old. I applaud you but maybe don't. I'm not liable for any injuries, btw. (...great job.)`;
        } else if (age >= 101 && age <= 105) {
            return `You know at the age of ${age} you've earned the right to not have even done this at all. (...great job.)`;
        } else if (age >= 106) {
            return `I simply don't believe you. ${age} years old? No. (...great job.)`;
        } else {
            return `Age ${age}? Interesting... (...great job.)`;
        }
    };

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
            <p className="age-message">{getAgeMessage(age)}</p>
            <button onClick={onSubmit} className="submit-button">
                Submit Birthday
            </button>
        </div>
    );
}

export default CompletionScreen;
