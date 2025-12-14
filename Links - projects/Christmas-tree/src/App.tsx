import React, { useState } from 'react';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { UI } from './components/UI';
import { TreeState } from './types';

const App: React.FC = () => {
    const [treeState, setTreeState] = useState<TreeState>(TreeState.COLLAPSED);

    return (
        <div className="relative w-full h-screen bg-[#050202]">
            {/* 3D Scene Background */}
            <div className="absolute inset-0 z-0">
                <Experience treeState={treeState} />
            </div>

            {/* UI Overlay */}
            <UI treeState={treeState} setTreeState={setTreeState} />
            
            {/* Vignette Overlay for cinematic feel */}
            <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

            {/* Loading Indicator */}
            <Loader 
                containerStyles={{ background: '#050202' }} 
                innerStyles={{ width: '40vw', height: '2px', background: '#333' }}
                barStyles={{ background: '#FFD700', height: '2px' }}
                dataStyles={{ fontFamily: 'Cinzel, serif', color: '#FFD700', fontSize: '1rem' }}
            />
        </div>
    );
};

export default App;