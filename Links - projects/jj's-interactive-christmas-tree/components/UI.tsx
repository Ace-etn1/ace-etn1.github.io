import React, { useEffect, useRef, useState } from 'react';
import { TreeState, VisionState } from '../types';
import { initializeHandLandmarker, detectGesture } from '../services/gestureService';

interface UIProps {
    treeState: TreeState;
    setTreeState: (state: TreeState) => void;
}

export const UI: React.FC<UIProps> = ({ treeState, setTreeState }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const requestRef = useRef<number>(0);
    const consecutiveClosedRef = useRef<number>(0);
    
    // Track what the camera actually sees (for UI feedback)
    const [gestureStatus, setGestureStatus] = useState<'OPEN' | 'CLOSED' | 'NONE'>('NONE');

    const [visionState, setVisionState] = useState<VisionState>({
        isConnected: false,
        isStreaming: false,
        error: null,
        detectedState: TreeState.COLLAPSED
    });

    useEffect(() => {
        let isActive = true;

        const startVision = async () => {
            if (!videoRef.current) return;

            setVisionState(prev => ({ ...prev, error: null }));

            // 1. Initialize MediaPipe
            const initSuccess = await initializeHandLandmarker();
            if (!initSuccess) {
                setVisionState(prev => ({ ...prev, error: "Failed to load hand tracking model" }));
                return;
            }
            if (!isActive) return;

            // 2. Setup Camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 480, frameRate: 30 } 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setVisionState(prev => ({ ...prev, isConnected: true, isStreaming: true }));
                    
                    // 3. Start Detection Loop
                    startLoop();
                }
            } catch (err: any) {
                console.error("Camera Error", err);
                setVisionState(prev => ({ ...prev, error: "Camera access denied" }));
            }
        };

        const startLoop = () => {
            const loop = () => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                    const { isOpen, isDetected } = detectGesture(videoRef.current);

                    // 1. UI Feedback Logic
                    if (!isDetected) {
                        setGestureStatus('NONE');
                    } else {
                        setGestureStatus(isOpen ? 'OPEN' : 'CLOSED');
                    }

                    // 2. Tree Control Logic
                    if (isDetected) {
                        if (isOpen) {
                            // Instant expand on open palm
                            setTreeState(TreeState.EXPANDED);
                            consecutiveClosedRef.current = 0;
                        } else {
                            // Delay collapse to prevent flickering
                            consecutiveClosedRef.current++;
                            if (consecutiveClosedRef.current > 5) {
                                setTreeState(TreeState.COLLAPSED);
                            }
                        }
                    } else {
                         // No hand detected -> Assume Closed (with small buffer for glitches)
                         consecutiveClosedRef.current++;
                         if (consecutiveClosedRef.current > 5) {
                             setTreeState(TreeState.COLLAPSED);
                         }
                    }
                }
                requestRef.current = requestAnimationFrame(loop);
            };
            loop();
        };

        startVision();

        return () => {
            isActive = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
            }
        };
    }, [setTreeState]);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
            {/* Header */}
            <header className="flex flex-col items-center transition-opacity duration-1000">
                <h1 className="text-4xl md:text-6xl text-[#FFFDD0] font-serif tracking-widest text-center drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" style={{ fontFamily: '"Cinzel", serif' }}>
                    Magical Christmas Tree
                </h1>
            </header>

            {/* MESSAGE OVERLAY (CENTERED) */}
             <div 
                className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-2000 ease-in-out ${treeState === TreeState.EXPANDED ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-90 blur-xl'}`}
            >
                <div className="text-center p-8 bg-black/20 backdrop-blur-sm rounded-3xl border border-[#FFD700]/10">
                    <p className="text-[#FFFDD0] text-xl md:text-3xl font-serif italic mb-4 drop-shadow-md">
                        Wishing you and your loved ones
                    </p>
                    <h2 
                        className="text-5xl md:text-8xl font-bold text-[#FFD700] mb-6 drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]"
                        style={{ fontFamily: '"Cinzel", serif' }}
                    >
                        Merry Christmas
                    </h2>
                    <p className="text-[#FFFDD0] text-xl md:text-3xl font-serif italic drop-shadow-md">
                        & Happy New Year!
                    </p>
                </div>
            </div>

            {/* Controls & Vision Preview */}
            <div className="flex flex-col md:flex-row items-end justify-end w-full pointer-events-auto pb-4 gap-4">
                
                {/* Video Preview Box (Right) */}
                <div className="relative w-32 md:w-48 aspect-video bg-black/50 rounded-xl overflow-hidden border border-[#FFD700]/30 shadow-lg backdrop-blur-md">
                    <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover opacity-80" 
                        muted 
                        playsInline
                    />
                    
                    {/* Status Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                        {visionState.error ? (
                            <span className="text-[10px] text-red-400 text-center px-2">{visionState.error}</span>
                        ) : !visionState.isConnected ? (
                            <span className="text-[10px] text-yellow-200 animate-pulse">LOADING MODEL...</span>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${gestureStatus === 'OPEN' ? 'bg-green-500 shadow-[0_0_8px_#00ff00]' : gestureStatus === 'CLOSED' ? 'bg-red-500' : 'bg-yellow-500'} transition-colors duration-300`} />
                                <span className="text-[10px] font-bold tracking-wider text-white bg-black/50 px-2 py-0.5 rounded-full">
                                    {gestureStatus === 'NONE' ? 'Searching Hand...' : `Palm: ${gestureStatus}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};