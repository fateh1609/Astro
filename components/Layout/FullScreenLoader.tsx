
import React from 'react';
import StarBackground from './StarBackground';

interface FullScreenLoaderProps {
  text?: string;
  subText?: string;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ text = "Loading...", subText = "Aligning Cosmic Energies..." }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-mystic-900 flex flex-col items-center justify-center text-white overflow-hidden">
      <StarBackground />
      
      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
        <div className="w-24 h-24 mb-8 relative">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-4 border-t-gold-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin duration-[3s]"></div>
            
            {/* Inner Ring */}
            <div className="absolute inset-2 border-4 border-t-transparent border-r-gold-300 border-b-transparent border-l-purple-300 rounded-full animate-spin [animation-direction:reverse] duration-[2s]"></div>
            
            {/* Core Orb */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-amber-600 rounded-full blur-md animate-pulse"></div>
                <span className="text-3xl relative z-10 animate-float">✨</span>
            </div>
        </div>
        
        <h2 className="text-2xl font-serif text-gold-400 tracking-widest font-bold mb-2 animate-pulse">{text}</h2>
        <p className="text-xs text-mystic-300 font-mono uppercase tracking-wider opacity-80">{subText}</p>
        
        {/* Progress Bar Aesthetic */}
        <div className="w-48 h-1 bg-mystic-800 rounded-full mt-6 overflow-hidden border border-white/10">
            <div className="h-full bg-gradient-to-r from-violet-600 via-gold-500 to-violet-600 w-[50%] animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;
