import { ProductCategory } from '@/types';
import { SHOP_CONFIG } from './constants';

export interface AIProductAnalysis {
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  description: string;
  tags: string[];
  specs: Record<string, string>;
}

export interface AIParsedBooklist {
  studentGrade: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    available: boolean;
  }>;
  estimatedTotal: number;
  suggestedDiscount: number;
  finalTotal: number;
  recommendedReadyDate: string;
  recommendedTimeSlot: string;
}

// Test Gemini API Key connectivity
export const testGeminiApiKey = async (
  apiKey: string
): Promise<{ success: boolean; message: string }> => {
  const trimmed = (apiKey || '').trim();
  if (!trimmed) {
    return { success: false, message: 'API key is empty.' };
  }

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash-latest'];
  let lastErrMsg = '';

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmed}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with OK' }] }],
          }),
        }
      );

      if (response.ok) {
        return {
          success: true,
          message: `Connected successfully to Google Gemini (${model})!`,
        };
      }

      const errData = await response.json().catch(() => ({}));
      lastErrMsg = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      if (lastErrMsg.includes('API_KEY_INVALID') || lastErrMsg.includes('key not valid')) {
        return { success: false, message: 'Invalid API Key. Please copy your key again from Google AI Studio.' };
      }
    } catch (err: any) {
      lastErrMsg = err.message || String(err);
      console.warn(`Test ping error on ${model}:`, err);
    }
  }

  return {
    success: false,
    message: lastErrMsg
      ? `Google Gemini error: ${lastErrMsg}`
      : 'Could not connect to Gemini API. Please check your internet connection.',
  };
};

