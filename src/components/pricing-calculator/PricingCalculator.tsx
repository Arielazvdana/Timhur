import { useState, useCallback, useMemo } from "react";

const MEETING_OPTIONS = [
    { label: "פגישה חודשית", value: "monthly", factor: 5 },
    { label: "פגישה רבעונית", value: "quarterly", factor: 4 },
    { label: "פגישה חצי שנתית", value: "semi-annual", factor: 3 },
    { label: "פגישה שנתית", value: "annual", factor: 2 },
    { label: "ללא פגישות", value: "none", factor: 1 },
];

const COMPLEXITY_OPTIONS = [
    { label: "תיק מורכב מאוד", value: "very-complex", factor: 4 },
    { label: "תיק מורכב", value: "complex", factor: 3 },
    { label: "תיק רגיל", value: "regular", factor: 2 },
    { label: "תיק בסיסי", value: "basic", factor: 1 },
];

const BASE_PRICE = 45;

interface ProposalItem {
    id: number;
    meetingLabel: string;
    complexityLabel: string;
    price: number;
}

function PricingCalculator() {
    const [meetingIndex, setMeetingIndex] = useState(4); // ללא פגישות
    const [complexityIndex, setComplexityIndex] = useState(1); // תיק מורכב
    const [proposals, setProposals] = useState<ProposalItem[]>([]);

    const selectedMeeting = MEETING_OPTIONS[meetingIndex];
    const selectedComplexity = COMPLEXITY_OPTIONS[complexityIndex];

    const monthlyPrice = useMemo(() => {
        return BASE_PRICE * selectedMeeting.factor * selectedComplexity.factor;
    }, [selectedMeeting, selectedComplexity]);

    const serviceSummary = useMemo(() => {
        return `לתיק ${selectedComplexity.label} ${selectedMeeting.label === "ללא פגישות" ? "ללא פגישות" : "עם " + selectedMeeting.label}`;
    }, [selectedMeeting, selectedComplexity]);

    const handleAddToProposal = useCallback(() => {
        const newItem: ProposalItem = {
            id: Date.now(),
            meetingLabel: selectedMeeting.label,
            complexityLabel: selectedComplexity.label,
            price: monthlyPrice,
        };
        setProposals((prev) => [...prev, newItem]);
    }, [selectedMeeting, selectedComplexity, monthlyPrice]);

    const handleRemoveProposal = useCallback((id: number) => {
        setProposals((prev) => prev.filter((item) => item.id !== id));
    }, []);

    return (
        <div className="pricing-calculator">
            {/* סוג הליווי */}
            <div className="pricing-card">
                <div className="card-header">
                    <h3 className="card-title">סוג הליווי</h3>
                    <span className="card-value">{selectedMeeting.label}</span>
                </div>
                <div className="slider-container">
                    <input
                        type="range"
                        min={0}
                        max={MEETING_OPTIONS.length - 1}
                        value={meetingIndex}
                        onChange={(e) => setMeetingIndex(Number(e.target.value))}
                        className="pricing-slider"
                        style={{
                            "--slider-progress": `${(meetingIndex / (MEETING_OPTIONS.length - 1)) * 100}%`,
                        } as React.CSSProperties}
                    />
                    <div className="slider-labels">
                        {MEETING_OPTIONS.map((option, index) => (
                            <button
                                key={option.value}
                                className={`slider-label ${index === meetingIndex ? "active" : ""}`}
                                onClick={() => setMeetingIndex(index)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* מורכבות התיק */}
            <div className="pricing-card">
                <div className="card-header">
                    <h3 className="card-title">מורכבות התיק</h3>
                    <span className="card-value">{selectedComplexity.label}</span>
                </div>
                <div className="slider-container">
                    <input
                        type="range"
                        min={0}
                        max={COMPLEXITY_OPTIONS.length - 1}
                        value={complexityIndex}
                        onChange={(e) => setComplexityIndex(Number(e.target.value))}
                        className="pricing-slider"
                        style={{
                            "--slider-progress": `${(complexityIndex / (COMPLEXITY_OPTIONS.length - 1)) * 100}%`,
                        } as React.CSSProperties}
                    />
                    <div className="slider-labels">
                        {COMPLEXITY_OPTIONS.map((option, index) => (
                            <button
                                key={option.value}
                                className={`slider-label ${index === complexityIndex ? "active" : ""}`}
                                onClick={() => setComplexityIndex(index)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ליווי מתמשך + עלות חודשית */}
            <div className="pricing-summary-row">
                <div className="pricing-card summary-card">
                    <h3 className="card-title">ליווי מתמשך</h3>
                    <p className="service-summary">{serviceSummary}</p>
                </div>
                <div className="pricing-card cost-card">
                    <div className="cost-header">
                        <h3 className="card-title">העלות החודשית</h3>
                        <span className="vat-note">כולל מעמ</span>
                    </div>
                    <div className="cost-value">
                        <span className="price-amount">{monthlyPrice}</span>
                        <span className="price-currency">₪</span>
                    </div>
                    <button className="add-to-proposal-btn" onClick={handleAddToProposal}>
                        הוספה להצעה +
                    </button>
                </div>
            </div>

            {/* ההצעה לליווי המתמשך */}
            <div className="pricing-card proposal-card">
                <h3 className="card-title">ההצעה לליווי המתמשך</h3>
                {proposals.length === 0 ? (
                    <div className="proposal-empty">
                        <p>לחץ על כפתור ההוספה כדי ליצור אפשרויות לבחירה.</p>
                    </div>
                ) : (
                    <div className="proposal-list">
                        {proposals.map((item) => (
                            <div key={item.id} className="proposal-item">
                                <button
                                    className="proposal-remove-btn"
                                    onClick={() => handleRemoveProposal(item.id)}
                                >
                                    ✕
                                </button>
                                <div className="proposal-item-details">
                                    <span className="proposal-item-desc">
                                        {item.complexityLabel} {item.meetingLabel === "ללא פגישות" ? "ללא פגישות" : "עם " + item.meetingLabel}
                                    </span>
                                    <span className="proposal-item-price">₪{item.price}</span>
                                </div>
                            </div>
                        ))}
                        <div className="proposal-total">
                            <span>סה״כ חודשי:</span>
                            <span className="proposal-total-price">
                                ₪{proposals.reduce((sum, item) => sum + item.price, 0)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PricingCalculator;
