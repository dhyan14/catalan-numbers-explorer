/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useRef } from 'react';

const PathSequenceStep = () => {
    const GRID_SIZE = 5; // n=5
    const getInitialState = () => ({
        path: [{ x: 0, y: 0 }],
        message: "Click an adjacent dot to move Up or Right.",
        messageClass: ''
    });

    const [state, setState] = useState(getInitialState());
    const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    const { path, message, messageClass } = state;
    const lastPoint = path[path.length - 1];
    const isComplete = lastPoint.x === GRID_SIZE && lastPoint.y === GRID_SIZE;

    const sequence = useMemo(() => {
        if (path.length <= 1) return [];
        const moves = [];
        for (let i = 1; i < path.length; i++) {
            if (path[i].x > path[i - 1].x) {
                moves.push('R');
            } else {
                moves.push('U');
            }
        }
        return moves;
    }, [path]);

    const handleReset = () => {
        setState(getInitialState());
    };

    const handleDotClick = (x: number, y: number) => {
        if (isComplete) return;

        const isAdjacent = (x === lastPoint.x + 1 && y === lastPoint.y) || (x === lastPoint.x && y === lastPoint.y + 1);
        if (!isAdjacent) return;

        const newPath = [...path, { x, y }];
        let newMessage = 'Keep going!';
        let newMessageClass = '';

        if (x === GRID_SIZE && y === GRID_SIZE) {
            newMessage = `Path Complete! You made ${GRID_SIZE} 'U' and ${GRID_SIZE} 'R' moves.`;
            newMessageClass = 'success';
        }
        
        setState({ path: newPath, message: newMessage, messageClass: newMessageClass });
        setMousePos(null); // Hide preview line after click
    };

    const SVG_SIZE = 300;
    const PADDING = 20;
    const CELL_SIZE = (SVG_SIZE - 2 * PADDING) / GRID_SIZE;

    const toSvgCoord = (p: {x: number, y: number}) => ({
        x: PADDING + p.x * CELL_SIZE,
        y: PADDING + (GRID_SIZE - p.y) * CELL_SIZE
    });
    
    const pathData = path.map(toSvgCoord).map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (isComplete || !svgRef.current) return;
        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const screenCTM = svgRef.current.getScreenCTM();
        if (screenCTM) {
            const transformedPoint = svgPoint.matrixTransform(screenCTM.inverse());
            setMousePos(transformedPoint);
        }
    };

    const handleMouseLeave = () => {
        setMousePos(null);
    };

    return (
        <div className="puzzle-content fade-in">
            <h2>From Paths to Sequences</h2>
            <p>Any path from the bottom-left to top-right on a {GRID_SIZE}x{GRID_SIZE} grid must use exactly {GRID_SIZE} 'Up' (U) and {GRID_SIZE} 'Right' (R) moves.</p>
            <p>This means every path has a unique corresponding sequence. Draw a path to see this in action!</p>
            
            <div className="dyck-path-container">
                <svg 
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} 
                    className="dyck-grid-interactive"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* User Path */}
                    <path d={pathData} className="user-path" />

                    {/* Preview Line */}
                    {mousePos && !isComplete && (
                        <line
                            x1={toSvgCoord(lastPoint).x}
                            y1={toSvgCoord(lastPoint).y}
                            x2={mousePos.x}
                            y2={mousePos.y}
                            className="preview-path"
                        />
                    )}

                    {/* Grid Dots */}
                    {Array.from({ length: GRID_SIZE + 1 }).map((_, y_idx) => 
                        Array.from({ length: GRID_SIZE + 1 }).map((_, x_idx) => {
                            const p = {x: x_idx, y: y_idx};
                            const svgP = toSvgCoord(p);
                            const isPathPoint = path.some(pt => pt.x === p.x && pt.y === p.y);
                            const isValidMove = !isComplete && ((p.x === lastPoint.x + 1 && p.y === lastPoint.y) || (p.x === lastPoint.x && p.y === lastPoint.y + 1));

                            return (
                                <circle 
                                    key={`${x_idx}-${y_idx}`}
                                    cx={svgP.x} 
                                    cy={svgP.y}
                                    r={isValidMove ? 8 : 5}
                                    onClick={() => handleDotClick(p.x, p.y)}
                                    className={`grid-dot ${isPathPoint ? 'active' : ''} ${isValidMove ? 'valid-move' : ''}`}
                                />
                            );
                        })
                    )}
                </svg>
            </div>
             <div className="path-sequence-container">
                <h3>Your Path's Sequence</h3>
                <div className="path-sequence-display">
                    {sequence.length > 0 ? sequence.join(' ') : '...'}
                </div>
            </div>
             <div className="dyck-controls">
                <p className={`status-message ${messageClass}`}>{message}</p>
                <button onClick={handleReset} className="nav-button small">Reset</button>
            </div>
        </div>
    );
};

export default PathSequenceStep;
