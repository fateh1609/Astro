
import { supabase } from './supabaseClient';
import { Product, Transaction, UserState, Message, Astrologer, CommunicationLog, UsageLog } from '../types';
import { MOCK_PRODUCTS, MOCK_ASTROLOGERS } from '../constants';
import { hashPassword, compressAndEncrypt, decryptAndDecompress } from './securityService';

// --- HELPERS ---
export const generateReferenceId = (type: 'Product' | 'Subscription' | 'Dakshina' | 'Consultation' | 'Log', subtype?: string) => {
    const random = Math.floor(1000 + Math.random() * 9000);
    let prefix = 'GEN';
    
    switch(type) {
        case 'Product': prefix = 'STR'; break; // Store
        case 'Consultation': prefix = 'CNS'; break;
        case 'Subscription': prefix = 'SUB'; break;
        case 'Dakshina': prefix = 'TIP'; break;
        case 'Log': prefix = 'LOG'; break;
    }
    
    // Add subtype for Subs (e.g. SUB-MTH-1234)
    if (subtype && type === 'Subscription') {
        let tierCode = 'GEN';
        const lowerSub = subtype.toLowerCase();
        if (lowerSub.includes('monthly')) tierCode = 'MTH';
        else if (lowerSub.includes('yearly')) tierCode = 'YR';
        else if (lowerSub.includes('one')) tierCode = 'ONE';
        else if (lowerSub.includes('elite')) tierCode = 'ELT';
        
        return `${prefix}-${tierCode}-${random}`;
    }
    
    return `${prefix}-${random}`;
};

// --- NATAL CACHE (Deterministic Responses) ---
export const fetchCachedReading = async (key: string): Promise<string | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('natal_cache')
            .select('response')
            .eq('id', key)
            .maybeSingle();
            
        if (error || !data) return null;
        return data.response;
    } catch (e) {
        return null;
    }
};

export const saveCachedReading = async (key: string, response: string) => {
    if (!supabase) return;
    try {
        await supabase
            .from('natal_cache')
            .upsert({ id: key, response }, { onConflict: 'id' });
    } catch (e) {
        console.warn("Failed to cache reading", e);
    }
};

// --- LOGGING ---
export const logCommunication = async (
    type: CommunicationLog['type'],
    recipient: string,
    direction: CommunicationLog['direction'],
    status: CommunicationLog['status'],
    details?: string
) => {
    const logId = generateReferenceId('Log');
    console.log(`[${logId}] ${direction.toUpperCase()} ${type} to ${recipient}: ${status} (${details})`);
    
    if (supabase) {
        try {
            await supabase.from('communications').insert([{
                id: logId,
                type,
                recipient,
                direction,
                status,
                details,
                timestamp: new Date().toISOString()
            }]);
        } catch (e) {
            // Ignore insert errors if table doesn't exist in demo
        }
    }
};

export const fetchCommunicationLogs = async (): Promise<CommunicationLog[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase.from('communications').select('*').order('timestamp', { ascending: false });
        if (error || !data || data.length === 0) return [];
        
        return data.map((log: any) => ({
            id: log.id,
            type: log.type,
            recipient: log.recipient,
            direction: log.direction,
            status: log.status,
            timestamp: log.timestamp,
            details: log.details
        }));
    } catch (e) {
        return [];
    }
};

// --- TOKEN USAGE TRACKING (Backend) ---
export const logTokenUsage = async (userId: string, feature: string, inputTokens: number, outputTokens: number) => {
    if (!supabase) return;
    try {
        await supabase.from('usage_logs').insert([{
            user_id: userId,
            feature: feature,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: inputTokens + outputTokens,
            timestamp: new Date().toISOString()
        }]);
    } catch (e) {
        console.error("Failed to log usage", e);
    }
};

export const fetchUsageStats = async () => {
    if (!supabase) return { totalRequests: 0, estimatedTokens: 0 };
    try {
        const { data, error } = await supabase.from('usage_logs').select('total_tokens');
        if (error || !data) return { totalRequests: 0, estimatedTokens: 0 };
        
        const totalTokens = data.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
        return {
            totalRequests: data.length,
            estimatedTokens: totalTokens
        };
    } catch (e) {
        return { totalRequests: 0, estimatedTokens: 0 };
    }
};

