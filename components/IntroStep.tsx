/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

const CATALAN_NUMBERS = [1, 1, 2, 5, 14, 42, 132];

const IntroStep = () => (
    <div className="puzzle-content fade-in">
        <h2>What are Catalan Numbers?</h2>
        <p>Catalan numbers are a sequence of natural numbers that appear in many counting problems in combinatorics.</p>
        <p>The sequence starts:</p>
        <div className="catalan-sequence">
            {CATALAN_NUMBERS.slice(0, 5).map((num, index) => (
                <span key={index} className="catalan-number" style={{ animationDelay: `${index * 0.15}s` }}>
                    {num}
                </span>
            ))}
            <span>...</span>
        </div>
        <p>Let's understand them by building them ourselves.</p>
    </div>
);

export default IntroStep;
