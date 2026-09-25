import { Order, CartItem } from '../types/restaurant';
import { RESTAURANT_CONFIG, formatPrice } from '../data/menuData';

/**
 * Generates formatted WhatsApp message for ordering
 */
export function generateWhatsAppOrderUrl(
  tableNumber: number,
  items: CartItem[],
  totalAmount: number,
  customerName?: string,
  paymentMethod: string = 'cash_table',
  notes?: string
): string {
  const cleanPhone = RESTAURANT_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
  
  let payLabel = "Espèces au serveur";
  if (paymentMethod === 'mobile_money') payLabel = "Mobile Money (MTN / Moov)";
  if (paymentMethod === 'cashier') payLabel = "En caisse";

  let text = `👑 *COMMANDE - AMAZONE WIS'ART COTONOU*\n`;
  text += `📍 *TABLE N° ${tableNumber}*\n`;
  if (customerName && customerName.trim()) {
    text += `👤 *Client :* ${customerName.trim()}\n`;
  }
  text += `⏰ *Heure :* ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
  text += `📋 *Détail des plats & boissons :*\n`;

  items.forEach((ci) => {
    const variantStr = ci.variantName ? ` (${ci.variantName})` : '';
    text += `▪️ ${ci.quantity}x *${ci.item.name}*${variantStr} : ${formatPrice(ci.totalPrice)}\n`;
    if (ci.selectedOptions && ci.selectedOptions.length > 0) {
      text += `   ↳ _Options: ${ci.selectedOptions.join(', ')}_\n`;
    }
    if (ci.notes && ci.notes.trim()) {
      text += `   ↳ _Précision: ${ci.notes.trim()}_\n`;
    }
  });

  text += `\n💰 *TOTAL : ${formatPrice(totalAmount)}*`;
  text += `\n💳 *Mode de règlement :* ${payLabel}`;
  
  if (notes && notes.trim()) {
    text += `\n💬 *Instructions spéciales :* ${notes.trim()}`;
  }

  text += `\n\n_Envoyé via le Menu Digital interactif d'Amazone Wis'art Cotonou_`;

  const encoded = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * WhatsApp for single quick table assistance
 */
export function generateWhatsAppCallUrl(tableNumber: number, reason: string): string {
  const cleanPhone = RESTAURANT_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
  const text = `🔔 *APPEL SERVEUR - TABLE ${tableNumber}*\n` +
               `Demande : *${reason}*\n` +
               `Restaurant Lounge Amazone Wis'art Cotonou\n` +
               `Merci d'envoyer un serveur à notre table.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Share active order link / receipt on WhatsApp
 */
export function generateWhatsAppShareOrderUrl(order: Order): string {
  let payLabel = "Espèces au serveur";
  if (order.paymentMethod === 'mobile_money') payLabel = "Mobile Money (MTN / Moov)";
  if (order.paymentMethod === 'cashier') payLabel = "En caisse";

  let text = `👑 *SUIVI COMMANDE #${order.orderNumber}*\n`;
  text += `📍 *Table N° ${order.tableNumber}* - Amazone Wis'art Cotonou\n\n`;
  order.items.forEach((it) => {
    text += `▪️ ${it.quantity}x ${it.name}${it.variantName ? ` (${it.variantName})` : ''} - ${formatPrice(it.totalPrice)}\n`;
  });
  text += `\n💰 *Total : ${formatPrice(order.totalAmount)}*\n`;
  text += `💳 *Paiement :* ${payLabel}\n`;
  text += `Status actuel : *${order.status.toUpperCase()}*`;

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
