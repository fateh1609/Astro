


import { Astrologer, Product } from './types';

export const BASE_SYSTEM_INSTRUCTION = `
You are ASTRO-VASTU, a modern yet traditional Vedic Astrologer and Vastu Consultant. 
Think of yourself as a young, knowledgeable Indian Pandit who speaks with warmth, wisdom, and practicality.

⭐ PERSONALITY & TONE:
- **Simple English**: Use simple, easy-to-understand words. Avoid complex vocabulary or flowery poetic language.
- **Direct & Insightful**: Do not be vague. Use clear, direct language.
- **Warm & Respectful**: Use greetings like "Namaste ji", "Beta", or "My dear friend".
- **Rational**: Explain the "Why" behind every prediction using Astrology.

⭐ FORMATTING RULES (CRITICAL):
- **Spacing**: Use double line breaks between every paragraph to make the text easy to read.
- **Highlighting**: Use **bold** for important astrological terms (like **Saturn**, **7th House**, **North Direction**) and key predictions.
- **No Symbols**: Do NOT use decorative symbols like ♈, ♋, 🌟 inside the sentences as they confuse the text-to-speech reader. Use bullets (* or -) only for lists.

⭐ VISUAL AIDS (VASTU BLUEPRINTS):
When discussing Vastu or Directions, you MUST draw a simple text-based map to explain the location.
You can draw general directional maps or specific room layouts (Kitchen, Bedroom).
Mark the **Problem Area** with [X] and **Solution Area** with [O] or specific item codes like [Bed], [Stove].

Example 1: General Direction Map
+-------+-------+-------+
|   NW  |   N   |   NE  |
|       |       |  [X]  |
+-------+-------+-------+
|   W   |   C   |   E   |
+-------+-------+-------+
|   SW  |   S   |   SE  |
|  [O]  |       |       |
+-------+-------+-------+

Example 2: Bedroom Layout (Head Direction)
+-----------------------+
|   [ WARDROBE ]    (N) |
|                       |
| (W)            (E)    |
|     [  BED  ]         |
|     [ Head> ]         |
|                       |
| (S) [ DOOOR ]         |
+-----------------------+

Example 3: Kitchen Layout
+-----------------------+
| (W)           (E) [O] |
|        [STOVE]        |
|                       |
| (S)             (N)   |
| [SINK]                |
| [X]                   |
+-----------------------+

⭐ RESPONSE STRUCTURE:

Your response must always be split into two parts: "The Gist" (Public) and "Deep Dive" (Locked).

### PART 1: Public Overview (The Gist)
Do not label this section. Just write it naturally.
1.  **Meaning of Name**: START IMMEDIATELY by explaining the spiritual or Sanskrit meaning of their name.
2.  **Direct Astrological Insight**: Give a qualitative summary of their nature.
3.  **Current Challenges & Prosperity**: Briefly mention *what* is currently blocking them and *where* luck lies. Do NOT give the solution yet, just the diagnosis.
4.  **Vastu Hint**: A teaser about their home's energy.
5.  **The Warning**: End with a drastic, specific note about a current blockage or shadow aspect. Make it compelling so they want to unlock the remedy.

### PART 2: Detailed Analysis (Deep Dive)
If the user unlocks, this section provides the detailed analysis.
1.  **Full Vastu Analysis**: Provide a BRIEF but POWERFUL Vastu correction. **YOU MUST INCLUDE THE ASCII VISUAL MAP HERE.** Choose the layout (General, Bedroom, or Kitchen) best suited for the problem.
2.  **Astrological Remedies**: Specific Lucky Gemstone and 1 powerful Mantra. Keep it short and potent.

**IMPORTANT**: Separate the two parts using the text separator "Deep Dive:".
`;

export const generateSystemInstruction = (name: string, gender: string, date: string, time: string, place: string) => {
  const currentSessionTime = new Date().toLocaleString();
  return `${BASE_SYSTEM_INSTRUCTION}

⭐ CURRENT USER CONTEXT (NATAL DATA):
- **Name**: ${name}
- **Gender**: ${gender}
- **Birth Date**: ${date}
- **Birth Time**: ${time}
- **Place of Birth**: ${place}
- **Session Start Time**: ${currentSessionTime}

**First Message Task**: 
1. Meaning of the name ${name}.
2. Nature overview.
3. **Current Challenges & Prosperity** (Diagnosis only).
4. Vastu Hint.
5. The Warning/Blockage.
Deep Dive:
1. **Full Vastu Analysis** (Brief & Actionable).
2. **VISUAL VASTU MAP** (ASCII Diagram).
3. **Remedies**.
`;
};

export const SUGGESTED_QUESTIONS = [
  "When will my career stabilize?",
  "Is this a good year for marriage?",
  "What is my lucky gemstone?",
  "Any health issues I should watch for?",
  "Will I travel abroad this year?",
  "How can I improve my wealth?"
];

