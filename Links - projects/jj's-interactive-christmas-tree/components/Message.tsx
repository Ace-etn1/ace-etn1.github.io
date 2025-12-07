import React, { useRef } from 'react';
import { Text, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { TreeState } from '../types';
import * as THREE from 'three';

interface MessageProps {
    treeState: TreeState;
}

export const Message: React.FC<MessageProps> = ({ treeState }) => {
    const groupRef = useRef<THREE.Group>(null);
    const textMatRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        
        const isExpanded = treeState === TreeState.EXPANDED;
        
        // Scale logic
        const targetScale = isExpanded ? 1 : 0;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);
        
        // Rotation for elegance
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    });

    return (
        <group ref={groupRef} scale={[0,0,0]}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                {/* Removed direct font URL to prevent loading issues. Uses default font. */}
                <Text
                    fontSize={1.2}
                    maxWidth={8}
                    lineHeight={1.2}
                    textAlign="center"
                    position={[0, 0, 0]}
                    anchorX="center"
                    anchorY="middle"
                >
                    Wishing you and your loved ones{"\n"}Merry Christmas{"\n"}&{"\n"}Happy New Year!
                    <meshStandardMaterial 
                        ref={textMatRef}
                        color="#FFFDD0" 
                        emissive="#FFD700"
                        emissiveIntensity={0.8}
                        toneMapped={false}
                    />
                </Text>
            </Float>
        </group>
    );
};