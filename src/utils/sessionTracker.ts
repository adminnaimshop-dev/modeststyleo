export interface IncompleteOrderSession {
  sessionId: string;
  lastActivity: string;
  startTime: string;
  exitTime?: string;
  status: 'Product Viewed' | 'Add to Cart' | 'Checkout Started' | 'Payment Pending' | 'Checkout Abandoned' | 'Cancelled' | 'Order Placed';
  customerInfo: {
    name?: string;
    phone?: string;
    email?: string;
    fbName?: string;
    userId?: string;
  };
  addressProgress: {
    name: boolean;
    phone: boolean;
    district: boolean;
    address: boolean;
    payment: boolean;
  };
  viewedProducts: { id: string; name: string; image?: string; count: number; lastViewed: string }[];
  cartInfo: {
    itemCount: number;
    total: number;
    items: any[];
  };
  recovery: {
    status: 'New' | 'Contacted' | 'Waiting' | 'Recovered' | 'Not Interested' | 'Ignored';
    reminders: {
      min30: boolean;
      hour2: boolean;
      hour24: boolean;
    };
    logs: { action: string; time: string }[];
    adminNote?: string;
    followUpDate?: string;
    followUpTime?: string;
    nextReminder?: string;
  };
  timeline: { action: string; time: string; detail?: string }[];
  cancelReason?: string;
  cancelBy?: string;
  orderId?: string; // If cancelled
}

export function getSessionId() {
  let sid = localStorage.getItem('naimshop_session_id');
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('naimshop_session_id', sid);
  }
  return sid;
}

export function updateSessionTracker(updates: Partial<IncompleteOrderSession> | ((prev: IncompleteOrderSession) => IncompleteOrderSession)) {
  const sid = getSessionId();
  let sessions: IncompleteOrderSession[] = JSON.parse(localStorage.getItem('naimshop_incomplete_orders') || '[]');
  
  let currentSession = sessions.find(s => s.sessionId === sid);
  if (!currentSession) {
    currentSession = {
      sessionId: sid,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: 'Product Viewed',
      customerInfo: {},
      addressProgress: { name: false, phone: false, district: false, address: false, payment: false },
      viewedProducts: [],
      cartInfo: { itemCount: 0, total: 0, items: [] },
      recovery: { status: 'New', reminders: { min30: false, hour2: false, hour24: false }, logs: [] },
      timeline: []
    };
    sessions.push(currentSession);
  }

  // Find the index now in case push moved things, though it's the last element if we just pushed
  const index = sessions.findIndex(s => s.sessionId === sid);

  if (typeof updates === 'function') {
    sessions[index] = updates(sessions[index]);
  } else {
    sessions[index] = { ...sessions[index], ...updates };
  }
  
  sessions[index].lastActivity = new Date().toISOString();
  localStorage.setItem('naimshop_incomplete_orders', JSON.stringify(sessions));
}

export function trackEvent(action: string, detail?: string) {
  updateSessionTracker(prev => {
    return {
      ...prev,
      timeline: [...prev.timeline, { action, time: new Date().toISOString(), detail }]
    };
  });
}
