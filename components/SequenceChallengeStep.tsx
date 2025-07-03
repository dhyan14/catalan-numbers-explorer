/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: string[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

const generateSequence = (size: number) => {
    const half = Array(size).fill('R');
    const otherHalf = Array(size).fill('U');
    return shuffleArray([...half, ...otherHalf]);
}

const SequenceChallengeStep = () => {
    const GRID_SIZE = 5;
    const [targetSequence, setTargetSequence] = useState<string[]>([]);
    const [path, setPath] = useState<{ x: number; y: number }[]>([{ x: 0, y: 0 }]);
    const [message, setMessage] = useState("Draw the path for the sequence above.");
    const [messageClass, setMessageClass] = useState('');
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    const lastPoint = path[path.length - 1];
    const isPathComplete = path.length === GRID_SIZE * 2 + 1;

    const userSequence = useMemo(() => {
        if (path.length <= 1) return [];
        const moves = [];
        for (let i = 1; i < path.length; i++) {
            moves.push(path[i].x > path[i - 1].x ? 'R' : 'U');
        }
        return moves;
    }, [path]);

    const handleNewChallenge = () => {
        setTargetSequence(generateSequence(GRID_SIZE));
        setPath([{ x: 0, y: 0 }]);
        setMessage("Draw the path for the new sequence.");
        setMessageClass('');
    };
    
    // Initialize challenge on mount
    useEffect(handleNewChallenge, []);

    const handleDotClick = (x: number, y: number) => {
        if (isPathComplete) return;
        const isAdjacent = (x === lastPoint.x + 1 && y === lastPoint.y) || (x === lastPoint.x && y === lastPoint.y + 1);
        if (!isAdjacent) return;

        const newPath = [...path, { x, y }];
        setPath(newPath);
        
        if (newPath.length === GRID_SIZE * 2 + 1) {
            setMessage("Path complete! Click 'Validate' to check your answer.");
            setMessageClass('');
        } else {
            setMessage("Keep going...");
        }
        setMousePos(null);
    };

    const handleValidate = () => {
        const isCorrect = JSON.stringify(userSequence) === JSON.stringify(targetSequence);
        if (isCorrect) {
            setMessage("Correct! You've masterfully translated the sequence.");
            setMessageClass('success');
        } else {
            setMessage("Not quite right. The path doesn't match the sequence. Try again!");
            setMessageClass('failure');
        }
    };

    const SVG_SIZE = 300;
    const PADDING = 20;
    const CELL_SIZE = (SVG_SIZE - 2 * PADDING) / GRID_SIZE;
    const toSvgCoord = (p: { x: number; y: number }) => ({
        x: PADDING + p.x * CELL_SIZE,
        y: PADDING + (GRID_SIZE - p.y) * CELL_SIZE
    });
    const pathData = path.map(toSvgCoord).map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (isPathComplete || !svgRef.current) return;
        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const screenCTM = svgRef.current.getScreenCTM();
        if (screenCTM) {
            setMousePos(svgPoint.matrixTransform(screenCTM.inverse()));
        }
    };
    const handleMouseLeave = () => setMousePos(null);

    return (
        <div className="puzzle-content fade-in">
            <h2>Challenge: Recreate the Path</h2>
            <p>You've seen how paths create sequences. Now, do the reverse! Draw the path that matches this target sequence.</p>

            <div className="target-sequence-container">
                <h3>Target Sequence</h3>
                <div className="target-sequence-display">
                    {targetSequence.join(' ')}
                </div>
            </div>

            <div className="dyck-path-container">
                <svg ref={svgRef} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="dyck-grid-interactive" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                    <path d={pathData} className="user-path" />
                    {mousePos && !isPathComplete && (
                        <line x1={toSvgCoord(lastPoint).x} y1={toSvgCoord(lastPoint).y} x2={mousePos.x} y2={mousePos.y} className="preview-path" />
                    )}
                    {Array.from({ length: GRID_SIZE + 1 }).map((_, y_idx) =>
                        Array.from({ length: GRID_SIZE + 1 }).map((_, x_idx) => {
                            const p = { x: x_idx, y: y_idx };
                            const svgP = toSvgCoord(p);
                            const isPathPoint = path.some(pt => pt.x === p.x && pt.y === p.y);
                            const isValidMove = !isPathComplete && ((p.x === lastPoint.x + 1 && p.y === lastPoint.y) || (p.x === lastPoint.x && p.y === lastPoint.y + 1));
                            return <circle key={`${x_idx}-${y_idx}`} cx={svgP.x} cy={svgP.y} r={isValidMove ? 8 : 5} onClick={() => handleDotClick(p.x, p.y)} className={`grid-dot ${isPathPoint ? 'active' : ''} ${isValidMove ? 'valid-move' : ''}`} />;
                        })
                    )}
                </svg>
            </div>

            <div className="challenge-controls">
                <p className={`status-message ${messageClass}`}>{message}</p>
                <button onClick={handleValidate} className="nav-button" disabled={!isPathComplete}>Validate</button>
                <button onClick={handleNewChallenge} className="nav-button small">New Challenge</button>
            </div>
        </div>
    );
};

export default SequenceChallengeStep;