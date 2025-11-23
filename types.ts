
export enum Sender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
  ASTROLOGER = 'astrologer'
}

export enum MessageType {
  TEXT = 'text',
  CALL_OFFER = 'call_offer', // Video/Voice call request
  PAYMENT_REQUEST = 'payment_request', // Dakshina/Tip request
  SYSTEM_NOTIF = 'system_notif'
}

export interface Product {
  id: string;
  name: string;
  category: 'gemstone' | 'rudraksha' | 'pooja' | 'yantra' | 'incense';
  price: number;
  description: string;
  benefits: string;
  imageUrl: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  type?: MessageType; // Defaults to TEXT
  timestamp: Date;
  isGist?: boolean; 
  isLocked?: boolean;
  fullContent?: string;
  astrologerId?: string; // If sent by a real astrologer
  suggestedProducts?: Product[]; // For context-aware e-commerce suggestions
  metadata?: {
    amount?: number; // For payment requests
    callType?: 'voice' | 'video'; // For call offers
  };
}

export interface Astrologer {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  pricePerMin: number; // In INR
  imageUrl: string;
  isOnline: boolean;
}

export interface Earnings {
  chats: number;
  products: number;
  tips: number;
  withdrawn: number;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
}

export interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  status: 'Processing' | 'Completed' | 'Failed';
  referenceId: string;
}

export interface UserState {
  dailyQuestionsLeft: number;
  isPremium: boolean;
  name: string;
  gender?: string;
  zodiacSign?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  hasOnboarded: boolean;
  connectedAstrologerId?: string;
  subscriptionExpiry?: Date;
}

export interface CallState {
  isActive: boolean;
  type: 'voice' | 'video';
  partnerName: string;
  partnerImage: string;
}

export enum AppView {
  CHAT = 'chat',
  MARKETPLACE = 'marketplace',
  SHOP = 'shop',
  PROFILE = 'profile',
  ASTRO_DASHBOARD = 'astro_dashboard'
}
