/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';

// Extend window type for KaTeX
declare global {
    interface Window {
        katex: any;
    }
}

interface ConclusionStepProps {
  onRestart: () => void;
}

const ConclusionStep: React.FC<ConclusionStepProps> = ({ onRestart }) => {
    const [subStep, setSubStep] = useState(0);
    const katexRefs = {
        badPathsGeneral: useRef<HTMLDivElement>(null),
        badPathsSpecific: useRef<HTMLDivElement>(null),
        catalanFormulaGeneral: useRef<HTMLDivElement>(null),
        catalanFormulaSpecific: useRef<HTMLDivElement>(null),
        catalanFormulaSimplified: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        const renderKatex = (ref: React.RefObject<HTMLElement>, formula: string) => {
            if (ref.current && window.katex) {
                window.katex.render(formula, ref.current, {
                    throwOnError: false,
                    displayMode: true,
                });
            }
        };

        if (subStep === 0) {
            renderKatex(katexRefs.badPathsGeneral, `\\text{Bad Paths} = \\binom{2n}{n-1}`);
            renderKatex(katexRefs.badPathsSpecific, `\\text{For } n=5: \\binom{10}{4} = \\frac{10!}{4!6!} = 210`);
        } else if (subStep === 1) {
            renderKatex(katexRefs.catalanFormulaGeneral, `C_n = \\binom{2n}{n} - \\binom{2n}{n-1}`);
            renderKatex(katexRefs.catalanFormulaSpecific, `C_5 = \\binom{10}{5} - \\binom{10}{4} = 252 - 210 = 42`);
        } else if (subStep === 2) {
            renderKatex(katexRefs.catalanFormulaSimplified, `C_n = \\frac{1}{n+1} \\binom{2n}{n}`);
        }
    }, [subStep]);

    const renderContent = () => {
        switch (subStep) {
            case 0:
                return (
                    <>
                        <h2>Counting the 'Bad' Paths</h2>
                        <p>The Reflection Principle shows that every 'bad' path from (0,0) to (n,n) corresponds to a unique path to the reflected endpoint (n-1, n+1).</p>
                        <p>A path to (n-1, n+1) requires n-1 Right moves and n+1 Up moves. The number of such paths is:</p>
                        <div ref={katexRefs.badPathsGeneral}></div>
                        <div ref={katexRefs.badPathsSpecific}></div>
                        <button onClick={() => setSubStep(1)} className="nav-button small" style={{ marginTop: '1.5rem' }}>Next</button>
                    </>
                );
            case 1:
                return (
                    <>
                        <h2>Putting It All Together</h2>
                        <p>The number of valid Dyck paths is the total paths minus the 'bad' paths:</p>
                        <p style={{textAlign: 'center', fontFamily: "'Roboto Mono', monospace"}}>
                            <code>C_n = (Total Paths) - (Bad Paths)</code>
                        </p>
                        <div ref={katexRefs.catalanFormulaGeneral}></div>
                        <p>For n=5, we get the 5th Catalan Number:</p>
                        <div ref={katexRefs.catalanFormulaSpecific}></div>
                        <button onClick={() => setSubStep(2)} className="nav-button small" style={{ marginTop: '1.5rem' }}>Derive General Formula</button>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2>The General Formula</h2>
                        <p>Through algebraic simplification, our subtraction formula transforms into the more common, compact form of the Catalan number.</p>
                        <div className="result-explanation" style={{textAlign: 'left', margin: '1.5rem auto', padding: '1rem 1.5rem'}}>
                             <p><strong>1. Expand into factorials:</strong></p>
                             <code style={{display: 'block', fontSize: '0.8rem', padding: '0.5rem', background: '#252525', borderRadius: '4px', overflowX: 'auto'}}>
                                = (2n)!/(n! n!) - (2n)!/((n-1)!(n+1)!)
                            </code>
                            <p style={{marginTop: '1rem'}}><strong>2. Combine using a common denominator:</strong></p>
                            <code style={{display: 'block', fontSize: '0.8rem', padding: '0.5rem', background: '#252525', borderRadius: '4px', overflowX: 'auto'}}>
                                = [ (n+1) - n ] * (2n)! / (n+1)! n!
                            </code>
                             <p style={{marginTop: '1rem'}}><strong>3. Simplify to the final result:</strong></p>
                             <code style={{display: 'block', fontSize: '0.8rem', padding: '0.5rem', background: '#252525', borderRadius: '4px', overflowX: 'auto'}}>
                                = (1/(n+1)) * (2n)!/(n!n!)
                            </code>
                        </div>
                        <p>This gives us the famous formula:</p>
                        <div ref={katexRefs.catalanFormulaSimplified}></div>
                        <button onClick={() => setSubStep(3)} className="nav-button small" style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>What are they used for?</button>
                    </>
                );
            case 3:
            default:
                return (
                    <>
                        <h2>Endless Applications</h2>
                        <p>We've only scratched the surface! Catalan numbers also count the number of:</p>
                        <ul>
                            <li>Full binary trees with n+1 leaves.</li>
                            <li>Ways to form a "mountain range" with n upstrokes and n downstrokes.</li>
                            <li>And many other combinatorial structures.</li>
                        </ul>
                        <button onClick={onRestart} className="nav-button small" style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Restart Explorer</button>
                    </>
                );
        }
    };

    return (
        <div className="puzzle-content fade-in">
            {renderContent()}
        </div>
    );
};

export default ConclusionStep;