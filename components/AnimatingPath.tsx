/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect } from 'react';

type AnimatingPathProps = {
    pathData: string;
    duration: number;
    onComplete: () => void;
};

const AnimatingPath: React.FC<AnimatingPathProps> = ({ pathData, duration, onComplete }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const animationRef = useRef<Animation | null>(null);

    useEffect(() => {
        const pathElement = pathRef.current;
        if (!pathElement) return;

        // requestAnimationFrame ensures that the browser has completed layout and paint,
        // so getTotalLength() will return a valid value. This is crucial for paths
        // created and animated in rapid succession.
        const frameId = requestAnimationFrame(() => {
            const length = pathElement.getTotalLength();

            if (length > 0) {
                pathElement.style.strokeDasharray = `${length}`;
                pathElement.style.strokeDashoffset = `${length}`;

                animationRef.current = pathElement.animate(
                    [
                        // Draw in the path over the first 40% of the duration
                        { strokeDashoffset: length, opacity: 1 },
                        { strokeDashoffset: 0, opacity: 1, offset: 0.4 },
                        // Hold the complete path visible until 90% of the duration
                        { strokeDashoffset: 0, opacity: 1, offset: 0.9 },
                        // Fade out the path over the last 10%
                        { strokeDashoffset: 0, opacity: 0 }
                    ],
                    {
                        duration: duration,
                        easing: 'linear', // Use linear easing for predictable timing
                        fill: 'forwards'
                    }
                );

                animationRef.current.onfinish = onComplete;
            } else {
                // If length is still 0, the path is likely not visible or empty.
                // Call onComplete to prevent it from hanging around and breaking the sequence.
                onComplete();
            }
        });

        // Cleanup function
        return () => {
            cancelAnimationFrame(frameId);
            if (animationRef.current) {
                // Cancel any ongoing Web Animation
                animationRef.current.cancel();
            }
        };
    }, [pathData, duration, onComplete]);

    return <path ref={pathRef} d={pathData} className="enumerated-path" />;
};

export default AnimatingPath;