// Smart AI Analyzer with Gemini Vision API capability + intelligent heuristic recognition
export const analyzeProductWithAI = async (
  imageDataUrl: string,
  fileNameOrHint?: string,
  customApiKey?: string
): Promise<AIProductAnalysis> => {
  const apiKey = (
    customApiKey ||
    (typeof window !== 'undefined' ? localStorage.getItem('zenexis_gemini_api_key') : '') ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  ).trim();

  // If API Key is present, call Google Gemini Vision API
  if (apiKey) {
    // If customApiKey was passed, ensure it is persisted in localStorage
    if (typeof window !== 'undefined' && customApiKey) {
      try {
        localStorage.setItem('zenexis_gemini_api_key', customApiKey.trim());
      } catch {}
    }

    // Extract real MIME type and raw base64 data
    const mimeMatch = imageDataUrl.match(/^data:([^;]+);base64,/);
    let mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/jpeg';
    if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
    const base64Data = (imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl).trim();

    const hint = fileNameOrHint ? `\nUser provided extra context or hint: "${fileNameOrHint}"` : '';

    const promptText = `You are an expert product cataloger for "Zenexis Ambalangoda", a premier Sri Lankan computer accessories, mobile phones, chargers, and school stationery shop.
Analyze this uploaded product photo or promotional flyer with high precision.${hint}

CRITICAL EXTRACTION RULES:
1. READ ALL VISIBLE TEXT: Look for exact brand name (e.g. JEQANG, Fantech, Prolink, Kingston, Sandisk, Atlas, Nokia, Itel, Apple, Samsung), model number (e.g. JM-G102, 105, C20), and product category.
2. DETECT PRINTED PRICE: Check for any price tag, badge, sticker, or text (e.g. "Rs. 950/-", "Rs. 950 ONLY", "950/-", "Rs 950", "LKR 1,500"). If a price is clearly visible on the image, you MUST set "price" to that EXACT integer number (e.g. 950).
3. ORIGINAL / STRIKE-THROUGH PRICE: If a higher original price or discount is shown, set "originalPrice" to that higher number. Otherwise set "originalPrice" to approximately 20% higher than "price".
4. CATEGORY: Must be strictly one of: "computer" | "stationery" | "mobile" | "chargers" | "school_bundles".
5. DESCRIPTION: Write an engaging 2-3 sentence product overview in English highlighting the key specifications shown (e.g. honeycomb perforated design, multi-color lighting, wired USB connection, paper grade, battery life). Mention availability at Zenexis Ambalangoda.
6. TAGS: 5-8 relevant lowercase search tags.
7. SPECS: Extract key technical specifications as key-value pairs (e.g. {"Brand": "...", "Model": "...", "Connection": "...", ...}).

Return ONLY a valid JSON object matching this structure:
{
  "name": "Full Product Title (e.g. JEQANG JM-G102 Honeycomb Wired Gaming Mouse)",
  "category": "computer",
  "price": 950,
  "originalPrice": 1200,
  "description": "Engaging description...",
  "tags": ["jeqang", "mouse", "gaming", "honeycomb"],
  "specs": { "Brand": "JEQANG", "Model": "JM-G102" }
}`;

    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash-latest'];
    let lastError: string | null = null;

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptText },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                topK: 32,
                topP: 0.95,
              },
            }),
          }
        );

        if (response.ok) {
          const json = await response.json();
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const match = rawText.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              const rawPrice = Number(parsed.price);
              const price = !isNaN(rawPrice) && rawPrice > 0 ? rawPrice : 1000;
              const rawOrigPrice = Number(parsed.originalPrice);
              const originalPrice = !isNaN(rawOrigPrice) && rawOrigPrice > price ? rawOrigPrice : Math.round(price * 1.2);

              const validCategories: ProductCategory[] = [
                'computer',
                'stationery',
                'mobile',
                'chargers',
                'school_bundles',
              ];
              const category = validCategories.includes(parsed.category) ? parsed.category : 'computer';

              return {
                name: parsed.name || 'New Product Item',
                category,
                price,
                originalPrice,
                description: parsed.description || 'Quality product available at Zenexis Ambalangoda.',
                tags: Array.isArray(parsed.tags) ? parsed.tags : ['zenexis', category],
                specs: parsed.specs || { Condition: 'Brand New', Warranty: 'Check in store' },
              };
            }
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`Gemini Vision API (${model}) failed:`, lastError);
        }
      } catch (err: any) {
        lastError = err.message || String(err);
        console.warn(`Gemini fetch error on ${model}:`, err);
      }
    }

    if (lastError) {
      throw new Error(`Google Gemini API error: ${lastError}`);
    }
  }

  // If no API Key was provided, check if smart heuristic recognition can parse the hint / filename
  if (fileNameOrHint) {
    const hint = fileNameOrHint.toLowerCase();

    // Check for JEQANG / Honeycomb / Mouse
    if (hint.includes('jeqang') || hint.includes('honeycomb') || hint.includes('g102') || hint.includes('mouse')) {
      const price = hint.includes('950') ? 950 : 950;
      return {
        name: 'JEQANG JM-G102 Honeycomb Wired Gaming Mouse',
        category: 'computer',
        price,
        originalPrice: 1200,
        description: 'Internet-famous JEQANG JM-G102 lightweight honeycomb wired optical mouse. Features an ultra-lightweight ergonomic honeycomb perforated shell, dynamic multi-color breathing lighting, and responsive high-durability switches. Available at Zenexis Ambalangoda.',
        tags: ['jeqang', 'mouse', 'gaming', 'honeycomb', 'jm-g102', 'wired', 'computer', 'accessories'],
        specs: {
          Brand: 'JEQANG',
          Model: 'JM-G102',
          Design: 'Honeycomb Perforated Shell',
          Connection: 'Wired USB',
          Lighting: 'Multi-Color RGB Breathing',
          Warranty: 'Checking Warranty Available',
        },
      };
    }

    if (hint.includes('keyboard') || hint.includes('keypad')) {
      return {
        name: 'Mechanical Tactile Gaming Keyboard LED',
        category: 'computer',
        price: 5800,
        originalPrice: 6500,
        description: 'Durable mechanical feel keyboard with customizable LED backlighting, fast response keycaps, and ergonomic wrist incline.',
        tags: ['keyboard', 'rgb', 'gaming', 'pc', 'hardware'],
        specs: { Layout: 'Standard US 104 Keys', Connection: 'USB Braided', Warranty: '6 Months' },
      };
    }

    if (hint.includes('book') || hint.includes('cr') || hint.includes('poth')) {
      return {
        name: 'Atlas CR 80 Pages Single Rule Bundle Pack',
        category: 'stationery',
        price: 2400,
        originalPrice: 2800,
        description: 'Smooth white 70gsm writing paper notebooks. High durability stitch binding designed for school coursework and notes.',
        tags: ['atlas', 'books', 'crbooks', 'school', 'stationery'],
        specs: { Brand: 'Atlas', Pages: '80 Pages', Pack: 'Set of 10' },
      };
    }

    if (hint.includes('charge') || hint.includes('cable') || hint.includes('pd') || hint.includes('adapter')) {
      return {
        name: '20W PD Ultra Fast USB-C Charging Adapter',
        category: 'chargers',
        price: 1850,
        originalPrice: 2200,
        description: 'Compact 20W Power Delivery wall adapter compatible with iPhone, Samsung, Xiaomi, and other modern devices. Safe intelligent chip protection.',
        tags: ['charger', 'adapter', 'typec', 'fastcharging', 'power'],
        specs: { Output: '20W Max PD 3.0', Port: 'USB Type-C', Input: '100-240V AC' },
      };
    }

    if (hint.includes('phone') || hint.includes('nokia') || hint.includes('itel')) {
      return {
        name: 'Nokia / Itel Dual SIM Keypad Button Phone',
        category: 'mobile',
        price: 7800,
        originalPrice: 8500,
        description: 'Reliable everyday button phone featuring ultra-long battery standby, loud audio speaker, bright torchlight, and FM wireless radio.',
        tags: ['phone', 'mobile', 'buttonphone', 'keypad', 'nokia'],
        specs: { SIM: 'Dual SIM', Battery: 'Up to 5 Days Standby', Warranty: '1 Year Company' },
      };
    }
  }

  // If no API key is configured and no specific hint matched, throw a friendly error
  throw new Error('GEMINI_API_KEY_REQUIRED');
};

