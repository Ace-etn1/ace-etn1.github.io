
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Center } from '@react-three/drei';
import * as THREE from 'three';
import { TREE_HEIGHT, COLOR_GOLD } from '../constants';
import { TreeState } from '../types';

export const StarTopper: React.FC<{ treeState: TreeState }> = ({ treeState }) => {
    const ref = useRef<THREE.Group>(null);
    const targetY = TREE_HEIGHT / 2 + 1; // Top of tree
    
    // Create a 5-pointed star shape
    const starShape = useMemo(() => {
        const shape = new THREE.Shape();
        const points = 5;
        const outerRadius = 1.2;
        const innerRadius = 0.5;
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points; // - Math.PI / 2 to point up? Rotation handled in group
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return shape;
    }, []);

    const extrudeSettings = useMemo(() => ({
        depth: 0.4,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 3
    }), []);

    useFrame((state, delta) => {
        if (!ref.current) return;
        
        const isExpanded = treeState === TreeState.EXPANDED;
        
        // Star moves up slightly when expanded
        const y = isExpanded ? targetY + 2 : targetY;
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, y, delta * 2);

        // Continuous Spin
        ref.current.rotation.y += delta * 0.8;
        
        // Pulse scale
        const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        ref.current.scale.setScalar(s);
    });

    return (
        <group ref={ref} position={[0, targetY, 0]}>
             <Float speed={4} rotationIntensity={0.2} floatIntensity={0.5}>
                <Center>
                    <mesh rotation={[0, 0, Math.PI / 10]}> {/* Slight rotation to align point up */}
                        <extrudeGeometry args={[starShape, extrudeSettings]} />
                        <meshStandardMaterial 
                            color={COLOR_GOLD} 
                            emissive={COLOR_GOLD} 
                            emissiveIntensity={1.5} 
                            roughness={0.1}
                            metalness={1}
                            toneMapped={false}
                        />
                    </mesh>
                </Center>
                <pointLight distance={15} intensity={3} color={COLOR_GOLD} />
             </Float>
        </group>
    );
};
