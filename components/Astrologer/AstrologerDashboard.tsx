
import React, { useState } from 'react';
import { Message, UserState, Sender, Astrologer, Product, Earnings, BankDetails, PayoutRecord } from '../../types';
import { MOCK_ASTROLOGERS, MOCK_PRODUCTS } from '../../constants';
import NatalChart from '../Astrology/NatalChart';

interface AstrologerDashboardProps {
  activeUser: UserState;
  messages: Message[];
  onAction: (actionType: 'reply' | 'call' | 'request_payment' | 'end_session' | 'recommend_product' | 'payout', payload: any) => void;
  earnings: Record<string, Earnings>;
}

const AstrologerDashboard: React.FC<AstrologerDashboardProps> = ({ activeUser, messages, onAction, earnings }) => {
  const [replyText, setReplyText] = useState('');
  const [currentGuru, setCurrentGuru] = useState<Astrologer | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [dakshinaAmount, setDakshinaAmount] = useState('');
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  // Bank & Payout State
  const [showBankModal, setShowBankModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: ''
  });
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([
      { id: 'PAY-8821', amount: 12500, date: '2023-10-15', status: 'Completed', referenceId: 'UPI-992122' },
      { id: 'PAY-7734', amount: 8200, date: '2023-09-30', status: 'Completed', referenceId: 'UPI-881233' },
  ]);

  const handleSend = () => {
    if (replyText.trim()) {
      onAction('reply', replyText);
      setReplyText('');
    }
  };

  const handleRequestDakshina = () => {
      if (dakshinaAmount && !isNaN(Number(dakshinaAmount))) {
          onAction('request_payment', Number(dakshinaAmount));
          setDakshinaAmount('');
      }
  };

  const handleEndSession = () => {
      onAction('end_session', null);
      setIsChatOpen(false);
      setShowClientDetails(false);
  };

  const handleRecommendProduct = (product: Product) => {
      onAction('recommend_product', product);
      setShowProductSelector(false);
  };

  // --- Bank & Payout Logic ---
  const handleSaveBankDetails = () => {
      // Simulate API Save
      setShowBankModal(false);
      alert("Bank details updated successfully!");
  };

  const handleRequestPayout = () => {
      const myEarnings = currentGuru ? (earnings[currentGuru.id] || { chats: 0, products: 0, tips: 0, withdrawn: 0 }) : { chats: 0, products: 0, tips: 0, withdrawn: 0 };
      const totalEarnings = myEarnings.chats + myEarnings.products + myEarnings.tips;
      const withdrawn = myEarnings.withdrawn || 0;
      const availableBalance = totalEarnings - withdrawn;
      
      if (availableBalance < 500) {
          alert("Minimum payout amount is ₹500");
          return;
      }
      
      // Add a processing record locally
      const newRecord: PayoutRecord = {
          id: `PAY-${Math.floor(Math.random() * 10000)}`,
          amount: availableBalance, // Withdraw full balance
          date: new Date().toISOString().split('T')[0],
          status: 'Processing',
          referenceId: 'PENDING'
      };
      
      setPayoutHistory([newRecord, ...payoutHistory]);
      
      // Update global state via App.tsx to reflect withdrawal immediately
      onAction('payout', { astroId: currentGuru?.id, amount: availableBalance });
      
      alert(`Payout request for ₹${availableBalance.toLocaleString()} initiated!`);
  };

  // --- Visual Chart Components ---
  const BarChart = () => (
      <div className="flex items-end justify-between h-32 gap-2 w-full mt-4 pb-2 border-b border-white/10 px-2">
          {[40, 65, 30, 85, 50, 90, 60].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                   <div 
                      style={{ height: `${h}%` }} 
                      className={`w-full max-w-[20px] rounded-t-sm transition-all duration-500 ${i === 6 ? 'bg-gold-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-mystic-600 group-hover:bg-mystic-500'}`}
                   ></div>
                   <span className="text-[10px] text-mystic-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
              </div>
          ))}
      </div>
  );

  const ActivityLineChart = () => (
      <div className="relative h-24 w-full mt-4">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
             <path d="M0,45 Q10,35 20,40 T40,20 T60,30 T80,10 T100,25" fill="none" stroke="#22c55e" strokeWidth="2" className="drop-shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
             <path d="M0,45 Q10,35 20,40 T40,20 T60,30 T80,10 T100,25 L100,50 L0,50 Z" fill="url(#grad1)" opacity="0.2" />
             <defs>
                 <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                 </linearGradient>
             </defs>
          </svg>
          <div className="flex justify-between text-[10px] text-mystic-500 mt-1 uppercase tracking-widest">
              <span>9 AM</span>
              <span>12 PM</span>
              <span>3 PM</span>
              <span>6 PM</span>
              <span>Now</span>
          </div>
      </div>
  );

  const StatCard = ({ label, value, colorClass }: { label: string, value: string, colorClass: string }) => (
      <div className="bg-white/5 rounded-xl p-4 flex flex-col items-start border border-white/5 hover:border-white/10 transition-colors">
          <p className="text-xs text-mystic-400 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-xl md:text-2xl font-bold ${colorClass}`}>{value}</p>
      </div>
  );

  // 1. LOGIN SCREEN
  if (!currentGuru) {
      return (
          <div className="flex flex-col h-full bg-mystic-900/90 text-white rounded-xl overflow-hidden items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="mb-8 text-center">
                  <div className="w-20 h-20 bg-mystic-800 rounded-full mx-auto flex items-center justify-center text-4xl border border-gold-500/30 mb-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                      🕉️
                  </div>
                  <h2 className="text-3xl font-serif text-gold-400">Guru Login</h2>
                  <p className="text-mystic-400 text-sm mt-2">Select your profile to access the dashboard</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  {MOCK_ASTROLOGERS.map(guru => (
                      <button 
                        key={guru.id}
                        onClick={() => {
                            setCurrentGuru(guru);
                            // Set dummy bank details for demo
                            setBankDetails({
                                accountHolderName: guru.name,
                                accountNumber: 'XXXX-XXXX-4589',
                                ifscCode: 'SBIN0001234',
                                upiId: `${guru.name.split(' ')[0].toLowerCase()}@upi`
                            });
                        }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-mystic-800/60 hover:bg-mystic-800 border border-transparent hover:border-gold-500/40 transition-all text-left group hover:scale-[1.02] duration-200"
                      >
                          <img src={guru.imageUrl} alt={guru.name} className="w-14 h-14 rounded-full object-cover border-2 border-mystic-600 group-hover:border-gold-400 transition-colors" />
                          <div>
                              <div className="font-bold text-lg text-white group-hover:text-gold-300">{guru.name}</div>
                              <div className="text-xs text-mystic-400">{guru.specialty}</div>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  const myEarnings = earnings[currentGuru.id] || { chats: 0, products: 0, tips: 0, withdrawn: 0 };
  const totalEarnings = myEarnings.chats + myEarnings.products + myEarnings.tips;
  const withdrawn = myEarnings.withdrawn || 0;
  const availableBalance = totalEarnings - withdrawn;
  
  const isClientConnected = activeUser.connectedAstrologerId === currentGuru.id;

  // 2. DASHBOARD (CLIENT LIST & OVERVIEW)
  if (!isChatOpen) {
      return (
        <div className="flex flex-col h-full bg-mystic-900/90 text-white rounded-xl overflow-hidden p-4 md:p-8 relative animate-in zoom-in-95 duration-300 overflow-y-auto">
           {/* Header */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/5 pb-6 gap-4">
              <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={currentGuru.imageUrl} className="w-16 h-16 rounded-full border-2 border-gold-500 shadow-lg object-cover" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-mystic-900 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                      <h2 className="text-2xl font-bold font-serif text-white">Namaste, {currentGuru.name}</h2>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-widest font-bold">Online</span>
                        <span className="text-[10px] bg-mystic-700 text-mystic-300 px-2 py-0.5 rounded uppercase tracking-widest">Rate: ₹{currentGuru.pricePerMin}/min</span>
                      </div>
                  </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                    onClick={() => setShowEarningsModal(true)}
                    className="flex-1 md:flex-none text-xs font-bold text-mystic-900 bg-gold-500 hover:bg-gold-400 px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
                >
                    <span>💰</span> Analytics
                </button>
                <button 
                    onClick={() => setCurrentGuru(null)} 
                    className="md:flex-none text-xs font-bold text-mystic-400 hover:text-white bg-white/5 hover:bg-white/10 px-6 py-2.5 rounded-lg transition-colors"
                >
                    Logout
                </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Requests Section */}
                <div className="lg:col-span-2 space-y-4">
                     <h3 className="text-sm font-bold text-mystic-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <span>Incoming Consultations</span>
                        <span className="bg-mystic-700 text-white text-[10px] px-2 py-0.5 rounded-full">{isClientConnected ? '1' : '0'}</span>
                    </h3>

                    {isClientConnected ? (
                        <div 
                            onClick={() => setIsChatOpen(true)}
                            className="bg-gradient-to-r from-mystic-800 to-mystic-800/50 border border-green-500/30 p-6 rounded-2xl cursor-pointer hover:border-green-500/60 transition-all group relative overflow-hidden shadow-lg transform hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-900 flex items-center justify-center text-white font-bold text-2xl shadow-inner border border-white/10">
                                        {activeUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-white group-hover:text-gold-400 transition-colors">{activeUser.name}</h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <p className="text-xs text-green-400 font-bold flex items-center gap-1 bg-green-900/30 px-2 py-0.5 rounded-full">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live Now
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <span className="text-xs text-mystic-400 bg-black/20 px-2 py-1 rounded">Started just now</span>
                                    <div className="bg-green-600 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg shadow-green-900/50 group-hover:scale-105 transition-transform">
                                        Open Chat
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-mystic-700 rounded-2xl bg-black/20 p-8">
                            <div className="text-5xl mb-4 grayscale animate-pulse">🧘</div>
                            <p className="text-lg font-medium text-mystic-300">Meditating...</p>
                            <p className="text-xs mt-2 text-mystic-400 max-w-xs">Waiting for a seeker to connect. Stay online to receive requests.</p>
                        </div>
                    )}
                </div>

                {/* Quick Stats Sidebar (Desktop) */}
                <div className="bg-mystic-800/40 border border-white/5 rounded-2xl p-6 hidden lg:flex flex-col">
                     <h3 className="text-sm font-bold text-gold-500 uppercase tracking-widest mb-4">Today's Energy</h3>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center pb-3 border-b border-white/5">
                             <span className="text-sm text-mystic-300">Total Minutes</span>
                             <span className="text-lg font-bold text-white">45m</span>
                         </div>
                         <div className="flex justify-between items-center pb-3 border-b border-white/5">
                             <span className="text-sm text-mystic-300">Sessions</span>
                             <span className="text-lg font-bold text-white">3</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <span className="text-sm text-mystic-300">Rating</span>
                             <span className="text-lg font-bold text-gold-400">4.9 ★</span>
                         </div>
                     </div>
                     <div className="mt-auto pt-6">
                         <p className="text-[10px] text-mystic-500 text-center uppercase tracking-widest">Weekly Goal: 85% Achieved</p>
                         <div className="w-full bg-mystic-900 h-1.5 rounded-full mt-2 overflow-hidden">
                             <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-full w-[85%]"></div>
                         </div>
                     </div>
                </div>
           </div>

            {/* Wallet / Earnings Modal (Improved Scaling) */}
            {showEarningsModal && (
                <div className="fixed inset-0 z-50 bg-mystic-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                    <div className="bg-mystic-900 border border-gold-500/30 w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] rounded-3xl p-6 md:p-8 relative flex flex-col shadow-2xl overflow-y-auto">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
                            <div>
                                <h3 className="text-gold-400 font-serif text-2xl md:text-3xl flex items-center gap-3">
                                    <span>📊</span> Financial Insights
                                </h3>
                                <p className="text-mystic-400 text-sm mt-1">Real-time earnings & payouts</p>
                            </div>
                            <button 
                                onClick={() => setShowEarningsModal(false)} 
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 shrink-0">
                            
                            {/* Main Balance Card */}
                            <div className="md:col-span-8 bg-gradient-to-br from-mystic-800 to-mystic-900 rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                                <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl">₹</div>
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-mystic-400 text-sm uppercase tracking-widest mb-1 relative z-10">Available Balance</p>
                                            <p className="text-4xl md:text-6xl font-bold text-white relative z-10 tracking-tight">₹{availableBalance.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right hidden md:block">
                                            <p className="text-mystic-500 text-xs uppercase">Lifetime Earnings</p>
                                            <p className="text-mystic-300 font-bold">₹{totalEarnings.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-green-400 text-sm relative z-10 mt-2">
                                        <span>▲ 12%</span>
                                        <span className="text-mystic-500">vs last week</span>
                                    </div>
                                </div>
                                <ActivityLineChart />
                            </div>

                            {/* Stat Cards */}
                            <div className="md:col-span-4 grid grid-cols-1 gap-4">
                                <StatCard label="Consultations (90%)" value={`₹${myEarnings.chats.toLocaleString()}`} colorClass="text-green-400" />
                                <StatCard label="Commissions (10%)" value={`₹${myEarnings.products.toLocaleString()}`} colorClass="text-gold-400" />
                                <StatCard label="Dakshina (80%)" value={`₹${myEarnings.tips.toLocaleString()}`} colorClass="text-violet-400" />
                            </div>
                        </div>

                        {/* Breakdown & Actions Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[200px]">
                            
                            {/* Weekly Trend Bar Chart */}
                            <div className="bg-mystic-800/40 rounded-2xl p-6 border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Weekly Performance</h4>
                                    <select className="bg-black/20 border-none text-[10px] text-mystic-400 rounded">
                                        <option>Last 7 Days</option>
                                    </select>
                                </div>
                                <BarChart />
                                <div className="flex justify-between mt-4 text-xs text-mystic-400 px-2">
                                    <div className="text-center">
                                        <span className="block font-bold text-white">24</span>
                                        <span>Hours</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-bold text-white">12</span>
                                        <span>Clients</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-bold text-white">4.9</span>
                                        <span>Rating</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions Panel */}
                            <div className="bg-mystic-800/40 rounded-2xl p-6 border border-white/5 flex flex-col justify-center items-center text-center">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-3xl mb-4 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                    💸
                                </div>
                                <h4 className="text-lg font-bold text-white mb-1">Quick Actions</h4>
                                <p className="text-mystic-400 text-xs mb-6 max-w-xs">Request payouts or update your banking information for seamless transfers.</p>
                                
                                <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-4">
                                    <button 
                                        onClick={handleRequestPayout}
                                        disabled={availableBalance < 500}
                                        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-lg shadow-green-900/20"
                                    >
                                        Withdraw Balance
                                    </button>
                                    <button 
                                        onClick={() => setShowHistoryModal(true)}
                                        className="bg-mystic-700 hover:bg-mystic-600 text-white font-bold py-3 rounded-xl text-xs transition-colors"
                                    >
                                        Payout History
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setShowBankModal(true)}
                                    className="text-xs text-gold-500 hover:text-gold-400 font-bold underline transition-colors"
                                >
                                    Manage Bank Details
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* OVERLAY: Bank Details Modal */}
                    {showBankModal && (
                         <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                             <div className="bg-mystic-800 border border-gold-500/30 p-8 rounded-2xl max-w-md w-full m-4 shadow-2xl relative">
                                 <button onClick={() => setShowBankModal(false)} className="absolute top-4 right-4 text-mystic-500 hover:text-white">✕</button>
                                 <h3 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4">Bank Account Details</h3>
                                 <div className="space-y-4">
                                     <div>
                                         <label className="text-[10px] uppercase text-mystic-400 font-bold">Account Holder Name</label>
                                         <input 
                                            type="text"
                                            value={bankDetails.accountHolderName}
                                            onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                                            className="w-full bg-mystic-900 border border-mystic-600 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none mt-1"
                                         />
                                     </div>
                                     <div>
                                         <label className="text-[10px] uppercase text-mystic-400 font-bold">Account Number</label>
                                         <input 
                                            type="text"
                                            value={bankDetails.accountNumber}
                                            onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                                            className="w-full bg-mystic-900 border border-mystic-600 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none mt-1"
                                         />
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] uppercase text-mystic-400 font-bold">IFSC Code</label>
                                            <input 
                                                type="text"
                                                value={bankDetails.ifscCode}
                                                onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                                                className="w-full bg-mystic-900 border border-mystic-600 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-mystic-400 font-bold">UPI ID</label>
                                            <input 
                                                type="text"
                                                value={bankDetails.upiId}
                                                onChange={(e) => setBankDetails({...bankDetails, upiId: e.target.value})}
                                                className="w-full bg-mystic-900 border border-mystic-600 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none mt-1"
                                            />
                                        </div>
                                     </div>
                                 </div>
                                 <div className="flex gap-3 mt-8">
                                     <button onClick={handleSaveBankDetails} className="flex-1 bg-gold-500 hover:bg-gold-400 text-mystic-900 font-bold py-2.5 rounded-xl">Save Details</button>
                                     <button onClick={() => setShowBankModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl">Cancel</button>
                                 </div>
                             </div>
                         </div>
                    )}

                    {/* OVERLAY: Payout History Modal */}
                    {showHistoryModal && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                            <div className="bg-mystic-800 border border-gold-500/30 p-6 rounded-2xl max-w-lg w-full m-4 shadow-2xl h-[400px] flex flex-col relative">
                                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                                    <h3 className="text-xl font-serif text-white">Payout History</h3>
                                    <button onClick={() => setShowHistoryModal(false)} className="text-mystic-400 hover:text-white">✕</button>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                                    {payoutHistory.length === 0 ? (
                                        <div className="text-center text-mystic-500 mt-10">No payouts found.</div>
                                    ) : (
                                        payoutHistory.map(record => (
                                            <div key={record.id} className="bg-mystic-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                                <div>
                                                    <p className="text-white font-bold">₹{record.amount.toLocaleString()}</p>
                                                    <p className="text-xs text-mystic-400">{record.date}</p>
                                                    <p className="text-[10px] text-mystic-500 font-mono mt-1">Ref: {record.referenceId}</p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                    record.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                                    record.status === 'Processing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                                    'bg-red-500/10 text-red-400 border-red-500/30'
                                                }`}>
                                                    {record.status}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      );
  }

  // 3. CHAT INTERFACE
  return (
    <div className="flex flex-col h-full bg-mystic-900/90 text-white rounded-xl overflow-hidden border border-gold-500/20 animate-in slide-in-from-right-10 duration-300 relative">
      {/* Active Chat Header */}
      <div className="bg-mystic-800 p-4 border-b border-mystic-700 flex justify-between items-center shadow-lg z-10">
        <div className="flex items-center gap-3">
           <button 
                onClick={() => setIsChatOpen(false)}
                className="mr-1 text-mystic-400 hover:text-white transition-colors"
           >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           </button>
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-900 flex items-center justify-center text-white font-bold text-sm border border-white/20">
                {activeUser.name.charAt(0).toUpperCase()}
           </div>
           <div className="flex flex-col">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    {activeUser.name}
                    <button 
                        onClick={() => setShowClientDetails(!showClientDetails)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-colors ${showClientDetails ? 'bg-gold-500 border-gold-500 text-black' : 'border-mystic-500 text-mystic-500 hover:text-white'}`}
                        title="Toggle Client Details"
                    >
                        i
                    </button>
                </h2>
                <div className="text-[10px] text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Connected
                </div>
           </div>
        </div>
        
        <button 
            onClick={handleEndSession}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg text-xs font-bold transition-all"
        >
            End Chat
        </button>
      </div>

      {/* Client Details Panel (Toggleable) */}
      {showClientDetails && (
          <div className="bg-mystic-950/50 backdrop-blur-sm border-b border-mystic-700 p-4 animate-in slide-in-from-top-4 duration-300 h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                 <h4 className="text-gold-400 text-xs font-bold uppercase tracking-widest">Natal Chart & Details</h4>
                 <span className="text-[10px] text-mystic-500 bg-mystic-900 px-2 py-0.5 rounded">Confidential</span>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mb-4">
                  <div>
                      <p className="text-[10px] text-mystic-400 uppercase">Birth Date</p>
                      <p className="text-white font-mono">{activeUser.birthDate || 'N/A'}</p>
                  </div>
                  <div>
                      <p className="text-[10px] text-mystic-400 uppercase">Time</p>
                      <p className="text-white font-mono">{activeUser.birthTime || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                      <p className="text-[10px] text-mystic-400 uppercase">Place of Birth</p>
                      <p className="text-white font-mono">{activeUser.birthPlace || 'N/A'}</p>
                  </div>
              </div>
              
              {/* Added Natal Chart View for Astrologer */}
              <div className="border-t border-white/5 pt-4">
                  <NatalChart 
                      name={activeUser.name}
                      date={activeUser.birthDate || ''}
                      time={activeUser.birthTime || ''}
                      place={activeUser.birthPlace || ''}
                  />
              </div>
          </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
         {messages.length === 0 && <div className="text-center text-mystic-500 mt-10 italic">Start the conversation with a blessing...</div>}
         {messages.map((msg) => (
           <div key={msg.id} className={`flex flex-col ${msg.sender === Sender.USER ? 'items-start' : 'items-end'}`}>
             <div className={`text-[10px] mb-1 opacity-70 ${msg.sender === Sender.USER ? 'text-violet-300 ml-1' : 'text-gold-300 mr-1'}`}>
                {msg.sender === Sender.USER ? activeUser.name : msg.sender === Sender.ASTROLOGER ? 'You' : msg.sender === Sender.SYSTEM ? 'System' : 'AI'}
             </div>
             <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
               msg.sender === Sender.USER 
                ? 'bg-mystic-700/80 text-white rounded-tl-none border border-white/5' 
                : msg.sender === Sender.SYSTEM 
                    ? 'bg-gray-800/50 italic text-gray-400 text-xs self-center' 
                    : 'bg-gold-500/10 border border-gold-500/20 text-gold-100 rounded-tr-none'
             }`}>
                {msg.text}
             </div>
           </div>
         ))}
      </div>

      {/* Product Selector Modal for Guru */}
      {showProductSelector && (
          <div className="absolute bottom-20 left-4 right-4 md:left-10 md:right-10 bg-mystic-900 border border-gold-500/30 rounded-2xl p-4 animate-in slide-in-from-bottom-10 shadow-2xl z-20 max-h-80 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                  <h4 className="text-gold-400 text-xs font-bold uppercase tracking-widest">Select Remedy to Recommend</h4>
                  <button onClick={() => setShowProductSelector(false)} className="text-mystic-400 hover:text-white text-xs bg-white/5 px-2 py-1 rounded">Close</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {MOCK_PRODUCTS.map(product => (
                      <div 
                        key={product.id} 
                        onClick={() => handleRecommendProduct(product)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-mystic-800 hover:bg-mystic-700 cursor-pointer border border-transparent hover:border-gold-500/30 transition-all group"
                      >
                          <img src={product.imageUrl} className="w-10 h-10 rounded object-cover" />
                          <div className="truncate flex-1">
                              <p className="text-sm text-white truncate group-hover:text-gold-200">{product.name}</p>
                              <p className="text-[10px] text-gold-400">₹{product.price}</p>
                          </div>
                          <span className="text-xs text-mystic-500 group-hover:text-white">→</span>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Control Panel (Compact) */}
      <div className="bg-mystic-800 border-t border-mystic-700 p-2 pb-4 md:pb-2">
          {/* Quick Actions Toolbar */}
          <div className="flex gap-2 mb-2 overflow-x-auto border-b border-white/5 pb-2 scrollbar-hide px-1">
              <button onClick={() => onAction('call', 'voice')} className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-mystic-700 hover:bg-mystic-600 text-mystic-200 text-xs rounded-lg transition-colors border border-white/5">
                 📞 Voice
              </button>
              <button onClick={() => onAction('call', 'video')} className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-mystic-700 hover:bg-mystic-600 text-mystic-200 text-xs rounded-lg transition-colors border border-white/5">
                 📹 Video
              </button>
              <button onClick={() => setShowProductSelector(!showProductSelector)} className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 text-xs rounded-lg transition-colors">
                 🏷️ Recommend Item
              </button>
              <div className="w-px bg-white/10 mx-1"></div>
              <div className="flex items-center gap-0 bg-mystic-900 rounded-lg border border-mystic-600 overflow-hidden">
                 <span className="text-gold-500 text-xs pl-2">₹</span>
                 <input 
                    type="number" 
                    value={dakshinaAmount}
                    onChange={(e) => setDakshinaAmount(e.target.value)}
                    placeholder="101"
                    className="bg-transparent w-10 text-xs text-white outline-none px-1 py-1.5"
                 />
                 <button 
                    onClick={handleRequestDakshina}
                    className="bg-gold-600 hover:bg-gold-500 text-mystic-900 text-[10px] font-bold px-2 py-1.5"
                 >
                    REQ
                 </button>
              </div>
          </div>

          {/* Message Input */}
          <div className="flex gap-2 items-center">
            <input 
                type="text" 
                className="flex-1 bg-mystic-900 border border-mystic-600 rounded-xl px-4 py-3 focus:border-gold-500 outline-none text-sm text-white placeholder-mystic-500 transition-all shadow-inner"
                placeholder="Type your guidance..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
                onClick={handleSend}
                disabled={!replyText.trim()}
                className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-mystic-900 font-bold px-4 py-3 rounded-xl text-sm transition-all shadow-lg shadow-gold-500/20"
            >
                <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            </button>
          </div>
      </div>
    </div>
  );
};

export default AstrologerDashboard;
