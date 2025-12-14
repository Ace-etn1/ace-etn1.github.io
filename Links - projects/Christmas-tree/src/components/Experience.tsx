import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { TreeState } from '../types';
import { Decorations } from './Decorations';
import { StarTopper } from './StarTopper';
import { COLOR_RED, COLOR_GOLD } from '../constants';

interface ExperienceProps {
    treeState: TreeState;
}

export const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
    return (
        <Canvas 
            camera={{ position: [0, 0, 25], fov: 35 }}
            gl={{ 
                antialias: false, 
                stencil: false, 
                depth: true, 
                alpha: false 
            }}
            dpr={[1, 2]} 
        >
            <color attach="background" args={['#050202']} />
            
            {/* Background Atmosphere */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
            
            {/* Dim Yellow Dots Background - Updated for brightness and size */}
            <Sparkles 
                count={400} 
                scale={50} 
                size={8} 
                speed={0.4} 
                opacity={0.8} 
                color={COLOR_GOLD} 
                noise={0.5}
            />

            <fog attach="fog" args={['#050202', 15, 60]} />
            
            <Suspense fallback={null}>
                {/* Scene Content */}
                <group position={[0, -2, 0]}>
                    <Decorations treeState={treeState} />
                    <StarTopper treeState={treeState} />
                </group>

                {/* Lighting - Brightened */}
                <ambientLight intensity={1.2} />
                <spotLight 
                    position={[10, 20, 10]} 
                    angle={0.5} 
                    penumbra={1} 
                    intensity={6} 
                    color="#ffeedd" 
                    castShadow 
                />
                <pointLight position={[-10, -5, -10]} intensity={3} color={COLOR_RED} />
                <Environment preset="city" />

                {/* Post Processing - multisampling={0} prevents black screen on some GPUs */}
                <EffectComposer multisampling={0}>
                    <Bloom 
                        luminanceThreshold={0.8} 
                        mipmapBlur 
                        intensity={1.5} 
                        radius={0.6}
                    />
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
            </Suspense>

            <OrbitControls 
                enablePan={false} 
                minPolarAngle={Math.PI / 4} 
                maxPolarAngle={Math.PI / 1.8}
                minDistance={15}
                maxDistance={40}
                autoRotate={treeState === TreeState.COLLAPSED}
                autoRotateSpeed={0.5}
            />
        </Canvas>
    );
};