/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

import IntroStep from './components/IntroStep.tsx';
import PathSequenceStep from './components/PathSequenceStep.tsx';
import SequenceChallengeStep from './components/SequenceChallengeStep.tsx';
import PathCalculationStep from './components/PathCalculationStep.tsx';
import DyckPathStep from './components/DyckPathStep.tsx';
import DyckPathCountingStep from './components/DyckPathCountingStep.tsx';
import ConclusionStep from './components/ConclusionStep.tsx';

const App = () => {
    const [step, setStep] = useState(0);
    const totalSteps = 7;

    const steps = [
        <IntroStep />,
        <PathSequenceStep />,
        <SequenceChallengeStep />,
        <PathCalculationStep />,
        <DyckPathStep />,
        <DyckPathCountingStep />,
        <ConclusionStep onRestart={() => setStep(0)} />,
    ];

    const handleNext = () => setStep(s => Math.min(s + 1, totalSteps - 1));
    const handlePrev = () => setStep(s => Math.max(s - 1, 0));

    return (
        <div>
            <h1>Catalan Numbers Explorer</h1>
            <main className="puzzle-container">
                <div className="puzzle-content-area">
                    {steps[step]}
                </div>
                <div className="nav-container">
                    <button onClick={handlePrev} disabled={step === 0} className="nav-button">Previous</button>
                    <span className="progress-indicator">Step {step + 1} of {totalSteps}</span>
                    <button onClick={handleNext} disabled={step === totalSteps - 1} className="nav-button">Next</button>
                </div>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);