// --- AUTHENTICATION (OTP) ---
export const sendAuthOtp = async (contact: string): Promise<{ success: boolean; message?: string; isRateLimit?: boolean }> => {
    if (!supabase) return { success: false, message: "System not initialized" };

    const isEmail = /[a-zA-Z@]/.test(contact);

    await logCommunication(isEmail ? 'email' : 'sms', contact, 'outbound', 'sent', 'OTP Requested');

    try {
        let error;
        if (isEmail) {
            const res = await supabase.auth.signInWithOtp({
                email: contact,
                options: { shouldCreateUser: true }
            });
            error = res.error;
        } else {
            const phone = contact.replace(/[\s-]/g, '');
            const res = await supabase.auth.signInWithOtp({
                phone: phone,
                options: { shouldCreateUser: true }
            });
            error = res.error;
        }

        if (error) {
            const msg = error.message.toLowerCase();
            await logCommunication(isEmail ? 'email' : 'sms', contact, 'outbound', 'failed', `Error: ${msg}`);
            
            if (msg.includes('security') || msg.includes('seconds') || msg.includes('rate limit')) {
                return { success: false, message: error.message, isRateLimit: true };
            }
            throw error;
        }
        
        return { success: true };
    } catch (e: any) {
        console.error("Auth Error:", e);
        return { success: false, message: e.message };
    }
};

export const verifyAuthOtp = async (contact: string, token: string): Promise<{ success: boolean; message?: string }> => {
    if (!supabase) return { success: false, message: "System not initialized" };

    const isEmail = /[a-zA-Z@]/.test(contact);

    try {
        let error;
        let data;

        if (isEmail) {
            ({ data, error } = await supabase.auth.verifyOtp({
                email: contact,
                token: token,
                type: 'email'
            }));
        } else {
            const phone = contact.replace(/[\s-]/g, '');
            ({ data, error } = await supabase.auth.verifyOtp({
                phone: phone,
                token: token,
                type: 'sms'
            }));
        }

        if (error) {
            if (error.message.includes("Token has expired") || error.message.includes("Signups not allowed")) {
                return { success: false, message: error.message };
            }
            throw error;
        }
        
        if (data.session) {
            await logCommunication(isEmail ? 'email' : 'sms', contact, 'inbound', 'completed', 'OTP Verified');
            
            // --- PROFILE SYNC FIX ---
            // Ensure the profile exists in public.profiles. If not, create a skeleton.
            const user = data.session.user;
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('id').eq('contact', contact).single();
                
                if (!profile) {
                    console.log("Creating new skeleton profile for", contact);
                    // New user via OTP, create entry in profiles
                    await supabase.from('profiles').insert([{
                        id: user.id, // Sync Auth ID with Profile ID if possible, or let DB gen UUID
                        contact: contact,
                        name: contact.split('@')[0], // Default name
                        daily_questions_left: 1, // Default limit
                        is_premium: false
                    }]);
                }
            }
            // ------------------------

            return { success: true };
        } else {
            return { success: false, message: "Invalid code. Please try again." };
        }
    } catch (e: any) {
        console.error("Verify Error:", e);
        return { success: false, message: "Verification failed. Check code and try again." };
    }
};

export const resetUserPassword = async (contact: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!supabase) return { success: false, message: "System not initialized" };
    try {
        const hashedPassword = await hashPassword(newPassword);
        const { error } = await supabase
            .from('profiles')
            .update({ password: hashedPassword })
            .eq('contact', contact);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        console.error("Reset Password Error:", e);
        return { success: false, message: "Failed to update password." };
    }
};

