
import React, { useState, useEffect, useRef } from 'react';
import { Sender, Message, UserState, AppView, Astrologer, MessageType, CallState, Product, Earnings } from './types';
import { MOCK_ASTROLOGERS, INITIAL_DAILY_LIMIT, PREMIUM_DAILY_LIMIT, generateSystemInstruction, SUGGESTED_QUESTIONS, RAZORPAY_KEY_ID, MOCK_PRODUCTS } from './constants';
import { initializeChat, sendMessageToGemini } from './services/geminiService';
import StarBackground from './components/Layout/StarBackground';
import MessageBubble from './components/Chat/MessageBubble';
import AstroCard from './components/Marketplace/AstroCard';
import AstrologerDashboard from './components/Astrologer/AstrologerDashboard';
import CallInterface from './components/Call/CallInterface';
import RatingModal from './components/Chat/RatingModal';
import Shop from './components/Shop/Shop';
import NatalChart from './components/Astrology/NatalChart';

// Helper for unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function App() {
  const [view, setView] = useState<AppView>(AppView.CHAT);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userState, setUserState] = useState<UserState>({
    dailyQuestionsLeft: INITIAL_DAILY_LIMIT,
    isPremium: false,
    name: '',
    gender: '',
    hasOnboarded: false,
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  });
  
  // Earnings State for Astrologers
  const [astrologerEarnings, setAstrologerEarnings] = useState<Record<string, Earnings>>({});

  // UI Modals
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('');
  const [showChartModal, setShowChartModal] = useState(false);
  
  // Purchase & Address State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
      address: '',
      city: '',
      pincode: '',
      phone: ''
  });
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState<Product | null>(null);
  
  // Call & Rating State
  const [callState, setCallState] = useState<CallState>({ isActive: false, type: 'voice', partnerName: '', partnerImage: '' });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<Astrologer | null>(null);

  // Onboarding Form State
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    gender: '',
    date: '',
    time: '',
    place: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TTS Cleanup on Mount/Unmount/Refresh
  useEffect(() => {
    // Stop any existing speech
    window.speechSynthesis.cancel();
    
    const handleUnload = () => {
        window.speechSynthesis.cancel();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => {
        window.removeEventListener('beforeunload', handleUnload);
        window.speechSynthesis.cancel();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, view]);

  // --- HELPER: Update Earnings ---
  const updateEarnings = (astroId: string, type: keyof Earnings, amount: number) => {
    setAstrologerEarnings(prev => {
        const current = prev[astroId] || { chats: 0, products: 0, tips: 0, withdrawn: 0 };
        return {
            ...prev,
            [astroId]: {
                ...current,
                [type]: current[type] + amount
            }
        };
    });
  };

  // --- HELPER: Find products in text ---
  const findRelevantProducts = (text: string): Product[] => {
      const lowerText = text.toLowerCase();
      
      return MOCK_PRODUCTS.filter(p => {
          // For Gemstones: The SPECIFIC name must appear (e.g., "Coral" or "Moonga", "Sapphire" or "Pukhraj")
          if (p.category === 'gemstone') {
              // Extract core name like "Coral" from "Natural Red Coral (Moonga)"
              const keywords = p.name.toLowerCase().split(' ').filter(w => w.length > 3 && w !== 'natural' && w !== 'stone');
              const hasSpecificMatch = keywords.some(k => lowerText.includes(k));
              return hasSpecificMatch;
          }

          // For other items (Pooja, Rudraksha), generalized keywords + category matching is okay
          const nameMatch = p.name.toLowerCase().split(' ').some(word => word.length > 4 && lowerText.includes(word));
          const catMatch = lowerText.includes(p.category) && lowerText.includes('buy') || lowerText.includes('wear');
          
          return nameMatch || (catMatch && Math.random() > 0.7); 
      }).slice(0, 1); // Only suggest 1 top product to avoid clutter
  };

  // --- RAZORPAY PAYMENT LOGIC ---
  const handlePayment = (amount: number, description: string, onSuccess: () => void, contact?: string) => {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount * 100, // Amount in paise
      currency: "INR",
      name: "ASTRO-VASTU",
      description: description,
      image: "https://cdn-icons-png.flaticon.com/512/2649/2649127.png", // Astrology Icon
      handler: function (response: any) {
        // On Success
        console.log("Payment ID: ", response.razorpay_payment_id);
        onSuccess();
      },
      prefill: {
        name: userState.name,
        contact: contact || "9999999999", // Use captured phone or mock
        email: "seeker@astro.vastu" // Mock email
      },
      theme: {
        color: "#7652D6" // Mystic Purple
      }
    };

    if (window.Razorpay) {
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
      
      rzp1.on('payment.failed', function (response: any) {
        alert("Payment Failed: " + response.error.description);
      });
    } else {
      alert("Payment gateway failed to load. Please check internet connection.");
    }
  };

  const initiateProductPurchase = (product: Product) => {
      setSelectedProductForPurchase(product);
      setShippingDetails({ address: '', city: '', pincode: '', phone: '' }); // Reset form
      setShowAddressModal(true);
  };

  const confirmPurchaseWithAddress = () => {
      if (!selectedProductForPurchase) return;
      const { address, city, pincode, phone } = shippingDetails;
      
      if (!address.trim() || !city.trim() || !pincode.trim() || !phone.trim()) {
          alert("Please fill in all shipping details to proceed.");
          return;
      }
      
      const product = selectedProductForPurchase;
      const fullAddress = `${address}, ${city} - ${pincode}\nContact: ${phone}`;
      
      handlePayment(product.price, `Order: ${product.name}`, () => {
          // ACCOUNTING: If connected to an Astrologer, they get 10% commission
          if (userState.connectedAstrologerId) {
              updateEarnings(userState.connectedAstrologerId, 'products', product.price * 0.10);
          }

          const msg: Message = {
              id: generateId(),
              text: `✅ Purchase Successful!\n\n**${product.name}**\nwill be shipped to:\n${fullAddress}\n\nExpected Delivery: 5-7 Days.`,
              sender: Sender.SYSTEM,
              timestamp: new Date()
          };
          setMessages(prev => [...prev, msg]);
          setShowAddressModal(false);
          setSelectedProductForPurchase(null);
          if (view === AppView.SHOP) setView(AppView.CHAT);
      }, phone);
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingData.name || !onboardingData.gender || !onboardingData.date || !onboardingData.time || !onboardingData.place) return;

    setUserState(prev => ({
      ...prev,
      name: onboardingData.name,
      gender: onboardingData.gender,
      birthDate: onboardingData.date,
      birthTime: onboardingData.time,
      birthPlace: onboardingData.place,
      hasOnboarded: true
    }));

    // Initialize Chat with User Context
    const systemInstruction = generateSystemInstruction(
      onboardingData.name,
      onboardingData.gender,
      onboardingData.date,
      onboardingData.time,
      onboardingData.place
    );

    initializeChat(systemInstruction).then(async () => {
        setIsLoading(true);
        // Initial Prompt for Vastu and Destiny - Injecting Current Time
        const now = new Date().toLocaleString();
        try {
            // UPDATED PROMPT: Explicitly asking for Full Vastu in Deep Dive to satisfy "First Output" requirement
            const initialPrompt = `[System: Current Date & Time is ${now}] Start the session. 1. Explain Meaning of Name. 2. Destiny Overview. 3. Current Challenges & Prosperity (Diagnosis). 4. Vastu Hint. 5. Blockage Warning. Deep Dive: 1. Full Vastu Analysis (Brief & Actionable). 2. Remedies.`;
            const responseText = await sendMessageToGemini(initialPrompt);
            
            const welcomeMsg: Message = {
                id: generateId(),
                text: responseText,
                sender: Sender.AI,
                timestamp: new Date(),
                isLocked: true // Initial message is always locked to show the "Gist" behavior
            };
            setMessages([welcomeMsg]);
            
            // Note: We no longer auto-trigger the modal here. 
            // The user must click the "Unlock Full Potential" banner in the message bubble.

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }).catch(console.error);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    // If connected to astrologer, sending logic differs (simulated)
    if (userState.connectedAstrologerId) {
        const userMsg: Message = {
            id: generateId(),
            text: textToSend,
            sender: Sender.USER,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        return;
    }

    if (userState.dailyQuestionsLeft <= 0) {
      setShowPremiumModal(true);
      return;
    }

    const userMsg: Message = {
      id: generateId(),
      text: textToSend,
      sender: Sender.USER,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // INJECT CURRENT DATE AND TIME INTO PROMPT
      const currentTimestamp = new Date().toLocaleString('en-US', {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });
      
      const promptWithContext = `[Current Real-Time: ${currentTimestamp}] ${textToSend}`;

      const responseText = await sendMessageToGemini(promptWithContext);
      
      // Determine lock state based on content type
      const hasDeepDive = responseText.includes("Deep Dive:");
      const shouldLock = !userState.isPremium && hasDeepDive;
      
      // SCAN FOR PRODUCT SUGGESTIONS
      const suggestedProducts = findRelevantProducts(responseText);

      const aiMsg: Message = {
        id: generateId(),
        text: responseText,
        sender: Sender.AI,
        timestamp: new Date(),
        isLocked: shouldLock,
        suggestedProducts: suggestedProducts.length > 0 ? suggestedProducts : undefined
      };

      setMessages(prev => [...prev, aiMsg]);

      // Decrement limit
      setUserState(prev => ({
          ...prev,
          dailyQuestionsLeft: prev.dailyQuestionsLeft - 1
      }));

    } catch (error) {
      console.error("Error sending message", error);
      const errorMsg: Message = {
        id: generateId(),
        text: "The cosmic connection is weak. Please try again.",
        sender: Sender.AI,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockMessage = (messageId: string) => {
    if (!userState.isPremium) {
       setShowPremiumModal(true);
    } else {
      // If already premium, just ensure UI updates (MessageBubble handles local state)
    }
  };

  const handleGuruDakshina = (amount: number) => {
    handlePayment(amount, `Dakshina for Guru`, () => {
        // ACCOUNTING: Guru gets 80% of Dakshina/Tip
        if (userState.connectedAstrologerId) {
            updateEarnings(userState.connectedAstrologerId, 'tips', amount * 0.80);
        }

        const sysMsg: Message = {
            id: generateId(),
            text: `Dakshina of ₹${amount} received with blessings.`,
            sender: Sender.SYSTEM,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, sysMsg]);
        setShowTipModal(false);
    });
  };

  const connectToAstrologer = (astro: Astrologer) => {
      // 1. Resume existing session if it's the same astrologer
      if (userState.connectedAstrologerId === astro.id) {
          setView(AppView.CHAT);
          return;
      }

      // 2. Prevent multiple sessions
      if (userState.connectedAstrologerId) {
          alert("You are already connected to an astrologer. Please end the current session first.");
          return;
      }

      // 3. Initiate New Payment for session
      const sessionCost = astro.pricePerMin * 10;
      handlePayment(sessionCost, `10 Min Session with ${astro.name}`, () => {
          // ACCOUNTING: Guru gets 90% of Chat Session fee
          updateEarnings(astro.id, 'chats', sessionCost * 0.90);

          setUserState(prev => ({
              ...prev,
              connectedAstrologerId: astro.id
          }));
          setRatingTarget(astro);
          setView(AppView.CHAT);
          setMessages(prev => [...prev, {
              id: generateId(),
              text: `System: You are now connected to ${astro.name}. Your session has started.`,
              sender: Sender.SYSTEM,
              timestamp: new Date()
          }]);
      });
  };

  const disconnectAstrologer = () => {
      setUserState(prev => ({
          ...prev,
          connectedAstrologerId: undefined
      }));
      setShowRatingModal(true);
  };

  const handleRateGuru = (rating: number, comment: string) => {
      console.log(`Rated ${rating} stars. Comment: ${comment}`);
      // Send data to backend here
      setShowRatingModal(false);
      setMessages(prev => [...prev, {
          id: generateId(),
          text: `System: Thank you for your feedback. Session Ended.`,
          sender: Sender.SYSTEM,
          timestamp: new Date()
      }]);
  };

  // --- CALL LOGIC ---
  const handleAcceptCall = (type: 'voice' | 'video') => {
      const guru = MOCK_ASTROLOGERS.find(a => a.id === userState.connectedAstrologerId);
      if (guru) {
          setCallState({
              isActive: true,
              type: type,
              partnerName: guru.name,
              partnerImage: guru.imageUrl
          });
      }
  };

  const handleEndCall = () => {
      setCallState(prev => ({ ...prev, isActive: false }));
  };

  // Astrologer Panel Handler (Simulates Guru Actions)
  const handleAstrologerAction = (actionType: 'reply' | 'call' | 'request_payment' | 'end_session' | 'recommend_product' | 'payout', payload: any) => {
      const astroId = userState.connectedAstrologerId || '1'; // Fallback if testing dashboard independently
      
      if (actionType === 'reply') {
        const msg: Message = {
            id: generateId(),
            text: payload,
            sender: Sender.ASTROLOGER,
            astrologerId: astroId,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, msg]);
      } 
      else if (actionType === 'call') {
        const msg: Message = {
            id: generateId(),
            text: `Incoming ${payload} call...`,
            sender: Sender.ASTROLOGER,
            astrologerId: astroId,
            type: MessageType.CALL_OFFER,
            metadata: { callType: payload },
            timestamp: new Date()
        };
        setMessages(prev => [...prev, msg]);
      }
      else if (actionType === 'request_payment') {
          const msg: Message = {
              id: generateId(),
              text: `Guru has requested Dakshina`,
              sender: Sender.ASTROLOGER,
              astrologerId: astroId,
              type: MessageType.PAYMENT_REQUEST,
              metadata: { amount: payload },
              timestamp: new Date()
          };
          setMessages(prev => [...prev, msg]);
      }
      else if (actionType === 'recommend_product') {
          const msg: Message = {
              id: generateId(),
              text: `I highly recommend you use this spiritual remedy for your current dosha.`,
              sender: Sender.ASTROLOGER,
              astrologerId: astroId,
              timestamp: new Date(),
              suggestedProducts: [payload]
          };
          setMessages(prev => [...prev, msg]);
      }
      else if (actionType === 'end_session') {
          disconnectAstrologer();
      }
      else if (actionType === 'payout') {
          const targetAstroId = payload.astroId;
          const amount = payload.amount;
          updateEarnings(targetAstroId, 'withdrawn', amount);
      }
  };

  return (
    <div className="relative min-h-screen font-sans text-mystic-100 flex flex-col bg-mystic-900 overflow-hidden">
      <StarBackground />
      
      {/* Call Interface Overlay */}
      {callState.isActive && (
          <CallInterface 
            partnerName={callState.partnerName} 
            partnerImage={callState.partnerImage} 
            callType={callState.type} 
            onEndCall={handleEndCall} 
          />
      )}

      {/* Header - Fixed Top with Strong Backdrop */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-mystic-900/95 backdrop-blur-2xl transition-all shadow-2xl shadow-black/20">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-900 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
                🔮
            </div>
            <div className="flex flex-col justify-center">
                <h1 className="text-xl md:text-2xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-mystic-200 truncate leading-none">
                    ASTRO-VASTU
                </h1>
                {userState.connectedAstrologerId && (
                     <div className="text-[10px] text-green-400 font-bold tracking-widest flex items-center gap-1 mt-1 animate-in fade-in">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        CONNECTED TO GURU
                     </div>
                )}
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            {/* Show 'Your Chart' if onboarded */}
            {userState.hasOnboarded && (
                <button 
                    onClick={() => setShowChartModal(true)}
                    className="hidden md:flex items-center gap-1 bg-mystic-800/50 hover:bg-gold-500/20 border border-mystic-600 hover:border-gold-500/50 text-mystic-300 hover:text-gold-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    📜 Your Chart
                </button>
            )}

            {/* End Chat Button (User Side) */}
            {userState.connectedAstrologerId && view === AppView.CHAT && (
                 <button 
                    onClick={disconnectAstrologer}
                    className="hidden md:flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    End Chat
                </button>
            )}

            {/* Tip Guru Button (Only when connected) */}
            {userState.connectedAstrologerId && view === AppView.CHAT && (
                <button 
                    onClick={() => setShowTipModal(true)}
                    className="hidden md:flex items-center gap-1 bg-gold-500/20 hover:bg-gold-500/40 border border-gold-500/50 text-gold-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    <span>🕉️</span> Tip Guru
                </button>
            )}

            {userState.hasOnboarded && !userState.connectedAstrologerId && (
                <div 
                    onClick={() => !userState.isPremium && setShowPremiumModal(true)}
                    className="cursor-pointer hidden md:flex flex-col items-end mr-2 group"
                >
                    <span className="text-xs text-mystic-300 uppercase tracking-wider">
                        {userState.isPremium ? 'Premium Energy' : 'Free Energy'}
                    </span>
                    <div className="flex gap-1 mt-1">
                        {/* Show remaining questions visually limited to 10 dots max to avoid UI break */}
                        {[...Array(Math.min(10, Math.max(0, userState.dailyQuestionsLeft)))].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${userState.isPremium ? 'bg-indigo-400 shadow-[0_0_8px_#818CF8]' : 'bg-gold-400 shadow-[0_0_8px_#FBBF24]'}`} />
                        ))}
                        {/* Show used/empty slots if count is low */}
                        {!userState.isPremium && [...Array(Math.max(0, INITIAL_DAILY_LIMIT - userState.dailyQuestionsLeft))].map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-mystic-700 border border-white/10" />
                        ))}
                    </div>
                </div>
            )}
            
            {/* Main Navigation Tabs - Desktop */}
            {userState.hasOnboarded && (
                <div className="hidden md:flex bg-white/5 rounded-full p-1 border border-white/10">
                    <button 
                        onClick={() => setView(AppView.CHAT)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === AppView.CHAT ? 'bg-mystic-100 text-mystic-900' : 'text-mystic-400 hover:text-white'}`}
                    >
                        Chat
                    </button>
                    <button 
                        onClick={() => setView(AppView.MARKETPLACE)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === AppView.MARKETPLACE ? 'bg-mystic-100 text-mystic-900' : 'text-mystic-400 hover:text-white'}`}
                    >
                        Gurus
                    </button>
                    <button 
                        onClick={() => setView(AppView.SHOP)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === AppView.SHOP ? 'bg-mystic-100 text-mystic-900' : 'text-mystic-400 hover:text-white'}`}
                    >
                        Shop
                    </button>
                </div>
            )}
            
            {/* Mobile Navigation Toggle (Simple for now: Toggle View) */}
            {userState.hasOnboarded && (
                 <button 
                    onClick={() => {
                        // Cyclic toggle for mobile convenience
                        if(view === AppView.CHAT) setView(AppView.SHOP);
                        else if(view === AppView.SHOP) setView(AppView.MARKETPLACE);
                        else setView(AppView.CHAT);
                    }}
                    className="md:hidden px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xs font-bold"
                 >
                    {view === AppView.CHAT ? 'Shop' : view === AppView.SHOP ? 'Gurus' : 'Chat'}
                 </button>
            )}
        </div>
      </header>

      {/* Main Content Area - Padded for Fixed Header */}
      <main className="relative z-10 flex-1 flex flex-col max-w-5xl w-full mx-auto h-screen pt-20 md:pt-24">
        
        {!userState.hasOnboarded ? (
            // Onboarding View
            <div className="flex items-center justify-center h-full p-4 pb-20 overflow-y-auto">
                <div className="bg-mystic-800/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl animate-float">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-gold-500/20">
                            <span className="text-3xl">✨</span>
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-2">Vedic Onboarding</h2>
                        <p className="text-mystic-300 text-sm">Enter your birth details for accurate Kundali & Vastu analysis.</p>
                    </div>

                    <form onSubmit={handleOnboardingSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-mystic-400 font-bold ml-1">Your Name</label>
                            <input 
                                type="text" 
                                required
                                value={onboardingData.name}
                                onChange={e => setOnboardingData({...onboardingData, name: e.target.value})}
                                className="w-full bg-mystic-900/50 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
                                placeholder="Seeker"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-mystic-400 font-bold ml-1">Gender</label>
                            <select
                                required
                                value={onboardingData.gender}
                                onChange={e => setOnboardingData({...onboardingData, gender: e.target.value})}
                                className="w-full bg-mystic-900/50 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="bg-mystic-900 text-gray-500">Select Gender</option>
                                <option value="Male" className="bg-mystic-900">Male</option>
                                <option value="Female" className="bg-mystic-900">Female</option>
                                <option value="Other" className="bg-mystic-900">Other</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-widest text-mystic-400 font-bold ml-1">Birth Date</label>
                                <input 
                                    type="date" 
                                    required
                                    value={onboardingData.date}
                                    onChange={e => setOnboardingData({...onboardingData, date: e.target.value})}
                                    className="w-full bg-mystic-900/50 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-all [color-scheme:dark]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-widest text-mystic-400 font-bold ml-1">Time</label>
                                <input 
                                    type="time" 
                                    required
                                    value={onboardingData.time}
                                    onChange={e => setOnboardingData({...onboardingData, time: e.target.value})}
                                    className="w-full bg-mystic-900/50 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-mystic-400 font-bold ml-1">Place of Birth</label>
                            <input 
                                type="text" 
                                required
                                value={onboardingData.place}
                                onChange={e => setOnboardingData({...onboardingData, place: e.target.value})}
                                className="w-full bg-mystic-900/50 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-all"
                                placeholder="Mumbai, India"
                            />
                        </div>

                        <button 
                            type="submit"
                            className="w-full mt-4 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-mystic-950 font-bold py-3.5 rounded-xl shadow-lg shadow-gold-500/20 transform transition-all active:scale-[0.98]"
                        >
                            Reveal Destiny & Vastu
                        </button>
                    </form>
                </div>
            </div>
        ) : (
            // App Content
            <>
                {view === AppView.ASTRO_DASHBOARD ? (
                    <AstrologerDashboard 
                        activeUser={userState} 
                        messages={messages} 
                        onAction={handleAstrologerAction} 
                        earnings={astrologerEarnings}
                    />
                ) : view === AppView.CHAT ? (
                    // Chat View
                    <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
                        <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 pb-48 pt-4 px-4 md:px-0">
                            {messages.map((msg) => (
                                <MessageBubble 
                                    key={msg.id} 
                                    message={msg} 
                                    onUnlock={handleUnlockMessage}
                                    onPay={(amount) => handleGuruDakshina(amount)}
                                    onAcceptCall={handleAcceptCall}
                                    onSubscribe={() => setShowPremiumModal(true)}
                                    onBuyProduct={initiateProductPurchase}
                                    userHasPremium={userState.isPremium}
                                    userName={userState.name}
                                />
                            ))}
                            {isLoading && (
                                <div className="flex w-full mb-6 items-center gap-3 animate-pulse">
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-mystic-900 border border-white/20 flex items-center justify-center text-lg">
                                        🔮
                                    </div>
                                    <div className="bg-mystic-800/50 px-5 py-3 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-3">
                                        <span className="text-xs text-gold-400 font-serif tracking-widest uppercase">Consulting the stars</span>
                                        <div className="flex gap-1 mt-1">
                                            <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Sticky Input Area */}
                        <div className="fixed bottom-0 left-0 w-full z-40 pointer-events-none">
                            <div className="max-w-5xl mx-auto relative px-4 pb-6 pt-4 bg-gradient-to-t from-mystic-900 via-mystic-900 to-transparent pointer-events-auto">
                                
                                {/* Suggested Questions */}
                                {!isLoading && !userState.connectedAstrologerId && (
                                    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
                                        {SUGGESTED_QUESTIONS.map((q, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => handleSendMessage(q)}
                                                className="whitespace-nowrap px-3 py-1.5 bg-mystic-800/80 hover:bg-gold-500/20 border border-mystic-600 hover:border-gold-500/50 rounded-full text-xs text-mystic-200 transition-colors"
                                            >
                                                ✨ {q}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="relative flex items-center bg-mystic-800/80 backdrop-blur-xl border border-mystic-600/30 rounded-full p-2 shadow-2xl">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder={
                                            userState.connectedAstrologerId 
                                            ? "Message your astrologer..." 
                                            : userState.dailyQuestionsLeft <= 0 
                                                ? "Daily limit reached..." 
                                                : "Ask about your career, marriage, or vastu..."
                                        }
                                        disabled={userState.dailyQuestionsLeft <= 0 && !userState.connectedAstrologerId}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-mystic-400 px-4 py-2 font-sans text-lg outline-none"
                                    />
                                    <button
                                        onClick={() => handleSendMessage()}
                                        disabled={!input.trim() || isLoading || (userState.dailyQuestionsLeft <= 0 && !userState.connectedAstrologerId)}
                                        className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white hover:shadow-lg hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                                    >
                                        <svg className="w-6 h-6 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {/* Floating Top Bar for Zero State */}
                                {userState.dailyQuestionsLeft <= 0 && !userState.connectedAstrologerId && (
                                    <div className="absolute -top-4 left-0 right-0 text-center">
                                        <span 
                                            onClick={() => setShowPremiumModal(true)}
                                            className="inline-block text-xs font-bold text-gold-900 bg-gold-400 px-4 py-1.5 rounded-full cursor-pointer hover:bg-gold-300 border border-gold-500/50 shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-bounce"
                                        >
                                            {userState.isPremium ? 'Daily Limit Reached (10/10)' : 'Unlock More Questions 🔓'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : view === AppView.MARKETPLACE ? (
                    // Marketplace View (Astrologers)
                    <div className="flex-1 overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-right-4 duration-300 p-4 md:p-0">
                        <div className="text-center mb-8 mt-4">
                            <h2 className="text-3xl font-serif text-white mb-2">Vedic Gurus</h2>
                            <p className="text-mystic-300">Consult verified astrologers for personalized remedies.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                            {MOCK_ASTROLOGERS.map(astro => (
                                <AstroCard 
                                    key={astro.id} 
                                    astrologer={astro} 
                                    onConnect={connectToAstrologer} 
                                    connectedAstrologerId={userState.connectedAstrologerId}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    // Shop View
                    <Shop onBuy={initiateProductPurchase} />
                )}
            </>
        )}
      </main>

      {/* Natal Chart Modal */}
      {showChartModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-mystic-900 border border-gold-500/50 p-6 rounded-3xl max-w-lg w-full relative shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                  <button 
                      onClick={() => setShowChartModal(false)}
                      className="absolute top-4 right-4 text-mystic-500 hover:text-white"
                  >
                      ✕
                  </button>
                  <h3 className="text-xl font-serif text-white mb-6 text-center">Your Vedic Birth Chart</h3>
                  <NatalChart 
                      name={userState.name}
                      date={userState.birthDate || 'Unknown'}
                      time={userState.birthTime || 'Unknown'}
                      place={userState.birthPlace || 'Unknown'}
                  />
                  <p className="text-center text-xs text-mystic-400 mt-4 italic">
                      This chart is generated based on your birth details. Consult a Guru for a detailed reading.
                  </p>
              </div>
          </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-mystic-800 border border-gold-500/30 p-6 rounded-2xl w-full max-w-xs text-center shadow-2xl">
                 <h3 className="text-gold-400 font-serif mb-4">Support the Guru</h3>
                 <input 
                    type="number" 
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="Enter Amount (₹)"
                    className="w-full bg-mystic-900 border border-mystic-600 rounded-lg px-4 py-2 mb-4 text-center text-white outline-none focus:border-gold-500"
                 />
                 <div className="grid grid-cols-3 gap-2 mb-4">
                    {[51, 101, 501].map(amt => (
                        <button key={amt} onClick={() => setTipAmount(amt.toString())} className="bg-mystic-700 hover:bg-mystic-600 py-1 rounded-text-xs">
                            ₹{amt}
                        </button>
                    ))}
                 </div>
                 <button 
                    onClick={() => {
                        const amt = Number(tipAmount);
                        if(amt > 0) handleGuruDakshina(amt);
                    }}
                    className="w-full bg-gold-500 hover:bg-gold-400 text-mystic-900 font-bold py-2 rounded-lg"
                 >
                    Send Dakshina
                 </button>
                 <button onClick={() => setShowTipModal(false)} className="mt-3 text-xs text-mystic-500">Cancel</button>
             </div>
          </div>
      )}

      {/* Address & Checkout Modal */}
      {showAddressModal && selectedProductForPurchase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-mystic-800 border border-gold-500/30 p-6 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                      <img src={selectedProductForPurchase.imageUrl} className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                      <div>
                          <h3 className="text-white font-serif text-lg leading-tight">{selectedProductForPurchase.name}</h3>
                          <p className="text-gold-400 font-bold mt-1">₹{selectedProductForPurchase.price.toLocaleString()}</p>
                      </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                      <h4 className="text-xs uppercase tracking-widest text-mystic-400 font-bold mb-2">Shipping Details</h4>
                      
                      <div className="space-y-1">
                          <input 
                              type="text"
                              value={shippingDetails.address}
                              onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                              placeholder="Flat / House No / Street Area"
                              className="w-full bg-mystic-900/50 border border-mystic-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500/50"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <input 
                              type="text"
                              value={shippingDetails.city}
                              onChange={(e) => setShippingDetails({...shippingDetails, city: e.target.value})}
                              placeholder="City"
                              className="w-full bg-mystic-900/50 border border-mystic-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500/50"
                          />
                          <input 
                              type="text"
                              value={shippingDetails.pincode}
                              onChange={(e) => setShippingDetails({...shippingDetails, pincode: e.target.value})}
                              placeholder="Pincode"
                              className="w-full bg-mystic-900/50 border border-mystic-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500/50"
                          />
                      </div>

                      <div className="space-y-1 pt-1">
                          <input 
                              type="tel"
                              value={shippingDetails.phone}
                              onChange={(e) => setShippingDetails({...shippingDetails, phone: e.target.value})}
                              placeholder="Phone Number (+91)"
                              className="w-full bg-mystic-900/50 border border-mystic-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500/50"
                          />
                      </div>
                  </div>
                  
                  <button 
                      onClick={confirmPurchaseWithAddress}
                      className="w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-mystic-950 font-bold py-3.5 rounded-xl shadow-lg mb-3 transform transition-all active:scale-[0.98]"
                  >
                      Proceed to Pay
                  </button>
                  <button 
                      onClick={() => {
                          setShowAddressModal(false);
                          setSelectedProductForPurchase(null);
                      }}
                      className="w-full text-mystic-500 text-sm hover:text-white transition-colors"
                  >
                      Cancel Order
                  </button>
              </div>
          </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && ratingTarget && (
        <RatingModal 
            guruName={ratingTarget.name}
            guruImage={ratingTarget.imageUrl}
            onSubmit={handleRateGuru}
            onSkip={() => setShowRatingModal(false)}
        />
      )}

      {/* Premium/Unlock Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gradient-to-b from-mystic-800 to-mystic-900 border border-gold-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.2)] relative overflow-hidden">
                <button 
                    onClick={() => setShowPremiumModal(false)}
                    className="absolute top-4 right-4 text-mystic-400 hover:text-white"
                >
                    ✕
                </button>

                <div className="w-16 h-16 bg-mystic-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                    <span className="text-3xl">✨</span>
                </div>

                <h3 className="text-2xl font-serif text-white mb-2">Align Your Stars</h3>
                <p className="text-mystic-300 mb-6 text-sm leading-relaxed">
                    {userState.isPremium 
                        ? "You have reached your daily limit of 10 questions. Come back tomorrow for more guidance."
                        : "Unlock the full prediction and remedies. Join our premium circle for 10 daily questions."}
                </p>

                {!userState.isPremium && (
                    <div className="space-y-3">
                        <button 
                            onClick={() => handlePayment(299, "Monthly Subscription", () => {
                                setUserState(prev => ({ ...prev, isPremium: true, dailyQuestionsLeft: PREMIUM_DAILY_LIMIT }));
                                setShowPremiumModal(false);
                            })}
                            className="w-full group relative bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-mystic-950 font-bold py-4 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02]"
                        >
                            <span className="flex flex-col items-center">
                                <span className="text-base">Monthly Subscription</span>
                                <span className="text-xs opacity-80">₹299 / month (10 Q/day + Remedies)</span>
                            </span>
                             <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                        </button>

                        <button 
                            onClick={() => handlePayment(99, "One Time Question", () => {
                                setUserState(prev => ({ ...prev, dailyQuestionsLeft: prev.dailyQuestionsLeft + 1 }));
                                setShowPremiumModal(false);
                            })}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-mystic-200 font-semibold py-3 rounded-xl transition-colors"
                        >
                             Ask 1 Question (₹99)
                        </button>
                    </div>
                )}
                
                {userState.isPremium && (
                     <button 
                        onClick={() => setShowPremiumModal(false)}
                        className="w-full bg-mystic-700 hover:bg-mystic-600 text-white font-bold py-3 rounded-xl transition-colors"
                     >
                         I will wait for tomorrow
                     </button>
                )}
            </div>
        </div>
      )}

        {/* Small Astrologer Login Link (Bottom Left) */}
        {userState.hasOnboarded && (
            <div className="fixed bottom-2 left-2 z-50 opacity-30 hover:opacity-100 transition-opacity pointer-events-auto">
                <button 
                    onClick={() => setView(view === AppView.ASTRO_DASHBOARD ? AppView.CHAT : AppView.ASTRO_DASHBOARD)}
                    className="text-[10px] text-mystic-500 hover:text-gold-400"
                >
                    {view === AppView.ASTRO_DASHBOARD ? "Exit" : "Guru Login"}
                </button>
            </div>
        )}
    </div>
  );
}
