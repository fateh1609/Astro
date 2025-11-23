
import React from 'react';

interface NatalChartProps {
  name: string;
  date: string;
  time: string;
  place: string;
}

const NatalChart: React.FC<NatalChartProps> = ({ name, date, time, place }) => {
  
  // Helper to generate deterministic planet positions based on user data
  // In a real app, this would use an ephemeris library
  const getPlanets = (seed: string) => {
    const planets = ['Sun', 'Moon', 'Mars', 'Merc', 'Jup', 'Ven', 'Sat', 'Rah', 'Ket'];
    const houses: Record<number, string[]> = {};
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    
    planets.forEach((planet, index) => {
        // Distribute planets deterministically 
        const houseNum = (Math.abs(hash + index * 123) % 12) + 1;
        if (!houses[houseNum]) houses[houseNum] = [];
        houses[houseNum].push(planet);
    });
    
    // Ensure Lagna (Ascendant) is in House 1 for this view
    if (!houses[1]) houses[1] = [];
    houses[1].unshift('Asc');

    return houses;
  };

  const planetPositions = getPlanets(name + date + time);

  // Helper to render text in a house
  const renderHouseContent = (houseNum: number, x: number, y: number) => {
      const items = planetPositions[houseNum] || [];
      return (
          <text x={x} y={y} textAnchor="middle" className="text-[10px] md:text-xs fill-gold-400 font-serif" dy="0">
              {items.map((p, i) => (
                  <tspan key={p} x={x} dy={i === 0 ? 0 : 12}>{p}</tspan>
              ))}
          </text>
      );
  };

  return (
    <div className="w-full max-w-md mx-auto aspect-square bg-mystic-900 border-4 border-gold-600 rounded-lg shadow-2xl relative p-1">
      <div className="absolute top-2 left-2 text-[10px] text-mystic-500 font-bold uppercase tracking-widest bg-black/40 px-2 py-1 rounded">
          Lagna Chart
      </div>
      <svg viewBox="0 0 400 400" className="w-full h-full bg-mystic-950 stroke-gold-500/50">
        {/* Outer Frame */}
        <rect x="0" y="0" width="400" height="400" fill="none" strokeWidth="2" />
        
        {/* Diagonals */}
        <line x1="0" y1="0" x2="400" y2="400" strokeWidth="1" />
        <line x1="400" y1="0" x2="0" y2="400" strokeWidth="1" />
        
        {/* Diamond (Midpoints) */}
        <line x1="200" y1="0" x2="400" y2="200" strokeWidth="1" />
        <line x1="400" y1="200" x2="200" y2="400" strokeWidth="1" />
        <line x1="200" y1="400" x2="0" y2="200" strokeWidth="1" />
        <line x1="0" y1="200" x2="200" y2="0" strokeWidth="1" />

        {/* House Labels (Roman Numerals for House Numbers) */}
        {/* H1 - Top Center */}
        <text x="200" y="80" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">I</text>
        {renderHouseContent(1, 200, 110)}

        {/* H2 - Top Left */}
        <text x="100" y="40" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">II</text>
        {renderHouseContent(2, 100, 50)}

        {/* H3 - Left Top */}
        <text x="40" y="100" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">III</text>
        {renderHouseContent(3, 40, 120)}

        {/* H4 - Center Left */}
        <text x="120" y="200" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">IV</text>
        {renderHouseContent(4, 100, 210)}

        {/* H5 - Left Bottom */}
        <text x="40" y="300" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">V</text>
        {renderHouseContent(5, 40, 310)}

        {/* H6 - Bottom Left */}
        <text x="100" y="360" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">VI</text>
        {renderHouseContent(6, 100, 350)}

        {/* H7 - Bottom Center */}
        <text x="200" y="320" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">VII</text>
        {renderHouseContent(7, 200, 310)}

        {/* H8 - Bottom Right */}
        <text x="300" y="360" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">VIII</text>
        {renderHouseContent(8, 300, 350)}

        {/* H9 - Right Bottom */}
        <text x="360" y="300" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">IX</text>
        {renderHouseContent(9, 360, 310)}

        {/* H10 - Center Right */}
        <text x="280" y="200" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">X</text>
        {renderHouseContent(10, 300, 210)}

        {/* H11 - Right Top */}
        <text x="360" y="100" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">XI</text>
        {renderHouseContent(11, 360, 120)}

        {/* H12 - Top Right */}
        <text x="300" y="40" textAnchor="middle" className="text-[8px] fill-mystic-600 opacity-50">XII</text>
        {renderHouseContent(12, 300, 50)}

      </svg>
      
      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-mystic-400 font-mono">
         <div>Name: <span className="text-white">{name}</span></div>
         <div className="text-right">{date} | {time}</div>
         <div className="col-span-2 text-center text-mystic-600 uppercase tracking-widest text-[8px] mt-1">
             Astro-Vastu Generated • {place}
         </div>
      </div>
    </div>
  );
};

export default NatalChart;