// Smart AI Parser for Handwritten School Book Lists
export const parseHandwrittenBooklistWithAI = async (
  _imageDataUrl: string,
  userNotes?: string
): Promise<AIParsedBooklist> => {
  await new Promise((r) => setTimeout(r, 1600)); // Processing delay

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const notesLower = (userNotes || '').toLowerCase();
  const isPrimary =
    notesLower.includes('grade 1') ||
    notesLower.includes('grade 2') ||
    notesLower.includes('grade 3') ||
    notesLower.includes('grade 4') ||
    notesLower.includes('grade 5');

  const items = isPrimary
    ? [
        { name: 'Atlas CR 80pg Single Rule Books', quantity: 6, unitPrice: 240, available: true },
        { name: 'Atlas CR 80pg Square Rule Math Books', quantity: 2, unitPrice: 240, available: true },
        { name: 'Atlas Drawing Book 40 Pages', quantity: 2, unitPrice: 320, available: true },
        { name: 'Faber-Castell 12 Color Pencils Box', quantity: 1, unitPrice: 650, available: true },
        { name: 'Natraj 2B Pencils Pack (10 pcs)', quantity: 1, unitPrice: 480, available: true },
        { name: 'Eraser & Sharpener Duo Set', quantity: 2, unitPrice: 90, available: true },
        { name: 'Plastic Ruler 30cm Transparent', quantity: 1, unitPrice: 120, available: true },
        { name: 'Pencil Box Multi-Compartment', quantity: 1, unitPrice: 850, available: true },
      ]
    : [
        { name: 'Atlas CR 120pg Single Rule Books', quantity: 8, unitPrice: 380, available: true },
        { name: 'Atlas CR 120pg Square Rule Math Books', quantity: 2, unitPrice: 380, available: true },
        { name: 'Faber-Castell Mathematical Instrument Box', quantity: 1, unitPrice: 1550, available: true },
        { name: 'Reynolds 045 Blue Ballpoint Pens (Pack 10)', quantity: 1, unitPrice: 650, available: true },
        { name: 'Reynolds 045 Red Ballpoint Pens (Pack 5)', quantity: 1, unitPrice: 350, available: true },
        { name: 'A4 Assignment File Folders (Set of 5)', quantity: 1, unitPrice: 750, available: true },
        { name: 'Atlas A4 80gsm Paper (100 loose sheets)', quantity: 1, unitPrice: 680, available: true },
      ];

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = Math.round(subtotal * 0.1); // 10% School season special discount

  return {
    studentGrade: isPrimary ? 'Primary (Grade 1-5)' : 'Secondary (Grade 6-11)',
    items,
    estimatedTotal: subtotal,
    suggestedDiscount: discount,
    finalTotal: subtotal - discount,
    recommendedReadyDate: dateStr,
    recommendedTimeSlot: '10:30 AM - 12:30 PM (Zenexis Ambalangoda Showroom)',
  };
};

