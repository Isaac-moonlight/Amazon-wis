export type MenuCategory = 
  | 'cocktails_bar' 
  | 'grillades_braises' 
  | 'specialites_benin' 
  | 'tapas_planches';

export interface CategoryInfo {
  id: MenuCategory;
  name: string;
  subtitle: string;
  iconName: string;
}

export interface ItemVariant {
  name: string;
  price: number;
}

export interface ItemOption {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  description: string;
  price: number; // base price in FCFA
  badge?: string; // e.g. "Signature", "Coup de cœur", "Spécialité Reine"
  spicyLevel?: 0 | 1 | 2 | 3;
  image: string;
  tags?: string[];
  ingredients?: string[];
  preparationTimeMinutes?: number;
  available: boolean;
  variants?: ItemVariant[];
  availableOptions?: ItemOption[];
  isHouseSpecial?: boolean;
  isPopular?: boolean;
}

export interface CartItem {
  cartItemId: string;
  item: MenuItem;
  quantity: number;
  variantName?: string;
  unitPrice: number;
  selectedOptions?: string[];
  optionsPrice: number;
  notes?: string;
  totalPrice: number;
}

export type OrderStatus = 
  | 'en_attente' 
  | 'en_preparation' 
  | 'pret' 
  | 'servi' 
  | 'annule';

export type PaymentMethod = 
  | 'cash_table' 
  | 'mobile_money' 
  | 'cashier';

export interface OrderItemSummary {
  id: string;
  name: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  options?: string[];
  totalPrice: number;
  category: MenuCategory;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  customerName?: string;
  customerPhone?: string;
  items: OrderItemSummary[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
  notes?: string;
  source: 'direct' | 'offline_synced' | 'whatsapp_backup';
}

export type CallReason = 'addition' | 'eau_couverts' | 'boisson' | 'assistance';

export interface TableCall {
  id: string;
  tableNumber: number;
  reason: CallReason;
  createdAt: number;
  resolved: boolean;
  resolvedAt?: number;
}
