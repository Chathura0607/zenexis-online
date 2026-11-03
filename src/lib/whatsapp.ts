import { Order, SchoolListRequest } from '@/types';
import { SHOP_CONFIG } from './constants';

export const createWhatsAppUrl = (phone: string, text: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  // Format international number for Sri Lanka if starts with 0
  const targetNumber = cleanPhone.startsWith('0')
    ? '94' + cleanPhone.substring(1)
    : cleanPhone.startsWith('94')
    ? cleanPhone
    : '94' + cleanPhone;

  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${targetNumber}?text=${encodedText}`;
};

export const generateOrderWhatsAppMessage = (order: Order): string => {
  const itemsList = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.product.name}*\n   Qty: ${item.quantity} x Rs. ${item.product.price.toLocaleString()} = Rs. ${(
          item.product.price * item.quantity
        ).toLocaleString()}`
    )
    .join('\n');

  const deliveryText =
    order.deliveryMethod === 'store_pickup'
      ? `🏪 *Store Pickup at Zenexis (Ambalangoda)*\nScheduled: ${order.scheduledPickupDate || 'Today'} ${
          order.scheduledPickupTime ? `at ${order.scheduledPickupTime}` : ''
        }`
      : `🚚 *Island-wide Delivery*\n📍 Delivery Address: ${order.address || 'N/A'}, ${order.city || ''}`;

  return `*🛍️ NEW ORDER - ZENEXIS ONLINE*
━━━━━━━━━━━━━━━━━━━━
*Order ID:* #${order.orderNumber}
*Customer:* ${order.customerName}
*Phone:* ${order.phone}

*📦 ORDER ITEMS:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
*Subtotal:* Rs. ${order.subtotal.toLocaleString()}
*Delivery Fee:* Rs. ${order.deliveryFee.toLocaleString()}
${order.discount > 0 ? `*Discount:* -Rs. ${order.discount.toLocaleString()}\n` : ''}*TOTAL AMOUNT:* *Rs. ${order.total.toLocaleString()}*
*Payment:* ${order.paymentMethod === 'cod' ? '💵 Cash on Delivery (COD)' : order.paymentMethod === 'pickup' ? '🏪 Pay on Pickup' : '💳 Bank Transfer'}

${deliveryText}
${order.notes ? `\n📝 *Notes:* ${order.notes}` : ''}

_Please confirm my order and send updates. Thank you!_
*Zenexis Showroom - Ambalangoda*
*WhatsApp: 0701120945*`;
};

export const generateSchoolRequestWhatsAppMessage = (req: SchoolListRequest): string => {
  const missingText =
    req.missingItemsRequested.length > 0
      ? `\n\n*⚠️ Missing / Requested Items:*\n${req.missingItemsRequested
          .map((i) => `• ${i}`)
          .join('\n')}`
      : '';

  return `*🎒 SCHOOL BOOKLIST ORDER - ZENEXIS*
━━━━━━━━━━━━━━━━━━━━
*Request ID:* #${req.requestNumber}
*Parent/Customer:* ${req.customerName}
*Phone:* ${req.phone}
*Student:* ${req.studentName || 'N/A'} (${req.schoolGrade || 'N/A'})
${req.schoolName ? `*School:* ${req.schoolName}` : ''}

*Handwritten List Attached:* ${req.handwrittenImageUrl ? 'Yes (Photo Uploaded)' : 'No'}
${missingText}
${req.notes ? `\n📝 *Special Request:* ${req.notes}` : ''}

_Please review this booklist and send me the estimated total price, discount, and pickup date & time._

*Zenexis Showroom - Ambalangoda*
*WhatsApp: 0701120945*`;
};

export const generateStatusUpdateWhatsAppMessage = (
  order: Order,
  statusMessage: string
): string => {
  return `*📢 ORDER UPDATE - ZENEXIS*
━━━━━━━━━━━━━━━━━━━━
Hello *${order.customerName}*,
Regarding your Zenexis Order *#${order.orderNumber}*:

*Status:* ${statusMessage}
${order.scheduledPickupDate ? `*Pickup Date:* ${order.scheduledPickupDate}\n` : ''}${
    order.scheduledPickupTime ? `*Pickup Time Slot:* ${order.scheduledPickupTime}\n` : ''
  }*Total Amount:* Rs. ${order.total.toLocaleString()}

📍 *Pickup Location:*
Zenexis Showroom, Ambalangoda (Near Bus Stand)
📞 *Hotline/WhatsApp:* 0701120945

Thank you for choosing Zenexis!`;
};

export const generateDirectWhatsAppQueryUrl = (productName?: string): string => {
  const text = productName
    ? `Hello Zenexis! I am interested in: *${productName}*. Is this available in stock at your Ambalangoda branch?`
    : `Hello Zenexis! I would like to inquire about your computer items, stationery, and mobile accessories.`;
  return createWhatsAppUrl(SHOP_CONFIG.whatsappNumber, text);
};