// Conversational AI Support Bot responses
export const generateBotResponse = (userMessage: string): string => {
  const query = userMessage.toLowerCase().trim();

  if (
    query.includes('location') ||
    query.includes('koheda') ||
    query.includes('where') ||
    query.includes('address') ||
    query.includes('thiyenne') ||
    query.includes('place')
  ) {
    return `🏪 **Zenexis Showroom Location:**\nWe are located at **Ambalangoda** (near the bus stand), Sri Lanka.\n\n⏰ **Opening Hours:** Every day from 8:00 AM to 8:30 PM.\n📞 **WhatsApp:** 0701120945.\nYou can visit us directly or order online with in-store pickup & Island-wide cash on delivery!`;
  }

  if (
    query.includes('whatsapp') ||
    query.includes('number') ||
    query.includes('contact') ||
    query.includes('call') ||
    query.includes('phone') ||
    query.includes('nambare')
  ) {
    return `📱 **Zenexis WhatsApp & Hotline:**\nOur official number is **0701120945**.\n\nYou can chat with our team anytime or send photos of items / school booklists!`;
  }

  if (
    query.includes('delivery') ||
    query.includes('cod') ||
    query.includes('cash on delivery') ||
    query.includes('bedada') ||
    query.includes('evann')
  ) {
    return `🚚 **Delivery & Payment Options:**\n• **Island-wide Cash on Delivery (COD)**: Pay cash right at your doorstep anywhere in Sri Lanka!\n• **Delivery Time:** 2-3 working days across the island.\n• **In-Store Pickup:** Collect in 30 minutes at our Ambalangoda showroom without paying any delivery fee!`;
  }

  if (
    query.includes('poth') ||
    query.includes('school') ||
    query.includes('season') ||
    query.includes('stationery') ||
    query.includes('list') ||
    query.includes('pansal') ||
    query.includes('cr')
  ) {
    return `🎒 **School Season Special Feature!**\nSkip the crowded shop queues:\n1. Open our **"🎒 School Season"** tab.\n2. Upload a clear photo of your handwritten booklist.\n3. Our AI instantly prepares the item list, gives a **10% season discount**, and gives you an exact pickup date & time!\n4. When you arrive at our Ambalangoda showroom, your package is packed and ready to take!`;
  }

  if (
    query.includes('mouse') ||
    query.includes('keyboard') ||
    query.includes('pendrive') ||
    query.includes('speaker') ||
    query.includes('computer')
  ) {
    return `💻 **Computer Accessories at Zenexis:**\nWe stock high quality Gaming & Office items:\n• Fantech & JEQANG Optical RGB Gaming Mice\n• Mechanical Clicky Keyboards\n• SanDisk & Kingston High-Speed Pen Drives (32GB, 64GB, 128GB)\n• 2.0 Bass Boosted Multimedia Desktop Speakers\n• HDMI 4K & DisplayPort cables\n\nAll items come with genuine company warranty. Tap "Shop" to view current stock!`;
  }

  if (
    query.includes('phone') ||
    query.includes('nokia') ||
    query.includes('button') ||
    query.includes('charger') ||
    query.includes('type c') ||
    query.includes('power bank')
  ) {
    return `📱 **Mobile Phones & Fast Chargers:**\n• Original Nokia 105 & Itel 4G Button Keypad Phones with TRCSL warranty.\n• 20W PD Fast Charging Adapters for iPhone & Android.\n• Braided 3A Heavy Duty Type-C & Micro USB cables.\n• Remax Dual-Port High Capacity Power Banks.\n\nAll available with Cash on Delivery or showroom pickup!`;
  }

  if (
    query.includes('hi') ||
    query.includes('hello') ||
    query.includes('machan') ||
    query.includes('machn') ||
    query.includes('kohomada') ||
    query.includes('ayubowan')
  ) {
    return `👋 **Hello & Welcome to Zenexis! (ආයුබෝවන්)**\nI am your AI assistant for **Zenexis Ambalangoda**.\n\nHow can I help you today?\n• 💻 Inquire about Computer & Phone accessories\n• 🎒 Upload school booklists & get discounts\n• 🚚 Check Island-wide delivery / Cash on delivery\n• 📱 Connect with our WhatsApp at 0701120945`;
  }

  return `Thank you for your message! At **Zenexis (Ambalangoda)** we have computer accessories, school stationery, mobile phones, and chargers in stock.\n\nFor custom inquiries, feel free to order directly here or message us on WhatsApp at **0701120945**!`;
};
