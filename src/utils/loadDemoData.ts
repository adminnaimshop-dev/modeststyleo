const demoSessions = [
  {
    sessionId: "demo_1",
    startTime: new Date(Date.now() - 30 * 60000).toISOString(),
    lastActivity: new Date(Date.now() - 5 * 60000).toISOString(),
    status: "Checkout Started",
    customerInfo: { name: "Md. Rakib Hasan", phone: "01712-345678", email: "rakib@gmail.com" },
    addressProgress: { name: true, phone: true, district: false, address: false, payment: false },
    viewedProducts: [{ id: "pol-001", name: "Premium Polo Shirt", count: 2, lastViewed: new Date().toISOString() }],
    cartInfo: { itemCount: 2, total: 2500, items: [{ name: "Premium Polo Shirt", price: 1250, qty: 2 }] },
    recovery: { status: "New", reminders: { min30: false, hour2: false, hour24: false }, logs: [] },
    timeline: [
        { action: "Product Viewed", time: new Date(Date.now() - 20 * 60000).toISOString() },
        { action: "Add to Cart", time: new Date(Date.now() - 15 * 60000).toISOString() },
        { action: "Checkout Started", time: new Date(Date.now() - 10 * 60000).toISOString() }
    ]
  },
  {
    sessionId: "demo_2",
    startTime: new Date(Date.now() - 40 * 60000).toISOString(),
    lastActivity: new Date(Date.now() - 15 * 60000).toISOString(),
    status: "Add to Cart",
    customerInfo: { name: "Nusrat Jahan", phone: "01845-112233", email: "nusrat@gmail.com" },
    addressProgress: { name: false, phone: false, district: false, address: false, payment: false },
    viewedProducts: [{ id: "pol-002", name: "Classic Polo Shirt", count: 1, lastViewed: new Date().toISOString() }],
    cartInfo: { itemCount: 1, total: 1250, items: [{ name: "Classic Polo Shirt", price: 1250, qty: 1 }] },
    recovery: { status: "New", reminders: { min30: false, hour2: false, hour24: false }, logs: [] },
    timeline: [
        { action: "Product Viewed", time: new Date(Date.now() - 30 * 60000).toISOString() },
        { action: "Add to Cart", time: new Date(Date.now() - 25 * 60000).toISOString() }
    ]
  },
  {
    sessionId: "demo_3",
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
    lastActivity: new Date(Date.now() - 60 * 60000).toISOString(),
    status: "Cancelled",
    customerInfo: { name: "Arif Hossain", phone: "01988-556677", email: "arif@gmail.com" },
    addressProgress: { name: true, phone: true, district: true, address: true, payment: true },
    viewedProducts: [{ id: "pol-003", name: "Premium Cotton Polo", count: 1, lastViewed: new Date().toISOString() }],
    cartInfo: { itemCount: 1, total: 1500, items: [{ name: "Premium Cotton Polo", price: 1500, qty: 1 }] },
    recovery: { status: "Ignored", reminders: { min30: false, hour2: false, hour24: false }, logs: [] },
    timeline: [],
    cancelReason: "Customer Cancelled",
    orderId: "ORD-10025"
  },
  {
    sessionId: "demo_4",
    startTime: new Date(Date.now() - 200 * 60000).toISOString(),
    lastActivity: new Date(Date.now() - 100 * 60000).toISOString(),
    status: "Order Placed",
    customerInfo: { name: "Sohan Ahmed", phone: "01611-778899", email: "sohan@gmail.com" },
    addressProgress: { name: true, phone: true, district: true, address: true, payment: true },
    viewedProducts: [{ id: "pol-004", name: "Black Polo Shirt", count: 1, lastViewed: new Date().toISOString() }],
    cartInfo: { itemCount: 1, total: 1100, items: [{ name: "Black Polo Shirt", price: 1100, qty: 1 }] },
    recovery: { status: "Recovered", reminders: { min30: false, hour2: false, hour24: false }, logs: [{action: "Sent WhatsApp", time: new Date(Date.now() - 120 * 60000).toISOString()}] },
    timeline: []
  },
  {
    sessionId: "demo_5",
    startTime: new Date(Date.now() - 25 * 60000).toISOString(),
    lastActivity: new Date(Date.now() - 20 * 60000).toISOString(),
    status: "Product Viewed",
    customerInfo: { name: "Guest User", phone: "01777-999888", email: "" },
    addressProgress: { name: false, phone: false, district: false, address: false, payment: false },
    viewedProducts: [{ id: "pol-005", name: "TikTok Trend Shirt", count: 7, lastViewed: new Date().toISOString() }],
    cartInfo: { itemCount: 0, total: 0, items: [] },
    recovery: { status: "New", reminders: { min30: false, hour2: false, hour24: false }, logs: [] },
    timeline: [
        { action: "Product Viewed", time: new Date(Date.now() - 24 * 60000).toISOString() }
    ]
  }
];

localStorage.setItem('naimshop_incomplete_orders', JSON.stringify(demoSessions));
alert('Demo data loaded!');
