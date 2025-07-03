/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';

type Point = { x: number; y: number };
type Path = Point[];
type ViewMode = 'question' | 'result' | 'visualizing';

// Extend window type for KaTeX
declare global {
    interface Window {
        katex: any;
    }
}

const PathCalculationStep = () => {
    const GRID_SIZE = 5; // n=5 grid
    const [viewMode, setViewMode] = useState<ViewMode>('question');
    const [userGuess, setUserGuess] = useState('');
    const [guessResult, setGuessResult] = useState('');
    const [guessResultClass, setGuessResultClass] = useState('');
    
    const [isAnimating, setIsAnimating] = useState(false);
    const [visualizationStatus, setVisualizationStatus] = useState("Get ready...");
    const [currentPathIndex, setCurrentPathIndex] = useState(-1);
    const [replayKey, setReplayKey] = useState(0); // For replaying animation

    const pathCounterRef = useRef(0);
    const formulaRef = useRef<HTMLSpanElement>(null);
    const animationTimeoutRef = useRef<number | null>(null);

    const factorial = (n: number): bigint => (n <= 1 ? 1n : BigInt(n) * factorial(n - 1));
    
    const correctAnswer = useMemo(() => {
        const n = GRID_SIZE;
        return Number(factorial(2 * n) / (factorial(n) * factorial(n)));
    }, [GRID_SIZE]);

    const allPaths = useMemo(() => {
        // Only generate paths when the visualization view is active.
        if (viewMode !== 'visualizing') return [];
        const paths: Path[] = [];
        const generate = (currentPath: Path) => {
            const lastPoint = currentPath[currentPath.length - 1];
            if (lastPoint.x === GRID_SIZE && lastPoint.y === GRID_SIZE) {
                paths.push(currentPath);
                return;
            }
            if (lastPoint.x < GRID_SIZE) generate([...currentPath, { x: lastPoint.x + 1, y: lastPoint.y }]);
            if (lastPoint.y < GRID_SIZE) generate([...currentPath, { x: lastPoint.x, y: lastPoint.y + 1 }]);
        };
        generate([{ x: 0, y: 0 }]);
        return paths;
    }, [GRID_SIZE, viewMode]);
    
    useEffect(() => {
        if (viewMode === 'result' && formulaRef.current && window.katex) {
            const n = GRID_SIZE;
            const formula = `\\binom{2n}{n} = \\frac{(2n)!}{n!n!} = \\binom{${2*n}}{${n}} = ${correctAnswer}`;
            window.katex.render(formula, formulaRef.current, { throwOnError: false, displayMode: true });
        }
    }, [viewMode, correctAnswer, GRID_SIZE]);

    // Animation scheduler
    useEffect(() => {
        if (!isAnimating || !allPaths.length) {
            return;
        }
        
        const totalPaths = allPaths.length;

        const showNextPath = (index: number) => {
            if (index >= totalPaths) {
                setIsAnimating(false);
                setVisualizationStatus("Done!");
                setCurrentPathIndex(totalPaths - 1); // Keep last path visible
                return;
            }

            setCurrentPathIndex(index);
            pathCounterRef.current = index + 1;
            
            // Calculate dynamic delay for ease-in/ease-out effect
            const progress = totalPaths > 1 ? index / (totalPaths - 1) : 1;
            const minDelay = 20; // ms for fastest speed in the middle
            const maxDelay = 150; // ms for slowest speed at start/end
        
            // A sine curve provides a smooth transition from slow to fast and back to slow.
            const speedFactor = Math.sin(progress * Math.PI);
            const delay = maxDelay - (maxDelay - minDelay) * speedFactor;

            animationTimeoutRef.current = setTimeout(() => {
                showNextPath(index + 1);
            }, delay);
        };

        showNextPath(0);

        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, [isAnimating, allPaths]);

    // Countdown and setup for visualization
    useEffect(() => {
        if (viewMode === 'visualizing') {
            setIsAnimating(false);
            setCurrentPathIndex(-1);
            pathCounterRef.current = 0;
            setVisualizationStatus("Get ready...");

            const timers = [
                setTimeout(() => setVisualizationStatus("3"), 1000),
                setTimeout(() => setVisualizationStatus("2"), 2000),
                setTimeout(() => setVisualizationStatus("1"), 3000),
                setTimeout(() => {
                    setVisualizationStatus("Counting...");
                    setIsAnimating(true);
                }, 4000)
            ];
            return () => {
                timers.forEach(clearTimeout);
                if (animationTimeoutRef.current) {
                    clearTimeout(animationTimeoutRef.current);
                }
            };
        }
    }, [viewMode, replayKey]); // Rerun this effect on replay
    
    const handleReveal = () => {
        const guessNumber = parseInt(userGuess, 10);
        if (isNaN(guessNumber)) {
            setGuessResult('Please enter a valid number.');
            setGuessResultClass('failure');
        } else if (guessNumber === correctAnswer) {
            setGuessResult(`Correct! Your guess of ${guessNumber} is spot on.`);
            setGuessResultClass('success');
        } else {
            setGuessResult(`Not quite. Your guess was ${guessNumber}. The correct answer is ${correctAnswer}.`);
            setGuessResultClass('failure');
        }
        setViewMode('result');
    };
    
    const handleReplay = () => {
        setReplayKey(key => key + 1);
    };

    const SVG_SIZE = 300;
    const PADDING = 20;
    const CELL_SIZE = (SVG_SIZE - 2 * PADDING) / GRID_SIZE;
    const toSvgCoord = (p: Point) => ({ x: PADDING + p.x * CELL_SIZE, y: PADDING + (GRID_SIZE - p.y) * CELL_SIZE });
    const toPathData = (path: Path) => path.map(toSvgCoord).map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');

    const renderQuestionView = () => (
        <>
            <p>You've seen how paths are formed. Now for the big question: how many unique paths exist on a <strong>{GRID_SIZE}x{GRID_SIZE}</strong> grid?</p>
            <div className="guess-container">
                 <input type="number" value={userGuess} onChange={e => setUserGuess(e.target.value)} placeholder="Enter your guess" className="guess-input" onKeyDown={e => e.key === 'Enter' && handleReveal()} />
                <button onClick={handleReveal} className="nav-button">Reveal the Answer</button>
            </div>
        </>
    );

    const renderResultView = () => (
         <div className="result-view fade-in">
             <div className={`guess-result ${guessResultClass}`}>{guessResult}</div>
             <div className="result-explanation">
                <p>For an <code>n x n</code> grid, any path from the bottom-left to the top-right must consist of exactly <code>n</code> 'Right' moves and <code>n</code> 'Up' moves. This gives us a total of <code>2n</code> moves.</p>
                <p>The problem then becomes: out of <code>2n</code> total moves, how many ways can we <strong>choose</strong> <code>n</code> of them to be 'Up' moves? This is a classic combination problem, solved with the binomial coefficient "2n choose n":</p>
                <span ref={formulaRef}></span>
            </div>
            <button onClick={() => setViewMode('visualizing')} className="nav-button visualize-button">See All {correctAnswer} Paths</button>
        </div>
    );

    const renderVisualizingView = () => {
        const isFinished = visualizationStatus === "Done!";
        const currentPath = currentPathIndex > -1 && currentPathIndex < allPaths.length ? allPaths[currentPathIndex] : null;
        const currentPathData = currentPath ? toPathData(currentPath) : '';
        const count = pathCounterRef.current;

        return (
            <div className="calculation-display fade-in">
                <div className="visualization-status">
                    {isFinished ? <span className="success">Done!</span> : visualizationStatus}
                </div>
                <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="visualization-grid">
                    {Array.from({ length: GRID_SIZE + 1 }).map((_, y_idx) => Array.from({ length: GRID_SIZE + 1 }).map((_, x_idx) => <circle key={`${x_idx}-${y_idx}`} cx={toSvgCoord({x:x_idx,y:y_idx}).x} cy={toSvgCoord({x:x_idx,y:y_idx}).y} r={5} className="grid-dot" />))}
                    
                    {currentPathData && (
                        <path
                            key={currentPathIndex}
                            d={currentPathData}
                            className="enumerated-path"
                        />
                    )}
                </svg>
                <div className="path-counter">{count > 0 ? count : ''}</div>
                <button
                    onClick={handleReplay}
                    className="nav-button small"
                    style={{ marginBottom: '1rem' }}
                >
                    Replay
                </button>
            </div>
        );
    };

    return (
        <div className="puzzle-content fade-in">
            <h2>Counting the Paths</h2>
            {viewMode === 'question' && renderQuestionView()}
            {viewMode === 'result' && renderResultView()}
            {viewMode === 'visualizing' && renderVisualizingView()}
        </div>
    );
};

export default PathCalculationStep;