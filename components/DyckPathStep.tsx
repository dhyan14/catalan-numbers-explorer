/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useRef } from 'react';

const DyckPathStep = () => {
    const GRID_SIZE = 5;
    const getInitialState = () => ({
        path: [{ x: 0, y: 0 }],
        message: "Draw a path that never goes above the main diagonal.",
        messageClass: '',
        isPathValid: true,
    });

    const [state, setState] = useState(getInitialState());
    const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    const { path, message, messageClass, isPathValid } = state;
    const lastPoint = path[path.length - 1];
    const isComplete = lastPoint.x === GRID_SIZE && lastPoint.y === GRID_SIZE;

    const handleReset = () => {
        setState(getInitialState());
    };

    const handleDotClick = (x: number, y: number) => {
        if (isComplete && isPathValid) return;

        // Allow moving even if path is complete but invalid, so user can correct it
        if (isComplete && !isPathValid && (path.length > 1)) {
            // Effectively a reset on the next click if the invalid path is finished
            handleReset();
            return;
        }

        const isAdjacent = (x === lastPoint.x + 1 && y === lastPoint.y) || (x === lastPoint.x && y === lastPoint.y + 1);
        if (!isAdjacent) return;

        const newPath = [...path, { x, y }];
        const pathIsValid = newPath.every(p => p.y <= p.x);

        let newMessage;
        let newMessageClass;

        if (!pathIsValid) {
            newMessage = "Invalid path! A Dyck path cannot cross above the diagonal.";
            newMessageClass = 'failure';
        } else if (x === GRID_SIZE && y === GRID_SIZE) {
            newMessage = `Congratulations! You drew a valid Dyck path.`;
            newMessageClass = 'success';
        } else {
            newMessage = "Good! Stay on or below the diagonal.";
            newMessageClass = '';
        }
        
        setState({ path: newPath, message: newMessage, messageClass: newMessageClass, isPathValid: pathIsValid });
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
        if ((isComplete && isPathValid) || !svgRef.current) return;
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

    const p1Diagonal = toSvgCoord({x: 0, y: 0});
    const p2Diagonal = toSvgCoord({x: GRID_SIZE, y: GRID_SIZE});

    return (
        <div className="puzzle-content fade-in">
            <h2>The Diagonal Constraint</h2>
            <p>
                A special path, called a <strong>Dyck Path</strong>, never goes above the main diagonal.
            </p>
            <p>
                Try to draw a complete path that is valid. These are the paths that Catalan numbers truly count.
            </p>
            
            <div className="dyck-path-container">
                <svg 
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} 
                    className="dyck-grid-interactive"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Diagonal Line */}
                    <line x1={p1Diagonal.x} y1={p1Diagonal.y} x2={p2Diagonal.x} y2={p2Diagonal.y} className="diagonal-line" />

                    {/* User Path */}
                    <path d={pathData} className={`user-path ${isPathValid ? '' : 'invalid'}`} />

                    {/* Preview Line */}
                    {mousePos && !(isComplete && isPathValid) && (
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
                            const isValidMove = !(isComplete && isPathValid) && ((p.x === lastPoint.x + 1 && p.y === lastPoint.y) || (p.x === lastPoint.x && p.y === lastPoint.y + 1));

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
             <div className="dyck-controls">
                <p className={`status-message ${messageClass}`}>{message}</p>
                <button onClick={handleReset} className="nav-button small">Reset</button>
            </div>
        </div>
    );
};

export default DyckPathStep;