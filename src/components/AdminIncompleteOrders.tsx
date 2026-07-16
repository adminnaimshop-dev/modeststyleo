import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, MessageSquare, Mail, AlertTriangle, CheckCircle2, RotateCcw, Download, Search, Filter, Clock, ShoppingCart, User, StopCircle, Eye, ClipboardX, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IncompleteOrderSession } from '../utils/sessionTracker';

export default function AdminIncompleteOrders() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<IncompleteOrderSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const loadData = () => {
    const data = JSON.parse(localStorage.getItem('naimshop_incomplete_orders') || '[]');
    setSessions(data.sort((a: any, b: any) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()));
  };

  const demoIncompleteOrders: IncompleteOrderSession[] = [
    {
      sessionId: "demo_1",
      startTime: new Date().toISOString(),
      lastActivity: new Date(Date.now() - 5 * 60000).toISOString(),
      status: "Checkout Started",
      customerInfo: { name: "Md Rakib Hasan", phone: "01712-345678", email: "rakib@gmail.com" },
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
      startTime: new Date().toISOString(),
      lastActivity: new Date(Date.now() - 15 * 60000).toISOString(),
      status: "Checkout Abandoned",
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
      startTime: new Date().toISOString(),
      lastActivity: new Date(Date.now() - 60 * 60000).toISOString(),
      status: "Cancelled",
      customerInfo: { name: "Arif Hossain", phone: "01988-556677", email: "arif@gmail.com" },
      addressProgress: { name: true, phone: true, district: true, address: true, payment: true },
      viewedProducts: [{ id: "pol-003", name: "Premium Cotton Polo", count: 1, lastViewed: new Date().toISOString() }],
      cartInfo: { itemCount: 1, total: 1450, items: [{ name: "Premium Cotton Polo", price: 1450, qty: 1 }] },
      recovery: { status: "Ignored", reminders: { min30: false, hour2: false, hour24: false }, logs: [] },
      timeline: [
        { action: "Order Placed", time: new Date(Date.now() - 120 * 60000).toISOString() },
        { action: "Cancelled", time: new Date(Date.now() - 60 * 60000).toISOString() }
      ],
      cancelReason: "Customer Cancelled",
      orderId: "ORD-10025"
    }
  ];

  const sessionsToDisplay = sessions.length > 0 ? sessions : demoIncompleteOrders;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // 3 second polling for "Live Data" feeling
    return () => clearInterval(interval);
  }, []);

  const handleUpdateRecoveryStatus = (sessionId: string, status: IncompleteOrderSession['recovery']['status']) => {
    const updated = sessions.map(s => s.sessionId === sessionId ? {
      ...s,
      recovery: { ...s.recovery, status }
    } : s);
    setSessions(updated);
    localStorage.setItem('naimshop_incomplete_orders', JSON.stringify(updated));
  };

  const handleLogAction = (sessionId: string, action: string) => {
    const updated = sessions.map(s => s.sessionId === sessionId ? {
      ...s,
      recovery: { 
        ...s.recovery, 
        logs: [...s.recovery.logs, { action, time: new Date().toISOString() }] 
      }
    } : s);
    setSessions(updated);
    localStorage.setItem('naimshop_incomplete_orders', JSON.stringify(updated));
  };

  // Calculations for summary
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const todayIncomplete = sessionsToDisplay.filter(s => new Date(s.lastActivity) >= today && s.status !== 'Order Placed' && s.status !== 'Cancelled').length;
  const todayRecovered = sessionsToDisplay.filter(s => new Date(s.lastActivity) >= today && s.recovery.status === 'Recovered').length;
  const pendingFollowUp = sessionsToDisplay.filter(s => ['New', 'Contacted', 'Waiting'].includes(s.recovery.status) && s.status !== 'Order Placed' && s.status !== 'Cancelled').length;
  const whatsappSent = sessionsToDisplay.filter(s => s.recovery.logs.some(l => l.action.includes('WhatsApp'))).length;
  const callsMade = sessionsToDisplay.filter(s => s.recovery.logs.some(l => l.action.includes('Call'))).length;
  const emailSent = sessionsToDisplay.filter(s => s.recovery.logs.some(l => l.action.includes('Email'))).length;
  const activeCarts = sessionsToDisplay.filter(s => s.cartInfo.itemCount > 0 && s.status !== 'Order Placed' && s.status !== 'Cancelled').length;
  const last24hIncomplete = sessionsToDisplay.filter(s => new Date(s.lastActivity) >= last24h && s.status !== 'Order Placed' && s.status !== 'Cancelled').length;

  const filteredSessions = sessionsToDisplay.filter(s => {
    const matchesSearch = 
      s.customerInfo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerInfo.phone?.includes(searchTerm) ||
      s.customerInfo.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.orderId?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    
    // Filters
    const sessDate = new Date(s.lastActivity);
    const sessDay = new Date(sessDate);
    sessDay.setHours(0,0,0,0);
    
    if (filter === 'today' && sessDay.getTime() !== today.getTime()) return false;
    if (filter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (sessDay.getTime() !== yesterday.getTime()) return false;
    }
    if (filter === 'last7' && sessDate.getTime() < (today.getTime() - 7*24*60*60*1000)) return false;
    if (filter === 'last30' && sessDate.getTime() < (today.getTime() - 30*24*60*60*1000)) return false;
    if (filter === 'hasPhone' && !s.customerInfo.phone) return false;
    if (filter === 'hasEmail' && !s.customerInfo.email) return false;
    if (filter === 'add2cart' && s.status !== 'Add to Cart') return false;
    if (filter === 'checkoutStarted' && s.status !== 'Checkout Started') return false;
    if (filter === 'cancelled' && s.status !== 'Cancelled') return false;
    if (filter === 'abandoned' && !['Checkout Started', 'Payment Pending', 'Checkout Abandoned'].includes(s.status)) return false;
    if (filter === 'hasCart' && s.cartInfo.itemCount === 0) return false;

    return true;
  });

  const exportCSV = () => {
    const csvRows = [
      ['Session/Order ID', 'Customer Name', 'Phone', 'Email', 'Status', 'Cart Total', 'Last Activity', 'Recovery Status']
    ];
    filteredSessions.forEach(s => {
      csvRows.push([
        s.orderId || s.sessionId,
        s.customerInfo.name || 'Unknown',
        s.customerInfo.phone || 'N/A',
        s.customerInfo.email || 'N/A',
        s.status,
        s.cartInfo.total.toString(),
        new Date(s.lastActivity).toLocaleString(),
        s.recovery.status
      ]);
    });
    
    const csvString = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'incomplete_orders_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-4 animate-fade-in pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1 text-[11px] font-bold text-[#ff2f7d] bg-pink-50 hover:bg-pink-100 border border-pink-150 rounded-lg px-2.5 py-1.5 cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to Dashboard
        </button>
        <b className="text-[#ff2f7d] text-[11px] tracking-widest uppercase font-black">Incomplete & Cancelled</b>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 shadow-sm text-center">
          <span className="text-[9px] text-rose-500 uppercase font-black tracking-wider block">Today's Incomplete</span>
          <h4 className="text-xl font-black text-rose-600 mt-0.5">{todayIncomplete}</h4>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
          <span className="text-[9px] text-emerald-500 uppercase font-black tracking-wider block">Today Recovered</span>
          <h4 className="text-xl font-black text-emerald-600 mt-0.5">{todayRecovered}</h4>
        </div>
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 shadow-sm text-center">
          <span className="text-[9px] text-amber-500 uppercase font-black tracking-wider block">Pending Follow-up</span>
          <h4 className="text-xl font-black text-amber-600 mt-0.5">{pendingFollowUp}</h4>
        </div>
        <div className="bg-green-50 p-3 rounded-xl border border-green-100 shadow-sm text-center">
          <span className="text-[9px] text-green-600 uppercase font-black tracking-wider block">WhatsApp Sent</span>
          <h4 className="text-xl font-black text-green-700 mt-0.5">{whatsappSent}</h4>
        </div>
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm text-center">
          <span className="text-[9px] text-blue-500 uppercase font-black tracking-wider block">Call Made</span>
          <h4 className="text-xl font-black text-blue-600 mt-0.5">{callsMade}</h4>
        </div>
        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 shadow-sm text-center">
          <span className="text-[9px] text-indigo-500 uppercase font-black tracking-wider block">Email Sent</span>
          <h4 className="text-xl font-black text-indigo-600 mt-0.5">{emailSent}</h4>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Active Cart</span>
          <h4 className="text-xl font-black text-slate-800 mt-0.5">{activeCarts}</h4>
        </div>
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 shadow-sm text-center">
          <span className="text-[9px] text-purple-500 uppercase font-black tracking-wider block">Last 24h Incomp.</span>
          <h4 className="text-xl font-black text-purple-600 mt-0.5">{last24hIncomplete}</h4>
        </div>
      </div>

      {/* Controls: Search, Filter, Export */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search name, phone, email, order ID..." 
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white font-medium text-[11px] focus:outline-none focus:border-[#ff2f7d]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[11px] font-bold focus:outline-none focus:border-[#ff2f7d] outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Sessions</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last7">Last 7 Days</option>
          <option value="last30">Last 30 Days</option>
          <option value="hasPhone">Has Phone</option>
          <option value="hasEmail">Has Gmail/Email</option>
          <option value="add2cart">Add to Cart</option>
          <option value="checkoutStarted">Checkout Started</option>
          <option value="abandoned">Abandoned Cart</option>
          <option value="cancelled">Cancelled Orders</option>
          <option value="hasCart">Active Cart</option>
        </select>
        <button onClick={exportCSV} className="h-10 px-4 bg-slate-900 text-white rounded-xl text-[11px] font-black hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map(session => (
          <div key={session.sessionId} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-4">
            
            {/* Header: Status & Info */}
            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider ${
                    session.status === 'Cancelled' ? 'bg-rose-50 text-rose-500' :
                    session.status === 'Order Placed' ? 'bg-emerald-50 text-emerald-500' :
                    'bg-amber-50 text-amber-500'
                  }`}>
                    {session.status}
                  </span>
                  {(() => {
                     const getRecoveryScore = (s: IncompleteOrderSession) => {
                        if (s.status === 'Cancelled' || s.status === 'Order Placed') return null;
                        if (s.cartInfo.itemCount > 0 && s.customerInfo.phone) return { label: 'High Chance', color: 'text-emerald-500 bg-emerald-50' };
                        if (s.customerInfo.phone || s.cartInfo.itemCount > 0) return { label: 'Medium Chance', color: 'text-amber-500 bg-amber-50' };
                        return { label: 'Low Chance', color: 'text-rose-500 bg-rose-50' };
                     };
                     const score = getRecoveryScore(session);
                     if (!score) return null;
                     return (
                        <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider ${score.color}`}>
                           ● {score.label}
                        </span>
                     );
                  })()}
                  {session.orderId && <span className="text-xs font-bold text-slate-400">#{session.orderId}</span>}
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">{session.customerInfo.name || 'Anonymous User'}</h4>
                <div className="flex flex-col gap-0.5 mt-1 text-[11px] font-semibold text-slate-500">
                  {session.customerInfo.phone && <span className="flex items-center gap-1"><Phone size={10} /> {session.customerInfo.phone}</span>}
                  {session.customerInfo.email && <span className="flex items-center gap-1"><Mail size={10} /> {session.customerInfo.email}</span>}
                  {session.customerInfo.userId && <span className="flex items-center gap-1"><User size={10} /> ID: {session.customerInfo.userId}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold mb-1">Recovery Status</div>
                <select 
                  className="bg-slate-50 border border-slate-150 rounded-lg text-[11px] font-black px-2 py-1 outline-none focus:border-[#ff2f7d]"
                  value={session.recovery.status}
                  onChange={(e) => handleUpdateRecoveryStatus(session.sessionId, e.target.value as any)}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Ignored">Ignored</option>
                </select>
                <div className="text-[10px] font-bold text-slate-400 mt-2 flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1"><Clock size={10} /> 1st Visit: {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> Last active: {new Date(session.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {(() => {
                     const mins = Math.round((new Date().getTime() - new Date(session.lastActivity).getTime()) / 60000);
                     if (mins < 60) return <span className="text-amber-500">{mins} mins ago</span>;
                     const hrs = Math.floor(mins / 60);
                     return <span className="text-slate-400">{hrs} hrs ago</span>;
                  })()}
                </div>
              </div>
            </div>

            {/* Address Progress */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="text-slate-400 uppercase tracking-widest block w-full mb-1">Information Progress</span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${session.addressProgress.name ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {session.addressProgress.name ? <CheckCircle2 size={12} /> : <StopCircle size={12} />} Name
              </span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${session.addressProgress.phone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {session.addressProgress.phone ? <CheckCircle2 size={12} /> : <StopCircle size={12} />} Mobile
              </span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${session.addressProgress.district ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {session.addressProgress.district ? <CheckCircle2 size={12} /> : <StopCircle size={12} />} District
              </span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${session.addressProgress.address ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {session.addressProgress.address ? <CheckCircle2 size={12} /> : <StopCircle size={12} />} Full Address
              </span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${session.addressProgress.payment ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {session.addressProgress.payment ? <CheckCircle2 size={12} /> : <StopCircle size={12} />} Payment
              </span>
            </div>

            {/* Cart & Products Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-50">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1">
                  <ShoppingCart size={12} /> Cart Details ({session.cartInfo.itemCount} items) - ৳{session.cartInfo.total}
                </div>
                {session.cartInfo.items.length > 0 ? (
                  <div className="space-y-1.5">
                    {session.cartInfo.items.map((item, i) => (
                      <div key={i} className="text-[11px] font-semibold text-slate-700 flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                           {item.image ? (
                             <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" />
                           ) : (
                             <div className="w-8 h-8 bg-slate-200 rounded"></div>
                           )}
                           <span className="truncate max-w-[120px]">{item.qty}x {item.name}</span>
                        </div>
                        <span className="font-black whitespace-nowrap">৳{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Cart is empty</span>
                )}
              </div>

              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1">
                  <Eye size={12} /> Viewed Products ({session.viewedProducts.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {session.viewedProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      {p.image ? (
                         <img src={p.image} alt="" className="w-6 h-6 rounded object-cover" />
                      ) : (
                         <div className="w-6 h-6 bg-slate-200 rounded"></div>
                      )}
                      <span className="text-[10px] font-semibold text-slate-600 truncate max-w-[100px]">
                        {p.name} <span className="text-slate-400">({p.count}x)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="pt-3 border-t border-slate-50">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Admin Notes</span>
               <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#ff2f7d] resize-none"
                  rows={2}
                  placeholder="Add notes about this customer..."
                  value={session.recovery.adminNote || ''}
                  onChange={(e) => {
                     const updated = sessions.map(s => s.sessionId === session.sessionId ? {
                        ...s, recovery: { ...s.recovery, adminNote: e.target.value }
                     } : s);
                     setSessions(updated);
                     localStorage.setItem('naimshop_incomplete_orders', JSON.stringify(updated));
                  }}
               />
            </div>

            {/* Quick Actions / Recovery */}
            <div className="pt-4 border-t border-slate-50">
              <div className="flex flex-wrap gap-2 mb-3">
                <a href={`tel:${session.customerInfo.phone}`} onClick={() => handleLogAction(session.sessionId, 'Called Customer')} className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex-1 min-w-[80px]">
                  <Phone size={13} /> Call
                </a>
                <a href={`https://wa.me/88${session.customerInfo.phone}`} target="_blank" rel="noreferrer" onClick={() => handleLogAction(session.sessionId, 'Sent WhatsApp')} className="flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex-1 min-w-[80px]">
                  <MessageSquare size={13} /> WhatsApp
                </a>
                <a href={`mailto:${session.customerInfo.email}`} onClick={() => handleLogAction(session.sessionId, 'Sent Email')} className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex-1 min-w-[80px]">
                  <Mail size={13} /> Email
                </a>
                <button onClick={() => { handleLogAction(session.sessionId, 'Viewed Details'); alert('In a full app, this would expand detailed view'); }} className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex-1 min-w-[80px]">
                  <Eye size={13} /> Details
                </button>
                <button onClick={() => handleUpdateRecoveryStatus(session.sessionId, 'Recovered')} className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex-1 min-w-[80px]">
                  <CheckCircle2 size={13} /> Recovered
                </button>
                <button onClick={() => { 
                   if (confirm('Delete this session?')) {
                     const updated = sessions.filter(s => s.sessionId !== session.sessionId);
                     setSessions(updated);
                     localStorage.setItem('naimshop_incomplete_orders', JSON.stringify(updated));
                   }
                }} className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex-1 min-w-[80px]">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
              
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auto Reminders</span>
                <div className="flex gap-1.5">
                  <button onClick={() => { handleLogAction(session.sessionId, '30m Reminder Scheduled'); alert('30m reminder configured'); }} className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600 hover:text-[#ff2f7d] hover:border-[#ff2f7d] cursor-pointer">30 Min</button>
                  <button onClick={() => { handleLogAction(session.sessionId, '2h Reminder Scheduled'); alert('2h reminder configured'); }} className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600 hover:text-[#ff2f7d] hover:border-[#ff2f7d] cursor-pointer">2 Hours</button>
                  <button onClick={() => { handleLogAction(session.sessionId, '24h Reminder Scheduled'); alert('24h reminder configured'); }} className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600 hover:text-[#ff2f7d] hover:border-[#ff2f7d] cursor-pointer">24 Hours</button>
                </div>
              </div>
            </div>

            {/* Timelines logs snippet */}
            {(session.recovery.logs.length > 0 || session.timeline.length > 0) && (
              <div className="pt-3 border-t border-slate-50 mt-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Customer Timeline & Logs</span>
                
                {session.timeline.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {session.timeline.map((t, i) => (
                       <span key={`t-${i}`} className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                         {t.action} {t.detail ? `(${t.detail})` : ''} - {new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    ))}
                  </div>
                )}

                {session.recovery.logs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {session.recovery.logs.map((l, i) => (
                       <span key={`l-${i}`} className="text-[9px] font-bold text-slate-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                         {l.action} - {new Date(l.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-bold bg-white rounded-xl border border-slate-100 shadow-sm">
             No sessions match your filter.
          </div>
        )}
      </div>
    </div>
  );
}