// --- SEEDING ---
export const seedDatabase = async () => {
    if (!supabase) return;
    try {
        const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        if (prodCount === 0) {
            const productsPayload = MOCK_PRODUCTS.map(p => ({
                name: p.name,
                category: p.category,
                price: p.price,
                description: p.description,
                benefits: p.benefits,
                image_url: p.imageUrl
            }));
            await supabase.from('products').insert(productsPayload);
        }

        const { count: astroCount } = await supabase.from('astrologers').select('*', { count: 'exact', head: true });
        if (astroCount === 0) {
            const astroPayload = MOCK_ASTROLOGERS.map(a => ({
                name: a.name,
                specialty: a.specialty,
                rating: a.rating,
                reviews: a.reviews,
                price_per_min: a.pricePerMin,
                image_url: a.imageUrl,
                is_online: a.isOnline
            }));
            await supabase.from('astrologers').insert(astroPayload);
        }

    } catch (e) {
        console.error("DB: Exception during seeding", e);
    }
};

// --- REALTIME SUBSCRIPTIONS ---
export const subscribeToTable = (table: string, callback: (payload: any) => void) => {
    if (!supabase) return null;
    return supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: table }, callback)
        .subscribe();
};

// --- ASTROLOGERS ---
export const fetchAstrologers = async (): Promise<Astrologer[]> => {
    if (!supabase) return MOCK_ASTROLOGERS;
    try {
        const { data, error } = await supabase.from('astrologers').select('*').order('is_online', { ascending: false });
        if (error || !data) return MOCK_ASTROLOGERS;

        return data.map((a: any) => ({
            id: a.id,
            name: a.name,
            specialty: a.specialty,
            rating: a.rating,
            reviews: a.reviews,
            pricePerMin: a.price_per_min,
            imageUrl: a.image_url,
            isOnline: a.is_online
        }));
    } catch (e) {
        return MOCK_ASTROLOGERS;
    }
};

export const saveAstrologer = async (astro: Partial<Astrologer>) => {
    if (!supabase) return;
    const payload = {
        name: astro.name,
        specialty: astro.specialty,
        rating: astro.rating,
        reviews: astro.reviews,
        price_per_min: astro.pricePerMin,
        image_url: astro.imageUrl,
        is_online: astro.isOnline
    };
    if (astro.id && astro.id.length > 10) { 
        await supabase.from('astrologers').update(payload).eq('id', astro.id);
    } else { 
        await supabase.from('astrologers').insert([payload]);
    }
};

export const deleteAstrologer = async (id: string) => {
    if (!supabase) return;
    await supabase.from('astrologers').delete().eq('id', id);
};


// --- PRODUCTS ---
export const fetchProducts = async (): Promise<Product[]> => {
  if (!supabase) return MOCK_PRODUCTS;
  
  try {
      const { data, error } = await supabase.from('products').select('*');
      
      if (error || !data || data.length === 0) return MOCK_PRODUCTS;
      
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description,
        benefits: p.benefits,
        imageUrl: p.image_url 
      }));
  } catch (e) {
      return MOCK_PRODUCTS;
  }
};

export const createProduct = async (product: Product): Promise<Product | null> => {
  if (!supabase) return product;

  try {
      const payload = {
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        benefits: product.benefits,
        image_url: product.imageUrl
      };
      
      let data, error;
      
      if (product.id && product.id.length > 10 && !product.id.startsWith('p')) {
          ({ data, error } = await supabase.from('products').update(payload).eq('id', product.id).select().single());
      } else {
          ({ data, error } = await supabase.from('products').insert([payload]).select().single());
      }

      if (error) {
          console.error("Product Save Error:", error);
          return null;
      }
      return { 
          ...product, 
          id: data.id,
          name: data.name,
          imageUrl: data.image_url,
          category: data.category
      };
  } catch (e) {
      console.error("Product Save Exception:", e);
      return null;
  }
};

export const deleteProductFromDb = async (id: string): Promise<boolean> => {
    if (!supabase) return true;
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        return !error;
    } catch (e) {
        return false;
    }
};

// --- TRANSACTIONS ---
export const fetchTransactions = async (): Promise<Transaction[]> => {
  if (!supabase) return [];

  try {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (error) return [];

      return data.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        userName: t.user_name,
        amount: t.amount,
        type: t.type,
        status: t.status,
        date: new Date(t.created_at).toISOString().split('T')[0],
        details: t.details
      }));
  } catch (e) {
      return [];
  }
};

