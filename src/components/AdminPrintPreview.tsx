
import React, { useState, useEffect } from 'react';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrintPreviewProps {
  orders: any[];
  type: 'invoice' | 'sticker' | 'company-sticker';
  size: string;
  companySettings: any;
  couriers?: Record<string, any>;
  paymentConfigs?: any;
}

const demoOrder = {
  id: "ORD-9952",
  customerName: "Kabir Chowdhury",
  phone: "01815151522",
  email: "customer@gmail.com",
  shippingAddress: "House 12, Road 4, Mirpur, Dhaka",
  division: "Dhaka",
  district: "Dhaka",
  upazila: "Mirpur",
  date: "June 12, 2026",
  time: "11:45 AM",
  shippingArea: "Inside Dhaka",
  paymentStatus: "Paid",
  paymentMethod: "bKash",
  deliveryCharge: 60,
  discount: 100,
  total: 6700,
  courierName: "RedX Logistics",
  trackingId: "RX-223591939",
  status: "Confirmed",
  items: [
    { name: "Premium Silk Saree", sku: "SK- saree-01", size: "L", color: "Purple", qty: 2, price: 3350, image: "" }
  ]
};

export default function AdminPrintPreview({ orders, type, size, companySettings, couriers = {}, paymentConfigs }: PrintPreviewProps) {
  const navigate = useNavigate();
  const [printSize, setPrintSize] = useState(size || (type === 'invoice' ? 'A4' : '50x75mm'));
  const [selectedCourierKey, setSelectedCourierKey] = useState<string | null>(null);

  const activeCouriers = Object.values(couriers).filter(c => c.active === true);

  useEffect(() => {
    if (size) {
      setPrintSize(size);
    } else {
      if ((type === 'sticker' || type === 'company-sticker') && !['50x75mm', '4x6', '80mm'].includes(printSize)) {
        setPrintSize('50x75mm');
      } else if (type === 'invoice' && !['A4', 'A5', 'A6', '4x6', '80mm'].includes(printSize)) {
        setPrintSize('A4');
      }
    }
  }, [type, size]);

  useEffect(() => {
    if (type === 'sticker' && activeCouriers.length > 0 && !selectedCourierKey) {
      setSelectedCourierKey(Object.keys(couriers).find(k => couriers[k].active) || null);
    }
  }, [type, activeCouriers, couriers, selectedCourierKey]);
  
  // If no orders, use demo data to avoid blank screen
  const displayOrders = orders.length > 0 ? orders : [demoOrder];

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = (elementId: string, size: string) => {
    // Basic wrapper to trigger print for PDF saving
    // Typically you'd use html2pdf or jsPDF here for genuine PDF generation
    window.print();
  };

  const handlePDF = () => {
    generatePDF("company-sticker-preview", printSize);
  };

  const selectedCourier = selectedCourierKey ? couriers[selectedCourierKey] : null;

  return (
    <div className="print-preview-page animate-fade-in pb-20">
      <div className="print-topbar no-print mb-4 shadow-sm border border-slate-100 flex flex-col p-0">
        {type === 'company-sticker' ? (
          <div className="company-sticker-toolbar">
            <button onClick={() => navigate('/admin/orders')} className="bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 px-2 flex items-center justify-center rounded-lg">
              <ArrowLeft size={14} />
            </button>
            <div className="h-[20px] w-px bg-slate-200 mx-1 flex-shrink-0 self-center"></div>
            {['50x75mm', '4x6', '80mm'].map(sz => (
              <button 
                key={sz}
                onClick={() => setPrintSize(sz)}
                className={`border transition-all ${printSize === sz ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                {sz}
              </button>
            ))}
            <div className="h-[20px] w-px bg-slate-200 mx-1 flex-shrink-0 self-center"></div>
            <button onClick={handlePDF} className="bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100">
              PDF
            </button>
            <button onClick={handlePrint} className="bg-slate-900 text-white border border-slate-900 hover:bg-slate-800">
              Print
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 p-2 px-3 border-b border-slate-50">
              <button onClick={() => navigate('/admin/orders')} className="p-1 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg">
                <ArrowLeft size={14} />
              </button>
              
              <div className="print-title">
                {type === 'invoice' ? 'Invoice' : 'Sticker'}
                {orders.length === 0 && <span className="ml-1 text-rose-500 text-[8px] uppercase font-black px-1 py-0.5 bg-rose-50 rounded">Demo</span>}
              </div>
            </div>

            {/* Courier Selector for Stickers */}
            {type === 'sticker' && activeCouriers.length > 0 && (
              <div className="courier-chip-row border-b border-slate-50">
                {activeCouriers.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCourierKey(c.name)}
                    className={`courier-chip ${selectedCourierKey === c.name ? 'active' : ''}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Size Selection Row */}
            <div className="print-size-row border-b border-slate-50">
              {(type === 'invoice' ? ['A4', 'A5', 'A6', '4x6', '80mm'] : ['50x75mm', '4x6', '80mm']).map(sz => (
                <button 
                  key={sz}
                  onClick={() => setPrintSize(sz)}
                  className={`size-chip border transition-all ${printSize === sz ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Action Row */}
            <div className="print-action-row">
              <button onClick={handlePDF} className="print-action-btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                PDF
              </button>
              <button onClick={handlePrint} className="print-action-btn bg-slate-900 text-white hover:bg-slate-800">
                Print
              </button>
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        {displayOrders.map((order, idx) => (
          <div key={order.id} className="print-sheet break-inside-avoid shadow-none" id="invoice-preview">
            {type === 'invoice' ? (
              <div className="invoice-sheet">
                <InvoiceSheet order={order} companySettings={companySettings} size={printSize} />
              </div>
            ) : type === 'company-sticker' ? (
              <div id="company-sticker-preview">
                <CompanyStickerSheet order={order} companySettings={companySettings} size={printSize} paymentConfigs={paymentConfigs} />
              </div>
            ) : (
              <StickerSheet order={order} companySettings={companySettings} size={printSize} courier={selectedCourier} />
            )}
          </div>
        ))}
      </div>


      {/* Sticky Bottom Actions (Mobile/Web view only) */}
      <div className="print-actions fixed bottom-0 left-0 right-0 z-[100] no-print">
         <div className="max-w-md mx-auto w-full flex gap-2">
            <button onClick={() => navigate('/admin/orders')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black">Back</button>
            <button onClick={handlePDF} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-200">PDF</button>
            <button onClick={handlePrint} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-200">Print</button>
         </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-preview-page { padding: 0 !important; background: transparent !important; }
          .print-sheet { 
            border: none !important; 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 0 !important;
            page-break-after: always;
            transform: scale(1) !important;
          }
          body { background: white !important; }
        }
        .print-only { display: none; }
        .print-preview-page {
          padding: 14px;
          background: #f6f7fb;
          min-height: 100vh;
        }
        .print-topbar {
          display: flex;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
        }
        .company-sticker-toolbar {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 8px;
          white-space: nowrap;
          scrollbar-width: none;
        }
        .company-sticker-toolbar::-webkit-scrollbar { display: none; }
        .company-sticker-toolbar button {
          flex: 0 0 auto;
          height: 30px;
          padding: 0 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .print-title {
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          color: #0f172a;
        }
        .courier-chip-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px 10px;
          white-space: nowrap;
          scrollbar-width: none;
        }
        .courier-chip-row::-webkit-scrollbar { display: none; }
        .courier-chip {
          flex: 0 0 auto;
          height: 32px;
          padding: 0 12px;
          border-radius: 9px;
          border: 1px solid #e5e7eb;
          background: #fff;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
        }
        .courier-chip.active {
          background: #6426ff;
          color: #fff;
          border-color: #6426ff;
        }
        .print-size-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 6px 10px;
          scrollbar-width: none;
        }
        .print-size-row::-webkit-scrollbar { display: none; }
        .size-chip {
          flex: 0 0 auto;
          height: 30px;
          min-width: 48px;
          padding: 0 7px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .print-action-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 6px 10px 10px;
          scrollbar-width: none;
        }
        .print-action-row::-webkit-scrollbar { display: none; }
        .print-action-btn {
          flex: 0 0 auto;
          height: 32px;
          min-width: 70px;
          padding: 0 8px;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .invoice-sheet {
          transform: scale(.88);
          transform-origin: top center;
          margin-top: 4px;
        }
        .sticker-sheet {
          transform-origin: top center;
        }
        .sticker-preview {
          background: #fff;
          border: 1px solid #111;
          overflow: hidden;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }
        .sticker-preview.small {
          width: 50mm;
          height: 75mm;
          padding: 4mm;
          font-size: 8px;
        }
        .sticker-preview.standard {
          width: 100mm;
          height: 150mm;
          padding: 6mm;
          font-size: 10px;
        }
        .sticker-preview.thermal {
          width: 80mm;
          min-height: 100mm;
          padding: 5mm;
          font-size: 10px;
        }
        .company-sticker {
          width: 50mm;
          height: 75mm;
          padding: 4mm;
          background: #fff;
          border: 1px solid #111;
          font-size: 8px;
          overflow: hidden;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }
        .company-sticker-logo {
          width: 14mm;
          height: 14mm;
          object-fit: contain;
        }
        .company-sticker-title {
          font-size: 11px;
          font-weight: 800;
        }
        .company-sticker-row {
          font-size: 7.5px;
          line-height: 1.25;
        }
        .company-sticker.size-4x6 {
          width: 100mm;
          height: 150mm;
          font-size: 10px;
          padding: 6mm;
        }
        .company-sticker.size-80mm {
          width: 80mm;
          min-height: 100mm;
          font-size: 10px;
          padding: 5mm;
        }
        .print-sheet {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 4px;
          overflow: hidden;
        }
        .print-actions {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          padding: 10px;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  );
}

function InvoiceSheet({ order, companySettings, size }: { order: any; companySettings: any; size: string }) {
  const subtotal = order.total - (order.deliveryCharge || 0) + (order.discount || 0);
  const isThermal = size === '80mm';
  
  return (
    <div className={`text-slate-800 font-sans ${isThermal ? 'max-w-[80mm] mx-auto text-[10px]' : ''}`}>
      <div className={`flex justify-between items-start border-b border-slate-200 pb-4 mb-4 ${isThermal ? 'flex-col gap-2' : ''}`}>
        <div>
          <h2 className={`${isThermal ? 'text-lg' : 'text-xl'} font-black tracking-tighter uppercase`}>{companySettings.name}</h2>
          <p className="text-[10px] text-slate-500 font-bold max-w-[200px] leading-relaxed mt-1">
            {companySettings.address}<br/>
            Phone: {companySettings.mobile}<br/>
            {companySettings.website}
          </p>
        </div>
        <div className={isThermal ? 'text-left' : 'text-right'}>
          <h3 className={`${isThermal ? 'text-sm' : 'text-lg'} font-black text-slate-400`}>INVOICE</h3>
          <p className="text-xs font-bold text-slate-900 mt-1 uppercase">Order #{order.id.replace('ORD-', '')}</p>
          <p className="text-[10px] text-slate-500">{order.date}</p>
        </div>
      </div>

      <div className={`grid ${isThermal ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-8'} mb-6`}>
        <div className={isThermal ? 'border-b border-dashed border-slate-200 pb-4' : ''}>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Customer / Ship To</span>
          <p className="text-xs font-black text-slate-900">{order.customerName}</p>
          <p className="text-[11px] text-slate-600 font-bold mt-0.5">{order.phone}</p>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 whitespace-pre-wrap">
            {order.shippingAddress}<br/>
            {order.upazila}, {order.district}, {order.division}
          </p>
        </div>
        <div className={isThermal ? '' : 'text-right'}>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Payment Status</span>
          <span className={`text-[11px] font-black px-2 py-1 rounded inline-block uppercase ${order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {order.paymentStatus || 'Unpaid'}
          </span>
          <p className="text-[10px] text-slate-500 font-bold mt-2">Method: {order.paymentMethod || 'bKash / Cash'}</p>
        </div>
      </div>

      <table className="w-full text-xs mb-6">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="text-left py-2 font-black uppercase text-[10px]">Item</th>
            {!isThermal && <th className="text-center py-2 font-black uppercase text-[10px]">Qty</th>}
            {!isThermal && <th className="text-right py-2 font-black uppercase text-[10px]">Price</th>}
            <th className="text-right py-2 font-black uppercase text-[10px]">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(order.items || []).map((item: any, i: number) => (
            <tr key={i}>
              <td className="py-3 font-bold">
                <div className="text-slate-900">{item.name} {isThermal && `(x${item.qty || 1})`}</div>
                <div className="text-[9px] text-slate-400 font-semibold">SKU: {item.sku} • {item.size}/{item.color}</div>
              </td>
              {!isThermal && <td className="py-3 text-center font-black">{item.qty || 1}</td>}
              {!isThermal && <td className="py-3 text-right font-bold text-slate-600">৳{item.price}</td>}
              <td className="py-3 text-right font-black text-slate-900">৳{item.price * (item.qty || 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`flex ${isThermal ? 'justify-between' : 'justify-end'} pt-4 border-t border-slate-200`}>
        <div className={`${isThermal ? 'w-full' : 'w-56'} space-y-2`}>
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>Subtotal:</span>
            <span>৳{subtotal}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>Shipping:</span>
            <span>৳{order.deliveryCharge || 0}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-xs font-bold text-emerald-600">
              <span>Discount:</span>
              <span>-৳{order.discount}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
            <span>Grand Total:</span>
            <span className="text-[#ff2f7d]">৳{order.total}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-[10px] text-slate-400 font-medium italic border-t border-slate-50 pt-4">
        Thank you for trusting NaimShop Bangladeshi heritage collections. Always handle with care.
      </div>
    </div>
  );
}

function StickerSheet({ order, companySettings, size, courier }: { order: any; companySettings: any; size: string; courier?: any }) {
  const isImageTemplate = courier?.stickerFormat === 'image_template' && courier.stickerTemplate;
  const isApiUrl = courier?.stickerFormat === 'api_url';
  const stickerUrl = order.courierStickerUrl || courier?.apiStickerUrl || null;

  const isStandard = size === '100x150mm' || size === '4x6';
  const isThermal = size === '80mm';
  const sizeClass = isStandard ? 'standard' : isThermal ? 'thermal' : 'small';

  const trackingId = order.trackingId || 'PENDING';
  const orderId = order.id;
  const customerName = order.customerName || order.customer?.name || '';
  const customerPhone = order.phone || order.customer?.phone || '';
  const fullAddress = order.shippingAddress || order.customer?.fullAddress || '';
  const district = order.district || order.customer?.district || '';
  const upazila = order.upazila || order.customer?.upazila || '';
  const products = order.items || [];
  const codAmount = order.total;
  const deliveryCharge = order.deliveryCharge || 0;
  const merchantName = companySettings.name;
  const merchantPhone = companySettings.mobile || companySettings.phone || '';
  const courierName = courier?.name || order.courierName || 'Pathao Courier';
  const courierLogo = courier?.logo || null;

  if (isApiUrl && stickerUrl) {
    return (
      <div className={`sticker-preview ${sizeClass} justify-center items-center`}>
        <img src={stickerUrl} alt="Courier Sticker" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  return (
    <div 
      className={`sticker-preview ${sizeClass} font-sans relative ${isImageTemplate ? 'text-white' : 'text-slate-900'}`}
      style={{ gap: '0.6em', border: isImageTemplate ? 'none' : '' }}
    >
       {isImageTemplate && (
         <img src={courier.stickerTemplate} className="absolute inset-0 w-full h-full object-fill -z-10 brightness-50" alt="" />
       )}

       {/* Header with Logo + ID */}
       <div className={`flex justify-between items-center border-b ${isImageTemplate ? 'border-white/20' : 'border-slate-200'} pb-1`}>
          <div className="flex items-center gap-[0.5em]">
             {courierLogo && <img src={courierLogo} className="w-[1.8em] h-[1.8em] object-contain bg-white rounded p-[0.1em]" alt="" />}
             <div className="font-black tracking-tighter uppercase" style={{fontSize:'1.4em', lineHeight:1}}>
                {merchantName}
             </div>
          </div>
          <div className={`font-mono font-black py-[0.1em] px-[0.4em] ${isImageTemplate ? 'bg-white text-black' : 'bg-black text-white'} rounded`} style={{fontSize:'1em'}}>
             {orderId}
          </div>
       </div>

       {/* Courier Info */}
       <div className={`grid grid-cols-2 gap-[0.5em] border-b ${isImageTemplate ? 'border-white/20' : 'border-slate-150'} pb-[0.2em]`}>
          <div className={`border-r ${isImageTemplate ? 'border-white/20' : 'border-slate-100'} pr-[0.5em]`}>
             <span className={`font-black uppercase ${isImageTemplate ? 'text-white/60' : 'text-slate-400'} block tracking-widest leading-none`} style={{fontSize:'0.7em'}}>Courier</span>
             <b className={`${isImageTemplate ? 'text-white' : 'text-indigo-700'} block mt-[0.2em] leading-tight`} style={{fontSize:'1.2em'}}>{courierName}</b>
             <span className={`font-bold ${isImageTemplate ? 'text-white/80' : 'text-slate-500'} block mt-[0.2em] leading-tight`} style={{fontSize:'0.8em'}}>Tracking: {trackingId}</span>
             <span className={`font-bold ${isImageTemplate ? 'text-white/80' : 'text-slate-500'} leading-tight`} style={{fontSize:'0.8em'}}>Del. Charge: ৳{deliveryCharge}</span>
          </div>
          <div className="text-right flex flex-col justify-center">
             <span className={`font-black uppercase ${isImageTemplate ? 'text-white/60' : 'text-slate-400'} block tracking-widest leading-none`} style={{fontSize:'0.7em'}}>COD Amount</span>
             <b className={`${isImageTemplate ? 'text-white' : 'text-rose-600'} block mt-[0.1em] leading-none`} style={{fontSize:'1.6em'}}>৳{codAmount}</b>
          </div>
       </div>

       {/* Shipping Info */}
       <div className={`${isImageTemplate ? 'bg-black/40 border-white/20' : 'bg-slate-50 border-slate-100'} p-[0.4em] rounded border`}>
          <span className={`font-black uppercase ${isImageTemplate ? 'text-white/60' : 'text-slate-400'} block tracking-widest mb-[0.2em] leading-none`} style={{fontSize:'0.7em'}}>Recipient / Ship To</span>
          <div className="flex justify-between items-baseline leading-none mb-[0.2em]">
             <b className={`${isImageTemplate ? 'text-white' : 'text-slate-900'}`} style={{fontSize:'1.3em'}}>{customerName}</b>
             <b className={`font-mono ${isImageTemplate ? 'text-white' : ''}`} style={{fontSize:'1em'}}>{customerPhone}</b>
          </div>
          <p className={`${isImageTemplate ? 'text-white/90' : 'text-slate-700'} font-bold leading-tight uppercase`} style={{fontSize:'0.9em'}}>
             {fullAddress}<br/>
             {upazila && `${upazila}, `}{district}
          </p>
       </div>

       {/* Items Detail */}
       <div className="flex-1 min-h-0 flex flex-col">
          <span className={`font-black uppercase ${isImageTemplate ? 'text-white/60' : 'text-slate-400'} block tracking-widest mb-[0.2em] leading-none`} style={{fontSize:'0.7em'}}>Parcel Contents</span>
          <div className="overflow-hidden flex-1 space-y-[0.2em]">
             {products.map((item: any, i: number) => (
                <div key={i} className={`flex justify-between items-center font-bold border-b ${isImageTemplate ? 'border-white/10' : 'border-slate-50'} py-[0.1em] last:border-0`} style={{fontSize:'0.9em'}}>
                   <span className={`w-[1.6em] h-[1.6em] rounded ${isImageTemplate ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'} flex-shrink-0 mr-[0.4em] flex items-center justify-center font-black leading-none`}>×{item.qty || 1}</span>
                   <div className="flex-1 min-w-0 leading-none">
                      <div className="truncate leading-tight">{item.name}</div>
                      <div className={`${isImageTemplate ? 'text-white/50' : 'text-slate-400'} truncate uppercase mt-[0.1em]`} style={{fontSize:'0.8em'}}>{item.size}/{item.color} • {item.sku}</div>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Bottom Section */}
       <div className={`flex items-center justify-between mt-auto pt-[0.4em] border-t ${isImageTemplate ? 'border-white/20' : 'border-slate-200'}`}>
          <div className="flex-1 min-w-0 pr-[0.5em]">
             <span className={`font-black uppercase ${isImageTemplate ? 'text-white/60' : 'text-slate-400'} block tracking-widest leading-none`} style={{fontSize:'0.7em'}}>Merchant Sender</span>
             <p className={`font-black ${isImageTemplate ? 'text-white' : 'text-slate-900'} mt-[0.2em] leading-tight truncate`} style={{fontSize:'0.9em'}}>{merchantName}</p>
             <p className={`${isImageTemplate ? 'text-white/70' : 'text-slate-500'} font-bold leading-none mt-[0.1em] truncate`} style={{fontSize:'0.8em'}}>{merchantPhone}</p>
          </div>
          <div className={`${isImageTemplate ? 'bg-white text-black' : 'bg-black text-white'} p-[0.3em] rounded-lg flex flex-col items-center flex-shrink-0`}>
             <div className="w-[3em] h-[3em] bg-white p-[0.1em] rounded-sm">
                <div className="grid grid-cols-5 gap-[0.05em] p-[0.05em] w-full h-full border border-black/10">
                   {[...Array(25)].map((_, i) => <div key={i} className={`w-full h-full ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`}></div>)}
                </div>
             </div>
             <span className="font-black tracking-widest mt-[0.1em]" style={{fontSize:'0.6em'}}>{orderId}</span>
          </div>
       </div>

       <div className={`${isImageTemplate ? 'bg-white text-black' : 'bg-black text-white'} text-center py-[0.2em] rounded font-black uppercase tracking-widest mt-[0.2em] leading-tight`} style={{fontSize:'0.8em'}}>
          Fragile - Handle with Care
       </div>
    </div>
  );
}

function CompanyStickerSheet({ order, companySettings, size, paymentConfigs }: { order: any; companySettings: any; size: string; paymentConfigs?: any }) {
  const isStandard = size === '100x150mm' || size === '4x6';
  const isThermal = size === '80mm';
  const sizeClass = isStandard ? 'size-4x6' : isThermal ? 'size-80mm' : '';

  const demoCompany = {
    logo: "/demo/company-logo.png",
    companyName: "NaimShop Bangladesh",
    phone: "01712345678",
    bkashNumber: "01700000000",
    email1: "admin.naimshop@gmail.com",
    email2: "support.naimshop@gmail.com",
    website: "https://naimshop.com",
    address: "Shop 204, Sector 11, Uttara, Dhaka, Bangladesh"
  };

  const cLogo = companySettings.logo || demoCompany.logo;
  const cName = companySettings.name || demoCompany.companyName;
  const cPhone = companySettings.mobile || companySettings.phone || demoCompany.phone;
  const cBkash = paymentConfigs?.bkash?.accounts?.[0]?.number || paymentConfigs?.bkash?.personalNumber || paymentConfigs?.bkash?.merchantNumber || demoCompany.bkashNumber;
  const cEmail1 = companySettings.email1 || companySettings.email || demoCompany.email1;
  const cEmail2 = companySettings.email2 || demoCompany.email2;
  const cWebsite = companySettings.website || demoCompany.website;
  const cAddress = companySettings.address || demoCompany.address;

  const orderId = order.id || 'DEMO-1234';
  const customerName = order.customerName || order.customer?.name || 'Jon Doe';
  const customerPhone = order.phone || order.customer?.phone || '01XXXXXXXXX';
  const customerAddress = order.shippingAddress || order.customer?.fullAddress || 'N/A';
  const district = order.district || order.customer?.district || '';
  const upazila = order.upazila || order.customer?.upazila || '';
  const division = order.division || order.customer?.division || '';
  const fullAddress = `${customerAddress} ${upazila ? `, ${upazila}` : ''} ${district ? `, ${district}` : ''} ${division ? `, ${division}` : ''}`;
  
  const codAmount = order.total || 0;
  const qty = order.items?.reduce((acc: number, item: any) => acc + (item.qty || 1), 0) || 1;

  return (
    <div className={`company-sticker ${sizeClass} font-sans`}>
      <div className="flex items-center gap-[0.5em] mb-[1em] border-b border-black/10 pb-[0.5em]">
        <img src={cLogo} className="company-sticker-logo bg-slate-50 p-[1px] rounded" alt="" />
        <div className="flex-1 min-w-0">
          <div className="company-sticker-title text-black leading-tight uppercase truncate">{cName}</div>
          <div className="company-sticker-row text-slate-500 mt-[0.2em] truncate">{cWebsite}</div>
        </div>
      </div>
      
      <div className="flex-1 space-y-[0.8em] flex flex-col">
        <div>
          <span className="font-black uppercase tracking-widest text-slate-400 block mb-[0.3em]" style={{fontSize: '0.9em'}}>Sender Info</span>
          <div className="grid grid-cols-2 gap-[0.5em]">
            <div className="company-sticker-row font-medium text-slate-700 truncate">📞 {cPhone}</div>
            <div className="company-sticker-row font-medium text-slate-700 truncate">🟣 bKash: {cBkash}</div>
            <div className="company-sticker-row font-medium text-slate-700 truncate">✉️ {cEmail1}</div>
            <div className="company-sticker-row font-medium text-slate-700 truncate">✉️ {cEmail2}</div>
            <div className="company-sticker-row font-medium text-slate-700 col-span-2 truncate">📍 {cAddress}</div>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 pt-[0.8em]">
           <span className="font-black uppercase tracking-widest text-slate-400 block mb-[0.3em]" style={{fontSize: '0.9em'}}>Recipient / Ship To</span>
           <div className="flex justify-between items-baseline mb-[0.2em]">
             <b className="text-black" style={{fontSize: '1.4em'}}>{customerName}</b>
           </div>
           <div className="font-mono font-black text-black mb-[0.3em]" style={{fontSize: '1em'}}>{customerPhone}</div>
           <p className="company-sticker-row font-bold text-slate-800 leading-tight uppercase">
             {fullAddress}
           </p>
        </div>

        <div className="border-t border-slate-200 pt-[0.6em] flex-1 min-h-0 flex flex-col">
           <span className="font-black uppercase tracking-widest text-slate-400 block mb-[0.3em]" style={{fontSize: '0.9em'}}>Parcel Contents</span>
           <div className="overflow-hidden flex-1 space-y-[0.3em]">
             {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center font-bold border-b border-slate-50 pb-[0.2em] last:border-0" style={{fontSize: '0.9em'}}>
                   <span className="bg-slate-100 text-slate-800 p-[0.2em] px-[0.4em] rounded mr-[0.4em] leading-none">×{item.qty || 1}</span>
                   <div className="flex-1 min-w-0 leading-tight">
                      <div className="truncate text-black">{item.name}</div>
                      <div className="text-slate-500 uppercase mt-[0.1em]" style={{fontSize: '0.8em'}}>{item.size || 'N/A'} / {item.color || 'N/A'}</div>
                   </div>
                </div>
             ))}
           </div>
        </div>

        <div className="border-t border-slate-200 pt-[0.8em] grid grid-cols-2 gap-[1em] mt-auto pb-[0.5em]">
          <div>
            <span className="font-black uppercase tracking-widest text-slate-400 block mb-[0.2em]" style={{fontSize: '0.9em'}}>COD Amount</span>
            <b className="text-rose-600 leading-none" style={{fontSize: '1.8em'}}>৳{codAmount}</b>
          </div>
          <div>
            <span className="font-black uppercase tracking-widest text-slate-400 block mb-[0.2em]" style={{fontSize: '0.9em'}}>Total Items</span>
            <b className="text-black leading-none" style={{fontSize: '1.6em'}}>{qty} Pcs</b>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-[0.8em] border-t-2 border-black pb-[0.2em]">
         <div className="flex flex-col gap-[0.2em]">
            <span className="font-black text-black uppercase leading-none" style={{fontSize: '1.3em'}}>Order #{orderId}</span>
            <span className="font-black uppercase text-slate-500 tracking-widest mt-[0.2em]" style={{fontSize: '0.8em'}}>Thank you for shopping</span>
         </div>
         <div className="w-[3.5em] h-[3.5em] bg-white border border-slate-300 p-[0.1em] rounded-sm flex-shrink-0">
            <div className="grid grid-cols-5 gap-[0.05em] w-full h-full p-[0.1em]">
               {[...Array(25)].map((_, i) => <div key={i} className={`w-full h-full ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`}></div>)}
            </div>
         </div>
      </div>
    </div>
  );
}
