import { db, collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy } from './firebase';
import { Order, TableCall, OrderStatus, CallReason } from '../types/restaurant';

const STORAGE_KEY_PENDING_ORDERS = 'amazone_pending_orders_offline';
const STORAGE_KEY_SAVED_ORDERS = 'amazone_local_orders_history';
const STORAGE_KEY_PENDING_CALLS = 'amazone_pending_calls_offline';

/**
 * Sanitizes object so Firestore never receives `undefined` values which cause silent write failures
 */
function sanitizeOrderForFirestore(order: Order): Record<string, any> {
  return {
    id: order.id,
    orderNumber: order.orderNumber || 'AW-0000',
    tableNumber: Number(order.tableNumber) || 1,
    customerName: order.customerName || `Client Table ${order.tableNumber}`,
    customerPhone: order.customerPhone || '',
    items: (order.items || []).map((it) => ({
      id: it.id || '',
      name: it.name || '',
      variantName: it.variantName || '',
      unitPrice: Number(it.unitPrice) || 0,
      quantity: Number(it.quantity) || 1,
      options: Array.isArray(it.options) ? it.options : [],
      totalPrice: Number(it.totalPrice) || 0,
      category: it.category || 'grillades_braises',
      notes: it.notes || '',
    })),
    totalAmount: Number(order.totalAmount) || 0,
    status: order.status || 'en_attente',
    paymentMethod: order.paymentMethod || 'cash_table',
    notes: order.notes || '',
    source: order.source || 'direct',
    createdAt: Number(order.createdAt) || Date.now(),
    updatedAt: Number(order.updatedAt) || Date.now(),
    synced: true,
  };
}

function sanitizeCallForFirestore(call: TableCall): Record<string, any> {
  return {
    id: call.id,
    tableNumber: Number(call.tableNumber) || 1,
    reason: call.reason || 'assistance',
    createdAt: Number(call.createdAt) || Date.now(),
    resolved: Boolean(call.resolved),
    resolvedAt: call.resolvedAt ? Number(call.resolvedAt) : 0,
  };
}