export const saveTransaction = async (tx: Transaction) => {
  if (!supabase) return;
  try {
      await supabase.from('transactions').insert([{
        id: tx.id, 
        user_id: tx.userId,
        user_name: tx.userName,
        amount: tx.amount,
        type: tx.type,
        details: tx.details,
        status: tx.status,
        created_at: new Date().toISOString()
      }]);
  } catch (e) {
      console.error("DB: Exception saving transaction", e);
  }
};

// --- USERS ---
export const fetchProfiles = async () => {
    if (!supabase) return [];
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return data || [];
};

export const updateProfile = async (id: string, updates: any) => {
    if (!supabase) return;
    await supabase.from('profiles').update(updates).eq('id', id);
};

export const fetchUserProfile = async (contact: string | string[]): Promise<{ profile: any | null, chatHistory: Message[] }> => {
  if (!supabase) return { profile: null, chatHistory: [] };
  
  try {
      let query = supabase.from('profiles').select('*');
      
      if (Array.isArray(contact)) {
          query = query.in('contact', contact);
      } else {
          query = query.eq('contact', contact);
      }

      const { data, error } = await query.limit(1).maybeSingle();
      
      if (error || !data) return { profile: null, chatHistory: [] };

      let messages: Message[] = [];
      if (data.chat_history) {
          const decrypted = decryptAndDecompress(data.chat_history);
          if (decrypted) {
              messages = decrypted.map((m: any) => ({
                  ...m,
                  timestamp: new Date(m.timestamp)
              }));
          }
      }
      
      return {
        profile: {
            id: data.id,
            contact: data.contact, 
            name: data.name,
            gender: data.gender,
            birthDate: data.birth_date,
            birthTime: data.birth_time,
            birthPlace: data.birth_place,
            isPremium: data.is_premium,
            dailyQuestionsLeft: data.daily_questions_left,
            subscriptionExpiry: data.subscription_expiry ? new Date(data.subscription_expiry) : undefined,
            password: data.password 
        },
        chatHistory: messages
      };
  } catch (e) {
      return { profile: null, chatHistory: [] };
  }
};

export const generateUniqueUsername = async (fullName: string): Promise<string> => {
    if (!supabase) return fullName.split(' ')[0];
    
    const firstName = fullName.trim().split(' ')[0];
    
    try {
        const { data } = await supabase
            .from('profiles')
            .select('name')
            .ilike('name', `%${firstName}`);
            
        if (!data || data.length === 0) return firstName;
        
        const matches = data.filter(p => 
            p.name.toLowerCase() === firstName.toLowerCase() || 
            p.name.toLowerCase().endsWith(` ${firstName.toLowerCase()}`)
        );
        
        if (matches.length === 0) return firstName;
        
        const count = matches.length;
        const prefix = count.toString().padStart(2, '0');
        return `+${prefix} ${firstName}`;
        
    } catch (e) {
        return firstName;
    }
};

export const saveUserProfile = async (user: UserState, password?: string, messages?: Message[]) => {
  if (!supabase) return;
  if (!user.contact) return; 

  try {
      const payload: any = {
        contact: user.contact,
        name: user.name || '',
        gender: user.gender || '',
        birth_date: user.birthDate || '',
        birth_time: user.birthTime || '',
        birth_place: user.birthPlace || '',
        is_premium: !!user.isPremium,
        daily_questions_left: typeof user.dailyQuestionsLeft === 'number' ? user.dailyQuestionsLeft : 0,
        subscription_expiry: user.subscriptionExpiry ? user.subscriptionExpiry.toISOString() : null
      };

      if (password) payload.password = await hashPassword(password);
      if (messages && messages.length > 0) payload.chat_history = compressAndEncrypt(messages);

      await supabase.from('profiles').upsert(payload, { onConflict: 'contact' });
  } catch (e) {
      console.error("DB: Critical Exception saving profile", e);
  }
};
