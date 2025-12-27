
import React, { useState } from 'react';
import { UserState, HoroscopeData } from '../../types';

interface HoroscopeViewProps {
  user: UserState;
  onSendYearlyReport: () => void;
  horoscopeData?: HoroscopeData;
  isLoading: boolean;
}

const HoroscopeView: React.FC<HoroscopeViewProps> = ({ user, onSendYearlyReport, horoscopeData, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const renderDaily = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="bg-gradient-to-r from-mystic-800 to-mystic-900 border border-gold-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl">✨</div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-serif text-white">Daily Cosmic Rhythm</h3>
                {horoscopeData?.starSign && (
                    <span className="text-xs bg-gold-500/20 text-gold-400 px-3 py-1 rounded-full border border-gold-500/30 font-bold uppercase tracking-widest">
                        {horoscopeData.starSign}
                    </span>
                )}
              </div>
              <p className="text-sm text-mystic-300 mb-4">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-gold-400 uppercase tracking-widest">Reading the stars...</p>
                  </div>
              ) : horoscopeData?.daily ? (
                  <>
                    <p className="text-white leading-relaxed mb-6 font-medium text-lg">{horoscopeData.daily.overview}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                            <h4 className="text-green-400 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2"><span>✅</span> Do's</h4>
                            <ul className="space-y-2">
                                {Array.isArray(horoscopeData.daily.dos) && horoscopeData.daily.dos.map((item, i) => (
                                    <li key={i} className="text-sm text-mystic-200 flex items-start gap-2">
                                        <span className="text-green-500 mt-1">•</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                            <h4 className="text-red-400 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2"><span>❌</span> Don'ts</h4>
                            <ul className="space-y-2">
                                {Array.isArray(horoscopeData.daily.donts) && horoscopeData.daily.donts.map((item, i) => (
                                    <li key={i} className="text-sm text-mystic-200 flex items-start gap-2">
                                        <span className="text-red-500 mt-1">•</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <div className="bg-white/5 rounded-lg px-4 py-2 text-center flex-1 border border-white/5">
                            <p className="text-[10px] text-mystic-400 uppercase">Lucky Color</p>
                            <p className="text-gold-300 font-bold">{horoscopeData.daily.luckyColor}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg px-4 py-2 text-center flex-1 border border-white/5">
                            <p className="text-[10px] text-mystic-400 uppercase">Lucky Number</p>
                            <p className="text-gold-300 font-bold">{horoscopeData.daily.luckyNumber}</p>
                        </div>
                    </div>
                  </>
              ) : (
                  <p className="text-center text-mystic-500 py-10">Unable to fetch insights. Please try again.</p>
              )}
          </div>
      </div>
  );

  const renderFullForecast = (type: 'weekly' | 'monthly') => {
      const content = type === 'weekly' ? horoscopeData?.weekly : horoscopeData?.monthly;
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-mystic-800/60 border border-white/10 rounded-2xl p-8 shadow-xl relative overflow-hidden min-h-[400px]">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl">{type === 'weekly' ? '📅' : '🌑'}</div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-serif text-gold-400 mb-6 flex items-center gap-3">
                        <span>{type === 'weekly' ? '🔭' : '🔮'}</span> 
                        {type === 'weekly' ? 'Weekly Transit Analysis' : 'Monthly Stellar Alignment'}
                    </h3>
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-indigo-400 uppercase tracking-widest">Consulting planetary ephemeris...</p>
                        </div>
                    ) : content ? (
                        <div className="prose prose-invert max-w-none">
                            <p className="text-mystic-100 text-lg leading-relaxed whitespace-pre-wrap">{content}</p>
                            <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                                <p className="text-xs text-mystic-500 italic">Insights generated for your natal chart alignment.</p>
                                <button onClick={onSendYearlyReport} className="text-xs bg-white/5 hover:bg-white/10 text-gold-400 font-bold px-4 py-2 rounded-full border border-gold-500/20 transition-all">
                                    Download Full Report
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-mystic-500 py-20">No data available for this cycle.</p>
                    )}
                </div>
            </div>
        </div>
      );
  };

  const renderYearly = () => (
      <div className="bg-gradient-to-br from-indigo-900/40 to-mystic-900 border border-indigo-500/30 rounded-2xl p-8 text-center animate-in fade-in">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              📅
          </div>
          <h3 className="text-2xl font-serif text-white mb-2">Annual 2024-25 Report</h3>
          <p className="text-mystic-300 max-w-md mx-auto mb-8">
              Get a comprehensive month-by-month breakdown of your career, health, and relationships sent directly to your registered email.
          </p>
          
          <button 
            onClick={onSendYearlyReport}
            className="bg-white hover:bg-mystic-100 text-mystic-900 font-bold px-8 py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center gap-2 mx-auto"
          >
              <span>📧</span> Email My Report
          </button>
          <p className="text-xs text-mystic-500 mt-4">Available for: {user.contact}</p>
      </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-0">
        <div className="flex justify-center mb-6">
            <div className="bg-mystic-800 rounded-full p-1 flex border border-white/10">
                {['daily', 'weekly', 'monthly'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                            activeTab === tab 
                            ? 'bg-gold-500 text-mystic-900 shadow-lg' 
                            : 'text-mystic-400 hover:text-white'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
            {activeTab === 'daily' && renderDaily()}
            {activeTab === 'weekly' && renderFullForecast('weekly')}
            {activeTab === 'monthly' && renderFullForecast('monthly')}
        </div>
    </div>
  );
};

export default HoroscopeView;