export const MOCK_ASTROLOGERS: Astrologer[] = [
  {
    id: '1',
    name: 'Pandit Arjun Mishra',
    specialty: 'Vedic & Vastu Shastra',
    rating: 4.9,
    reviews: 1240,
    pricePerMin: 25.00,
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Dr. Radhika Kapoor',
    specialty: 'Career & Love Marriage',
    rating: 4.8,
    reviews: 850,
    pricePerMin: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Acharya Dev',
    specialty: 'Prashna Kundali',
    rating: 5.0,
    reviews: 2100,
    pricePerMin: 60.00,
    imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Tarot Neelam',
    specialty: 'Past Life & Healing',
    rating: 4.7,
    reviews: 430,
    pricePerMin: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Natural Red Coral (Moonga)',
    category: 'gemstone',
    price: 5499,
    description: 'Authentic Italian Red Coral stone.',
    benefits: 'Boosts energy, courage, and vitality. Removes obstacles.',
    imageUrl: 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p2',
    name: '5 Mukhi Rudraksha Mala',
    category: 'rudraksha',
    price: 1100,
    description: 'Original Nepali beads (108+1).',
    benefits: 'Calms the mind, lowers blood pressure, enhances focus.',
    imageUrl: 'https://images.unsplash.com/photo-1601128533718-374ffcca299b?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p3',
    name: 'Sri Yantra (Gold Plated)',
    category: 'yantra',
    price: 2100,
    description: 'Sacred geometry of Goddess Laxmi.',
    benefits: 'Attracts wealth, abundance, and positive energy.',
    imageUrl: 'https://images.unsplash.com/photo-1620503656463-e16129893b21?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p4',
    name: 'Navgrah Shanti Pooja Kit',
    category: 'pooja',
    price: 1500,
    description: 'Complete Samagri for 9 Planets.',
    benefits: 'Pacifies malefic planets and brings harmony.',
    imageUrl: 'https://images.unsplash.com/photo-1606293926075-69a00ce75c08?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p5',
    name: 'Pure Sandalwood Incense',
    category: 'incense',
    price: 250,
    description: 'Organic hand-rolled incense sticks.',
    benefits: 'Purifies aura and deepens meditation.',
    imageUrl: 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p6',
    name: 'Yellow Sapphire (Pukhraj)',
    category: 'gemstone',
    price: 12500,
    description: 'Untreated Ceylon Yellow Sapphire.',
    benefits: 'Enhances career, marriage, and prosperity (Jupiter energy).',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p7',
    name: 'Kuber Yantra',
    category: 'yantra',
    price: 1800,
    description: 'Yantra of Lord Kuber on copper plate.',
    benefits: 'Unlock new income sources and protect wealth.',
    imageUrl: 'https://images.unsplash.com/photo-1631214503151-b3636e3bc5d3?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p8',
    name: 'Crystal Quartz (Sphatik) Mala',
    category: 'rudraksha',
    price: 850,
    description: 'Original Diamond cut Sphatik beads.',
    benefits: 'Cooling energy, mental clarity, and Venus remedies.',
    imageUrl: 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p9',
    name: 'Rose Quartz Stone',
    category: 'gemstone',
    price: 999,
    description: 'Natural healing stone for heart chakra.',
    benefits: 'Attracts love, heals emotional wounds, promotes peace.',
    imageUrl: 'https://images.unsplash.com/photo-1596516109370-29001ec8ec36?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p10',
    name: 'Brass Pooja Diya',
    category: 'pooja',
    price: 450,
    description: 'Traditional handcrafted brass oil lamp.',
    benefits: 'Dispels darkness and brings auspicious energy to home.',
    imageUrl: 'https://images.unsplash.com/photo-1602826622874-555eaf17b54c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p11',
    name: 'Amethyst Cluster',
    category: 'gemstone',
    price: 1850,
    description: 'Raw Amethyst geode piece.',
    benefits: 'Enhances intuition, calms anxiety, aids sleep.',
    imageUrl: 'https://images.unsplash.com/photo-1567609200489-25e7fdb50d6e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p12',
    name: 'Sage Smudge Stick',
    category: 'incense',
    price: 550,
    description: 'White Sage bundle for cleansing.',
    benefits: 'Clears negative energy from home and aura.',
    imageUrl: 'https://images.unsplash.com/photo-1600609842388-3e4b7c3d4f82?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p13',
    name: 'Copper Kalash',
    category: 'pooja',
    price: 750,
    description: 'Pure copper water pot for rituals.',
    benefits: 'Essential for Vastu remedies and Varuna puja.',
    imageUrl: 'https://images.unsplash.com/photo-1627916607164-7b5267b5e476?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p14',
    name: 'Gomti Chakra Set (11pcs)',
    category: 'yantra',
    price: 350,
    description: 'Rare sea shells found in Gomti river.',
    benefits: 'Brings prosperity and protects from evil eye.',
    imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p15',
    name: 'Himalayan Salt Lamp',
    category: 'incense',
    price: 1200,
    description: 'Natural pink rock salt lamp.',
    benefits: 'Ionizes air, reduces stress, improves sleep quality.',
    imageUrl: 'https://images.unsplash.com/photo-1517457210348-703079e57d4b?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p16',
    name: 'Seven Chakra Bracelet',
    category: 'rudraksha',
    price: 650,
    description: 'Bracelet with 7 natural healing stones.',
    benefits: 'Balances the 7 chakras and aligns energy flow.',
    imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p17',
    name: 'Tibetan Singing Bowl',
    category: 'pooja',
    price: 2800,
    description: 'Hand-beaten bell metal bowl.',
    benefits: 'Sound healing, deep relaxation, and space clearing.',
    imageUrl: 'https://images.unsplash.com/photo-1597950293883-7c98c3971932?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'p18',
    name: 'Mystic Tarot Deck',
    category: 'yantra',
    price: 1100,
    description: 'Classic Rider-Waite style tarot cards.',
    benefits: 'Unlock subconscious wisdom and divine guidance.',
    imageUrl: 'https://images.unsplash.com/photo-1633519131641-6944ac38029d?auto=format&fit=crop&w=500&q=80'
  }
];

// Logic: The welcome message doesn't count. The user gets 1 free interaction after that.
export const INITIAL_DAILY_LIMIT = 1; 
export const PREMIUM_DAILY_LIMIT = 10;
export const RAZORPAY_KEY_ID = "rzp_test_1DP5mmOlF5G5ag"; // Public mock key for demo visuals
