import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { 
  Search, User, Users, UserPlus, ShieldCheck, ShieldAlert, Phone, MessageSquare, 
  ExternalLink, X, ChevronRight, Plus, Download, Mail, MapPin, Calendar, 
  DollarSign, ShoppingBag, Star, MessageCircle, FileText, CheckCircle, 
  Clock, AlertTriangle, Trash2, Ban, Check, Send, MonitorSmartphone, Package
} from 'lucide-react';
import { motion, AnimatePresence } from '../lib/safe-motion';

// Highly realistic mock orders for demo customers
const mockOrders = {
  "CUST-1001": [
    { id: "ORD-9201", productImage: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=100&q=80", productName: "Premium Slim-Fit Polo", sku: "PL-NAVY-M", size: "M", quantity: 2, productPrice: 850, courierCharge: 100, totalAmount: 1800, paymentMethod: "COD", paymentStatus: "Paid", orderStatus: "Delivered", trackingStatus: "Received by customer", date: "2026-06-15" },
    { id: "ORD-9320", productImage: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&q=80", productName: "Classic Crewneck Tee Black", sku: "TS-BLK-M", size: "M", quantity: 1, productPrice: 550, courierCharge: 100, totalAmount: 650, paymentMethod: "bKash", paymentStatus: "Paid", orderStatus: "Delivered", trackingStatus: "Received by customer", date: "2026-06-22" }
  ],
  "CUST-1002": [
    { id: "ORD-9412", productImage: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=100&q=80", productName: "Silk Summer Scarf Pastel", sku: "SF-PST-OS", size: "OS", quantity: 1, productPrice: 750, courierCharge: 100, totalAmount: 850, paymentMethod: "Nagad", paymentStatus: "Paid", orderStatus: "Delivered", trackingStatus: "Received by customer", date: "2026-06-25" }
  ],
  "CUST-1003": [
    { id: "ORD-8910", productImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=100&q=80", productName: "Premium Leather Wallet Brown", sku: "WL-BRN-OS", size: "OS", quantity: 1, productPrice: 3100, courierCharge: 100, totalAmount: 3200, paymentMethod: "Card", paymentStatus: "Paid", orderStatus: "Delivered", trackingStatus: "Delivered", date: "2026-05-10" },
    { id: "ORD-9105", productImage: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=100&q=80", productName: "Casual Linen Shirt Sky Blue", sku: "SH-LIN-XL", size: "XL", quantity: 3, productPrice: 2200, courierCharge: 200, totalAmount: 6800, paymentMethod: "bKash", paymentStatus: "Paid", orderStatus: "Delivered", trackingStatus: "Delivered", date: "2026-06-02" },
    { id: "ORD-9599", productImage: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=100&q=80", productName: "Smart Fit Chino Pants Olive", sku: "PT-CHN-32", size: "32", quantity: 2, productPrice: 2650, courierCharge: 100, totalAmount: 5400, paymentMethod: "COD", paymentStatus: "Pending", orderStatus: "Processing", trackingStatus: "At Sorting Hub", date: "2026-06-26" }
  ],
  "CUST-1004": [
    { id: "ORD-9498", productImage: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=100&q=80", productName: "Ankle Breathable Socks Set", sku: "SK-WHT-OS", size: "OS", quantity: 1, productPrice: 320, courierCharge: 100, totalAmount: 420, paymentMethod: "COD", paymentStatus: "Pending", orderStatus: "Pending", trackingStatus: "Order Received", date: "2026-06-24" }
  ],
  "CUST-1005": []
};

// Highly realistic mock reviews for demo customers
const mockReviews = {
  "CUST-1001": [
    { id: "REV-101", rating: 5, text: "Excellent fabric and accurate sizing! Very happy with the dark navy shade.", date: "2026-06-17" }
  ],
  "CUST-1002": [
    { id: "REV-102", rating: 4, text: "The pastel scarf is beautiful and soft. Delivery took 3 days to Gazipur which is fair.", date: "2026-06-25" }
  ],
  "CUST-1003": [
    { id: "REV-103", rating: 5, text: "The leather wallet smells authentic and chinies look superb. Excellent packaging!", date: "2026-06-05" }
  ],
  "CUST-1004": [],
  "CUST-1005": []
};

// Highly realistic mock chat messages for demo customers
const mockChats = {
  "CUST-1001": [
    { sender: "customer", text: "Assalamu Alaikum, M size navy polo dynamic stock ase?", time: "2026-06-14 11:20 AM" },
    { sender: "admin", text: "Walaikum Assalam, ji sir! Navy M size available ache, current batch khub premium.", time: "2026-06-14 11:22 AM" }
  ],
  "CUST-1002": [
    { sender: "customer", text: "Gazipur delivery charge koto porbe please?", time: "2026-06-23 09:15 PM" },
    { sender: "admin", text: "Dhakar baire Gazipur er jonno delivery charge 120 Tk, cash on delivery popular sir.", time: "2026-06-23 09:20 PM" }
  ],
  "CUST-1003": [
    { sender: "customer", text: "Please update my shipping address to Uttara Sector 4 instead of Sector 9.", time: "2026-06-26 01:10 PM" },
    { sender: "admin", text: "Noted with thanks! We have updated the delivery sheet for Order #ORD-9599.", time: "2026-06-26 01:15 PM" }
  ],
  "CUST-1004": [
    { sender: "customer", text: "First order system is super simple. Order confirm hole sms pabo?", time: "2026-06-24 10:45 AM" },
    { sender: "admin", text: "Ji sir! Apnar registered num-e processing and shipping update SMS jabe.", time: "2026-06-24 10:48 AM" }
  ],
  "CUST-1005": [
    { sender: "customer", text: "CLICK HERE FOR 100$ PROMO NOW!!! FAKE CARD SPAM", time: "2026-06-20 02:00 AM" }
  ]
};

const demoCustomers: (Customer & { createdDate?: string; deviceInfo?: string })[] = [
  {
    uid: "CUST-1001",
    name: "Abeer Hasan",
    phone: "01712345678",
    email: "abeer.hasan@gmail.com",
    photo: "",
    provider: "Google",
    status: "active",
    totalOrders: 2,
    totalSpend: 2450,
    tags: ["VIP", "Regular"],
    notes: ["Prefers morning delivery inside Dhanmondi", "Requested delivery call 30 mins prior"],
    addresses: [
      { id: "a1", division: "Dhaka", district: "Dhaka", upazila: "Dhanmondi", address: "House 12, Road 5, Dhanmondi", phone: "01712345678", isDefault: true }
    ],
    lastLogin: "2026-06-26 10:30 AM",
    createdDate: "2026-01-15 08:20 AM",
    deviceInfo: "Chrome on macOS, IP: 103.111.xxx.xxx"
  },
  {
    uid: "CUST-1002",
    name: "Nusrat Jahan",
    phone: "01812345679",
    email: "nusrat.j@gmail.com",
    photo: "",
    provider: "Facebook",
    status: "active",
    totalOrders: 1,
    totalSpend: 850,
    tags: ["Regular"],
    notes: ["Very polite and responsive on Messenger"],
    addresses: [
      { id: "a2", division: "Dhaka", district: "Gazipur", upazila: "Gachha", address: "Flat 4B, Sky Rise Tower", phone: "01812345679", isDefault: true }
    ],
    lastLogin: "2026-06-25 04:15 PM",
    createdDate: "2026-05-20 02:10 PM",
    deviceInfo: "Facebook In-App Browser, Android"
  },
  {
    uid: "CUST-1003",
    name: "Tanvir Ahmed",
    phone: "01912345680",
    email: "tanvir.ahmed@gmail.com",
    photo: "",
    provider: "Gmail",
    status: "active",
    totalOrders: 12,
    totalSpend: 15400,
    tags: ["VIP", "Loyal Buyer"],
    notes: ["Top tier loyal customer. Always handles packages carefully.", "Requires premium bubble wrap for shoe boxes."],
    addresses: [
      { id: "a3", division: "Dhaka", district: "Dhaka", upazila: "Uttara", address: "Sector 4, Road 11, House 23", phone: "01912345680", isDefault: true }
    ],
    lastLogin: "2026-06-26 09:12 PM",
    createdDate: "2025-11-05 06:45 PM",
    deviceInfo: "Safari on iPhone 15 Pro Max"
  },
  {
    uid: "CUST-1004",
    name: "Kamrul Islam",
    phone: "01512345681",
    email: "kamrul@gmail.com",
    photo: "",
    provider: "Phone",
    status: "active",
    totalOrders: 1,
    totalSpend: 420,
    tags: ["New"],
    notes: ["New signup, converted from WhatsApp campaign."],
    addresses: [
      { id: "a4", division: "Chittagong", district: "Chittagong", upazila: "Double Mooring", address: "Chittagong Port Area", phone: "01512345681", isDefault: true }
    ],
    lastLogin: "2026-06-24 11:00 AM",
    createdDate: "2026-06-24 10:30 AM",
    deviceInfo: "Chrome on Android"
  },
  {
    uid: "CUST-1005",
    name: "Spam Profile",
    phone: "01312345682",
    email: "spammer99@gmail.com",
    photo: "",
    provider: "Gmail",
    status: "blocked",
    totalOrders: 0,
    totalSpend: 0,
    tags: ["Blocked"],
    notes: ["Fraud risk. Kept posting promo links in chat.", "Automatic blocking applied by system scanner."],
    addresses: [
      { id: "a5", division: "Sylhet", district: "Sylhet", upazila: "Sylhet Sadar", address: "Unknown Location", phone: "01312345682", isDefault: true }
    ],
    lastLogin: "2026-06-20 02:00 AM",
    createdDate: "2026-06-19 11:50 PM",
    deviceInfo: "Firefox on Windows 10, VPN Detected"
  }
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [localCustomers, setLocalCustomers] = useState<(Customer & { createdDate?: string; deviceInfo?: string })[]>(demoCustomers);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<(Customer & { createdDate?: string; deviceInfo?: string }) | null>(null);
  const [filterTab, setFilterTab] = useState<string>('all');
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  
  // Drawer Tab
  const [drawerTab, setDrawerTab] = useState<'info' | 'orders' | 'reviews' | 'chats'>('info');
  // New Private Note Input
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCustomers(data);
          setLocalCustomers(data.filter((c: any) => !c.isDeleted));
        } else {
          setCustomers(demoCustomers);
          setLocalCustomers(demoCustomers);
        }
      } catch (error) {
        console.error('Customers error:', error);
        setCustomers(demoCustomers);
        setLocalCustomers(demoCustomers);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);
  const handleBlockToggle = async (customer: Customer) => {
    const updatedStatus = customer.status === 'active' ? 'blocked' : 'active';
    
    // Update local state instantly
    setLocalCustomers(prev => prev.map(c => 
      c.uid === customer.uid ? { ...c, status: updatedStatus } : c
    ));
    if (selectedCustomer && selectedCustomer.uid === customer.uid) {
      setSelectedCustomer(prev => prev ? { ...prev, status: updatedStatus } : null);
    }

    // Try updating database if not demo id
    if (!customer.uid.startsWith('CUST-')) {
      try {
        await fetch('/api/customers/' + customer.uid, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: updatedStatus })
        });
      } catch (err) {
        console.error("Database update status failed:", err);
      }
    }
  };

  const handleToggleVIP = async (customer: Customer) => {
    const currentTags = customer.tags || [];
    const isVIP = currentTags.includes('VIP');
    const updatedTags = isVIP ? currentTags.filter(t => t !== 'VIP') : [...currentTags, 'VIP'];
    
    // Update local state instantly
    setLocalCustomers(prev => prev.map(c => 
      c.uid === customer.uid ? { ...c, tags: updatedTags } : c
    ));
    if (selectedCustomer && selectedCustomer.uid === customer.uid) {
      setSelectedCustomer(prev => prev ? { ...prev, tags: updatedTags } : null);
    }

    // Try updating database if not demo id
    if (!customer.uid.startsWith('CUST-')) {
      try {
        await fetch('/api/customers/' + customer.uid, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: updatedTags })
        });
      } catch (err) {
        console.error("Database update tags failed:", err);
      }
    }
  };

  const handleDeleteCustomer = async (uid: string) => {
    if (!window.confirm("Are you sure you want to delete this customer? Soft delete will be applied.")) return;

    // Update local state instantly
    setLocalCustomers(prev => prev.filter(c => c.uid !== uid));
    if (selectedCustomer && selectedCustomer.uid === uid) {
      setSelectedCustomer(null);
    }

    // Soft delete from DB
    if (!uid.startsWith('CUST-')) {
      try {
        await fetch('/api/customers/' + uid, { method: 'DELETE' });
      } catch (err) {
        console.error("Database delete customer failed:", err);
      }
    }
  };

  const handleAddNote = async (uid: string) => {
    if (!newNote.trim()) return;

    setLocalCustomers(prev => prev.map(c => {
      if (c.uid === uid) {
        const currentNotes = c.notes || [];
        const updatedNotes = [...currentNotes, newNote.trim()];
        
        // If selected, keep it synced
        if (selectedCustomer && selectedCustomer.uid === uid) {
          setSelectedCustomer(prevSel => prevSel ? { ...prevSel, notes: updatedNotes } : null);
        }

        // Try DB update
        if (!uid.startsWith('CUST-')) {
          fetch('/api/customers/' + uid, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: updatedNotes })
          }).catch(console.error);
        }

        return { ...c, notes: updatedNotes };
      }
      return c;
    }));

    setNewNote('');
  };

  // CSV Export handler
  const exportToCSV = () => {
    const headers = ['UID', 'Name', 'Phone', 'Email', 'Address', 'Provider', 'Status', 'Total Orders', 'Total Spend (Tk)', 'Last Login'];
    const rows = localCustomers.map(c => {
      const primaryAddress = c.addresses && c.addresses.length > 0 ? c.addresses[0].address : 'N/A';
      return [
        c.uid,
        `"${c.name.replace(/"/g, '""')}"`,
        c.phone,
        c.email,
        `"${primaryAddress.replace(/"/g, '""')}"`,
        c.provider,
        c.status,
        c.totalOrders || 0,
        c.totalSpend || 0,
        c.lastLogin || "Never"
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportMessage("Successfully exported CSV to Downloads!");
    setTimeout(() => setExportMessage(null), 3500);
  };

  const handleExportMock = (type: 'PDF' | 'Excel') => {
    setExportMessage(`Successfully compiled & exported customer directory as ${type}!`);
    setTimeout(() => setExportMessage(null), 3500);
  };

  // Filter & Search logic
  const filteredCustomers = localCustomers.filter((c) => {
    const custOrders = mockOrders[c.uid as keyof typeof mockOrders] || [];
    const matchOrder = custOrders.some(o => o.id.toLowerCase().includes(search.toLowerCase()));

    const matchesSearch = `${c.name} ${c.phone} ${c.email} ${c.uid}`
      .toLowerCase()
      .includes(search.toLowerCase()) || matchOrder;

    if (filterTab === 'all') return matchesSearch;
    if (filterTab === 'google') return matchesSearch && c.provider.toLowerCase() === 'google';
    if (filterTab === 'facebook') return matchesSearch && c.provider.toLowerCase() === 'facebook';
    if (filterTab === 'gmail') return matchesSearch && c.provider.toLowerCase() === 'gmail';
    if (filterTab === 'phone') return matchesSearch && c.provider.toLowerCase() === 'phone';
    if (filterTab === 'active') return matchesSearch && c.status === 'active';
    if (filterTab === 'blocked') return matchesSearch && c.status === 'blocked';
    if (filterTab === 'vip') return matchesSearch && ((c.tags && c.tags.includes('VIP')));
    if (filterTab === 'new') return matchesSearch && ((c.tags && c.tags.includes('New')) || (c.lastLogin && (c.lastLogin.includes('2026-06-26') || c.lastLogin.toLowerCase().includes('today'))));
    if (filterTab === 'high_spend') return matchesSearch && (c.totalSpend > 3000);
    return matchesSearch;
  });

  // Dynamic statistics
  const summary = {
    total: localCustomers.length,
    new: localCustomers.filter(c => (!c.lastLogin || c.lastLogin.includes('2026-06-26') || c.lastLogin.toLowerCase().includes('today')) || (c.tags && c.tags.includes('New'))).length,
    active: localCustomers.filter(c => c.status === 'active').length,
    blocked: localCustomers.filter(c => c.status === 'blocked').length,
    google: localCustomers.filter(c => c.provider.toLowerCase() === 'google').length,
    facebook: localCustomers.filter(c => c.provider.toLowerCase() === 'facebook').length,
    gmail: localCustomers.filter(c => c.provider.toLowerCase() === 'gmail').length,
    phone: localCustomers.filter(c => c.provider.toLowerCase() === 'phone').length,
    totalOrders: localCustomers.reduce((acc, c) => acc + (c.totalOrders || 0), 0),
    totalSpend: localCustomers.reduce((acc, c) => acc + (c.totalSpend || 0), 0)
  };

  // Helper to render provider icon/badge
  const getProviderTag = (provider: string) => {
    switch(provider.toLowerCase()) {
      case 'google':
        return <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded text-[8px] font-bold">Google</span>;
      case 'facebook':
        return <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[8px] font-bold">Facebook</span>;
      case 'gmail':
        return <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded text-[8px] font-bold">Gmail</span>;
      case 'phone':
        return <span className="px-1.5 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 rounded text-[8px] font-bold">Phone</span>;
      default:
        return <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-100 rounded text-[8px] font-bold">{provider}</span>;
    }
  };

  return (
    <div className="p-4 animate-fade-in pb-28 admin-customers-page max-w-4xl mx-auto h-auto min-h-screen">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Customer Directory</h2>
          <p className="text-[9px] text-slate-500 font-bold">Manage system users, accounts and logs</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={exportToCSV}
            title="Export as CSV"
            className="p-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg flex items-center gap-1 text-[10px] font-bold border border-pink-100 transition-colors"
          >
            <Download size={12} />
            CSV
          </button>
          <button 
            onClick={() => handleExportMock('Excel')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100 transition-colors flex items-center gap-1"
          >
            <Download size={12} />
            Excel
          </button>
          <button 
            onClick={() => handleExportMock('PDF')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100 transition-colors flex items-center gap-1"
          >
            <Download size={12} />
            PDF
          </button>
        </div>
      </div>

      {/* Export feedback toast */}
      <AnimatePresence>
        {exportMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-2 bg-emerald-50 border border-emerald-150 rounded-xl text-center text-[10px] font-bold text-emerald-700 flex items-center justify-center gap-1.5"
          >
            <Check size={12} />
            {exportMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10 Custom Styled Stats Cards in 2-column compact grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {[
          { label: 'Total Customers', value: summary.total, icon: Users },
          { label: 'Today New', value: summary.new, icon: UserPlus },
          { label: 'Active', value: summary.active, icon: ShieldCheck },
          { label: 'Blocked', value: summary.blocked, icon: ShieldAlert },
          { label: 'Google Users', value: summary.google, icon: User },
          { label: 'Facebook Users', value: summary.facebook, icon: User },
          { label: 'Gmail Users', value: summary.gmail, icon: Mail },
          { label: 'Phone Users', value: summary.phone, icon: Phone },
          { label: 'Total Orders', value: summary.totalOrders, icon: ShoppingBag },
          { label: 'Total Spend (Tk)', value: summary.totalSpend, icon: DollarSign },
        ].map((item, i) => (
          <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between hover:border-slate-200 transition-colors">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider truncate">{item.label}</span>
              <div className="p-1 bg-pink-50 text-pink-600 rounded shrink-0">
                <item.icon size={10} />
              </div>
            </div>
            <div className="text-sm font-black text-slate-800 leading-none">{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs Chips */}
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-1.5 mb-3 py-1">
        {[
          { id: 'all', label: 'All Users' },
          { id: 'active', label: 'Active' },
          { id: 'blocked', label: 'Blocked' },
          { id: 'google', label: 'Google' },
          { id: 'facebook', label: 'Facebook' },
          { id: 'gmail', label: 'Gmail' },
          { id: 'phone', label: 'Phone' },
          { id: 'vip', label: '⭐ VIP' },
          { id: 'new', label: 'New' },
          { id: 'high_spend', label: 'High Spend' }
        ].map(chip => (
          <button
            key={chip.id}
            onClick={() => setFilterTab(chip.id)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
              filterTab === chip.id 
                ? 'bg-pink-600 text-white border-pink-600 shadow-xs' 
                : 'bg-white text-slate-600 border-slate-150 hover:bg-slate-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-slate-400" size={15} />
        <input 
          type="text" 
          placeholder="Search by name, phone, email, CUST ID, Order ID..." 
          className="w-full h-10 border border-slate-150 rounded-xl pl-9 pr-3 text-xs font-bold focus:outline-none focus:border-pink-500 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      {/* Customer List Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex-1 h-auto">
        {loading ? (
          <div className="p-10 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
            Loading customer entries...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center text-xs font-bold text-slate-400">
            <div>No customers found</div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Try another filter or search keyword</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredCustomers.map(c => (
              <div 
                key={c.uid} 
                className={`p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors ${
                  c.status === 'blocked' ? 'bg-red-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative">
                    <img 
                      src={c.photo || "https://ui-avatars.com/api/?background=fbcfe8&color=db2777&bold=true&name=" + encodeURIComponent(c.name)} 
                      className="w-10 h-10 rounded-full border border-pink-100 shrink-0 object-cover" 
                      alt={c.name} 
                    />
                    <div className="absolute -bottom-1 -right-1">
                      {c.status === 'active' ? (
                        <div className="w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center" title="Active">
                          <Check size={8} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center" title="Blocked">
                          <X size={8} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-800 truncate">{c.name}</span>
                      <span className="text-[8px] font-mono text-slate-400 font-bold bg-slate-50 px-1 rounded">{c.uid}</span>
                      {c.tags && c.tags.includes('VIP') && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded flex items-center gap-0.5"><Star size={8} className="fill-amber-700" /> VIP</span>
                      )}
                      {c.tags && c.tags.includes('New') && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black rounded">New</span>
                      )}
                      {c.status === 'blocked' && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[8px] font-black rounded flex items-center gap-0.5"><Ban size={8} /> Blocked</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{c.email || 'No email'} • {c.phone}</div>
                    
                    {/* Compact info row requested */}
                    <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                      {getProviderTag(c.provider)}
                      <span className="text-[9px] text-slate-500 font-bold">Orders: <strong className="text-slate-700">{c.totalOrders || 0}</strong></span>
                      <span className="text-[9px] text-slate-500 font-bold">Spend: <strong className="text-pink-600">{c.totalSpend || 0} Tk</strong></span>
                      {c.lastLogin && (
                        <span className="text-[8px] text-slate-400 font-medium">Active: {c.lastLogin.split(' ')[0]}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => {
                      setSelectedCustomer(c);
                      setDrawerTab('info');
                    }}
                    className="p-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl transition-colors"
                    title="View Customer Details"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[9px] text-slate-400 text-center font-bold mt-3">
        Showing {filteredCustomers.length} of {localCustomers.length} registered customers
      </p>

      {/* Customer Details Drawer overlay */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setSelectedCustomer(null)} />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="min-w-0">
                  <span className="text-[8px] font-mono text-slate-400 font-black block tracking-widest uppercase">{selectedCustomer.uid}</span>
                  <h3 className="text-sm font-black text-slate-800 truncate">{selectedCustomer.name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-150 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Navigation Tabs */}
              <div className="flex border-b border-slate-100 bg-white">
                {[
                  { id: 'info', label: 'Profile', icon: User },
                  { id: 'orders', label: `Orders (${(mockOrders[selectedCustomer.uid as keyof typeof mockOrders] || []).length})`, icon: ShoppingBag },
                  { id: 'reviews', label: `Reviews (${(mockReviews[selectedCustomer.uid as keyof typeof mockReviews] || []).length})`, icon: Star },
                  { id: 'chats', label: `Chats`, icon: MessageCircle }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id as any)}
                    className={`flex-1 py-3 text-[10px] font-bold flex items-center justify-center gap-1 border-b-2 transition-all ${
                      drawerTab === tab.id 
                        ? 'border-pink-600 text-pink-600 bg-pink-50/10' 
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
                
                {drawerTab === 'info' && (
                  <div className="space-y-4">
                    {/* Avatar Header Block */}
                    <div className="flex flex-col items-center text-center p-3 bg-slate-50 rounded-2xl border border-slate-100 relative">
                      {selectedCustomer.tags?.includes('VIP') && (
                        <div className="absolute top-3 left-3 bg-amber-100 text-amber-700 px-2 py-1 rounded text-[9px] font-black flex items-center gap-1">
                          <Star size={10} className="fill-amber-700" />
                          VIP
                        </div>
                      )}
                      <img 
                        src={selectedCustomer.photo || "https://ui-avatars.com/api/?background=fbcfe8&color=db2777&size=128&bold=true&name=" + encodeURIComponent(selectedCustomer.name)} 
                        className="w-16 h-16 rounded-full border-2 border-white shadow-sm mb-2" 
                        alt="" 
                      />
                      <h4 className="text-sm font-black text-slate-800">{selectedCustomer.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">{selectedCustomer.email || "No email linked"}</p>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                        {getProviderTag(selectedCustomer.provider)}
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          selectedCustomer.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {selectedCustomer.status}
                        </span>
                      </div>
                    </div>

                    {/* Compact contact actions */}
                    <div className="grid grid-cols-4 gap-2">
                      <a 
                        href={`tel:${selectedCustomer.phone}`}
                        className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-[9px] flex flex-col items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <Phone size={12} />
                        Call
                      </a>
                      <a 
                        href={`https://wa.me/88${selectedCustomer.phone}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-[9px] flex flex-col items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <MessageSquare size={12} />
                        WhatsApp
                      </a>
                      <button 
                        onClick={() => alert(`Opening messenger chat proxy for ${selectedCustomer.name}`)}
                        className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[9px] flex flex-col items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <MessageCircle size={12} />
                        Messenger
                      </button>
                      <a 
                        href={`mailto:${selectedCustomer.email}`}
                        className="py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-[9px] flex flex-col items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <Mail size={12} />
                        Email
                      </a>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => setDrawerTab('orders')}
                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] flex items-center justify-center gap-1 transition-all border border-slate-200"
                      >
                        <ShoppingBag size={11} />
                        View Orders
                      </button>
                      <button 
                        onClick={() => setDrawerTab('reviews')}
                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] flex items-center justify-center gap-1 transition-all border border-slate-200"
                      >
                        <Star size={11} />
                        View Reviews
                      </button>
                      <button 
                        onClick={() => setDrawerTab('chats')}
                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[9px] flex items-center justify-center gap-1 transition-all border border-slate-200"
                      >
                        <MessageCircle size={11} />
                        View Chat
                      </button>
                    </div>

                    {/* Customer Info Metadata Grid */}
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100 shadow-xs">
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold">Customer ID</span>
                        <span className="text-[10px] font-mono font-bold text-slate-800">{selectedCustomer.uid}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold">Phone Number</span>
                        <span className="text-[10px] font-bold text-slate-800">{selectedCustomer.phone}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold">Email Address</span>
                        <span className="text-[10px] font-bold text-slate-800">{selectedCustomer.email || 'N/A'}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold">Provider Login</span>
                        <span className="text-[10px] font-bold text-slate-800">{selectedCustomer.provider}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Calendar size={10}/> Account Created</span>
                        <span className="text-[10px] font-bold text-slate-800">{selectedCustomer.createdDate || "Unknown"}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Clock size={10}/> Last Login</span>
                        <span className="text-[10px] font-bold text-slate-800">{selectedCustomer.lastLogin || "Never"}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><MonitorSmartphone size={10}/> Device Info</span>
                        <span className="text-[9px] font-bold text-slate-500 truncate max-w-[150px]">{selectedCustomer.deviceInfo || "Web Browser"}</span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold">Total Orders</span>
                        <span className="text-[10px] font-black text-slate-800">{selectedCustomer.totalOrders} order(s)</span>
                      </div>
                      <div className="p-3 flex justify-between items-center bg-pink-50/30">
                        <span className="text-[10px] text-slate-500 font-bold">Total Spend Amount</span>
                        <span className="text-[10px] font-black text-pink-600">{selectedCustomer.totalSpend} Tk</span>
                      </div>
                      
                      {/* Order status breakdown */}
                      <div className="p-3 flex justify-between items-center bg-slate-50">
                        <div className="text-center">
                          <div className="text-[10px] font-black text-emerald-600">{
                            (mockOrders[selectedCustomer.uid as keyof typeof mockOrders] || []).filter(o => o.orderStatus === 'Delivered').length
                          }</div>
                          <div className="text-[8px] font-bold text-slate-400">Delivered</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-black text-amber-500">{
                            (mockOrders[selectedCustomer.uid as keyof typeof mockOrders] || []).filter(o => o.orderStatus === 'Processing' || o.orderStatus === 'Pending').length
                          }</div>
                          <div className="text-[8px] font-bold text-slate-400">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-black text-rose-500">{
                            (mockOrders[selectedCustomer.uid as keyof typeof mockOrders] || []).filter(o => o.orderStatus === 'Cancelled').length
                          }</div>
                          <div className="text-[8px] font-bold text-slate-400">Cancelled</div>
                        </div>
                      </div>
                    </div>

                    {/* Addresses Block */}
                    <div>
                      <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                        <MapPin size={11} />
                        Delivery Addresses
                      </h5>
                      {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                        selectedCustomer.addresses.map(addr => (
                          <div key={addr.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-[11px] font-bold text-slate-700 mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span>{addr.address}</span>
                              {addr.isDefault && <span className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded font-black">Default</span>}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-1">{addr.upazila}, {addr.district}, {addr.division} • {addr.phone}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl text-center text-[10px] text-slate-400 font-bold border border-dashed border-slate-200">
                          No address specified yet.
                        </div>
                      )}
                    </div>

                    {/* Private Notes block requested */}
                    <div>
                      <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                        <FileText size={11} />
                        Admin Private Notes
                      </h5>
                      <div className="space-y-2 mb-2">
                        {selectedCustomer.notes && selectedCustomer.notes.length > 0 ? (
                          selectedCustomer.notes.map((note, index) => (
                            <div key={index} className="p-2.5 bg-amber-50/50 border border-amber-150 rounded-lg text-[10px] font-bold text-slate-700 flex justify-between items-start">
                              <span className="flex-1">{note}</span>
                              <span className="text-[8px] text-amber-600 bg-amber-50 px-1 rounded ml-1 shrink-0 uppercase font-black">Private</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-[9px] text-slate-400 font-bold bg-slate-50 rounded-lg">
                            No internal notes added. Add notes to track special requirements.
                          </div>
                        )}
                      </div>

                      {/* Add Admin Note Input */}
                      <div className="flex gap-1.5 mt-2">
                        <input 
                          type="text" 
                          placeholder="VIP / Delivery issue / Fraud risk..." 
                          className="flex-1 h-8 border border-slate-200 rounded-lg px-2.5 text-[10px] font-semibold bg-slate-50 focus:outline-none focus:bg-white focus:border-pink-500"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNote(selectedCustomer.uid)}
                        />
                        <button 
                          onClick={() => handleAddNote(selectedCustomer.uid)}
                          className="h-8 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Plus size={11} /> Add
                        </button>
                      </div>
                    </div>

                    {/* Critical actions: Block, Delete, VIP */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => handleToggleVIP(selectedCustomer)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-colors ${
                          selectedCustomer.tags?.includes('VIP') 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                            : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100'
                        }`}
                      >
                        <Star size={11} className={selectedCustomer.tags?.includes('VIP') ? 'fill-amber-700' : ''} />
                        {selectedCustomer.tags?.includes('VIP') ? 'Remove VIP' : 'Mark VIP'}
                      </button>
                      
                      <button 
                        onClick={() => handleBlockToggle(selectedCustomer)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-colors ${
                          selectedCustomer.status === 'active' 
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                        }`}
                      >
                        <Ban size={11} />
                        {selectedCustomer.status === 'active' ? 'Block Account' : 'Unblock Account'}
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteCustomer(selectedCustomer.uid)}
                        className="py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-black text-slate-600 transition-all flex items-center justify-center gap-1 border border-slate-200 hover:border-rose-150 w-full"
                      >
                        <Trash2 size={11} />
                        Soft Delete Account
                      </button>
                    </div>

                  </div>
                )}

                {drawerTab === 'orders' && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Order History ({selectedCustomer.totalOrders})</h4>
                    
                    {(() => {
                      const list = mockOrders[selectedCustomer.uid as keyof typeof mockOrders] || [];
                      if (list.length === 0) {
                        return (
                          <div className="p-8 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            No orders registered for this account.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {list.map((order) => (
                            <div key={order.id} className="p-3 bg-white border border-slate-150 rounded-2xl shadow-2xs space-y-3">
                              <div className="flex justify-between items-center text-[10px] font-bold border-b border-slate-50 pb-2">
                                <span className="font-mono text-slate-800 flex items-center gap-1"><Package size={12}/> {order.id}</span>
                                <span className="text-slate-400 flex items-center gap-1"><Calendar size={10} /> {order.date}</span>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                {order.productImage && (
                                  <img src={order.productImage} alt={order.productName} className="w-12 h-12 object-cover rounded-lg border border-slate-100 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] font-black text-slate-800 truncate">{order.productName}</div>
                                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">SKU: {order.sku}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">Size: {order.size}</span>
                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">Qty: {order.quantity}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5 text-[9px]">
                                <div className="flex justify-between font-bold text-slate-500">
                                  <span>Product Price (x{order.quantity})</span>
                                  <span>{order.productPrice * order.quantity} Tk</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-500">
                                  <span>Courier Charge</span>
                                  <span>{order.courierCharge} Tk</span>
                                </div>
                                <div className="flex justify-between font-black text-slate-800 pt-1.5 border-t border-slate-200">
                                  <span>Total Amount</span>
                                  <span className="text-pink-600 text-[10px]">{order.totalAmount} Tk</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-50 flex-wrap gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{order.paymentMethod}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                    order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {order.paymentStatus}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={10} className="text-slate-400" />
                                  <span className="text-[9px] text-slate-500 font-bold">{order.orderStatus} • {order.trackingStatus}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {drawerTab === 'reviews' && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Product Review Submissions</h4>
                    
                    {(() => {
                      const reviews = mockReviews[selectedCustomer.uid as keyof typeof mockReviews] || [];
                      if (reviews.length === 0) {
                        return (
                          <div className="p-8 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            No reviews submitted by this customer.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2.5">
                          {reviews.map((rev) => (
                            <div key={rev.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      size={11} 
                                      className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                                    />
                                  ))}
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold">{rev.date}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium italic">"{rev.text}"</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {drawerTab === 'chats' && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Customer Support Chat History</h4>
                    
                    {(() => {
                      const chats = mockChats[selectedCustomer.uid as keyof typeof mockChats] || [];
                      if (chats.length === 0) {
                        return (
                          <div className="p-8 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            No recent support chat logs found.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2.5">
                          {chats.map((msg, idx) => (
                            <div 
                              key={idx} 
                              className={`flex flex-col max-w-[85%] rounded-2xl p-2.5 text-[11px] font-semibold leading-relaxed ${
                                msg.sender === 'admin' 
                                  ? 'bg-pink-600 text-white ml-auto rounded-tr-none' 
                                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
                              }`}
                            >
                              <div>{msg.text}</div>
                              <span className={`text-[8px] font-bold mt-1 block text-right ${
                                msg.sender === 'admin' ? 'text-pink-100' : 'text-slate-400'
                              }`}>
                                {msg.time}
                              </span>
                            </div>
                          ))}
                          
                          <div className="pt-2 border-t border-slate-100 flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Type support reply..." 
                              className="flex-1 h-8 border border-slate-200 rounded-lg px-2 text-[10px] font-semibold bg-slate-50 focus:outline-none focus:bg-white"
                              disabled
                              value="Quick chat shortcuts enabled via WhatsApp / Messenger"
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
