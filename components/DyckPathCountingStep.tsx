/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';

type Point = { x: number; y: number };
type Path = Point[];

const N_SIZE = 5;
// The grid is N_SIZE wide (x=0 to 5) and N_SIZE+1 high (y=0 to 6) for reflection demo.
const GRID_WIDTH_CELLS = N_SIZE;
const GRID_HEIGHT_CELLS = N_SIZE + 1;


const DyckPathCountingStep = () => {
    const [viewState, setViewState] = useState<'initial' | 'drawing' | 'drawn' | 'reflected' | 'visualizing'>('initial');
    const [path, setPath] = useState<Point[]>([{ x: 0, y: 0 }]);
    const [reflectedPathData, setReflectedPathData] = useState('');
    const [message, setMessage] = useState("We'll use a trick to count 'bad' paths. First, we need a bigger canvas for our demonstration.");
    const [messageClass, setMessageClass] = useState('');

    const svgRef = useRef<SVGSVGElement | null>(null);
    const [mousePos, setMousePos] = useState<Point | null>(null);
    
    // State for visualization animation
    const [isAnimating, setIsAnimating] = useState(false);
    const [visualizationStatus, setVisualizationStatus] = useState("Get ready...");
    const [currentPathIndex, setCurrentPathIndex] = useState(-1);
    const [replayKey, setReplayKey] = useState(0);
    const pathCounterRef = useRef(0);
    const animationTimeoutRef = useRef<number | null>(null);

    const lastPoint = path[path.length - 1];
    const isComplete = lastPoint.x === N_SIZE && lastPoint.y === N_SIZE;

    const SVG_SIZE = 300;
    const MIN_PADDING = 20;

    // Base cell size on the larger dimension (height) to fit inside the drawing area
    const CELL_SIZE = (SVG_SIZE - 2 * MIN_PADDING) / GRID_HEIGHT_CELLS; 

    const gridPixelWidth = GRID_WIDTH_CELLS * CELL_SIZE;
    const gridPixelHeight = GRID_HEIGHT_CELLS * CELL_SIZE;

    // Calculate padding needed to center the non-square grid within the SVG container
    const horizontalPadding = (SVG_SIZE - gridPixelWidth) / 2;
    const verticalPadding = (SVG_SIZE - gridPixelHeight) / 2;
    
    const toSvgCoord = (p: Point) => ({
        x: horizontalPadding + p.x * CELL_SIZE,
        y: verticalPadding + (GRID_HEIGHT_CELLS - p.y) * CELL_SIZE,
    });
    
    const pathData = path.map(toSvgCoord).map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');

    const allBadPaths = useMemo(() => {
        if (viewState !== 'visualizing') return [];
        const paths: Path[] = [];
        const generate = (currentPath: Path) => {
            const lastPoint = currentPath[currentPath.length - 1];
            if (lastPoint.x === N_SIZE && lastPoint.y === N_SIZE) {
                if (currentPath.some(p => p.y > p.x)) {
                    paths.push(currentPath);
                }
                return;
            }
            if (lastPoint.x < N_SIZE) generate([...currentPath, { x: lastPoint.x + 1, y: lastPoint.y }]);
            if (lastPoint.y < N_SIZE) generate([...currentPath, { x: lastPoint.x, y: lastPoint.y + 1 }]);
        };
        generate([{ x: 0, y: 0 }]);
        return paths;
    }, [viewState]);
    
    const getReflectedPath = (badPath: Path): Path => {
        const reflectionIndex = badPath.findIndex(p => p.y === p.x + 1);
        if (reflectionIndex === -1) {
            return badPath; // Should not happen for a "bad" path
        }
        const partToKeep = badPath.slice(0, reflectionIndex);
        const partToReflect = badPath.slice(reflectionIndex);
        const reflectedPart = partToReflect.map(p => ({ x: p.y - 1, y: p.x + 1 }));
        return [...partToKeep, ...reflectedPart];
    };

    // Countdown and setup for visualization
    useEffect(() => {
        if (viewState === 'visualizing') {
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
    }, [viewState, replayKey]);

    // Animation scheduler
    useEffect(() => {
        if (!isAnimating || !allBadPaths.length) {
            return;
        }
        
        const totalPaths = allBadPaths.length;

        const showNextPath = (index: number) => {
            if (index >= totalPaths) {
                setIsAnimating(false);
                setVisualizationStatus("Done!");
                setCurrentPathIndex(totalPaths - 1); // Keep last path visible
                return;
            }

            setCurrentPathIndex(index);
            pathCounterRef.current = index + 1;
            
            const progress = totalPaths > 1 ? index / (totalPaths - 1) : 1;
            const minDelay = 10;
            const maxDelay = 100;
            const speedFactor = Math.sin(progress * Math.PI);
            const delay = maxDelay - (maxDelay - minDelay) * speedFactor;

            animationTimeoutRef.current = window.setTimeout(() => {
                showNextPath(index + 1);
            }, delay);
        };

        showNextPath(0);

        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, [isAnimating, allBadPaths]);

    const handleExtendGrid = () => {
        setViewState('drawing');
        setMessage(`Draw a path from (0,0) to (${N_SIZE},${N_SIZE}) that goes above the main diagonal.`);
        setMessageClass('');
    };

    const handleReset = () => {
        setPath([{ x: 0, y: 0 }]);
        setReflectedPathData('');
        setViewState('drawing');
        setMessage(`Draw a 'bad' path from (0,0) to (${N_SIZE},${N_SIZE}) that goes above the main diagonal.`);
        setMessageClass('');
    };

    const handleDotClick = (x: number, y: number) => {
        if (viewState !== 'drawing' || isComplete) return;

        if (x > N_SIZE || y > N_SIZE) return;

        const isAdjacent = (x === lastPoint.x + 1 && y === lastPoint.y) || (x === lastPoint.x && y === lastPoint.y + 1);
        if (!isAdjacent) return;

        const newPath = [...path, { x, y }];
        setPath(newPath);
        setMousePos(null);

        const newPathIsComplete = x === N_SIZE && y === N_SIZE;
        if (newPathIsComplete) {
            const newPathIsBad = newPath.some(p => p.y > p.x);
            if (newPathIsBad) {
                setViewState('drawn');
                setMessage('Excellent! A "bad" path. Now, let\'s see the magic.');
                setMessageClass('success');
            } else {
                setMessage("That's a valid Dyck path! For this step, we need a 'bad' one. Try again.");
                setMessageClass('failure');
                setTimeout(() => {
                    setPath([{ x: 0, y: 0 }]);
                    setMessage(`Draw a 'bad' path from (0,0) to (${N_SIZE},${N_SIZE}) that goes above the main diagonal.`);
                    setMessageClass('');
                }, 2500);
            }
        } else {
            setMessage('Keep going...');
            setMessageClass('');
        }
    };

    const handleReflect = () => {
        const reflected = getReflectedPath(path);
        // Compare by reference. If it returns the same path, it failed.
        if (reflected === path) {
             setMessage("Path must touch the y = x + 1 line to be reflected this way. Try drawing a path higher up.");
            setMessageClass('failure');
            return;
        }
        
        const finalPathData = reflected.map(toSvgCoord).map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');
        
        setReflectedPathData(finalPathData);
        setViewState('reflected');
        setMessage(`The path is reflected! Every 'bad' path to (${N_SIZE},${N_SIZE}) uniquely maps to a path to (${N_SIZE - 1},${N_SIZE + 1}).`);
        setMessageClass('success');
    };
    
    const handleVisualizeBadPaths = () => {
        setViewState('visualizing');
    };

    const handleReplayAnimation = () => {
        setReplayKey(key => key + 1);
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (viewState !== 'drawing' || isComplete || !svgRef.current) return;
        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const screenCTM = svgRef.current.getScreenCTM();
        if (screenCTM) {
            setMousePos(svgPoint.matrixTransform(screenCTM.inverse()));
        }
    };
    const handleMouseLeave = () => setMousePos(null);

    const mainDiagonal = { p1: toSvgCoord({x: 0, y: 0}), p2: toSvgCoord({x: N_SIZE, y: N_SIZE}) };
    const reflectionDiagonal = { p1: toSvgCoord({x: 0, y: 1}), p2: toSvgCoord({x: GRID_WIDTH_CELLS, y: GRID_HEIGHT_CELLS}) };

    const renderVisualizingView = () => {
        const toPathData = (path: Path) => path.map(toSvgCoord).map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');

        const isFinished = visualizationStatus === "Done!";
        const currentBadPath = currentPathIndex > -1 && currentPathIndex < allBadPaths.length ? allBadPaths[currentPathIndex] : null;
        
        const currentBadPathData = currentBadPath ? toPathData(currentBadPath) : '';
        const currentReflectedPathData = currentBadPath ? toPathData(getReflectedPath(currentBadPath)) : '';

        const count = pathCounterRef.current;

        return (
            <div className="calculation-display fade-in">
                <p>Visualizing all {allBadPaths.length} 'bad' paths and their reflections.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#ff9800', opacity: 0.5 }}>― Bad Path</span>
                    <span style={{ color: '#4caf50' }}>― Reflected Path</span>
                </div>
                <div className="visualization-status">
                    {isFinished ? <span className="success">Done!</span> : visualizationStatus}
                </div>
                <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="visualization-grid">
                    {/* Diagonals */}
                    <line x1={mainDiagonal.p1.x} y1={mainDiagonal.p1.y} x2={mainDiagonal.p2.x} y2={mainDiagonal.p2.y} className="diagonal-line" />
                    <line x1={reflectionDiagonal.p1.x} y1={reflectionDiagonal.p1.y} x2={reflectionDiagonal.p2.x} y2={reflectionDiagonal.p2.y} className="reflection-line" />

                    {/* Grid Dots */}
                    {Array.from({ length: GRID_HEIGHT_CELLS + 1 }).map((_, y_idx) =>
                        Array.from({ length: GRID_WIDTH_CELLS + 1 }).map((_, x_idx) => {
                            const p = { x: x_idx, y: y_idx };
                            const isExtended = p.y > N_SIZE;
                            return (
                                <circle key={`${x_idx}-${y_idx}`} cx={toSvgCoord(p).x} cy={toSvgCoord(p).y} r={5} className={`grid-dot ${isExtended ? 'extended-dot' : ''}`} />
                            );
                        })
                    )}
                    
                    {/* Paths */}
                    {currentBadPathData && <path key={`${currentPathIndex}-bad`} d={currentBadPathData} className="user-path faded" />}
                    {currentReflectedPathData && <path key={`${currentPathIndex}-reflected`} d={currentReflectedPathData} className="reflected-path" />}
                </svg>
                <div className="path-counter">{count > 0 ? count : ''}</div>
                <button onClick={handleReplayAnimation} className="nav-button small" style={{ marginBottom: '1rem' }}>
                    Replay
                </button>
            </div>
        );
    };

    const renderDrawingView = () => (
        <>
            <div className="dyck-path-container">
                <svg ref={svgRef} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="dyck-grid-interactive" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                    <line x1={mainDiagonal.p1.x} y1={mainDiagonal.p1.y} x2={mainDiagonal.p2.x} y2={mainDiagonal.p2.y} className="diagonal-line" />
                    {viewState === 'drawn' || viewState === 'reflected' ? (
                        <line x1={reflectionDiagonal.p1.x} y1={reflectionDiagonal.p1.y} x2={reflectionDiagonal.p2.x} y2={reflectionDiagonal.p2.y} className="reflection-line" />
                    ) : null}

                    <path d={pathData} className={`user-path ${viewState === 'reflected' ? 'faded' : ''}`} />
                    {reflectedPathData && <path d={reflectedPathData} className="reflected-path" />}

                    {mousePos && viewState === 'drawing' && !isComplete && (
                        <line x1={toSvgCoord(lastPoint).x} y1={toSvgCoord(lastPoint).y} x2={mousePos.x} y2={mousePos.y} className="preview-path" />
                    )}

                    {Array.from({ length: GRID_HEIGHT_CELLS + 1 }).map((_, y_idx) =>
                        Array.from({ length: GRID_WIDTH_CELLS + 1 }).map((_, x_idx) => {
                            const p = { x: x_idx, y: y_idx };
                            const isPathPoint = path.some(pt => pt.x === p.x && pt.y === p.y);
                            const isValidMove = viewState === 'drawing' && !isComplete && ((p.x === lastPoint.x + 1 && p.y === lastPoint.y) || (p.x === lastPoint.x && p.y === lastPoint.y + 1)) && (p.x <= N_SIZE && p.y <= N_SIZE);
                            const isExtended = p.y > N_SIZE;
                            const canClick = !(p.y > N_SIZE);

                            return (
                                <circle key={`${x_idx}-${y_idx}`} cx={toSvgCoord(p).x} cy={toSvgCoord(p).y} r={isValidMove ? 8 : 5} onClick={() => canClick && handleDotClick(p.x, p.y)} className={`grid-dot ${isPathPoint ? 'active' : ''} ${isValidMove ? 'valid-move' : ''} ${isExtended ? 'extended-dot' : ''} ${!canClick ? 'not-allowed' : ''}`} />
                            );
                        })
                    )}
                </svg>
            </div>
             <div className="dyck-controls">
                <p className={`status-message ${messageClass}`}>{message}</p>
                {(viewState === 'drawing' && path.length > 1) && (
                    <button onClick={handleReset} className="nav-button small">Reset Path</button>
                )}
                {viewState === 'drawn' && (
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <button onClick={handleReflect} className="nav-button small">Reflect Path</button>
                        <button onClick={handleReset} className="nav-button small" disabled>Start Over</button>
                    </div>
                )}
                {viewState === 'reflected' && (
                     <div style={{display: 'flex', gap: '1rem'}}>
                        <button onClick={handleReset} className="nav-button small">Try Another Path</button>
                        <button onClick={handleVisualizeBadPaths} className="nav-button small">Visualize Bad Paths</button>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="puzzle-content fade-in">
            <h2>André's Reflection Principle</h2>
            
            {viewState === 'initial' && (
                 <div className="puzzle-content" style={{minHeight: '300px', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center'}}>
                    <p style={{marginBottom: '2rem'}}>Instead of counting good paths, we can subtract the 'bad' paths from the total. But how to count the bad paths? We'll use a visual trick.</p>
                    <button onClick={handleExtendGrid} className="nav-button small">Show Grid</button>
                </div>
            )}
            
            {viewState !== 'initial' && viewState !== 'visualizing' && renderDrawingView()}

            {viewState === 'visualizing' && renderVisualizingView()}
        </div>
    );
};

export default DyckPathCountingStep;
