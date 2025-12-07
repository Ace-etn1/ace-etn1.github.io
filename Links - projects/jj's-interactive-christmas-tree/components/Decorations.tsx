import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Instances, Instance } from '@react-three/drei';
import { 
    TREE_HEIGHT, TREE_RADIUS_BASE, ORNAMENT_COUNT, LIGHT_COUNT,
    COLOR_GOLD, COLOR_RED, COLOR_WARM_WHITE, COLOR_SILVER, COLOR_GREEN, COLOR_ROSE_GOLD,
    EXPANSION_FACTOR 
} from '../constants';
import { TreeState } from '../types';

interface DecorationsProps {
    treeState: TreeState;
}

// Helper to calculate position on a cone surface
const getConePoint = (t: number, angleOffset: number) => {
    // t goes from 0 (top) to 1 (bottom)
    const y = (t - 0.5) * TREE_HEIGHT;
    // Radius at this height
    const r = (1 - t) * TREE_RADIUS_BASE; // Taper to top
    const x = r * Math.cos(angleOffset);
    const z = r * Math.sin(angleOffset);
    return new THREE.Vector3(x, y, z);
};

const AnimatedInstance = ({ 
    position, 
    targetPosition, 
    color, 
    scale, 
    treeState 
}: { 
    position: THREE.Vector3, 
    targetPosition: THREE.Vector3, 
    color: string, 
    scale: number, 
    treeState: TreeState 
}) => {
    const ref = useRef<any>(null);
    const currentPos = useRef(position.clone());
    
    useFrame((state, delta) => {
        if (!ref.current) return;
        
        const isExpanded = treeState === TreeState.EXPANDED;
        const target = isExpanded ? targetPosition : position;
        
        // Smooth lerp
        currentPos.current.lerp(target, delta * 3);
        
        ref.current.position.copy(currentPos.current);
        
        // Gentle rotation for sparkle
        ref.current.rotation.x += delta * 0.2;
        ref.current.rotation.y += delta * 0.3;
    });

    return <Instance ref={ref} scale={scale} color={color} />;
};

export const Decorations: React.FC<DecorationsProps> = ({ treeState }) => {
    // Generate static data for ornaments
    const ornaments = useMemo(() => {
        const items = [];
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        
        for (let i = 0; i < ORNAMENT_COUNT; i++) {
            const t = i / ORNAMENT_COUNT; // 0 to 1
            const angle = 2 * Math.PI * goldenRatio * i;
            
            const basePos = getConePoint(t, angle);
            
            // Calculate expansion vector (normal to the Y axis roughly)
            let expansionDir = new THREE.Vector3(basePos.x, 0, basePos.z);
            if (expansionDir.lengthSq() < 0.00001) {
                expansionDir.set(1, 0, 0); 
            } else {
                expansionDir.normalize();
            }

            // Target Position Logic:
            // 1. Expand outward based on Factor
            // 2. Add random Z movement towards camera (which is at z=25) so particles surround user
            const targetPos = basePos.clone().add(expansionDir.multiplyScalar(EXPANSION_FACTOR));
            
            // Add volumetric chaos for "Fill Screen" effect
            targetPos.x += (Math.random() - 0.5) * 10; 
            targetPos.y += (Math.random() - 0.5) * 10;
            // Move towards camera (Z is positive). Base is around 0, Camera is at 25.
            // Spread them from z=5 to z=30
            targetPos.z += Math.random() * 30; 

            // Determine type and color mixing
            let color = COLOR_GOLD;
            let s = 0.25;
            
            const rand = Math.random();
            if (rand < 0.35) {
                color = COLOR_GOLD;
                s = 0.25;
            } else if (rand < 0.6) {
                color = COLOR_RED;
                s = 0.3;
            } else if (rand < 0.75) {
                color = COLOR_SILVER; // New Silver Balls
                s = 0.22;
            } else if (rand < 0.85) {
                color = COLOR_GREEN; // New Green Balls
                s = 0.28;
            } else {
                 color = COLOR_ROSE_GOLD;
                 s = 0.2;
            }
            
            items.push({
                id: i,
                position: basePos,
                targetPosition: targetPos,
                color,
                scale: s * (0.8 + Math.random() * 0.4)
            });
        }
        return items;
    }, []);

    // Helper for lights/emissives
    const lights = useMemo(() => {
        const items = [];
        for (let i = 0; i < LIGHT_COUNT; i++) {
            const t = i / LIGHT_COUNT;
            // Spiral distribution offset from ornaments
            const angle = t * Math.PI * 35 + Math.PI; 
            const height = TREE_HEIGHT * t - (TREE_HEIGHT / 2);
            const radius = (TREE_RADIUS_BASE - 0.2) * (1 - t); // Slightly inside
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = height;
            
            const pos = new THREE.Vector3(x, y, z);
            
            // Exploded Position logic (Spherical Cloud)
            const r = THREE.MathUtils.randFloat(10, EXPANSION_FACTOR * 1.2);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            const ex = r * Math.sin(phi) * Math.cos(theta);
            const ey = r * Math.sin(phi) * Math.sin(theta);
            const ez = (r * Math.cos(phi)) - 8; // Shift back Z to avoid clipping too close
            
            const target = new THREE.Vector3(ex, ey, ez);

            items.push({
                id: i,
                position: pos,
                targetPosition: target,
                scale: 0.08 + Math.random() * 0.05
            });
        }
        return items;
    }, []);

    return (
        <group>
            {/* Main Ornaments */}
            <Instances range={ORNAMENT_COUNT}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial 
                    roughness={0.15} 
                    metalness={0.9} 
                    envMapIntensity={3.5}
                />
                {ornaments.map((o) => (
                    <AnimatedInstance 
                        key={o.id} 
                        {...o} 
                        treeState={treeState} 
                    />
                ))}
            </Instances>

            {/* Glowing Lights */}
            <Instances range={LIGHT_COUNT}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color={COLOR_WARM_WHITE} toneMapped={false} />
                {lights.map((l) => (
                    <AnimatedInstance
                        key={`l-${l.id}`}
                        position={l.position}
                        targetPosition={l.targetPosition}
                        color={COLOR_WARM_WHITE}
                        scale={l.scale}
                        treeState={treeState}
                    />
                ))}
            </Instances>
        </group>
    );
};
