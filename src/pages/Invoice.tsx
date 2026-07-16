
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGoBack } from '../utils/navigation';
import { ChevronLeft, Download, Printer, Share2, Phone, Mail, Globe, MessageCircle, Home, Check } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [searchParams] = useSearchParams();
  const { companySettings } = useCompany();
  const [order, setOrder] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find order in localStorage
    let foundOrder = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('orders_')) {
        const orders = JSON.parse(localStorage.getItem(key) || '[]');
        foundOrder = orders.find((o: any) => o.id === id);
        if (foundOrder) break;
      }
    }
    
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      // If not found, check if it's a guest order
      const guestOrders = JSON.parse(localStorage.getItem('orders_guest') || '[]');
      foundOrder = guestOrders.find((o: any) => o.id === id);
      if (foundOrder) setOrder(foundOrder);
    }
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${id}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (order && searchParams.get('download') === 'true') {
      // Small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [order, searchParams]);

  const handleBack = () => {
    goBack();
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 invoice-page-container">
      {/* 
        Tailwind v4 uses oklch() colors which html2canvas cannot parse.
        We override these with standard hex values for the printable area.
      */}
      <style>{`
        .invoice-print-area {
          --background: #ffffff;
          --foreground: #111827;
          background-color: #ffffff !important;
          color: #111827 !important;
        }
        .invoice-print-area * {
          border-color: #f3f4f6 !important; /* gray-100 */
        }
        .invoice-print-area .text-gray-900 { color: #111827 !important; }
        .invoice-print-area .text-gray-800 { color: #1f2937 !important; }
        .invoice-print-area .text-gray-700 { color: #374151 !important; }
        .invoice-print-area .text-gray-500 { color: #6b7280 !important; }
        .invoice-print-area .text-gray-400 { color: #9ca3af !important; }
        .invoice-print-area .bg-gray-50 { background-color: #f9fafb !important; }
        .invoice-print-area .border-gray-50 { border-color: #f9fafb !important; }
        .invoice-print-area .border-gray-100 { border-color: #f3f4f6 !important; }
        .invoice-print-area .text-indigo-600 { color: #4f46e5 !important; }
        
        @media print {
          body { background: white !important; }
          .invoice-page-container { background: white !important; min-height: auto !important; padding-bottom: 0 !important; }
          .max-w-[520px] { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .rounded-2xl { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
          .shadow-sm { box-shadow: none !important; }
          .border { border: none !important; }
        }
      `}</style>

      {/* Top Header (Non-printable) */}
      <div className="bg-white border-b border-gray-100 px-4 h-16 flex items-center justify-between sticky top-0 z-50 print:hidden">
        <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900 text-[16px]">ইনভয়েস দেখুন</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-[520px] mx-auto p-4 space-y-4">
        {/* Invoice Card */}
        <div 
          ref={invoiceRef}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden invoice-print-area"
        >
          {/* Header Section */}
          <div className="p-6 text-center space-y-3 border-b border-gray-50">
            {companySettings.logo && (
              <img 
                src={companySettings.logo} 
                alt="Logo" 
                className="h-[60px] mx-auto object-contain mb-2" 
                crossOrigin="anonymous"
              />
            )}
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{companySettings.name}</h2>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500 font-bold">
              <span className="flex items-center gap-1"><Globe size={12} className="text-gray-400" /> {companySettings.website}</span>
              <span className="flex items-center gap-1"><MessageCircle size={12} className="text-gray-400" /> {companySettings.whatsapp}</span>
              <span className="flex items-center gap-1"><Mail size={12} className="text-gray-400" /> {companySettings.email}</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Details Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Invoice No</span>
                <p className="text-[13px] font-black text-gray-900">#{order.id}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Order Date</span>
                <p className="text-[13px] font-bold text-gray-800">{order.date}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-50"></div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Customer Name</span>
                <p className="text-[13px] font-bold text-gray-800">{order.customerName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Phone</span>
                <p className="text-[13px] font-bold text-gray-800">{order.phone}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Full Address</span>
                <p className="text-[13px] font-bold text-gray-800 leading-relaxed">{order.shippingAddress}</p>
                {(order.division || order.district || order.upazila) && (
                  <p className="text-[11px] text-gray-500 font-bold">
                    {[order.upazila, order.district, order.division].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-50"></div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Payment Method</span>
                <p className="text-[13px] font-black text-indigo-600 uppercase tracking-tight">{order.paymentMethod}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Courier Charge</span>
                <p className="text-[13px] font-bold text-gray-800">৳{order.deliveryCharge}</p>
              </div>
            </div>

            {/* Product List Table */}
            <div className="pt-4 border-t border-gray-50">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-3">Product list</span>
              <div className="space-y-3">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-3 items-center py-2">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-gray-400 font-bold">
                        {item.size && `Size: ${item.size}`} {item.sku && `• SKU: ${item.sku}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-black text-gray-900">৳{item.price * item.qty}</p>
                      <p className="text-[10px] text-gray-400 font-bold">Qty: {item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Section */}
            <div className="pt-6 border-t border-gray-50 space-y-2">
              <div className="flex justify-between text-[13px] font-bold text-gray-500">
                <span>Subtotal</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-[13px] font-bold text-gray-500">
                <span>Delivery Charge</span>
                <span>৳{order.deliveryCharge}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[13px] font-bold text-pink-500">
                  <span>Discount</span>
                  <span>-৳{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100">
                <span className="text-[15px] font-black text-gray-900">Total Amount</span>
                <span className="text-[20px] font-black text-[#FF2E86]">৳{order.total}</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-8">
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed italic">
                Thank you for choosing {companySettings.name}! For any queries regarding your order, please contact our support team with your Invoice No.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Non-printable) */}
        <div className="space-y-3 print:hidden">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center space-y-1">
            <p className="text-[14px] font-bold text-green-700 flex items-center justify-center gap-1">
              <Check size={16} /> আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে
            </p>
            <p className="text-[12px] text-green-600 font-medium">
              আপনি চাইলে ইনভয়েস ডাউনলোড করতে পারেন অথবা হোম পেজে ফিরে কেনাকাটা চালিয়ে যেতে পারেন।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="h-12 bg-[#FF2E86] text-white rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#FF2E86]/20 transition-all active:scale-95 disabled:opacity-70"
            >
              <Download size={18} /> {isDownloading ? 'Downloading...' : 'PDF ডাউনলোড'}
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${companySettings.name} Invoice`,
                    text: `Invoice for order #${order.id}`,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Invoice link copied to clipboard!');
                }
              }}
              className="h-12 bg-gray-900 text-white rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Share2 size={18} /> শেয়ার করুন
            </button>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full h-12 bg-white text-gray-700 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 border border-gray-200 transition-all active:scale-95"
          >
            <Home size={18} /> হোম পেজে ফিরুন
          </button>
        </div>
      </div>
    </div>
  );
}