class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Array<(online: boolean) => void> = [];
  private syncInProgress: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
        this.triggerSync();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public subscribeOnlineStatus(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);
    callback(this.isOnline);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.isOnline));
  }

  // Save order with Firestore real-time sync + local fallback
  public async submitOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<Order> {
    const localId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const orderNum = 'AW-' + Math.floor(1000 + Math.random() * 9000);
    const now = Date.now();

    const newOrder: Order = {
      ...orderData,
      id: localId,
      orderNumber: orderNum,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };

    // Save locally immediately
    this.saveOrderLocally(newOrder);

    // Try sending directly to Firestore
    try {
      const sanitized = sanitizeOrderForFirestore(newOrder);
      const orderRef = doc(db, 'orders', localId);
      await setDoc(orderRef, sanitized);
      newOrder.synced = true;
      this.updateLocalOrder(newOrder);
      console.log('Order successfully pushed to Firestore:', localId);
    } catch (err) {
      console.warn('Network issue during Firestore send, queued for background sync:', err);
      this.queueForSync(newOrder);
    }

    return newOrder;
  }

  // Service Call
  public async callServer(tableNumber: number, reason: CallReason): Promise<TableCall> {
    const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const call: TableCall = {
      id: callId,
      tableNumber,
      reason,
      createdAt: Date.now(),
      resolved: false
    };

    this.queueCallOffline(call);

    try {
      const sanitized = sanitizeCallForFirestore(call);
      const callRef = doc(db, 'calls', callId);
      await setDoc(callRef, sanitized);
      console.log('Call successfully sent to Firestore:', callId);
    } catch (err) {
      console.warn('Failed to send call immediately to Firestore, cached locally:', err);
    }

    return call;
  }

  public async resolveCall(callId: string): Promise<void> {
    try {
      const callRef = doc(db, 'calls', callId);
      await updateDoc(callRef, {
        resolved: true,
        resolvedAt: Date.now()
      });
    } catch (e) {
      console.error('Error resolving call in Firestore:', e);
    }

    // Update local storage
    try {
      const pending: TableCall[] = JSON.parse(localStorage.getItem(STORAGE_KEY_PENDING_CALLS) || '[]');
      const updated = pending.filter(c => c.id !== callId);
      localStorage.setItem(STORAGE_KEY_PENDING_CALLS, JSON.stringify(updated));
    } catch {}
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    // 1. Update local storage immediately
    const local = this.getLocalOrders();
    const updated = local.map(o => o.id === orderId ? { ...o, status, updatedAt: Date.now() } : o);
    localStorage.setItem(STORAGE_KEY_SAVED_ORDERS, JSON.stringify(updated));

    // 2. Update Firestore
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: Date.now()
      });
      console.log(`Order ${orderId} status updated in Firestore to ${status}`);
    } catch (e) {
      console.error('Error updating order status in Firestore:', e);
    }
  }

  // Offline queue helpers
  private queueForSync(order: Order) {
    try {
      const pending = this.getPendingOrders();
      if (!pending.find(o => o.id === order.id)) {
        pending.push(order);
        localStorage.setItem(STORAGE_KEY_PENDING_ORDERS, JSON.stringify(pending));
      }
    } catch (e) {
      console.error('Error queuing order for offline sync:', e);
    }
  }

  private queueCallOffline(call: TableCall) {
    try {
      const pending: TableCall[] = JSON.parse(localStorage.getItem(STORAGE_KEY_PENDING_CALLS) || '[]');
      if (!pending.find(c => c.id === call.id)) {
        pending.push(call);
        localStorage.setItem(STORAGE_KEY_PENDING_CALLS, JSON.stringify(pending));
      }
    } catch (e) {
      console.error('Error queuing call offline:', e);
    }
  }

  public getPendingOrders(): Order[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_PENDING_ORDERS) || '[]');
    } catch {
      return [];
    }
  }

  public getLocalOrders(): Order[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_SAVED_ORDERS) || '[]');
    } catch {
      return [];
    }
  }

  private saveOrderLocally(order: Order) {
    try {
      const existing = this.getLocalOrders();
      const updated = [order, ...existing.filter(o => o.id !== order.id)].slice(0, 50);
      localStorage.setItem(STORAGE_KEY_SAVED_ORDERS, JSON.stringify(updated));
    } catch (e) {
      console.error('Local save error', e);
    }
  }

  private updateLocalOrder(order: Order) {
    try {
      const existing = this.getLocalOrders();
      const updated = existing.map(o => o.id === order.id ? order : o);
      localStorage.setItem(STORAGE_KEY_SAVED_ORDERS, JSON.stringify(updated));
    } catch (e) {
      console.error('Local update error', e);
    }
  }

  // Trigger auto sync when back online
  public async triggerSync(): Promise<{ syncedOrdersCount: number }> {
    if (this.syncInProgress || !this.isOnline) return { syncedOrdersCount: 0 };
    this.syncInProgress = true;
    let syncedOrdersCount = 0;

    try {
      const pending = this.getPendingOrders();
      if (pending.length > 0) {
        const remaining: Order[] = [];
        for (const order of pending) {
          try {
            const orderRef = doc(db, 'orders', order.id);
            const sanitized = sanitizeOrderForFirestore(order);
            await setDoc(orderRef, sanitized);
            order.synced = true;
            this.updateLocalOrder(order);
            syncedOrdersCount++;
          } catch (err) {
            console.error('Failed syncing order ' + order.id, err);
            remaining.push(order);
          }
        }
        localStorage.setItem(STORAGE_KEY_PENDING_ORDERS, JSON.stringify(remaining));
      }

      // Sync pending calls
      const pendingCalls: TableCall[] = JSON.parse(localStorage.getItem(STORAGE_KEY_PENDING_CALLS) || '[]');
      if (pendingCalls.length > 0) {
        const remainingCalls: TableCall[] = [];
        for (const call of pendingCalls) {
          try {
            const callRef = doc(db, 'calls', call.id);
            await setDoc(callRef, sanitizeCallForFirestore(call));
          } catch (e) {
            remainingCalls.push(call);
          }
        }
        localStorage.setItem(STORAGE_KEY_PENDING_CALLS, JSON.stringify(remainingCalls));
      }
    } catch (e) {
      console.error('Sync process error:', e);
    } finally {
      this.syncInProgress = false;
    }

    return { syncedOrdersCount };
  }
}

export const syncManager = new SyncManager();
