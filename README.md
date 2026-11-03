# 🛒 Zenexis Online E-Commerce & Order Management System

Official, production-ready full-stack online shopping platform for **Zenexis (Ambalangoda)**.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **PWA Mobile App support**, and **Gemini AI Integration**.

---

## 🌟 Key Highlights & Features

### 1. 🏪 Shop Identity & Contact
- **Shop Name:** Zenexis
- **Location:** Ambalangoda (Near Bus Stand), Sri Lanka
- **WhatsApp & Hotline:** `0701120945`
- **Delivery Options:**
  - 🚚 **Island-wide Cash on Delivery (COD)** (Pay cash to courier anywhere in Sri Lanka)
  - 🏪 **In-Store Pickup** at Ambalangoda showroom (30-minute rapid preparation, 0 delivery fee)

---

### 2. 📱 100% Responsive & Installable PWA
- Optimized for mobile phones, tablets, laptops, and ultra-wide desktop monitors.
- Mobile App Bottom Navigation bar (Shop, School, Quick WhatsApp Chat, Track, Cart).
- **Progressive Web App (PWA)**: Customers can install Zenexis directly onto their Android or iOS home screens without downloading from an App Store!

---

### 3. 💬 Instant WhatsApp Automation
- Direct WhatsApp integration with `0701120945`.
- Whenever a customer places an order:
  - Formatted itemized receipt with Order ID, customer details, delivery address, items, and total amount.
  - Opens directly into WhatsApp with one tap.
- Whenever an order is updated (Approved, Packing, Ready for Pickup):
  - Admin can send a 1-click WhatsApp update to the customer with their scheduled pickup date & time slot!

---

### 4. 🎒 School Season Booklist Hub (Handwritten Photo AI Scan)
- **Eliminates long shop queues during new school terms!**
- Parents can take a photo of their child's handwritten school book list.
- **AI-Powered Scanner**:
  - Automatically identifies books (CR 80pg single rule, square rule, pens, pencils, math instrument boxes, drawing books).
  - Calculates the total quotation and automatically applies a **10% School Season Discount**.
  - Automatically allocates a **Scheduled Pickup Date & Time Slot** (e.g. Tomorrow at 10:30 AM in Ambalangoda Showroom).
- **Missing Items Request**:
  - Parents can type specific or uncommon book titles, so Zenexis staff can prepare or source them in advance.
- Parents approve the quote via WhatsApp, and collect their packed order within 2 minutes upon arrival!

---

### 5. 🤖 Gemini AI Product Auto-Creator (Admin Portal)
- Admin can upload a photo of any computer item, phone, charger, or stationery item.
- Gemini AI automatically:
  - Generates an attractive product title (in English & Sinhala).
  - Categorizes the product (`computer`, `stationery`, `mobile`, `chargers`, `school_bundles`).
  - Writes a 2-3 sentence engaging description with specifications.
  - Suggests selling price and original price.
  - Auto-tags the product.
- When saved, the system automatically broadcasts an in-app notification to all customers that a new item has arrived!

---

### 6. 🔐 Admin Management Portal (`/admin`)
- **Default PIN:** `2026` or `0701120945`
- **Sales Analytics:** Total revenue, active orders, popular categories, school requests.
- **Product Catalog:** Add, Edit, Delete, Toggle In-Stock / Out-of-Stock, Adjust Prices.
- **Orders Manager:** Review incoming orders, Approve, Set Pickup Date & Time, 1-Click WhatsApp update to customer.
- **School Booklist Requests:** Review uploaded paper photos, verify quoted amounts, set collection time slot.
- **Push Broadcast:** Broadcast real-time announcements to all store visitors.
- **⚡ Firestore & POS Sync:** Connect the existing Zenexis POS database for real-time live stock inventory sync.

---

### 7. 🤖 Interactive Customer AI Assistant & Order Tracking
- Floating AI assistant widget answering customer inquiries in English, Sinhala, and Singlish.
- Live order tracker at `/track` with visual multi-step stepper (`Order Placed` ➔ `Confirmed` ➔ `Packing` ➔ `Ready for Pickup / In Transit` ➔ `Completed`).

---

## 🚀 Running the Project Locally

```bash
# 1. Open the project folder
cd "c:\Users\chath\Downloads\Zenexis Online"

# 2. Run the development server
npm run dev

# 3. Open your browser
http://localhost:3000
```

---

## 🌐 Free Hosting Deployment (GitHub Pages / Vercel)

### Option A: GitHub Pages (100% Free - Hosted Directly on GitHub)
The project includes an automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`):
1. Push the project to your GitHub repository:
   ```bash
   git remote add origin https://github.com/<your-username>/zenexis-online.git
   git push -u origin main
   ```
2. In your GitHub repository, go to **Settings** ➔ **Pages**.
3. Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
4. That's it! GitHub will automatically build and deploy your site to:
   `https://<your-username>.github.io/zenexis-online`

### Option B: Vercel (100% Free)
1. Push this project to your GitHub repository.
2. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
3. Click **"Add New Project"** and select `zenexis-online`.
4. Leave build settings as default (`npm run build`).
5. (Optional) In Environment Variables, add:
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Your Google Gemini API key (free at aistudio.google.com).
6. Click **Deploy**. Your site will be live on a free `.vercel.app` domain with SSL!

---

## 📞 Store Details
- **Zenexis Showroom**
- **Address:** Ambalangoda, Sri Lanka
- **WhatsApp / Phone:** 0701120945
- **Admin PIN:** `2026`
