import React, { useMemo } from 'react';

interface NatalChartProps {
  name: string;
  date: string;
  time: string;
  place: string;
  allowDownload?: boolean;
  isPremium?: boolean;
  onUnlock?: () => void;
}

const NatalChart: React.FC<NatalChartProps> = ({ 
  name, 
  date, 
  time, 
  place,
  allowDownload = false,
  isPremium = false,
  onUnlock
}) => {
  
  // SEMI-ACCURATE CALCULATIONS (Mocking a real engine)
  const chartData = useMemo(() => {
    const houses: Record<number, string[]> = {};
    for(let i=1; i<=12; i++) houses[i] = [];

    const birthYear = parseInt(date.split('-')[0]) || 2000;
    const birthHour = parseInt(time.split(':')[0]) || 12;

    // 1. CALCULATE ASCENDANT (LAGNA)
    // Assumption: Sunrise at 6 AM. Ascendant moves 1 house every 2 hours.
    // Aries (1) starts at 6 AM.
    const hoursSinceSunrise = (birthHour - 6 + 24) % 24;
    const ascendantSignIndex = Math.floor(hoursSinceSunrise / 2) % 12; // 0=Aries, 1=Taurus...
    
    // 2. CALCULATE SLOW PLANETS based on Year (Rough Ephemeris)
    // Jupiter ~ 1 year per sign. Saturn ~ 2.5 years. Rahu/Ketu ~ 1.5 years.
    // Base year 2000: Jupiter in Aries, Saturn in Taurus, Rahu in Cancer (Retrograde)
    const diffYears = birthYear - 2000;
    
    const jupiterPos = (0 + diffYears) % 12; 
    const saturnPos = (1 + Math.floor(diffYears / 2.5)) % 12;
    const rahuPos = (3 - Math.floor(diffYears / 1.5)) % 12; // Retrograde
    const ketuPos = (rahuPos + 6) % 12;

    // 3. CALCULATE FAST PLANETS based on Month/Time (Very Rough)
    const birthMonth = parseInt(date.split('-')[1]) || 1;
    const sunPos = (birthMonth - 4 + 12) % 12; // April = Aries (roughly)
    const mercuryPos = sunPos; // Close to sun
    const venusPos = (sunPos + 1) % 12;
    
    // Moon moves fast, use random seed from date for now, but consistent
    const moonPos = (birthYear + birthMonth + birthHour) % 12;
    const marsPos = (birthYear + birthMonth) % 12;

    // Map Sign Index (0-11) to House Number (1-12) relative to Ascendant
    // House 1 has the Ascendant Sign.
    // Planet in Sign X goes to House: (SignIndex - AscendantIndex + 12) % 12 + 1
    
    const placePlanet = (planet: string, signIndex: number) => {
        // Adjust negative modulo
        let houseIdx = (signIndex - ascendantSignIndex + 12) % 12 + 1;
        // Fix for negative/NaN
        if(isNaN(houseIdx)) houseIdx = 1; 
        houses[houseIdx].push(planet);
    };

    placePlanet('Sun', sunPos);
    placePlanet('Moon', moonPos);
    placePlanet('Mars', marsPos);
    placePlanet('Merc', mercuryPos);
    placePlanet('Jup', jupiterPos);
    placePlanet('Ven', venusPos);
    placePlanet('Sat', saturnPos);
    placePlanet('Rah', (rahuPos + 12) % 12);
    placePlanet('Ket', (ketuPos + 12) % 12);
    houses[1].unshift('Asc'); // Lagna is always House 1

    // Determine the Sign Number for House 1
    const house1SignNumber = ascendantSignIndex + 1;

    return { houses, house1SignNumber };
  }, [date, time]);

  // Helper to render text in a house
  const renderHouseContent = (houseNum: number, x: number, y: number) => {
      const items = chartData.houses[houseNum] || [];
      // Calculate which Rashi number goes in this house
      // House 1 = Lagna Sign. House 2 = Lagna + 1...
      const rashiNum = ((chartData.house1SignNumber + (houseNum - 2)) % 12) + 1;
      
      return (
          <g>
            {/* Rashi Number in Corner of House */}
            <text x={x} y={y - 25} textAnchor="middle" style={{ fill: '#ffffff', opacity: 0.3, fontSize: '8px' }}>
                {rashiNum}
            </text>
            
            {/* Planets */}
            <text x={x} y={y} textAnchor="middle" style={{ fill: '#FFD700', fontSize: '9px', fontFamily: 'serif', fontWeight: 'bold' }} dy="0">
                {items.map((p, i) => (
                    <tspan key={p} x={x} dy={i === 0 ? 0 : 10}>{p}</tspan>
                ))}
            </text>
          </g>
      );
  };

  return (
    <div className="flex flex-col items-center select-none">
        {/* SVG Chart Container */}
        <div className="relative w-[300px] h-[300px] bg-mystic-900 border border-gold-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)] rounded-lg p-2">
            <svg viewBox="0 0 300 300" className="w-full h-full">
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* North Indian Chart Grid Lines */}
                <rect x="0" y="0" width="300" height="300" fill="none" stroke="#EA580C" strokeWidth="2" />
                <line x1="0" y1="0" x2="300" y2="300" stroke="#EA580C" strokeWidth="1" />
                <line x1="300" y1="0" x2="0" y2="300" stroke="#EA580C" strokeWidth="1" />
                <line x1="150" y1="0" x2="0" y2="150" stroke="#EA580C" strokeWidth="1" />
                <line x1="0" y1="150" x2="150" y2="300" stroke="#EA580C" strokeWidth="1" />
                <line x1="150" y1="300" x2="300" y2="150" stroke="#EA580C" strokeWidth="1" />
                <line x1="300" y1="150" x2="150" y2="0" stroke="#EA580C" strokeWidth="1" />

                {/* House Content Placement */}
                {/* 1 - Top Center Diamond */}
                {renderHouseContent(1, 150, 70)}
                {/* 2 - Top Left Triangle */}
                {renderHouseContent(2, 75, 30)}
                {/* 3 - Left Top Triangle */}
                {renderHouseContent(3, 30, 75)}
                {/* 4 - Left Center Diamond */}
                {renderHouseContent(4, 75, 150)}
                {/* 5 - Left Bottom Triangle */}
                {renderHouseContent(5, 30, 225)}
                {/* 6 - Bottom Left Triangle */}
                {renderHouseContent(6, 75, 270)}
                {/* 7 - Bottom Center Diamond */}
                {renderHouseContent(7, 150, 230)}
                {/* 8 - Bottom Right Triangle */}
                {renderHouseContent(8, 225, 270)}
                {/* 9 - Right Bottom Triangle */}
                {renderHouseContent(9, 270, 225)}
                {/* 10 - Right Center Diamond */}
                {renderHouseContent(10, 225, 150)}
                {/* 11 - Right Top Triangle */}
                {renderHouseContent(11, 270, 75)}
                {/* 12 - Top Right Triangle */}
                {renderHouseContent(12, 225, 30)}
            </svg>
            
            {/* Locked Overlay */}
            {!isPremium && !allowDownload && (
                <div className="absolute inset-0 bg-mystic-950/80 backdrop-blur-sm flex items-center justify-center flex-col text-center p-4 z-10">
                    <div className="text-4xl mb-2">🔒</div>
                    <p className="text-gold-400 font-bold mb-2 uppercase tracking-widest text-sm">Detailed Chart Locked</p>
                    <p className="text-xs text-mystic-300 mb-4 max-w-[200px]">
                        Upgrade to Premium to view detailed planetary positions, conjunctions, and download your Vedic Report.
                    </p>
                    <button 
                        onClick={onUnlock} 
                        className="bg-gold-500 hover:bg-gold-400 text-mystic-900 font-bold px-6 py-2 rounded-full text-xs transition-colors shadow-lg shadow-gold-500/20"
                    >
                        Unlock Now
                    </button>
                </div>
            )}
        </div>
        
        <div className="mt-4 text-center">
            <h4 className="text-white font-serif text-lg">{name}</h4>
            <p className="text-mystic-400 text-xs font-mono uppercase tracking-wide">
                {place} • {date} • {time}
            </p>
        </div>
    </div>
  );
};

export default NatalChart;