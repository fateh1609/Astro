import React, { useState, useEffect, useRef } from 'react';

interface CallInterfaceProps {
  partnerName: string;
  partnerImage: string;
  callType: 'voice' | 'video';
  onEndCall: () => void;
}

const CallInterface: React.FC<CallInterfaceProps> = ({ partnerName, partnerImage, callType, onEndCall }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Connection Simulation
  useEffect(() => {
    // Simulate connection time
    const connectTimer = setTimeout(() => {
        setCallStatus('connected');
    }, 1500);
    return () => clearTimeout(connectTimer);
  }, []);

  // Timer (only when connected)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'connected') {
        timer = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  // Handle End Call with Delay
  const handleHangup = () => {
      setCallStatus('ended');
      // Stop media streams immediately
      if (localVideoRef.current && localVideoRef.current.srcObject) {
          const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
      }
      
      // Delay unmount to show "Call Ended"
      setTimeout(() => {
          onEndCall();
      }, 2000);
  };

  // Access Camera/Mic
  useEffect(() => {
    const startStream = async () => {
      try {
        if (callType === 'video' && callStatus !== 'ended') {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };
    
    if (callStatus !== 'ended') {
        startStream();
    }

    // Cleanup
    return () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };
  }, [callType, callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col animate-in fade-in duration-300 font-sans">
      {/* Background / Remote Video Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {/* Simulating Remote Stream */}
        <div className="absolute inset-0 bg-mystic-900 transition-all duration-1000">
            <img 
                src={partnerImage} 
                alt="Remote" 
                className={`w-full h-full object-cover transition-all duration-500 ${callStatus === 'ended' ? 'grayscale opacity-20 scale-105' : 'opacity-50 blur-3xl'}`} 
            />
            <div className={`absolute inset-0 bg-black/50 transition-opacity duration-500 ${callStatus === 'ended' ? 'opacity-80' : 'opacity-0'}`}></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-4 shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden mb-6 transition-all duration-500 ${callStatus === 'ended' ? 'border-red-500 grayscale translate-y-4' : 'border-gold-500/50 animate-pulse'}`}>
                <img src={partnerImage} alt={partnerName} className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{partnerName}</h2>
            
            {callStatus === 'connecting' && (
                 <p className="text-mystic-400 text-lg animate-pulse tracking-widest uppercase text-xs">Connecting...</p>
            )}

            {callStatus === 'connected' && (
                <>
                    <p className="text-gold-400 font-mono text-xl">{formatTime(duration)}</p>
                    <p className="text-mystic-400 text-sm mt-2 animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {callType === 'video' ? 'Video Signal Stable' : 'Voice Connected'}
                    </p>
                </>
            )}

            {callStatus === 'ended' && (
                <div className="animate-in zoom-in duration-300 flex flex-col items-center">
                    <p className="text-red-500 text-3xl font-bold mb-1">Call Ended</p>
                    <p className="text-mystic-400 text-sm">{formatTime(duration)}</p>
                </div>
            )}
        </div>
      </div>

      {/* Local Video (PiP) */}
      {callType === 'video' && !isVideoOff && callStatus !== 'ended' && (
        <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-xl border border-white/20 shadow-xl overflow-hidden z-20">
            <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline
                className="w-full h-full object-cover"
            />
        </div>
      )}

      {/* Controls - Hide when ended */}
      {callStatus !== 'ended' && (
        <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center items-center gap-6 animate-in slide-in-from-bottom-10">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full backdrop-blur-md border transition-all ${isMuted ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
            >
                {isMuted ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2v-7a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v7a2 2 0 01-2 2H5z" /></svg>
                )}
            </button>

            <button 
                onClick={handleHangup}
                className="p-5 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-500 transform hover:scale-110 transition-all"
            >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
            </button>

            {callType === 'video' && (
                <button 
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-4 rounded-full backdrop-blur-md border transition-all ${isVideoOff ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                >
                    {isVideoOff ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export default CallInterface;