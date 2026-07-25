/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Grid, ShoppingBag, Layers, ClipboardList, Users, User,
  Image as ImageIcon, Percent, CreditCard, Truck, MessageSquare, Phone,
  BarChart3, Sliders, HelpCircle, Activity, Share2, Settings, 
  MessageCircle, Trash2, CheckCircle2, ChevronRight, PlusCircle, 
  Copy, ArrowUp, ArrowDown, Plus, Wallet, Banknote, ImagePlus, Upload, 
  Info, Search, Eye, Printer, ShieldAlert, BadgeInfo, Save, X, RefreshCw, Star, Check, Menu, LogOut, ClipboardX, Database, ExternalLink,
  Server, Globe, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from '../lib/safe-motion';
import { Product, Review, Banner, Category } from '../types';
import { CATEGORIES } from '../data';
import BottomNav from '../components/BottomNav';
import AdminProductDetailsEdit from '../components/AdminProductDetailsEdit';
import { AdminBulkUpload } from '../components/AdminBulkUpload';
import BannerManager from '../components/BannerManager';
import AdminPrintPreview from '../components/AdminPrintPreview';
import AdminIncompleteOrders from '../components/AdminIncompleteOrders';
import DatabaseWizard from '../components/DatabaseWizard';
import LogoutModal from '../components/LogoutModal';
import CustomersPage from './Customers';
import DatabaseSetup from './Admin/DatabaseSetup';
import { useCompany } from '../context/CompanyContext';
import { authClient } from '../lib/auth';


export default function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const adminAuth = localStorage.getItem('adminAuth');
        const loggedInCustomer = localStorage.getItem('loggedInCustomer');
        const userData = loggedInCustomer ? JSON.parse(loggedInCustomer) : null;
        
        // Check for MySQL session as well, but don't strictly require it if we have a valid local admin session
        const { data: { session } } = await authClient.auth.getSession();
        
        if ((adminAuth !== 'true' || userData?.role !== 'admin') && !session) {
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminEmail');
          localStorage.removeItem('loggedInCustomer');
          navigate('/admin-login', { replace: true });
        } else {
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('Admin auth check error:', error);
        navigate('/admin-login', { replace: true });
      }
    };
    
    checkAdminAuth();
  }, [navigate]);

  // Core loaded dataset states
  const [products, setProducts] = useState<Product[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showDatabaseWizard, setShowDatabaseWizard] = useState(false);
  const [wizardAction, setWizardAction] = useState<string>('');
  const [categoryValidationError, setCategoryValidationError] = useState<any>(null);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [messengerAnalytics, setMessengerAnalytics] = useState<any>(null);
  const [messengerMessages, setMessengerMessages] = useState<any[]>([]);
  const [aiAutoReplyEnabled, setAiAutoReplyEnabled] = useState(true);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");

  // Supabase Config States
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseConnectionOk, setSupabaseConnectionOk] = useState(false);
  const [supabaseError, setSupabaseError] = useState('');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);

  // Active submenu tabs for products/orders
  const [productTab, setProductTab] = useState<'list' | 'add' | 'stock' | 'views' | 'sizes' | 'bulk'>('list');
  const [orderTab, setOrderTab] = useState<'all' | 'pending' | 'confirmed' | 'courier' | 'invoice'>('all');

  // Active view state
  // null = main admin dashboard grid
  // string (e.g. 'products') = active working subpage
  const [activeSubpage, setActiveSubpage] = useState<string | null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [reviewSettings, setReviewSettings] = useState<any>({
    enabled: true,
    adminApproval: false,
    maxImages: 2,
    cameraEnabled: true,
    galleryEnabled: true,
    verifiedPurchaseOnly: false
  });

  // Orders list filters state
  const [orderChannelFilter, setOrderChannelFilter] = useState<'all' | 'Online' | 'In Shop'>('Online');
  const [orderPhoneSearch, setOrderPhoneSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentStatusFilter, setOrderPaymentStatusFilter] = useState('all');
  const [orderAreaFilter, setOrderAreaFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('all');
  const [printPreviewMode, setPrintPreviewMode] = useState<string | null>(null);

  const printOrderIdString = searchParams.get('orders') || searchParams.get('orderId') || '';
  const printSizeValue = searchParams.get('size') || 'A4';
  const ordersToPrint = orders.filter(o => printOrderIdString.split(',').includes(o.id));

  // Dynamic categories management state
  const [categoriesDb, setCategoriesDb] = useState<Category[]>(() => { try { return JSON.parse(localStorage.getItem('naimshop_categories') || '[]'); } catch { return []; } });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Form Fields State
  const [catFormName, setCatFormName] = useState('');
  const [catFormShortTitle, setCatFormShortTitle] = useState('');
  const [catFormImage, setCatFormImage] = useState('');
  const [catFormMainBanner, setCatFormMainBanner] = useState('');
  const [catFormSectionBanner, setCatFormSectionBanner] = useState('');
  const [catFormStatus, setCatFormStatus] = useState(true);
  const [catFormSerialNumber, setCatFormSerialNumber] = useState(1);

  const resizeCategoryAsset = (file: File, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // High quality resizing / crop center cover (Image stretch matching aspect ratio)
            const imgRatio = img.width / img.height;
            const targetRatio = width / height;
            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
            
            if (imgRatio > targetRatio) {
              // Image is wider than target aspect ratio
              sWidth = img.height * targetRatio;
              sx = (img.width - sWidth) / 2;
            } else if (imgRatio < targetRatio) {
              // Image is taller than target aspect ratio
              sHeight = img.width / targetRatio;
              sy = (img.height - sHeight) / 2;
            }
            
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
            resolve(canvas.toDataURL("image/webp", 0.9));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const loadCategoriesFromApi = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategoriesDb(data);
          localStorage.setItem('naimshop_categories', JSON.stringify(data));
          const active = data.filter(c => c.status === true);
          if (active.length > 0) {
            setProdCategory(active[0].id);
          }
        }
      })
      .catch(err => console.error("Error loading categories", err));
  };

  // Courier active status configuration settings
  const [couriers, setCouriers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('naimshop_admin_courier_details');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    
    // Initial default couriers as requested
    const defaults = [
      'Pathao Courier', 'Steadfast', 'REDX', 'Paperfly', 'eCourier', 
      'Sundarban Courier', 'SA Paribahan', 'Karatoa Courier', 'Delivery Tiger', 'Custom Courier'
    ];
    
    const initial: Record<string, any> = {};
    defaults.forEach(name => {
      initial[name] = {
        name,
        active: true,
        logo: '',
        merchantId: '',
        storeId: '',
        apiKey: '',
        secretToken: '',
        webhookUrl: '',
        apiUrl: '',
        trackingUrl: '',
        stickerTemplate: '',
        apiStickerUrl: '',
        insideDhaka: '80',
        outsideDhaka: '150',
        codCharge: '1%',
        pickupAddress: '',
        pickupPhone: '',
        supportPhone: '',
        returnCharge: '60',
        printSizes: ['A4', 'A5', 'A6', '4x6', '80mm']
      };
    });
    return initial;
  });

  useEffect(() => {
    fetch('/api/supabase/diagnostics')
      .then(r => r.json())
      .then(data => {
        setSupabaseConnectionOk(!!data.connected);
      })
      .catch(console.error);
  }, []);

  const loadSupabaseConfig = () => {
    fetch('/api/supabase/diagnostics')
      .then(res => res.json())
      .then(data => {
        if (data && data.config) {
          setSupabaseUrl(data.config.url || '');
          setSupabaseKey(data.config.key || '');
          setSupabaseConnectionOk(!!data.connected);
        }
      })
      .catch(err => console.error("Error loading Supabase config:", err));
  };

  useEffect(() => {
    if (activeSubpage === 'messenger') {
      fetch('/api/messenger/analytics').then(r=>r.json()).then(setMessengerAnalytics).catch(console.error);
      fetch('/api/messenger/messages').then(r=>r.json()).then(setMessengerMessages).catch(console.error);
      fetch('/api/messenger/settings')
        .then(r => r.json())
        .then(data => {
          setAiAutoReplyEnabled(data.aiAutoReplyEnabled);
          setFaqs(data.faqs || []);
        })
        .catch(console.error);
    } else if (activeSubpage === 'db-planner') {
      loadSupabaseConfig();
    }
  }, [activeSubpage]);

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSupabase(true);
    setSupabaseError('');
    try {
      const res = await fetch('/api/supabase/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: supabaseUrl,
          key: supabaseKey
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupabaseConnectionOk(true);
        showToast("🎉 Supabase Database connected and synchronized successfully!");
      } else {
        setSupabaseConnectionOk(false);
        setSupabaseError(data.error || "Failed to establish a database connection with these credentials.");
        showToast("❌ Database connection failed.");
      }
    } catch (err: any) {
      setSupabaseConnectionOk(false);
      setSupabaseError(err.message || "A network error occurred during initialization.");
      showToast("❌ Connection error occurred.");
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const saveMessengerSettings = (enabled: boolean, updatedFaqs: any[]) => {
    fetch('/api/messenger/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiAutoReplyEnabled: enabled, faqs: updatedFaqs })
    })
      .then(r => r.json())
      .then(data => {
        setAiAutoReplyEnabled(data.aiAutoReplyEnabled);
        setFaqs(data.faqs || []);
        showToast("Messenger Settings Saved successfully!");
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to save messenger settings");
      });
  };

  const [editingCourierKey, setEditingCourierKey] = useState<string | null>(null);

  const handleSaveCourierDetails = (name: string, details: any) => {
    const updated = { ...couriers, [name]: details };
    setCouriers(updated);
    localStorage.setItem('naimshop_admin_courier_details', JSON.stringify(updated));
    showToast(`✓ ${name} details saved!`);
    setEditingCourierKey(null);
  };

  // Redirect 'add' tab to new product editor page
  useEffect(() => {
    if (productTab === 'add') {
      navigate('/admin/products/new');
    }
  }, [productTab, navigate]);

  // Synchronize URL path with active subpage
  useEffect(() => {
    const path = location.pathname;
    const prodIdMatch = path.match(/\/admin\/products\/([^/]+)/);
    const orderIdMatch = path.match(/\/admin\/orders\/([^/]+)/);

    if (prodIdMatch) {
      const productId = prodIdMatch[1];
      setActiveSubpage('products');
      if (productId === 'new') {
        setEditingProduct({
          id: 'new',
          name: '',
          category: categoriesDb[0]?.name || 'Saree',
          price: 0,
          image: '',
          images: [],
          views: 2200,
          rating: 5,
          stock: 'In Stock',
          status: 'draft',
          highlights: [],
          returnPolicy: [],
          qnas: [],
          trustBadges: [],
          variants: []
        });
      } else {
        const found = products.find(p => p.id === productId);
        if (found) {
          setEditingProduct(found);
        }
      }
    } else if (orderIdMatch) {
      setActiveSubpage('orders');
      setViewingOrderId(orderIdMatch[1]);
    } else {
      setViewingOrderId(null);
      setEditingProduct(null);
      if (path === '/admin' || path === '/admin/' || path === '/admin-login') {
        setActiveSubpage(null);
      } else if (path.includes('/admin/categories')) {
        setActiveSubpage('categories');
      } else if (path.includes('/admin/customers')) {
        setActiveSubpage('customers');
      } else if (path.includes('/admin/messenger')) {
        setActiveSubpage('messenger');
      } else if (path.includes('/admin/products')) {
        setActiveSubpage('products');
        setProductTab('list');
      } else if (path.includes('/admin/print/invoice') || path.includes('/admin/orders/print/invoice')) {
        setActiveSubpage('invoice-print');
      } else if (path.includes('/admin/print/company-sticker') || path.includes('/admin/orders/print/company-sticker')) {
        setActiveSubpage('company-sticker-print');
      } else if (path.includes('/admin/print/sticker') || path.includes('/admin/orders/print/sticker')) {
        setActiveSubpage('sticker-print');
      } else if (path.includes('/admin/incomplete-orders')) {
        setActiveSubpage('incomplete-orders');
      } else if (path.includes('/admin/orders')) {
        setActiveSubpage('orders');
        setOrderTab('all');
      } else if (path.includes('/admin/banners')) {
        setActiveSubpage('banners');
      } else if (path.includes('/admin/payments') || path.includes('/admin/billing')) {
        setActiveSubpage('payments');
      } else if (path.includes('/admin/tracking')) {
        setActiveSubpage('tracking');
      } else if (path.includes('/admin/auth')) {
        setActiveSubpage('auth');
      } else if (path.includes('/admin/social')) {
        setActiveSubpage('socials');
      } else if (path.includes('/admin/company')) {
        setActiveSubpage('company');
      } else if (path.includes('/admin/footer')) {
        setActiveSubpage('footer');
      } else if (path.includes('/admin/offers')) {
        setActiveSubpage('offers');
      } else if (path.includes('/admin/courier')) {
        setActiveSubpage('courier');
      } else if (path.includes('/admin/reviews')) {
        setActiveSubpage('reviews');
      } else if (path.includes('/admin/chat')) {
        setActiveSubpage('chat');
      } else if (path.includes('/admin/reports')) {
        setActiveSubpage('reports');
      } else if (path.includes('/admin/settings')) {
        setActiveSubpage('settings');
      } else if (path.includes('/admin/help')) {
        setActiveSubpage('help');
      } else if (path.includes('/admin/db-planner')) {
        setActiveSubpage('db-planner');
      }
    }
  }, [location.pathname, products]);

  // Order Edit Form state
  const [editCusName, setEditCusName] = useState('');
  const [editCusPhone, setEditCusPhone] = useState('');
  const [editCusEmail, setEditCusEmail] = useState('');
  const [editCusAddress, setEditCusAddress] = useState('');
  const [editCusDivision, setEditCusDivision] = useState('');
  const [editCusDistrict, setEditCusDistrict] = useState('');
  const [editCusUpazila, setEditCusUpazila] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [editOrderStatus, setEditOrderStatus] = useState('');
  const [editCourierStatus, setEditCourierStatus] = useState('');
  const [editCourierName, setEditCourierName] = useState('Pathao');
  const [editDeliveryCharge, setEditDeliveryCharge] = useState('60');
  const [editDiscount, setEditDiscount] = useState('0');
  const [editTrackingId, setEditTrackingId] = useState('');
  const [editOrderNote, setEditOrderNote] = useState('');
  const [editInternalNote, setEditInternalNote] = useState('');

  // Synchronize edit fields when active order details change
  useEffect(() => {
    if (viewingOrderId) {
      const activeOrd = orders.find(o => o.id === viewingOrderId);
      if (activeOrd) {
        setEditCusName(activeOrd.customerName || '');
        setEditCusPhone(activeOrd.phone || '');
        setEditCusEmail(activeOrd.email || '');
        setEditCusAddress(activeOrd.shippingAddress || '');
        setEditCusDivision(activeOrd.division || '');
        setEditCusDistrict(activeOrd.district || '');
        setEditCusUpazila(activeOrd.upazila || '');
        setEditPaymentStatus(activeOrd.paymentStatus || 'Paid');
        setEditOrderStatus(activeOrd.status || 'Pending');
        setEditCourierStatus(activeOrd.courierStatus || 'Pending pickup');
        setEditCourierName(activeOrd.courierName || 'Pathao');
        setEditDeliveryCharge(activeOrd.deliveryCharge !== undefined ? String(activeOrd.deliveryCharge) : '60');
        setEditDiscount(activeOrd.discount !== undefined ? String(activeOrd.discount) : '0');
        setEditTrackingId(activeOrd.trackingId || '');
        setEditOrderNote(activeOrd.orderNote || '');
        setEditInternalNote(activeOrd.internalNote || '');
      }
    }
  }, [viewingOrderId, orders]);

  const saveOrderDetails = () => {
    if (!viewingOrderId) return;
    setIsLoading(true);
    
    // Calculate new total based on products and custom adjustment if desired,
    // but the prompt says do not change existing database/order total calculations or products, just make them editable or add these fields!
    // So we'll save these properties inside the order object.
    
    // 1. Update in-memory state
    setOrders(prev => prev.map(o => {
      if (o.id === viewingOrderId) {
        return {
          ...o,
          customerName: editCusName,
          phone: editCusPhone,
          email: editCusEmail,
          shippingAddress: editCusAddress,
          division: editCusDivision,
          district: editCusDistrict,
          upazila: editCusUpazila,
          paymentStatus: editPaymentStatus,
          status: editOrderStatus,
          courierStatus: editCourierStatus,
          courierName: editCourierName,
          deliveryCharge: Number(editDeliveryCharge) || 0,
          discount: Number(editDiscount) || 0,
          trackingId: editTrackingId,
          orderNote: editOrderNote,
          internalNote: editInternalNote
        };
      }
      return o;
    }));

    // 2. Persist to localStorage across all client `orders_` prefix records and global list
    let foundAndSaved = false;
    
    // Update Global List
    try {
      const allOrders = JSON.parse(localStorage.getItem('naimshop_all_orders') || '[]');
      const globalIdx = allOrders.findIndex((o: any) => o.id === viewingOrderId);
      if (globalIdx > -1) {
        allOrders[globalIdx] = {
          ...allOrders[globalIdx],
          customerName: editCusName,
          phone: editCusPhone,
          email: editCusEmail,
          shippingAddress: editCusAddress,
          division: editCusDivision,
          district: editCusDistrict,
          upazila: editCusUpazila,
          paymentStatus: editPaymentStatus,
          status: editOrderStatus,
          courierStatus: editCourierStatus,
          courierName: editCourierName,
          deliveryCharge: Number(editDeliveryCharge) || 0,
          discount: Number(editDiscount) || 0,
          trackingId: editTrackingId,
          orderNote: editOrderNote,
          internalNote: editInternalNote
        };
        localStorage.setItem('naimshop_all_orders', JSON.stringify(allOrders));
      }
      
      if (editOrderStatus === 'Cancelled') {
         const sessions = JSON.parse(localStorage.getItem('naimshop_incomplete_orders') || '[]');
         const updatedSessions = sessions.map((s: any) => s.orderId === viewingOrderId ? { ...s, status: 'Cancelled' } : s);
         localStorage.setItem('naimshop_incomplete_orders', JSON.stringify(updatedSessions));
      }
    } catch(e) { console.error(e); }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('orders_')) {
        try {
          const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(userOrders)) {
            const targetIdx = userOrders.findIndex(o => o.id === viewingOrderId);
            if (targetIdx > -1) {
              userOrders[targetIdx] = {
                ...userOrders[targetIdx],
                customerName: editCusName,
                phone: editCusPhone,
                email: editCusEmail,
                shippingAddress: editCusAddress,
                division: editCusDivision,
                district: editCusDistrict,
                upazila: editCusUpazila,
                paymentStatus: editPaymentStatus,
                status: editOrderStatus,
                courierStatus: editCourierStatus,
                courierName: editCourierName,
                deliveryCharge: Number(editDeliveryCharge) || 0,
                discount: Number(editDiscount) || 0,
                trackingId: editTrackingId,
                orderNote: editOrderNote,
                internalNote: editInternalNote
              };
              localStorage.setItem(key, JSON.stringify(userOrders));
              foundAndSaved = true;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // fallback persistence
    if (!foundAndSaved) {
      try {
        const guestOrders = JSON.parse(localStorage.getItem('orders_guest') || '[]');
        const existingIdx = guestOrders.findIndex((o: any) => o.id === viewingOrderId);
        const sourceOrder = orders.find(o => o.id === viewingOrderId) || {};
        const updatedObj = {
          ...sourceOrder,
          id: viewingOrderId,
          customerName: editCusName,
          phone: editCusPhone,
          email: editCusEmail,
          shippingAddress: editCusAddress,
          division: editCusDivision,
          district: editCusDistrict,
          upazila: editCusUpazila,
          paymentStatus: editPaymentStatus,
          status: editOrderStatus,
          courierStatus: editCourierStatus,
          courierName: editCourierName,
          deliveryCharge: Number(editDeliveryCharge) || 0,
          discount: Number(editDiscount) || 0,
          trackingId: editTrackingId,
          orderNote: editOrderNote,
          internalNote: editInternalNote
        };
        if (existingIdx > -1) {
          guestOrders[existingIdx] = updatedObj;
        } else {
          guestOrders.push(updatedObj);
        }
        localStorage.setItem('orders_guest', JSON.stringify(guestOrders));
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      showToast("🎉 Order details updated successfully!");
    }, 400);
  };

  // SELECTED ORDER object for viewing/printing invoice
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  // Form State: Adding Product
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('1');
  const [prodPrice, setProdPrice] = useState('2200');
  const [prodOldPrice, setProdOldPrice] = useState('3000');
  const [prodSku, setProdSku] = useState('');
  const [prodViews, setProdViews] = useState('2200');
  const [prodStockStatus, setProdStockStatus] = useState('In Stock');
  const [prodFabric, setProdFabric] = useState('Premium Pure Cotton');
  const [prodGsm, setProdGsm] = useState('180 GSM');
  const [prodSizes, setProdSizes] = useState('M, L, XL, XXL');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=600&q=80');
  const [prodShortDesc, setProdShortDesc] = useState('Exclusive high-comfort ethnic wear designed for festivals.');
  const [prodFullDesc, setProdFullDesc] = useState('Intricately detailed premium weave work with top tier thread choice, ensuring maximum elegance and long lasting styling wear comfort.');

  // Form State: Banner Manager
  const [banTitle, setBanTitle] = useState('Festive Traditional Sale');
  const [banSubtitle, setBanSubtitle] = useState('Enjoy up to 50% discount on Silk Sarees');
  const [banBadge, setBanBadge] = useState('Hot Deal');
  const [banBgColor, setBanBgColor] = useState('#b50f4e');
  const [banImages, setBanImages] = useState('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80');
  const [banStatus, setBanStatus] = useState(true);
  const [banSerial, setBanSerial] = useState('1');
  const [banSliderTime, setBanSliderTime] = useState('5');

  // Form State: Offer Manager
  const [coupons, setCoupons] = useState<any[]>([
    { code: 'NAIM300', value: 300, type: 'flat', minCart: 3000, status: true },
    { code: 'EID500', value: 500, type: 'flat', minCart: 5000, status: true },
    { code: 'SILK20', value: 20, type: 'percent', minCart: 2000, status: true }
  ]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponValue, setNewCouponValue] = useState('10');
  const [newCouponMin, setNewCouponMin] = useState('1500');

  // Form State: Payment Settings 
  const [paymentConfigs, setPaymentConfigs] = useState<any>({
    bkash: { 
      label: 'bKash', order: 1, hidden: false, 
      accounts: [
        { id: 'acc_1', type: 'Personal', name: 'Naim Shop', number: '01712345678', instruction: 'Send money to our Personal bKash and confirm transaction ID.', logo: '', qr: '', active: true, hidden: false },
        { id: 'acc_2', type: 'Merchant', name: 'Naim Shop Official', number: '01998765432', instruction: 'Make Payment using our Official Merchant ID or scan our website QR.', logo: '', qr: '', active: true, hidden: false }
      ] 
    },
    nagad: { 
      label: 'Nagad', order: 2, hidden: false, 
      accounts: [
        { id: 'acc_1', type: 'Personal', name: 'Naim Shop', number: '01815151522', instruction: 'Send money using App/USSD and provide references.', logo: '', qr: '', active: true, hidden: false }
      ] 
    },
    rocket: { 
      label: 'Rocket', order: 3, hidden: false, 
      accounts: [
        { id: 'acc_1', type: 'Personal', name: 'Naim Shop', number: '01711122233', instruction: 'Select 12 digit personal wallet coordinates.', logo: '', qr: '', active: false, hidden: false }
      ] 
    },
    bank: { 
      label: 'Bank', order: 4, hidden: false, 
      accounts: [
        { id: 'acc_1', type: 'Gateway', name: 'Naim Shop DBBL', number: '122.105.9818', instruction: 'Wire total balance bank-to-bank and email receipt.', logo: '', qr: '', active: false, hidden: false }
      ] 
    },
    cod: { 
      label: 'Cash on Delivery', order: 5, hidden: false, 
      accounts: [
        { id: 'acc_1', type: 'COD', name: 'Express Delivery', number: 'Instant', instruction: 'Pay to the courier personnel after physical collection.', logo: '', qr: '', active: true, hidden: false }
      ] 
    },
    card: { 
      label: 'Card Payment', order: 6, hidden: false, 
      accounts: [
        { id: 'acc_1', type: 'Online', name: 'Secure Checkout', number: 'SSLCommerz', instruction: 'Pay instantly using Visa, Mastercard, or AMEX cards.', logo: '', qr: '', active: false, hidden: false }
      ] 
    }
  });

  // Dynamic Payment States for detail views
  const [selectedMethodKey, setSelectedMethodKey] = useState<string | null>(null);
  const [selectedAccountIdx, setSelectedAccountIdx] = useState<number | null>(null);
  const [selectedCourierAction, setSelectedCourierAction] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [printSize, setPrintSize] = useState('4x6');
  const [showCheckoutPreview, setShowCheckoutPreview] = useState(false);

  const filteredOrders = orders
    .filter(o => {
      const oType = (o.channel || o.orderType || '').toLowerCase();
      const activeTabLower = (orderChannelFilter || 'online').toLowerCase();
      return activeTabLower === 'online' ? oType.includes('online') : oType.includes('shop');
    })
    .filter(o => {
      if (!orderPhoneSearch) return true;
      const q = (orderPhoneSearch || '').toLowerCase().trim();
      return (o.phone || '').includes(q) || 
             (o.id || '').toLowerCase().includes(q) || 
             (o.customerName || '').toLowerCase().includes(q);
    })
    .filter(o => orderStatusFilter === 'all' ? true : (o.status || '').toLowerCase() === orderStatusFilter.toLowerCase())
    .filter(o => {
      const pFilter = (orderPaymentStatusFilter || 'all').toLowerCase();
      return pFilter === 'all' ? true : (o.paymentStatus || 'Unpaid').toLowerCase() === pFilter;
    })
    .filter(o => {
      const aFilter = (orderAreaFilter || 'all').toLowerCase();
      if (aFilter === 'all') return true;
      const sArea = (o.shippingArea || 'Inside Dhaka').toLowerCase();
      return sArea === aFilter;
    })
    .filter(o => {
      const dFilter = (orderDateFilter || 'all').toLowerCase();
      if (dFilter === 'all') return true;
      const dStr = o.date || '';
      const isTodayDate = dStr.includes('June 12') || dStr.includes('Jun 12');
      const isYesterdayDate = dStr.includes('June 11') || dStr.includes('Jun 11');
      const isThisMonthDate = dStr.includes('June') || dStr.includes('Jun') || dStr.includes('2026');
      if (dFilter === 'today') return isTodayDate;
      if (dFilter === 'yesterday') return isYesterdayDate;
      if (dFilter === 'this month') return isThisMonthDate;
      return true;
    });

  // States for editing a specific account
  const [editAccActive, setEditAccActive] = useState(true);
  const [editAccHidden, setEditAccHidden] = useState(false);
  const [editAccType, setEditAccType] = useState('Personal');
  const [editAccName, setEditAccName] = useState('');
  const [editAccNumber, setEditAccNumber] = useState('');
  const [editAccInstruction, setEditAccInstruction] = useState('');
  const [editAccLogo, setEditAccLogo] = useState('');
  const [editAccQr, setEditAccQr] = useState('');

  const getMethodLogo = (methodKey: string) => {
    const svgMap: Record<string, string> = {
      bkash: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23e21262"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="22" fill="white" text-anchor="middle">bKash</text></svg>',
      nagad: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23f64a1e"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="22" fill="white" text-anchor="middle">Nagad</text></svg>',
      rocket: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%238c3494"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="22" fill="white" text-anchor="middle">Rocket</text></svg>',
      bank: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%231e3a8a"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="22" fill="white" text-anchor="middle">Bank</text></svg>',
      cod: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23475569"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="24" fill="white" text-anchor="middle">COD</text></svg>',
      card: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%234f46e5"/><text x="50" y="58" font-family="Helvetica" font-weight="bold" font-size="24" fill="white" text-anchor="middle">CARD</text></svg>'
    };
    return svgMap[methodKey] || svgMap.cod;
  };

  const openAccountDetail = (methodKey: string, accIdx: number) => {
    setSelectedMethodKey(methodKey);
    setSelectedAccountIdx(accIdx);
    const acc = paymentConfigs[methodKey].accounts[accIdx];
    setEditAccActive(acc.active);
    setEditAccHidden(acc.hidden);
    setEditAccType(acc.type);
    setEditAccName(acc.name);
    setEditAccNumber(acc.number);
    setEditAccInstruction(acc.instruction);
    setEditAccLogo(acc.logo);
    setEditAccQr(acc.qr);
  };

  const handleUpdatePaymentMethodOrder = (methodKey: string, direction: 'up' | 'down') => {
    const sortedKeys = Object.keys(paymentConfigs).sort((a,b) => paymentConfigs[a].order - paymentConfigs[b].order);
    const idx = sortedKeys.indexOf(methodKey);
    if (direction === 'up' && idx > 0) {
      const prevKey = sortedKeys[idx - 1];
      const newConfigs = { ...paymentConfigs };
      const tempOrder = newConfigs[methodKey].order;
      newConfigs[methodKey].order = newConfigs[prevKey].order;
      newConfigs[prevKey].order = tempOrder;
      setPaymentConfigs(newConfigs);
    } else if (direction === 'down' && idx < sortedKeys.length - 1) {
      const nextKey = sortedKeys[idx + 1];
      const newConfigs = { ...paymentConfigs };
      const tempOrder = newConfigs[methodKey].order;
      newConfigs[methodKey].order = newConfigs[nextKey].order;
      newConfigs[nextKey].order = tempOrder;
      setPaymentConfigs(newConfigs);
    }
  };

  const handleToggleMethodHide = (methodKey: string) => {
    setPaymentConfigs((prev: any) => ({
      ...prev,
      [methodKey]: { ...prev[methodKey], hidden: !prev[methodKey].hidden }
    }));
  };

  const handleAddAnotherAccount = (methodKey: string) => {
    const newAcc = {
      id: 'acc_' + Date.now(),
      type: 'Personal',
      name: '',
      number: '',
      instruction: '',
      logo: '',
      qr: '',
      active: true,
      hidden: false
    };
    const updated = { ...paymentConfigs };
    updated[methodKey].accounts.push(newAcc);
    setPaymentConfigs(updated);
    openAccountDetail(methodKey, updated[methodKey].accounts.length - 1);
  };

  const handleRemoveAccount = (methodKey: string, accIdx: number) => {
    if (!confirm("Are you sure you want to remove this account?")) return;
    const updated = { ...paymentConfigs };
    updated[methodKey].accounts.splice(accIdx, 1);
    setPaymentConfigs(updated);
    setSelectedAccountIdx(null);
  };

  const handleSaveActiveAccount = () => {
    if (selectedMethodKey === null || selectedAccountIdx === null) return;
    const updated = { ...paymentConfigs };
    updated[selectedMethodKey].accounts[selectedAccountIdx] = {
      ...updated[selectedMethodKey].accounts[selectedAccountIdx],
      active: editAccActive,
      hidden: editAccHidden,
      type: editAccType,
      name: editAccName,
      number: editAccNumber,
      instruction: editAccInstruction,
      logo: editAccLogo,
      qr: editAccQr
    };
    setPaymentConfigs(updated);
    localStorage.setItem('naimshop_admin_payments', JSON.stringify(updated));
    showToast("✓ Saved Successfully");
    setSelectedAccountIdx(null);
  };

  const resizePaymentAsset = (file: File, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/png", 0.90));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const trimAndResizeLogo = (file: File, maxW = 300, maxH = 150): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          const width = imgData.width;
          const height = imgData.height;

          let minX = width;
          let minY = height;
          let maxX = 0;
          let maxY = 0;
          let foundContent = false;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];

              const isTransparent = a < 15;
              const isWhite = r > 248 && g > 248 && b > 248;

              if (!isTransparent && !isWhite) {
                foundContent = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          if (!foundContent) {
            minX = 0;
            minY = 0;
            maxX = width - 1;
            maxY = height - 1;
          }

          const cropWidth = maxX - minX + 1;
          const cropHeight = maxY - minY + 1;

          const croppedCanvas = document.createElement("canvas");
          croppedCanvas.width = cropWidth;
          croppedCanvas.height = cropHeight;
          const croppedCtx = croppedCanvas.getContext("2d");
          if (!croppedCtx) {
            resolve(event.target?.result as string);
            return;
          }
          croppedCtx.drawImage(
            canvas,
            minX, minY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
          );

          const finalCanvas = document.createElement("canvas");
          const finalCtx = finalCanvas.getContext("2d");
          if (!finalCtx) {
            resolve(croppedCanvas.toDataURL("image/png", 0.95));
            return;
          }

          const scale = Math.min(maxW / cropWidth, maxH / cropHeight);
          const finalWidth = Math.round(cropWidth * scale);
          const finalHeight = Math.round(cropHeight * scale);

          finalCanvas.width = finalWidth;
          finalCanvas.height = finalHeight;

          finalCtx.clearRect(0, 0, finalWidth, finalHeight);
          finalCtx.drawImage(croppedCanvas, 0, 0, finalWidth, finalHeight);

          resolve(finalCanvas.toDataURL("image/png", 0.95));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Form State: Tracking & Analytics
  const [editingTrackingKey, setEditingTrackingKey] = useState<string | null>(null);
  const [trackingConfigs, setTrackingConfigs] = useState<Record<string, any>>({
    fb: { active: true, id: '284710298319028', token: '', testEvent: '', label: 'Facebook Pixel', events: ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead'], logo: '/logos/analytics/facebook.svg' },
    tiktok: { active: false, id: '', token: '', testEvent: '', label: 'TikTok Pixel', events: ['PageView', 'ViewContent', 'AddToCart', 'Checkout', 'Purchase'], logo: '/logos/analytics/tiktok.svg' },
    ga: { active: true, id: 'G-72810XNYP2', label: 'Google Analytics GA4', events: ['Page View', 'Product View', 'Add To Cart', 'Checkout', 'Purchase'], logo: '/logos/analytics/google-analytics.svg' },
    gtm: { active: false, id: '', label: 'Google Tag Manager', events: [], logo: '/logos/analytics/google-tag-manager.svg' },
    metaApi: { active: false, id: '', token: '', datasetId: '', label: 'Meta Conversion API', events: [], logo: '/logos/analytics/meta.svg' },
    googleAds: { active: false, id: '', label: 'Google Ads Conversion', events: ['Conversion'], logo: '/logos/analytics/google-ads.svg' },
    pinterest: { active: false, id: '', label: 'Pinterest Tag', events: ['PageVisit', 'AddToCart', 'Checkout'], logo: '/logos/analytics/pinterest.svg' },
    snap: { active: false, id: '', label: 'Snap Pixel', events: ['PAGE_VIEW', 'VIEW_CONTENT', 'ADD_CART', 'PURCHASE'], logo: '/logos/analytics/snapchat.svg' },
  });

  // Form State: Company Settings
  const { companySettings, setCompanySettings } = useCompany();

  // Delivery Setting State
  const [deliveryInside, setDeliveryInside] = useState('80');
  const [deliveryOutside, setDeliveryOutside] = useState('150');
  const [deliveryFreeThreshold, setDeliveryFreeThreshold] = useState('10000');

  // Customer state
  const [customersList, setCustomersList] = useState<any[]>([
    { id: 'usr_1', name: 'Rahim Ahmed', email: 'rahim@gmail.com', signup: '12 May 2026', points: 420 },
    { id: 'usr_2', name: 'Sumaiya Khan', email: 'sumaiya@gmail.com', signup: '18 May 2026', points: 150 },
    { id: 'usr_3', name: 'Kabir Chowdhury', email: 'kabir.c@gmail.com', signup: '24 May 2026', points: 880 },
    { id: 'usr_4', name: 'Tania Islam', email: 'tania.im@gmail.com', signup: '02 June 2026', points: 30 }
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  // Auto show confirmation toast helper
  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Sync / Load Datasets from APIs and localStorage
  const forceSyncDatabase = () => {
    // 1. Fetch live products from backend in-memory DB
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const seen = new Set<string>();
          const unique = data.filter((p: any) => {
            if (!p || !p.id) return false;
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
          setProducts(unique);
        } else {
          setProducts([]);
        }
      })
      .catch(err => console.error(err));

    // 2. Fetch live reviews
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        setReviews(data);
      })
      .catch(err => console.error(err));

    // Fetch review settings
    fetch('/api/settings/reviews')
      .then(res => res.json())
      .then(data => {
        setReviewSettings(data);
      })
      .catch(err => console.error(err));

    // 3. Fetch banners
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        setBanners(data);
      })
      .catch(err => console.error(err));

    // Fetch dynamic categories
    loadCategoriesFromApi();

    // 4. Compile orders from localStorage
    loadMasterOrders();

    // 5. Load settings configs from localStarage if set
    const savedPayments = localStorage.getItem('naimshop_admin_payments');
    if (savedPayments) setPaymentConfigs(JSON.parse(savedPayments));

    const savedTracking = localStorage.getItem('naimshop_admin_tracking');
    if (savedTracking) setTrackingConfigs(JSON.parse(savedTracking));

    const savedCompany = localStorage.getItem('naimshop_admin_company');
    if (savedCompany) setCompanySettings(JSON.parse(savedCompany));

    const savedCoupons = localStorage.getItem('naimshop_admin_coupons');
    if (savedCoupons) setCoupons(JSON.parse(savedCoupons));

    const savedDelivery = localStorage.getItem('naimshop_admin_delivery');
    if (savedDelivery) {
      const parsed = JSON.parse(savedDelivery);
      setDeliveryInside(parsed.inside || '80');
      setDeliveryOutside(parsed.outside || '150');
      setDeliveryFreeThreshold(parsed.freeThreshold || '10000');
    }

    showToast('Database Synchronized Successfully!');
  };

  const decorateOrder = (o: any) => {
    const idNum = Number((o.id || '99').replace(/\D/g, '')) || 99;
    const channel = o.channel || (idNum % 2 === 0 ? 'Online' : 'In Shop');
    const paymentStatus = o.paymentStatus || (idNum % 3 === 0 ? 'Paid' : idNum % 3 === 1 ? 'Unpaid' : 'Partial');
    const shippingArea = o.shippingArea || (o.shippingAddress && o.shippingAddress.toLowerCase().includes('dhaka') ? 'Inside Dhaka' : 'Outside Dhaka');
    const email = o.email || `${(o.customerName || 'customer').toLowerCase().replace(/\s+/g, '')}@gmail.com`;
    const division = o.division || (shippingArea === 'Inside Dhaka' ? 'Dhaka' : 'Chittagong');
    const district = o.district || (shippingArea === 'Inside Dhaka' ? 'Dhaka' : 'Chittagong');
    const upazila = o.upazila || (shippingArea === 'Inside Dhaka' ? 'Banani' : 'Agrabad');
    const courierStatus = o.courierStatus || 'Pending pickup';
    
    // Ensure accurate item specifications
    const originalItems = o.items || [];
    const items = originalItems.map((it: any) => ({
      ...it,
      size: it.size || 'M',
      color: it.color || 'Royal Blue',
      image: it.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80'
    }));

    if (items.length === 0) {
      items.push({
        id: 'default-item',
        name: 'Premium Silk Saree',
        qty: 1,
        price: o.total || 2200,
        size: 'L',
        color: 'Saffron Pink',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80'
      });
    }

    return {
      ...o,
      channel,
      paymentStatus,
      shippingArea,
      email,
      division,
      district,
      upazila,
      courierStatus,
      items
    };
  };

  const loadMasterOrders = () => {
    const list: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orders_')) {
          try {
            const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(userOrders)) {
                userOrders.forEach(o => {
                  list.push(decorateOrder({ ...o, userSuffix: key.replace('orders_', '') }));
                });
            }
          } catch (e) {
            console.error('Error parsing orders for key', key, e);
          }
        }
    }

    if (list.length === 0) {
      // Default initial orders to populate beautifully
      const defaultOrders = [
        { id: 'ORD-9952', date: 'June 10, 2026', total: 6700, status: 'Pending', items: [{ name: 'Premium Silk Saree', price: 4500, qty: 1 }, { name: 'Men\'s Cotton Punjabi', price: 2200, qty: 1 }], courierName: 'RedX Logistics', trackingId: 'RX-98231', shippingAddress: 'House 12, Road 5, Banani, Dhaka', paymentMethod: 'bKash Personal', phone: '01815151522', customerName: 'Kabir Chowdhury' },
        { id: 'ORD-3041', date: 'June 08, 2026', total: 2200, status: 'Confirmed', items: [{ name: 'Men\'s Cotton Punjabi', price: 2200, qty: 1 }], courierName: 'Pathao Courier', trackingId: 'PT-44810', shippingAddress: 'Agrabad C/A, Chittagong', paymentMethod: 'Cash on Delivery', phone: '01712345678', customerName: 'Sumaiya Khan' },
        { id: 'ORD-1205', date: 'June 07, 2026', total: 4500, status: 'Delivered', items: [{ name: 'Premium Silk Saree', price: 4500, qty: 1 }], courierName: 'Steadfast Courier', trackingId: 'SF-10492', shippingAddress: 'Mirpur 10, Dhaka', paymentMethod: 'Nagad Personal', phone: '01998765432', customerName: 'Rahim Ahmed' }
      ].map(o => decorateOrder(o));
      setOrders(defaultOrders);
    } else {
      setOrders(list.map(o => decorateOrder(o)).sort((a, b) => b.id.localeCompare(a.id)));
    }
  };

  useEffect(() => {
    forceSyncDatabase();
  }, []);

  // Update order status in localStorage to affect client's profile in real time!
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setIsLoading(true);
    
    // Update global list
    try {
      const allOrders = JSON.parse(localStorage.getItem('naimshop_all_orders') || '[]');
      const globalIdx = allOrders.findIndex((o: any) => o.id === orderId);
      if (globalIdx > -1) {
        allOrders[globalIdx].status = newStatus;
        localStorage.setItem('naimshop_all_orders', JSON.stringify(allOrders));
      }
    } catch(e) { console.error(e); }

    // Map through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('orders_')) {
        try {
          const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(userOrders)) {
            const targetIdx = userOrders.findIndex(o => o.id === orderId);
            if (targetIdx > -1) {
              userOrders[targetIdx].status = newStatus;
              localStorage.setItem(key, JSON.stringify(userOrders));
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Update state
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    setTimeout(() => {
      setIsLoading(false);
      showToast(`Order status updated to ${newStatus}!`);
    }, 400);
  };

  const handleSendToCourier = async (order: any, courierKey: string) => {
    if (!order || !courierKey) return;
    
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/courier/send?courierId=${courierKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      const data = await resp.json();
      
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === order.id ? {
          ...o,
          courierName: courierKey,
          trackingId: data.tracking_id,
          trackingUrl: data.tracking_url,
          courierStatus: data.status,
          courierOrderId: data.courier_order_id,
          sentToCourierAt: new Date().toISOString()
        } : o));
        
        // Persist to localstorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('orders_')) {
            const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
            const idx = userOrders.findIndex((ord: any) => ord.id === order.id);
            if (idx > -1) {
              userOrders[idx] = {
                ...userOrders[idx],
                courierName: courierKey,
                trackingId: data.tracking_id,
                trackingUrl: data.tracking_url,
                courierStatus: data.status,
                sentToCourierAt: new Date().toISOString()
              };
              localStorage.setItem(key, JSON.stringify(userOrders));
            }
          }
        }
        showToast(`✓ Order #${order.id} sent to ${courierKey}`);
      } else {
        showToast(`❌ Failed: ${data.error || 'API Error'}`);
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Connection error while sending to courier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSendToCourier = async (targetOrderIds: string[], courierKey: string) => {
    if (targetOrderIds.length === 0) return;
    setIsBulkSending(true);
    setIsLoading(true);
    
    try {
      const resp = await fetch('/api/courier/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: targetOrderIds, courierId: courierKey })
      });
      const data = await resp.json();
      
      if (data.success) {
        const results = data.results;
        setOrders(prev => prev.map(o => {
          const res = results.find((r: any) => r.orderId === o.id);
          if (res) {
            return {
               ...o,
               courierName: courierKey,
               trackingId: res.trackingId,
               trackingUrl: res.trackingUrl,
               courierStatus: 'Sent',
               courierResponse: res,
               sentToCourierAt: new Date().toISOString()
            };
          }
          return o;
        }));
        
        // Sync localstorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('orders_')) {
            const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
            let changed = false;
            userOrders.forEach((o: any, idx: number) => {
              const res = results.find((r: any) => r.orderId === o.id);
              if (res) {
                userOrders[idx] = {
                  ...o,
                  courierName: courierKey,
                  trackingId: res.trackingId,
                  trackingUrl: res.trackingUrl,
                  courierStatus: 'Sent',
                  courierResponse: res,
                  sentToCourierAt: new Date().toISOString()
                };
                changed = true;
              }
            });
            if (changed) localStorage.setItem(key, JSON.stringify(userOrders));
          }
        }
        
        showToast(`✓ Successfully sent ${results.length} orders to ${courierKey}`);
        setSelectedOrderIds([]);
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Bulk send failed");
    } finally {
      setIsBulkSending(false);
      setIsLoading(false);
    }
  };

  // 18 Main action cards list configuration with exact requested names and routes
  const menuItems = [
    { key: 'categories', label: 'Categories', desc: 'Manage traditional genres', route: '/admin/categories', icon: <Layers size={18} className="text-[#ff2f7d]" /> },
    { key: 'customers', label: 'Customers', desc: 'Loyalty points directory', route: '/admin/customers', icon: <Users size={18} className="text-[#ff2f7d]" /> },
    { key: 'products', label: 'Products', desc: 'Add garments & inventory', route: '/admin/products', icon: <ShoppingBag size={18} className="text-[#ff2f7d]" /> },
    { key: 'orders', label: 'Orders', desc: 'List transactions & invoices', route: '/admin/orders', icon: <ClipboardList size={18} className="text-[#ff2f7d]" /> },
    { key: 'incomplete-orders', label: 'Incomplete Orders', desc: 'Recover abandoned carts', route: '/admin/incomplete-orders', icon: <ClipboardX size={18} className="text-[#ff2f7d]" /> },
    { key: 'company', label: 'Manage Shop', desc: 'Configure store profile', route: '/admin/company', icon: <Settings size={18} className="text-[#ff2f7d]" /> },
    { key: 'footer', label: 'Footer Settings', desc: 'Interactive brand links & info', route: '/admin/footer', icon: <Sliders size={18} className="text-[#ff2f7d]" /> },
    { key: 'banners', label: 'Banner Manager', desc: 'Slide & promo images upload', route: '/admin/banners', icon: <ImageIcon size={18} className="text-[#ff2f7d]" /> },
    { key: 'offers', label: 'Promo Codes / Offer', desc: 'Flash sales & coupon cards', route: '/admin/offers', icon: <Percent size={18} className="text-[#ff2f7d]" /> },
    { key: 'tracking', label: 'Analytics', desc: 'Setup FB & TikTok pixel', route: '/admin/tracking', icon: <BarChart3 size={18} className="text-[#ff2f7d]" /> },
    { key: 'reports', label: 'Reports', desc: 'Sleek sales log trends', route: '/admin/reports', icon: <BarChart3 size={18} className="text-[#ff2f7d]" /> },
    { key: 'courier', label: 'Courier / Delivery', desc: 'Shipping charge tiers setup', route: '/admin/courier', icon: <Truck size={18} className="text-[#ff2f7d]" /> },
    { key: 'payments', label: 'Billing', desc: 'Payment accounts & cash', route: '/admin/payments', icon: <CreditCard size={18} className="text-[#ff2f7d]" /> },
    { key: 'help', label: 'Help', desc: 'System user guidelines', route: '/admin/help', icon: <HelpCircle size={18} className="text-[#ff2f7d]" /> },
    { key: 'payments', label: 'Payment Settings', desc: 'Instant gateway configurations', route: '/admin/payments', icon: <CreditCard size={18} className="text-[#ff2f7d]" /> },
    { key: 'tracking', label: 'Tracking & Analytics', desc: 'Setup pixel and Google scripts', route: '/admin/tracking', icon: <Activity size={18} className="text-[#ff2f7d]" /> },
    { key: 'socials', label: 'Social Media', desc: 'Facebook & WhatsApp lines', route: '/admin/social', icon: <Share2 size={18} className="text-[#ff2f7d]" /> },
    { key: 'company', label: 'Company Settings', desc: 'Edit location and coordinates', route: '/admin/company', icon: <Sliders size={18} className="text-[#ff2f7d]" /> },
    { key: 'auth', label: 'Account Login System', desc: 'Configure social & local login toggles', route: '/admin/auth', icon: <Settings size={18} className="text-[#ff2f7d]" /> },
    { key: 'reviews', label: 'Reviews', desc: 'Hype reviews moderation', route: '/admin/reviews', icon: <MessageSquare size={18} className="text-[#ff2f7d]" /> },
    { key: 'chat', label: 'Live Chat', desc: 'Respond support query tickets', route: '/admin/chat', icon: <MessageCircle size={18} className="text-[#ff2f7d]" /> },
    { key: 'db-planner', label: 'Database Setup', desc: 'Hostinger MySQL configuration', route: '/admin/db-planner', icon: <Database size={18} className="text-[#ff2f7d]" /> }
  ];

  // Action: Add new product with POST to backend API
  const handleAddNewProduct = async (e: any, forceStatus?: 'draft' | 'published') => {
    if (e) e.preventDefault();
    if (isLoading) return;
    
    if (!prodName.trim()) {
      alert('Product Name is required!');
      return;
    }

    setIsLoading(true);
    const selectedCategory = categoriesDb.find(cat => cat.id === prodCategory) || { 
      id: prodCategory || '1', 
      slug: prodCategory === '1' ? 'saree' : prodCategory === '2' ? 'punjabi' : prodCategory === '3' ? 'polo-shirt' : prodCategory === '4' ? 't-shirt' : prodCategory === '5' ? 'bags' : 'saree', 
      name: prodCategory === '1' ? 'Saree' : prodCategory === '2' ? 'Punjabi' : prodCategory === '3' ? 'Polo Shirt' : prodCategory === '4' ? 'T-Shirt' : prodCategory === '5' ? 'Bags' : 'Saree',
      mainBanner: '',
      sectionBanner: ''
    };

    const newProductBody = {
      title: prodName,
      name: prodName, // fallback
      price: Number(prodPrice),
      oldPrice: Number(prodOldPrice),
      categoryId: selectedCategory.id,
      categorySlug: selectedCategory.slug || selectedCategory.name.toLowerCase().replace(/\s+/g, '-'),
      categoryName: selectedCategory.name,
      categoryMainBanner: selectedCategory.mainBanner || '',
      categorySectionBanner: selectedCategory.sectionBanner || '',
      sku: prodSku || 'NS-' + Math.floor(Math.random() * 95000),
      views: Number(prodViews) || 2200,
      stock: prodStockStatus,
      status: forceStatus || 'published',
      fabric: prodFabric,
      gsm: prodGsm,
      sizes: prodSizes.split(',').map(s => s.trim()).filter(Boolean),
      shortDescription: prodShortDesc,
      fullDescription: prodFullDesc,
      images: [prodImage],
      image: prodImage, // fallback
      rating: 5,
      isFlashSale: false
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductBody)
      });
      
      if (!res.ok) throw new Error('Failed to create product');
      const data = await res.json();
      
      setProducts(prev => [data, ...prev]);
      
      // Success Flow
      setSuccessMessage(forceStatus === 'draft' ? "Draft Saved Successfully" : "Product Published Successfully");
      setShowSuccessTick(true);
      
      // clear fields
      setProdName('');
      setProdSku('');
      
      // Redirect after 1.5s
      setTimeout(async () => {
        setShowSuccessTick(false);
        setProductTab('list');
        // Product List Refresh
        await forceSyncDatabase();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Save Payment System details inside local storage
  const handleSavePaymentConfig = (key: string, values: any) => {
    const updated = {
      ...paymentConfigs,
      [key]: { ...paymentConfigs[key], ...values }
    };
    setPaymentConfigs(updated);
    localStorage.setItem('naimshop_admin_payments', JSON.stringify(updated));
    showToast(`${paymentConfigs[key].label} settings saved!`);
  };

  // Action: Save Tracking Pixels config inside local storage
  const handleSaveTrackingConfig = (key: string, fields: any) => {
    const updated = {
      ...trackingConfigs,
      [key]: { ...trackingConfigs[key], ...fields }
    };
    setTrackingConfigs(updated);
    localStorage.setItem('naimshop_admin_tracking', JSON.stringify(updated));
    showToast(`${trackingConfigs[key].label} successfully saved and registered!`);
  };

  // Action: Save company settings
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('naimshop_company_settings', JSON.stringify(companySettings));
    showToast('Company identity settings synced!');
  };

  // Action: Save delivery configurations
  const handleSaveDeliveryOpts = (e: React.FormEvent) => {
    e.preventDefault();
    const config = { inside: deliveryInside, outside: deliveryOutside, freeThreshold: deliveryFreeThreshold };
    localStorage.setItem('naimshop_admin_delivery', JSON.stringify(config));
    showToast('Delivery charge tier values parsed!');
  };

  // Action: Add new customizable coupon coupon config
  const handleAddCouponObj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const item = {
      code: newCouponCode.substring(0, 15).toUpperCase().replace(/\s+/g, ''),
      value: Number(newCouponValue),
      type: 'flat',
      minCart: Number(newCouponMin),
      status: true
    };
    const updated = [item, ...coupons];
    setCoupons(updated);
    localStorage.setItem('naimshop_admin_coupons', JSON.stringify(updated));
    setNewCouponCode('');
    showToast(`Coupon card ${item.code} created!`);
  };

  const handleDeleteCouponObj = (code: string) => {
    const filtered = coupons.filter(c => c.code !== code);
    setCoupons(filtered);
    localStorage.setItem('naimshop_admin_coupons', JSON.stringify(filtered));
    showToast(`Coupon card ${code} removed!`);
  };

  // Action: Approve, Reject, or Delete live review status
  const handleApproveLiveReview = (reviewId: string) => {
    fetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Approved' })
    })
      .then(res => {
        if (res.ok) {
          setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'Approved' } : r));
          showToast('Review approved successfully!');
        }
      })
      .catch(err => console.error(err));
  };

  const handleRejectLiveReview = (reviewId: string) => {
    fetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Rejected' })
    })
      .then(res => {
        if (res.ok) {
          setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'Rejected' } : r));
          showToast('Review rejected successfully!');
        }
      })
      .catch(err => console.error(err));
  };

  const handleDeleteLiveReview = (reviewId: string) => {
    fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setReviews(prev => prev.filter(r => r.id !== reviewId));
          showToast('Review deleted from database!');
        }
      })
      .catch(err => console.error(err));
  };

  const handleSaveReviewSettings = (updated: any) => {
    fetch('/api/settings/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(data => {
        setReviewSettings(data);
        showToast('✓ Review settings updated successfully!');
      })
      .catch(err => {
        console.error(err);
        showToast('❌ Failed to update review settings.');
      });
  };

  // Action: Ban/Reward customer points
  const handleAdjustPoints = (custEmail: string, value: number) => {
    setCustomersList(prev => prev.map(c => c.email === custEmail ? { ...c, points: Math.max(0, c.points + value) } : c));
    showToast('Customer loyalty balance updated!');
  };

  // Auto slide dashboard banner promo/courier statuses
  const adminBanners = [
    {
      id: 'banner_courier',
      title: 'Hassle-Free Premium Courier Dispatch',
      text: 'Fast automated shipping integration via RedX, Steadfast, and Pathao Courier APIs.',
      bg: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)',
      badge: 'Courier Log'
    },
    {
      id: 'banner_promo',
      title: 'Traditional Pure Cotton Saree Campaign',
      text: 'Track real-time organic traffic, page views, and size metrics from your dashboard.',
      bg: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
      badge: 'Promo Slide'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx(prev => (prev + 1) % adminBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [adminBanners.length]);

  // Side Drawer list components
  const adminMenuItems = [
    { title:"Dashboard", path:"/admin" },
    { title:"Products", path:"/admin/products" },
    { title:"Categories", path:"/admin/categories" },
    { title:"Orders", path:"/admin/orders" },
    { title:"Incomplete Orders", path:"/admin/incomplete-orders" },
    { title:"Customers", path:"/admin/customers" },
    { title:"Messenger Center", path:"/admin/messenger" },
    { title:"Banner Manager", path:"/admin/banners" },
    { title:"Offer Manager", path:"/admin/offers" },
    { title:"Payment Settings", path:"/admin/payments" },
    { title:"Courier / Delivery", path:"/admin/courier" },
    { title:"Reviews", path:"/admin/reviews" },
    { title:"Live Chat", path:"/admin/chat" },
    { title:"Tracking & Analytics", path:"/admin/tracking" },
    { title:"Social Media Links", path:"/admin/social" },
    { title:"Company Settings", path:"/admin/company" },
    { title:"Footer Settings", path:"/admin/footer" },
    { title:"Account Login System", path:"/admin/auth" },
    { title:"Reports", path:"/admin/reports" },
    { title:"Billing", path:"/admin/billing" },
    { title:"Help", path:"/admin/help" }
  ];

  const getDrawerIcon = (title: string) => {
    switch(title) {
      case "Dashboard": return <BarChart3 size={15} className="text-[#ff2f7d]" />;
      case "Products": return <ShoppingBag size={15} className="text-[#ff2f7d]" />;
      case "Categories": return <Layers size={15} className="text-[#ff2f7d]" />;
      case "Orders": return <ClipboardList size={15} className="text-[#ff2f7d]" />;
      case "Incomplete Orders": return <ClipboardX size={15} className="text-[#ff2f7d]" />;
      case "Customers": return <Users size={15} className="text-[#ff2f7d]" />;
      case "Messenger Center": return <MessageCircle size={15} className="text-[#ff2f7d]" />;
      case "Banner Manager": return <ImageIcon size={15} className="text-[#ff2f7d]" />;
      case "Offer Manager": return <Percent size={15} className="text-[#ff2f7d]" />;
      case "Payment Settings": case "Billing": return <CreditCard size={15} className="text-[#ff2f7d]" />;
      case "Courier / Delivery": return <Truck size={15} className="text-[#ff2f7d]" />;
      case "Reviews": return <MessageSquare size={15} className="text-[#ff2f7d]" />;
      case "Live Chat": return <MessageCircle size={15} className="text-[#ff2f7d]" />;
      case "Tracking & Analytics": return <Activity size={15} className="text-[#ff2f7d]" />;
      case "Social Media Links": return <Share2 size={15} className="text-[#ff2f7d]" />;
      case "Company Settings": return <Settings size={15} className="text-[#ff2f7d]" />;
      case "Footer Settings": return <Sliders size={15} className="text-[#ff2f7d]" />;
      case "Account Login System": return <User size={15} className="text-[#ff2f7d]" />;
      case "Reports": return <BarChart3 size={15} className="text-[#ff2f7d]" />;
      case "Help": return <HelpCircle size={15} className="text-[#ff2f7d]" />;
      default: return <Sliders size={15} className="text-[#ff2f7d]" />;
    }
  };

  const handleAdminLogout = async () => {
    await authClient.auth.signOut();
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('loggedInCustomer');
    navigate("/account", { replace: true });
    setShowLogoutModal(false);
    setAdminMenuOpen(false);
  };

  const isPrintPage = activeSubpage === 'invoice-print' || activeSubpage === 'sticker-print' || activeSubpage === 'company-sticker-print';

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans relative flex flex-col lg:flex-row w-full">
      {authLoading && (
        <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="animate-spin text-slate-900" size={48} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Authenticating...</p>
          </div>
        </div>
      )}
      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={handleAdminLogout} 
      />

      {/* Global Success Tick Animation Overlay */}
      <AnimatePresence>
        {showSuccessTick && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white p-10 rounded-3xl shadow-2xl border border-emerald-100 flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                <Check size={48} className="text-white" strokeWidth={4} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Success!</h3>
                <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs">✓ {successMessage}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin side drawer overlay wrapper */}
      <AnimatePresence>
        {adminMenuOpen && (
          <div className="fixed inset-0 z-[1999] overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setAdminMenuOpen(false)}
            />
            
            {/* Drawer body */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="admin-drawer relative flex flex-col justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                {/* Header inside drawer */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-black">
                      N
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 leading-none">{companySettings.name}</h4>
                      <p className="text-[9px] text-[#ff2f7d] font-bold mt-1">Control Console Drawer</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAdminMenuOpen(false)}
                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full border-none flex items-center justify-center cursor-pointer text-xs font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* Drawer Menu Items */}
                <div className="space-y-0.5 max-h-[75vh] overflow-y-auto pr-1">
                  {adminMenuItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setAdminMenuOpen(false);
                      }}
                      className="admin-drawer-item w-full text-left bg-transparent border-none hover:text-[#ff2f7d] hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-all text-slate-700 font-bold"
                    >
                      <span className="flex-shrink-0 flex items-center justify-center w-5">
                        {getDrawerIcon(item.title)}
                      </span>
                      <span className="truncate flex-1 text-xs">{item.title}</span>
                      <ChevronRight size={11} className="text-slate-350" />
                    </button>
                  ))}

                  {/* New Logout Menu Item */}
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="admin-drawer-item w-full text-left bg-transparent border-none text-rose-500 hover:text-rose-600 hover:bg-rose-50/30 px-2 rounded-lg cursor-pointer transition-all font-bold mt-2 pt-1 border-t border-slate-100/80"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-5">
                      <LogOut size={15} className="text-rose-500" />
                    </span>
                    <span className="truncate flex-1 text-xs text-rose-500">Logout</span>
                    <ChevronRight size={11} className="text-rose-450" />
                  </button>
                </div>
              </div>

              {/* Drawer Footer info */}
              <div className="pt-4 border-t border-slate-100 text-center text-[9px] text-slate-400 font-bold">
                © 2026 Admin Panel • Active Systems Ok
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Desktop Sidebar (hidden on mobile, visible on desktop) */}
      {!isPrintPage && (
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-200 h-screen sticky top-0 shrink-0 border-r border-slate-800 z-50">
          {/* Brand/Logo Section */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <img 
              src={companySettings.logo || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80"} 
              className="w-8 h-8 rounded-full object-cover border border-[#ff2f7d]/50" 
              alt="Logo" 
            />
            <div className="overflow-hidden">
              <h1 className="text-sm font-black text-white truncate">{companySettings.name}</h1>
              <p className="text-[10px] text-[#ff2f7d] font-bold leading-none mt-1">Control Console</p>
            </div>
          </div>

          {/* Scrollable Navigation Area */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {adminMenuItems.map((item, idx) => {
              const itemSlug = item.path.replace('/admin/', '').replace('/admin', '');
              const isActive = (itemSlug === '' && activeSubpage === null) || (itemSlug !== '' && activeSubpage === itemSlug);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                  }}
                  className={`w-full text-left bg-transparent border-none px-3 py-2.5 rounded-xl cursor-pointer transition-all font-bold flex items-center gap-3 ${
                    isActive 
                      ? 'text-white bg-[#ff2f7d] shadow-lg shadow-[#ff2f7d]/15' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex-shrink-0">
                    {getDrawerIcon(item.title)}
                  </span>
                  <span className="text-xs truncate">{item.title}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer/Logout Action */}
          <div className="p-4 border-t border-slate-800 mt-auto">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full text-left bg-transparent border-none text-rose-500 hover:text-rose-400 px-3 py-2.5 rounded-xl cursor-pointer transition-all font-bold flex items-center gap-3 hover:bg-rose-950/20"
            >
              <LogOut size={15} />
              <span className="text-xs">Logout</span>
            </button>
            <div className="mt-3 text-[9px] text-slate-500 text-center font-bold">
              © 2026 Admin Control Panel
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-white">
      
        {/* Premium Compact Header */}
        <header className="lg:hidden bg-slate-900 text-white px-4 py-3 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-32 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10 w-full">
          {/* Left: Hamburger menu or back action */}
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => {
                if (activeSubpage) {
                  navigate('/admin');
                } else {
                  setAdminMenuOpen(true);
                }
              }}
              className="p-1 px-2.5 bg-slate-800 text-slate-350 hover:text-white rounded-lg border-none cursor-pointer flex items-center justify-center h-8 w-8 text-white font-black"
            >
              {activeSubpage ? <ArrowLeft size={16} /> : <span className="text-[17px] leading-none mb-0.5">☰</span>}
            </button>
          </div>

          {/* Center/Right: Brand logo + Admin name */}
          <div className="flex items-center gap-2">
            <img 
              src={companySettings.logo || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80"} 
              className="w-7 h-7 rounded-full object-cover border border-[#ff2f7d]/45" 
              alt="" 
            />
            <div className="text-right">
              <h1 className="text-xs font-black tracking-tight leading-none text-white whitespace-nowrap">
                {companySettings.name}
              </h1>
              <p className="text-[9px] text-[#ff2f7d] mt-0.5 font-bold leading-none">Desk Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Top Header (hidden on mobile, visible on desktop) */}
      {!isPrintPage && (
        <header className="hidden lg:flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 h-16 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {activeSubpage ? `${activeSubpage.toUpperCase()} CONSOLE` : 'DASHBOARD CONSOLE'}
            </h2>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <span className="text-[11px] text-slate-400 font-bold">Welcome back, Naim Shop Admin</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Live Sales and Stats indicator */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">System Operational</span>
            </div>

            {/* Profile Avatar / Indicator */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-150 flex items-center justify-center font-black text-slate-700 text-xs">
                A
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-slate-800 leading-none">Naim Shop Admin</p>
                <p className="text-[9px] text-[#ff2f7d] font-bold mt-1">Super Administrator</p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Floating Action Database Indicator / Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-4 right-4 z-[1050] p-3 text-center rounded-xl font-bold text-[11px] bg-slate-900 border border-slate-800 text-emerald-400 shadow-2xl flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={14} />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/37 flex items-center justify-center z-[2000]">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col items-center gap-3 animate-fade-in shadow-2xl">
            <RefreshCw size={24} className="text-primary animate-spin" />
            <span className="text-white text-[10px] font-black tracking-wider uppercase">Processing DB...</span>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2100] backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-slate-800">
                  Are you sure you want to delete this category?
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Category: {categoryToDelete.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              All products assigned to this category will automatically be set to <strong>Unpublished (Hidden)</strong> status and will immediately disappear from the Customer Panel, but their data, images, stock, and SEO will remain safely stored in the database.
            </p>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border-none rounded-xl cursor-pointer transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const catId = categoryToDelete.id;
                  setCategoryToDelete(null);
                  setIsLoading(true);
                  try {
                    const res = await fetch(`/api/categories/${catId}`, {
                      method: 'DELETE'
                    });
                    if (res.ok) {
                      showToast('🗑️ Category deleted successfully!');
                      loadCategoriesFromApi();
                      forceSyncDatabase();
                    } else {
                      const err = await res.json();
                      showToast(`Error: ${err.message || 'Failed to delete category.'}`);
                    }
                  } catch (err) {
                    console.error("Error during category deletion:", err);
                    showToast('Failed to delete category due to a network error.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="flex-1 py-2.5 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 border-none rounded-xl cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-rose-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 18. PRINT PREVIEWS - Full Width, Outside Mobile Wrapper */}
      {activeSubpage === 'invoice-print' && (
        <AdminPrintPreview 
          orders={ordersToPrint} 
          type="invoice" 
          size={printSizeValue} 
          companySettings={companySettings}
          couriers={couriers} 
        />
      )}
      {activeSubpage === 'sticker-print' && (
        <AdminPrintPreview 
          orders={ordersToPrint} 
          type="sticker" 
          size={printSizeValue} 
          companySettings={companySettings} 
          couriers={couriers} 
        />
      )}

      {activeSubpage === 'company-sticker-print' && (
        <AdminPrintPreview 
          orders={ordersToPrint} 
          type="company-sticker" 
          size={printSizeValue} 
          companySettings={companySettings} 
          couriers={couriers} 
          paymentConfigs={paymentConfigs}
        />
      )}

      {/* MAIN RENDER BLOCK */}
      {!(activeSubpage === 'invoice-print' || activeSubpage === 'sticker-print' || activeSubpage === 'company-sticker-print') && (
      <div className="max-w-md lg:max-w-7xl mx-auto w-full px-0 lg:px-4 pb-24 lg:pb-12 relative z-10 pointer-events-auto">
        
        {activeSubpage === null ? (
          /* ================= DASHBOARD MAIN GRID VIEW ================= */
          <div className="p-4 space-y-4">
            
            {/* Database Connectivity & Diagnostics Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${diagnostics?.serverConnected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                    <Database size={16} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Database Diagnostics</h5>
                    <p className="text-[9px] text-slate-500 font-bold">Real-time MySQL Infrastructure Status</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDatabaseWizard(true)}
                  className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-lg border-none cursor-pointer hover:bg-black transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
                  Run Repair
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Server size={14} className={diagnostics?.serverConnected ? 'text-emerald-500' : 'text-rose-500'} />
                  <span className="text-[8px] font-black text-slate-400 uppercase mt-1">MySQL</span>
                  <span className={`text-[9px] font-black ${diagnostics?.serverConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {diagnostics?.serverConnected ? 'RUNNING' : 'STOPPED'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Globe size={14} className={diagnostics?.databaseExists ? 'text-emerald-500' : 'text-rose-500'} />
                  <span className="text-[8px] font-black text-slate-400 uppercase mt-1">DB Found</span>
                  <span className={`text-[9px] font-black ${diagnostics?.databaseExists ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {diagnostics?.databaseExists ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Database size={14} className={(diagnostics?.tablesCount || 0) > 0 ? 'text-emerald-500' : 'text-rose-500'} />
                  <span className="text-[8px] font-black text-slate-400 uppercase mt-1">Tables</span>
                  <span className={`text-[9px] font-black ${(diagnostics?.tablesCount || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {diagnostics?.tablesCount || 0} Found
                  </span>
                </div>
              </div>

              {diagnostics?.error && (
                <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg flex items-center gap-2">
                  <ShieldAlert size={12} className="text-rose-500 shrink-0" />
                  <p className="text-[9px] font-bold text-rose-700 leading-tight">
                    {typeof diagnostics.error === 'string' && (diagnostics.error.includes('ECONNREFUSED') || diagnostics.error.includes('ENOTFOUND')) ? 'Hostinger MySQL কানেক্ট করা যাচ্ছে না। দয়া করে Host-এ "sqlXXX.hostinger.com" এর পরিবর্তে Hostinger Server IP ব্যবহার করুন এবং Remote MySQL চালু করুন।' : String(diagnostics.error)}
                  </p>
                </div>
              )}
            </div>

            {/* Realtime KPI banner */}
            <div className="border-b border-slate-100 p-4 grid grid-cols-3 gap-2 text-center">
              <div className="border-r border-slate-100">
                <span className="text-[9px] text-[#ff2f7d] font-extrabold uppercase tracking-wider block">Live Sales</span>
                <b className="text-sm font-black text-slate-900 block mt-1">৳{orders.reduce((sum, o) => o.status !=='Cancelled'? sum + o.total : sum, 0).toLocaleString()}</b>
                <span className="text-[8px] text-slate-400 block font-bold mt-0.5">Est. Volume</span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-wider block">Total Orders</span>
                <b className="text-sm font-black text-slate-900 block mt-1">{orders.length}</b>
                <span className="text-[8px] text-emerald-600 font-extrabold block mt-0.5">+{orders.filter(o => o.status === 'Pending').length} Pending</span>
              </div>
              <div>
                <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-wider block">Total Catalog</span>
                <b className="text-sm font-black text-slate-900 block mt-1">{products.length} Items</b>
                <span className="text-[8px] text-slate-400 block font-bold mt-0.5">Active Products</span>
              </div>
            </div>

            {/* Banner Slider Section */}
            <div className="admin-banner relative rounded-xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={bannerIdx}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  style={{ background: adminBanners[bannerIdx].bg }}
                  className="w-full h-full p-4 flex flex-col justify-center text-white relative"
                >
                  <div className="absolute right-3 top-3 bg-white/20 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full text-white uppercase tracking-wider backdrop-blur-sm">
                    {adminBanners[bannerIdx].badge}
                  </div>
                  <h3 className="text-xs font-black tracking-tight leading-snug pr-12">{adminBanners[bannerIdx].title}</h3>
                  <p className="text-[10px] text-white/80 font-medium leading-normal mt-0.5 pr-6 truncate">{adminBanners[bannerIdx].text}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Quick Actions Header */}
            <div className="px-1 flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase">Ecommerce Settings Bar</span>
              <span className="text-[9px] bg-slate-200 text-slate-600 font-extrabold px-1.5 py-0.5 rounded">100% Active</span>
            </div>

            {/* 18-Card 2-Column Responsive Premium Grid (As requested) */}
            <div className="admin-quick-grid">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    navigate(item.route);
                  }}
                  className="admin-action-card text-left border-none cursor-pointer hover:translate-y-[-1px] active:scale-98 transition-all duration-150 relative overflow-hidden"
                >
                  <div className="w-10 h-10 p-2 bg-rose-50 rounded-xl text-primary flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-slate-900 truncate tracking-tight">{item.label}</h4>
                    <p className="truncate block mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

          </div>
        ) : activeSubpage === 'orders' ? (
          /* ================= 4. SUBPAGE: ORDERS (FULL PAGE, NO MODAL STYLE) ================= */
          <div className="p-4 animate-fade-in pb-24 relative z-20 pointer-events-auto">
             {viewingOrderId ? (
                (() => {
                   const order = orders.find(o => o.id === viewingOrderId);
                   if (!order) {
                     return (
                       <div className="text-center p-6 space-y-3 bg-white border border-slate-100 rounded-2xl animate-fade-in">
                         <p className="text-xs text-slate-500 font-extrabold">Order reference not found.</p>
                         <button
                           onClick={() => navigate('/admin/orders')}
                           className="px-4 py-1.5 bg-[#ff2f7d] border-none text-white text-[11px] font-black rounded-xl cursor-pointer"
                         >
                           Go to Orders List
                         </button>
                       </div>
                     );
                   }

                   return (
                     <div className="space-y-4 animate-fade-in pb-12">
                       <div className="flex items-center justify-between">
                         <button 
                           onClick={() => navigate('/admin/orders')}
                           className="flex items-center gap-1 text-[11px] font-bold text-[#ff2f7d] bg-pink-50 hover:bg-pink-100 border border-pink-150 rounded-lg px-2.5 py-1.5 cursor-pointer"
                         >
                           <ArrowLeft size={13} /> Back to Orders
                         </button>
                         <b className="text-[#ff2f7d] text-[11px] tracking-widest uppercase font-black">Order Details</b>
                       </div>

                       {/* Ordered Products detail card */}
                       <div className="order-detail-box divide-y divide-slate-100 space-y-3 shadow-sm">
                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50">Ordered Items</h4>
                         {(order.items || []).map((item: any, idx: number) => (
                           <div key={idx} className="flex gap-3 pt-3 first:pt-0">
                             {/* Ordered Product Image */}
                             <img 
                               src={item.image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&q=80"} 
                               className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0 bg-slate-50" 
                               alt=""
                               referrerPolicy="no-referrer"
                             />
                             
                             <div className="space-y-0.5 text-xs flex-1 min-w-0">
                               {/* Product Name */}
                               <div className="font-extrabold text-slate-800 text-[12px] truncate">{item.name}</div>
                               {/* Quantity */}
                               <div className="text-slate-500 font-bold text-[10.5px]">Quantity: <span className="text-[#ff2f7d] font-black">{item.qty || 1}</span></div>
                               {/* Size */}
                               <div className="text-slate-500 font-bold text-[10.5px]">Size: <span className="text-indigo-600 font-black">{item.size || 'M'}</span></div>
                               {/* Color */}
                               <div className="text-slate-500 font-bold text-[10.5px]">Color: <span className="text-slate-600 font-black">{item.color || 'Royal Blue'}</span></div>
                               {/* Price */}
                               <div className="text-[#ff2f7d] font-black text-[11.5px] mt-0.5">Price: ৳{item.price || item.total || order.total}</div>
                             </div>
                           </div>
                         ))}
                       </div>

                       {/* Customer info table EDITABLE */}
                       <div className="order-detail-box space-y-3.5 text-xs shadow-sm">
                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50">Customer Specifications</h4>
                         
                         {/* Customer Name */}
                         <div>
                           <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Customer Name</label>
                           <input
                             type="text"
                             value={editCusName}
                             onChange={e => setEditCusName(e.target.value)}
                             className="w-full h-10 border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl px-3 font-bold text-slate-850"
                           />
                         </div>

                         {/* Mobile Number */}
                         <div>
                           <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Mobile Number</label>
                           <input
                             type="text"
                             value={editCusPhone}
                             onChange={e => setEditCusPhone(e.target.value)}
                             className="w-full h-10 border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl px-3 font-bold text-slate-850"
                           />
                         </div>

                         {/* Gmail */}
                         <div>
                           <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Gmail / Email</label>
                           <input
                             type="email"
                             value={editCusEmail}
                             onChange={e => setEditCusEmail(e.target.value)}
                             className="w-full h-10 border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl px-3 font-bold text-slate-850"
                           />
                         </div>

                         {/* Full Address */}
                         <div>
                           <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Full Address</label>
                           <textarea
                             rows={2}
                             value={editCusAddress}
                             onChange={e => setEditCusAddress(e.target.value)}
                             className="w-full border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl p-3 font-bold text-slate-850 resize-none"
                           />
                         </div>

                         {/* Division, District, Upazila */}
                         <div className="grid grid-cols-3 gap-2">
                           <div>
                             <label className="block text-[8.5px] font-black text-slate-400 uppercase mb-1">Division</label>
                             <input
                               type="text"
                               value={editCusDivision}
                               onChange={e => setEditCusDivision(e.target.value)}
                               className="w-full h-9 border border-slate-150 bg-slate-50 focus:bg-white rounded-xl px-2 font-bold text-slate-800"
                             />
                           </div>
                           <div>
                             <label className="block text-[8.5px] font-black text-slate-400 uppercase mb-1">District</label>
                             <input
                               type="text"
                               value={editCusDistrict}
                               onChange={e => setEditCusDistrict(e.target.value)}
                               className="w-full h-9 border border-slate-150 bg-slate-50 focus:bg-white rounded-xl px-2 font-bold text-slate-800"
                             />
                           </div>
                           <div>
                             <label className="block text-[8.5px] font-black text-slate-400 uppercase mb-1">Upazila</label>
                             <input
                               type="text"
                               value={editCusUpazila}
                               onChange={e => setEditCusUpazila(e.target.value)}
                               className="w-full h-9 border border-slate-150 bg-slate-50 focus:bg-white rounded-xl px-2 font-bold text-slate-800"
                             />
                           </div>
                         </div>

                         {/* Payment Status, Order Status */}
                         <div className="grid grid-cols-2 gap-2.5">
                           <div>
                             <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Payment Status</label>
                             <select
                               value={editPaymentStatus}
                               onChange={e => setEditPaymentStatus(e.target.value)}
                               className="w-full h-10 border border-slate-150 bg-white rounded-xl px-2 font-bold text-slate-800"
                             >
                               <option value="Paid">Paid</option>
                               <option value="Unpaid">Unpaid</option>
                               <option value="Partial">Partial</option>
                             </select>
                           </div>
                           <div>
                             <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Order Status</label>
                             <select
                               value={editOrderStatus}
                               onChange={e => setEditOrderStatus(e.target.value)}
                               className="w-full h-10 border border-slate-150 bg-white rounded-xl px-2 font-bold text-slate-800"
                             >
                               <option value="Order Placed">Order Placed</option>
                               <option value="Confirmed">Confirmed</option>
                               <option value="Packaging">Packaging</option>
                               <option value="Courier Assigned">Courier Assigned</option>
                               <option value="On Delivery">On Delivery</option>
                               <option value="Delivered">Delivered</option>
                               <option value="Cancelled">Cancelled</option>
                             </select>
                           </div>
                         </div>

                        {/* Courier Status */}
                        <div className="pt-2 border-t border-slate-50">
                          <label className="block text-[9px] font-black text-slate-450 uppercase mb-2 flex items-center gap-1.5">
                            <Truck size={10} className="text-[#ff2f7d]" /> Send to Courier (Integration)
                          </label>
                          <div className="flex gap-2">
                             <select 
                               onChange={(e) => setSelectedCourierAction(e.target.value)}
                               className="flex-1 h-10 border border-slate-150 bg-white rounded-xl px-3 font-bold text-slate-800 text-xs outline-none focus:border-[#ff2f7d]"
                             >
                               <option value="">Select Courier...</option>
                               {Object.keys(couriers).filter(k => couriers[k].active).map(k => (
                                 <option key={k} value={k}>{couriers[k].name}</option>
                               ))}
                             </select>
                             <button
                               type="button"
                               disabled={!selectedCourierAction || isBulkSending}
                               onClick={() => handleBulkSendToCourier([order.id], selectedCourierAction)}
                               className="px-4 h-10 bg-black text-white text-[10px] font-black rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                             >
                               {isBulkSending ? 'Sending...' : 'Send Now'}
                             </button>
                          </div>
                          {order.courierResponse && (
                            <div className="mt-2 text-[8px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto">
                               Response: {JSON.stringify(order.courierResponse).slice(0, 100)}...
                            </div>
                          )}
                        </div>

                        {/* Courier Status Text */}
                        <div>
                          <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Manual Courier Status</label>
                          <input
                            type="text"
                            value={editCourierStatus}
                            placeholder="e.g. Received at sorting hub"
                            onChange={e => setEditCourierStatus(e.target.value)}
                            className="w-full h-10 border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl px-3 font-bold text-slate-850"
                          />
                        </div>

                        {/* Delivery Charge & Discount Edit Fields */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Delivery Charge (৳)</label>
                            <input
                              type="number"
                              value={editDeliveryCharge}
                              onChange={e => setEditDeliveryCharge(e.target.value)}
                              className="w-full h-10 border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl px-3 font-bold text-slate-800 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Discount (৳)</label>
                            <input
                              type="number"
                              value={editDiscount}
                              onChange={e => setEditDiscount(e.target.value)}
                              className="w-full h-10 border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl px-3 font-bold text-slate-800 text-xs"
                            />
                          </div>
                        </div>

                        {/* Tracking ID Edit Field */}
                        <div>
                          <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Courier Tracking ID</label>
                          <input
                            type="text"
                            value={editTrackingId}
                            placeholder="e.g. PATHAO-1928374"
                            onChange={e => setEditTrackingId(e.target.value)}
                            className="w-full h-10 border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl px-3 font-semibold text-slate-800 text-xs"
                          />
                        </div>

                        {/* Order Note (Customer facing) */}
                        <div>
                          <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Customer Order Note</label>
                          <textarea
                            rows={2}
                            value={editOrderNote}
                            placeholder="Note from customer or direct instructions..."
                            onChange={e => setEditOrderNote(e.target.value)}
                            className="w-full border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl p-2.5 font-medium text-slate-800 text-xs resize-none"
                          />
                        </div>

                        {/* Staff / Internal Note (Admin private) */}
                        <div>
                          <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Staff / Private Internal Note</label>
                          <textarea
                            rows={2}
                            value={editInternalNote}
                            placeholder="Confidential comments..."
                            onChange={e => setEditInternalNote(e.target.value)}
                            className="w-full border border-slate-150 bg-slate-50 focus:bg-white focus:border-[#ff2f7d] outline-none rounded-xl p-2.5 font-medium text-slate-800 text-xs resize-none"
                          />
                        </div>

                         <button 
                           onClick={saveOrderDetails}
                           className="w-full h-10 mt-2 bg-[#ff2f7d] hover:bg-pink-600 text-white font-black text-xs border-none cursor-pointer rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                         >
                           <Save size={13} /> Save Changes
                         </button>
                       </div>

                       {/* Courier Action Section */}
                       <div className="order-detail-box space-y-4 text-xs shadow-sm">
                         <h4 className="text-[11.5px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50">Courier & Packaging Panel</h4>
                         
                         {/* Courier selector */}
                         <div>
                           <label className="block text-[9px] font-black text-slate-450 uppercase mb-1">Courier Select</label>
                           <select
                             value={editCourierName}
                             onChange={e => setEditCourierName(e.target.value)}
                             className="w-full h-10 border border-slate-150 bg-white rounded-xl px-2.5 font-bold text-slate-850"
                           >
                             {Object.keys(couriers)
                               .filter(k => couriers[k].active === true)
                               .map(k => (
                                 <option key={k} value={k}>{k}</option>
                               ))
                             }
                           </select>
                         </div>

                         {/* Sizes */}
                         <div>
                           <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Label Size Preset</label>
                           <div className="flex flex-wrap gap-1">
                             {(couriers[editCourierName]?.printSizes || ['A4', 'A5', 'A6', 'Thermal 80mm', 'Sticker 4x6']).map((size: string) => (
                               <button
                                 key={size}
                                 type="button"
                                 onClick={() => showToast(`Size selected: ${size}`)}
                                 className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-300 transition-all font-bold text-[9.5px] text-slate-705 rounded-lg cursor-pointer"
                               >
                                 {size}
                               </button>
                             ))}
                           </div>
                         </div>

                         <div className="grid grid-cols-3 gap-1.5 pt-2">
                           <button
                             type="button"
                             onClick={() => navigate(`/admin/print/sticker?orderId=${order.id}&size=4x6`)}
                             className="h-10 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-600 font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-0.5 cursor-pointer transition-all"
                           >
                             Sticker Print
                           </button>
                           <button
                             type="button"
                             onClick={() => navigate(`/admin/print/invoice?orderId=${order.id}&size=A4`)}
                             className="h-10 bg-emerald-50 border border-emerald-150 hover:bg-emerald-100 text-emerald-600 font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-0.5 cursor-pointer transition-all"
                           >
                             Invoice Print
                           </button>
                           <button
                             type="button"
                             onClick={() => showToast("📦 Delivery shipment packet ready!")}
                             className="h-10 bg-[#ff2f7d] hover:bg-pink-600 border-none text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-0.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                           >
                             Ready Button
                           </button>
                         </div>
                       </div>
                     </div>
                   );
                })()
             ) : (
                <div className="space-y-4">
                  {/* Top Header Row */}
                   <div className="orders-top">
                     <div className="order-tabs">
                       <button 
                         className={orderChannelFilter.toLowerCase() === "online" ? "active" : ""}
                         onClick={() => setOrderChannelFilter('Online')}
                       >
                         Online
                       </button>
                       <button 
                         className={orderChannelFilter.toLowerCase() === "in shop" || orderChannelFilter.toLowerCase() === "inshop" ? "active" : ""}
                         onClick={() => setOrderChannelFilter('In Shop')}
                       >
                         In Shop
                       </button>
                     </div>

                     <div className="order-actions">
                       <button onClick={() => navigate('/admin/products/add')}>+</button>
                       <button 
                         className={selectMode ? "bg-[#6426ff] text-white border-[#6426ff]" : ""}
                         onClick={() => setSelectMode(!selectMode)}
                       >
                         ☑
                       </button>
                       <button onClick={() => showToast("Download Orders Clicked!")}>⬇</button>
                     </div>
                   </div>

                   {/* Bulk Action Bar */}
                   {selectMode && (
                     <div className="bulk-action-scroll">
                        <button 
                          onClick={() => {
                            if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) setSelectedOrderIds([]);
                            else setSelectedOrderIds(filteredOrders.map(o => o.id));
                          }}
                          className={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? "active" : ""}
                        >
                          Select All
                        </button>
                        <div className="h-8 flex items-center px-2 text-[10px] font-black text-[#6426ff] uppercase whitespace-nowrap">
                          {selectedOrderIds.length} Selected
                        </div>
                        
                        {/* Courier Chips */}
                        {Object.keys(couriers).filter(k => couriers[k].active).map(k => (
                          <button key={k} onClick={() => handleBulkSendToCourier(selectedOrderIds, k)}>
                            {couriers[k].name}
                          </button>
                        ))}

                        {/* Print Chips */}
                        <button onClick={() => {
                          const ids = selectedOrderIds.join(',');
                          navigate(`/admin/print/invoice?orders=${ids}&size=${printSize}`);
                        }}>
                           Invoice
                        </button>
                        <button onClick={() => {
                          const ids = selectedOrderIds.join(',');
                          navigate(`/admin/print/sticker?orders=${ids}&size=${printSize}`);
                        }}>
                           Courier Sticker
                        </button>
                         <button onClick={() => {
                          const ids = selectedOrderIds.join(',');
                          navigate(`/admin/print/company-sticker?orders=${ids}&size=${printSize}`);
                        }}>Co. Sticker</button>
                        
                        {/* Size Selector */}
                        {['A4', 'A5', 'A6', '4x6', '80mm'].map(sz => (
                          <button 
                            key={sz} 
                            onClick={() => setPrintSize(sz)}
                            className={printSize === sz ? "active" : ""}
                          >
                            {sz}
                          </button>
                        ))}
                     </div>
                   )}

                   <div className="order-search-filter">
                     <input 
                       placeholder="Search phone" 
                       value={orderPhoneSearch}
                       onChange={e => setOrderPhoneSearch(e.target.value)}
                     />
                     <select
                       value={orderStatusFilter}
                       onChange={e => setOrderStatusFilter(e.target.value)}
                     >
                       <option value="all">All</option>
                       <option value="Paid">Paid</option>
                       <option value="Partial">Partial</option>
                       <option value="Unpaid">Unpaid</option>
                       <option value="Confirmed">Confirmed</option>
                       <option value="Pending">Pending</option>
                       <option value="Delivered">Delivered</option>
                       <option value="Cancelled">Cancelled</option>
                     </select>
                   </div>

                  {/* Order Cards List */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    <div className="space-y-0">
                      {filteredOrders.map((o) => (
                            <div 
                              key={o.id}
                              className="order-card p-0"
                              onClick={() => {
                                setViewingOrderId(o.id);
                                navigate(`/admin/orders/${o.id}`);
                              }}
                            >
                              <div className="order-card-head">
                                <div className="flex items-center gap-1.5">
                                  {selectMode && (
                                    <div 
                                      className="checkbox-area p-1 min-w-[24px] flex items-center justify-center"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input 
                                        type="checkbox" 
                                        className="w-4 h-4 accent-[#6426ff] rounded cursor-pointer" 
                                        checked={selectedOrderIds.includes(o.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (e.target.checked) setSelectedOrderIds(prev => [...prev, o.id]);
                                          else setSelectedOrderIds(prev => prev.filter(id => id !== o.id));
                                        }}
                                      />
                                    </div>
                                  )}
                                  <span className="font-extrabold text-slate-400">#{o.id.replace('ORD-', '')}</span>
                                  <span className="font-black text-slate-500 text-[11px] px-1.5 py-0.5 bg-slate-100 rounded-lg">{o.channel}</span>
                                  <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-wider ${
                                    (o.paymentStatus || 'Unpaid') === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 
                                    (o.paymentStatus || 'Unpaid') === 'Unpaid' ? 'bg-rose-50 text-[#ff2f7d]' : 'bg-amber-50 text-amber-500'
                                  }`}>
                                    {o.paymentStatus || 'Unpaid'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <b className="text-slate-900 font-extrabold">{o.total} ৳</b>
                                  <ChevronRight size={16} className="text-slate-300" />
                                </div>
                              </div>
                              
                              <div className="order-card-body">
                                <img 
                                  src={(o.items && o.items[0] && o.items[0].image) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&q=80'} 
                                  alt="" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="order-name">{o.customerName}</div>
                                  <div className="order-info">
                                    <span className="block font-bold">{o.phone}</span>
                                    <div>{(o.items || []).length} item • {(o.items || []).reduce((sum: number, it: any) => sum + (it.qty || 1), 0)} qty • Order #{o.id.replace('ORD-', '')}</div>
                                    <div className="text-indigo-600 font-bold uppercase">{o.shippingArea || 'Outside Dhaka'}</div>
                                    <div className="mt-0.5">{o.date} • {o.time || '11:15 AM'}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="order-card-foot">
                                <div className={`status-pill ${
                                  (o.status || '').toLowerCase() === 'delivered' ? 'bg-emerald-500' : 
                                  (o.status || '').toLowerCase() === 'pending' ? 'bg-amber-500' : 
                                  (o.status || '').toLowerCase() === 'cancelled' ? 'bg-slate-400' : 'bg-indigo-500'
                                }`}>
                                  {o.status || 'Pending'}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {filteredOrders.length === 0 && (
                            <div className="p-10 text-center">
                               <p className="text-xs font-bold text-slate-400">No orders found matching filters.</p>
                            </div>
                          )}
                        </div>
                  </div>

                </div>
             )}
          </div>
        ) : activeSubpage === 'products' ? (
          /* ================= 2. SUBPAGE: PRODUCTS (EMBEDDED WORKSPACE, NO MODAL STYLE) ================= */
          <div className="p-4 animate-fade-in pb-24 relative z-20 pointer-events-auto">
            <div className="space-y-4">
              
              {/* Clean Section Header (No modal borders/boxes) */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#ff2f7d]/10 text-[#ff2f7d] rounded-lg flex items-center justify-center">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[15px] text-slate-900 leading-tight">
                      {editingProduct ? (editingProduct.id === 'new' ? 'Add New Product Form' : 'Edit Product Details') : 'Product Inventory'}
                    </h3>
                    <p className="text-[9px] text-[#ff2f7d] font-bold">
                      {editingProduct ? 'Direct Integrated Editor' : 'Manage Apparel Designs'}
                    </p>
                  </div>
                </div>
                {editingProduct ? (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/products')}
                    className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border-none text-[10px] font-bold cursor-pointer"
                  >
                    Back to List
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border-none text-[10px] font-bold cursor-pointer"
                  >
                    Dashboard ×
                  </button>
                )}
              </div>

              {editingProduct ? (
                <AdminProductDetailsEdit 
                  product={editingProduct}
                  allProducts={products}
                  categories={categoriesDb.filter(c => c.status === true).length > 0 
                    ? categoriesDb.filter(c => c.status === true).map(c => c.name)
                    : ['Saree', 'Punjabi', 'Polo Shirt', 'T-Shirt', 'Bags']
                  }
                  onClose={() => navigate('/admin/products')}
                  onSave={async (id, payload) => {
                    try {
                      // Auto update/sync categoryId, categoryName, categorySlug, and banners
                      if (payload.category) {
                        const matchedCat = categoriesDb.find(c => c.name === payload.category);
                        if (matchedCat) {
                          payload.categoryId = matchedCat.id;
                          payload.categorySlug = matchedCat.slug || matchedCat.name.toLowerCase().replace(/\s+/g, '-');
                          payload.categoryName = matchedCat.name;
                          payload.categoryMainBanner = matchedCat.mainBanner || '';
                          payload.categorySectionBanner = matchedCat.sectionBanner || '';
                        }
                      }
                      const isNew = id === 'new';
                      const url = isNew ? '/api/products' : `/api/products/${id}`;
                      const method = isNew ? 'POST' : 'PUT';

                      const response = await fetch(url, {
                        method: method,
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                      });
                      if (response.ok) {
                        const updated = await response.json();
                        if (isNew) {
                          setProducts(prev => {
                            const filtered = prev.filter(p => p.id !== updated.id);
                            return [updated, ...filtered];
                          });
                          showToast("✨ Product added successfully!");
                        } else {
                          setProducts(prev => prev.map(p => p.id === id ? updated : p));
                          showToast("✨ Product specs updated successfully!");
                        }
                        await forceSyncDatabase();
                        return updated;
                      } else {
                        const errData = await response.json().catch(() => ({}));
                        const errorMsg = errData.error || "Failed to save product spec";
                        const customErr = new Error(errorMsg);
                        (customErr as any).reason = errData.reason;
                        (customErr as any).alterSql = errData.alterSql;
                        (customErr as any).missingColumns = errData.missingColumns;
                        (customErr as any).missingTables = errData.missingTables;
                        (customErr as any).tableName = errData.tableName;
                        throw customErr;
                      }
                    } catch (err) {
                      console.error(err);
                      throw err;
                    }
                  }}
                  onDelete={async (id) => {
                    try {
                      const response = await fetch(`/api/products/${id}`, {
                        method: 'DELETE'
                      });
                      if (response.ok) {
                        setProducts(prev => prev.filter(p => p.id !== id));
                        navigate('/admin/products');
                        showToast("🗑️ Product deleted successfully!");
                      } else {
                        throw new Error("Failed to delete product");
                      }
                    } catch (err) {
                      console.error(err);
                      throw err;
                    }
                  }}
                  onClone={async (p) => {
                    try {
                      const clonedPayload = {
                        ...p,
                        name: `${p.name} (Copy)`,
                        sku: `${p.sku || 'SKU'}-COPY-${Math.floor(Math.random() * 1000)}`,
                        views: 2200
                      };
                      const response = await fetch(`/api/products`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(clonedPayload)
                      });
                      if (response.ok) {
                        const savedClonedProduct = await response.json();
                        setProducts(prev => {
                          const filtered = prev.filter(p => p.id !== savedClonedProduct.id);
                          return [savedClonedProduct, ...filtered];
                        });
                        navigate(`/admin/products/${savedClonedProduct.id}`);
                        showToast("✨ Product cloned successfully!");
                      } else {
                        throw new Error("Failed to clone product");
                      }
                    } catch (err) {
                      console.error(err);
                      throw err;
                    }
                  }}
                />
              ) : (
                <div className="space-y-4">
                  
                  {/* Products sub-tabs */}
                  <div className="product-tabs no-scrollbar">
                    <button onClick={() => setProductTab('list')} className={`product-tab ${productTab === 'list' ? 'active' : ''}`}>All Products</button>
                    <button onClick={() => navigate('/admin/products/new')} className="product-tab">Add Product</button>
                    <button onClick={() => setProductTab('stock')} className={`product-tab ${productTab === 'stock' ? 'active' : ''}`}>Stock / Inventory</button>
                    <button onClick={() => setProductTab('views')} className={`product-tab ${productTab === 'views' ? 'active' : ''}`}>View Boost</button>
                    <button onClick={() => setProductTab('sizes')} className={`product-tab ${productTab === 'sizes' ? 'active' : ''}`}>Size & Fabrics</button>
                    <button onClick={() => setProductTab('bulk')} className={`product-tab ${productTab === 'bulk' ? 'active' : ''}`}>Bulk Upload</button>
                    {categoriesDb.filter(c => c.status === true).map(cat => (
                      <button key={cat.id} onClick={() => setProductTab(cat.id)} className={`product-tab ${productTab === cat.id ? 'active' : ''}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {(productTab === 'list' || categoriesDb.some(c => c.id === productTab)) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 p-2 bg-slate-100 rounded-xl">
                        <Search size={14} className="text-slate-450" />
                        <input 
                          type="text" 
                          placeholder="Search in product inventory..." 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="bg-transparent border-none text-[11px] font-bold outline-none flex-1"
                        />
                      </div>

                      <div className="space-y-2">
                        {products
                          .filter(p => p.isDeleted !== true && (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                          .filter(p => productTab === 'list' || p.categoryId === productTab || p.category === categoriesDb.find(c => c.id === productTab)?.name)
                          .map((p) => (
                            <div 
                              key={p.id} 
                              onClick={() => navigate(`/admin/products/${p.id}`)}
                              className="p-2 border-b border-slate-50 flex items-center justify-between gap-2 bg-white cursor-pointer hover:bg-slate-50 transition-all admin-product-card"
                            >
                              <img src={p.image || "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=600&q=80"} className="w-10 h-10 object-cover rounded-lg" alt="" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <b className="text-[11px] text-slate-900 truncate flex-1">{p.name}</b>
                                  <span className={`text-[7.5px] px-1 py-0.5 rounded font-black uppercase shrink-0 ${p.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {p.status === 'published' ? 'Live' : 'Draft'}
                                  </span>
                                </div>
                                <span className="text-[9px] text-indigo-500 font-extrabold mr-2">৳{p.price}</span>
                                <span className="text-[8px] bg-slate-100 px-1 py-0.5 rounded text-slate-500">{p.category}</span>
                              </div>
                              <span className="text-[9.5px] font-mono text-slate-400 font-bold">{p.sku}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {productTab === 'add' && (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400 font-bold bg-white rounded-2xl border border-slate-100 shadow-sm gap-2">
                      <RefreshCw className="animate-spin text-indigo-500" size={24} />
                      <p className="text-xs text-slate-500">Opening Full Product Editor...</p>
                    </div>
                  )}

                  {productTab === 'stock' && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] text-slate-500 font-bold">Fast toggle stock level constraints for your garments:</p>
                      <div className="space-y-2">
                        {products.map(p => (
                          <div key={p.id} className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-800 truncate max-w-[170px]">{p.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${p.stock==='In Stock'?'bg-emerald-50 text-emerald-600':'bg-amber-50 text-amber-600'}`}>{p.stock || 'In Stock'}</span>
                              <button 
                                onClick={() => {
                                  const text = p.stock === 'In Stock' ? 'Out of Stock' : 'In Stock';
                                  setProducts(prev => prev.map(item => item.id === p.id ? { ...item, stock: text } : item));
                                  showToast('Stock level toggled!');
                                }}
                                className="px-2 py-1 bg-white hover:bg-slate-100 font-extrabold border border-indigo-100 text-[#ff2f7d] cursor-pointer rounded text-[9px]"
                              >
                                Toggle
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {productTab === 'views' && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] text-slate-450 block font-bold leading-normal">Manually customize visual view statistics triggers to boost traditional fashion popularity displays:</span>
                      <div className="space-y-2">
                        {products.map(p => (
                          <div key={p.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="block text-[11px] font-black text-slate-800 truncate">{p.name}</span>
                              <span className="text-[9px] text-slate-400">Total displayed popularity views: <b>{p.views || 2200}</b></span>
                            </div>
                            <button 
                              onClick={() => {
                                setProducts(prev => prev.map(item => item.id === p.id ? { ...item, views: (item.views || 2200) + 1250 } : item));
                                showToast('Added 1,250 views boost!');
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border-none text-[10px] font-black text-indigo-600 cursor-pointer rounded-lg shrink-0"
                            >
                              +1.2k Views
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {productTab === 'sizes' && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-650 text-[11px] font-bold leading-relaxed space-y-2">
                      <span className="text-[10px] font-black text-[#ff2f7d] block uppercase">Apparel Sizing Matrix</span>
                      <p>All classic cotton Punjabis support active size parameters of: <b>M (Regular Fit), L (Regular Fit), XL (Premium), XXL (Ultimate Craftsmanship)</b>.</p>
                      <p>Traditional designer Silk Sarees are rendered with a fixed single-selection fallback size tag: <b>Free Size</b> with customized 85 GSM yarn density configurations.</p>
                    </div>
                  )}

                  {productTab === 'bulk' && (
                    <AdminBulkUpload 
                      onSuccess={() => {
                        setProductTab('list');
                        forceSyncDatabase();
                      }}
                      showToast={showToast}
                    />
                  )}

                </div>
              )}

            </div>

            {/* Floating Action Button (FAB) in bottom right corner */}
            {!editingProduct && (
              <button
                onClick={() => navigate('/admin/products/new')}
                className="fixed bottom-20 right-6 w-14 h-14 bg-[#ff2f7d] hover:bg-pink-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all z-50 cursor-pointer border-none"
                style={{ boxShadow: '0 4px 14px rgba(255, 47, 125, 0.4)' }}
                title="Add New Product"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            )}

          </div>
        ) : (
          /* ================= DETAILED WORKING SUBPAGES ================= */
          <div className="p-4 animate-fade-in">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xl space-y-5">
              
              {/* Working Subpage Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#ff2f7d]/10 text-[#ff2f7d] rounded-lg flex items-center justify-center">
                    {menuItems.find(m => m.key === activeSubpage)?.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[15px] text-slate-900 leading-tight">
                      {menuItems.find(m => m.key === activeSubpage)?.label}
                    </h3>
                    <p className="text-[9px] text-slate-450 font-bold">Workspace Section Active</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubpage(null)}
                  className="p-1 px-2.5 bg-slate-105 hover:bg-slate-200 text-slate-500 rounded-lg border-none text-[10px] cursor-pointer"
                >
                  Close ×
                </button>
              </div>

              {/* ================= 1. SUBPAGE: DASHBOARD STATS ================= */}
              {activeSubpage === 'dashboard' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900 text-white rounded-xl">
                    <b className="text-[9px] text-[#ff2f7d] uppercase tracking-wider block font-black">Monthly Business Scope</b>
                    <h4 className="text-2xl font-black text-white mt-1">৳458,500</h4>
                    <p className="text-[9px] text-slate-400 mt-1">Combined sales are computed in real-time across cash and bKash orders.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/70">
                      <span className="text-[9px] text-slate-450 uppercase block font-bold">Store Views Boost</span>
                      <span className="text-sm font-black block mt-0.5 text-slate-800">15,220 Views</span>
                      <b className="text-[8px] text-emerald-500 block mt-1">● 98.4% uptime OK</b>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/70">
                      <span className="text-[9px] text-slate-450 uppercase block font-bold">Avg Order Size</span>
                      <span className="text-sm font-black block mt-0.5 text-slate-800">৳3,850</span>
                      <b className="text-[8px] text-[#ff2f7d] block mt-1">Premium segment</b>
                    </div>
                  </div>

                  <div 
                    onClick={() => { setActiveSubpage('incomplete-orders'); navigate('/admin/incomplete-orders'); }}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-[#ff2f7d] transition-all group"
                  >
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5"><ClipboardX size={14} className="text-[#ff2f7d]" /> Recovery & Incomplete</span>
                       <span className="text-[9px] font-bold text-[#ff2f7d] group-hover:underline">View All →</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-rose-50 rounded-lg p-2 text-center">
                        <span className="block text-rose-500 font-black text-lg">{(() => {
                           const sess = JSON.parse(localStorage.getItem('naimshop_incomplete_orders') || '[]');
                           return sess.filter((s:any) => s.status !== 'Order Placed' && s.status !== 'Cancelled').length;
                        })()}</span>
                        <span className="block text-[8px] uppercase tracking-wider text-rose-600 font-bold mt-0.5">Incomplete</span>
                      </div>
                      <div className="flex-1 bg-amber-50 rounded-lg p-2 text-center">
                        <span className="block text-amber-500 font-black text-lg">{(() => {
                           const sess = JSON.parse(localStorage.getItem('naimshop_incomplete_orders') || '[]');
                           return sess.filter((s:any) => s.cartInfo?.itemCount > 0 && s.status !== 'Order Placed' && s.status !== 'Cancelled').length;
                        })()}</span>
                        <span className="block text-[8px] uppercase tracking-wider text-amber-600 font-bold mt-0.5">Abandoned</span>
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-lg p-2 text-center">
                        <span className="block text-slate-600 font-black text-lg">{(() => {
                           const sess = JSON.parse(localStorage.getItem('naimshop_incomplete_orders') || '[]');
                           return sess.filter((s:any) => s.status === 'Cancelled').length;
                        })()}</span>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Cancelled</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Top Selling Genres (Estimated)</span>
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] font-extrabold text-slate-700">
                          <span>Saree Traditional Wears</span>
                          <span>62% (৳284.2k)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
                          <div className="bg-[#ff2f7d] h-full" style={{ width: '62%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-extrabold text-slate-700">
                          <span>Punjabi Designer Crafts</span>
                          <span>28% (৳128.3k)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
                          <div className="bg-indigo-500 h-full" style={{ width: '28%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 2. SUBPAGE: PRODUCTS BAR (Extracted to primary render) ================= */}

              {/* ================= 3. SUBPAGE: CATEGORIES ================= */}
              {activeSubpage === 'categories' && (
                <div className="space-y-4 max-w-2xl mx-auto pb-24 relative z-20 pointer-events-auto">
                  {/* Top Bar back+title */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          if (editingCategory || isCreatingCategory) {
                            setEditingCategory(null);
                            setIsCreatingCategory(false);
                          } else {
                            setActiveSubpage(null);
                          }
                        }}
                        className="flex items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="text-sm font-black text-slate-850 tracking-tight uppercase">
                        {editingCategory ? "Edit Category" : isCreatingCategory ? "Add Category" : "Categories"}
                      </h3>
                    </div>
                    
                    {!(editingCategory || isCreatingCategory) && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {categoriesDb.length} Registered Categories
                      </span>
                    )}
                  </div>

                  {/* Category Create/Edit Page fields */}
                  {(editingCategory || isCreatingCategory) ? (
                    <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-4">
                      {/* Database Validation Error */}
                      {categoryValidationError && (
                        <div className="bg-slate-900 border-l-4 border-rose-500 rounded-xl p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center shrink-0 border border-rose-500/20">
                              <AlertCircle className="text-rose-500" size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-500">Supabase Database Issue</span>
                                <button 
                                  onClick={() => setCategoryValidationError(null)}
                                  className="text-slate-500 hover:text-white cursor-pointer bg-transparent border-none"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <p className="text-[12px] font-bold text-slate-100 leading-relaxed mb-2">
                                {categoryValidationError.message || categoryValidationError.error}
                              </p>

                              {categoryValidationError.sqlFix && (
                                <div className="mb-3 p-2 bg-slate-950 border border-slate-800 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-bold text-amber-400">Run this SQL in Supabase SQL Editor:</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(categoryValidationError.sqlFix);
                                        showToast("📋 SQL Command Copied!");
                                      }}
                                      className="text-[9px] text-slate-200 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded cursor-pointer border-none flex items-center gap-1"
                                    >
                                      <Copy size={10} />
                                      <span>Copy SQL</span>
                                    </button>
                                  </div>
                                  <code className="text-[10px] text-emerald-400 font-mono block overflow-x-auto p-1 bg-black/40 rounded">
                                    {categoryValidationError.sqlFix}
                                  </code>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-2">
                                <a 
                                  href="https://supabase.com/dashboard/project/mmughpeyyucoetqyrhhw/sql/new" 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1.5 transition-all no-underline shadow-sm"
                                >
                                  <ExternalLink size={11} />
                                  <span>Open Supabase SQL Editor</span>
                                </a>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setCategoryValidationError(null);
                                    const saveBtn = document.querySelector('button[data-save-category="true"]') as HTMLButtonElement;
                                    if (saveBtn) saveBtn.click();
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                                >
                                  <RefreshCw size={11} />
                                  <span>Retry Save</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category Name *</label>
                        <input
                          type="text"
                          value={catFormName}
                          onChange={e => {
                            const val = e.target.value;
                            setCatFormName(val);
                            if (val) {
                              setCatFormShortTitle(val + " Collection");
                            } else {
                              setCatFormShortTitle("");
                            }
                          }}
                          placeholder="e.g. Punjabi Collection"
                          className="w-full text-[12px] font-semibold border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#ff2f7d]"
                        />
                      </div>

                      {/* Small Category Name / Short Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Small Category Name / Short Title *</label>
                        <input
                          type="text"
                          value={catFormShortTitle}
                          onChange={e => setCatFormShortTitle(e.target.value)}
                          placeholder="e.g. Traditional Punjabi"
                          className="w-full text-[12px] font-semibold border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#ff2f7d]"
                        />
                      </div>

                      {/* Category Icon Image */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Category Icon (600 × 600 px)</label>
                        <label className="relative group rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 hover:border-[#ff2f7d] transition-colors w-full h-32 flex flex-col items-center justify-center cursor-pointer">
                          {catFormImage ? (
                            <>
                              <img src={catFormImage} className="w-full h-full object-cover" alt="" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white font-bold text-sm flex items-center gap-2">
                                  <Upload size={18} /> Replace Icon
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <Upload size={24} className="text-slate-300 mx-auto mb-2" />
                              <span className="text-[10px] font-bold text-slate-500">📷 Tap to Upload Category Icon</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const resized = await resizeCategoryAsset(e.target.files[0], 600, 600);
                                setCatFormImage(resized);
                                showToast("Icon updated!");
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>
                      </div>

                      {/* Main Category Banner */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Main Category Banner (1600 × 700 px)</label>
                        <label className="relative group rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 hover:border-[#ff2f7d] transition-colors w-full h-32 flex flex-col items-center justify-center cursor-pointer">
                          {catFormMainBanner ? (
                            <>
                              <img src={catFormMainBanner} className="w-full h-full object-cover" alt="" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white font-bold text-sm flex items-center gap-2">
                                  <Upload size={18} /> Replace Banner
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <Upload size={24} className="text-slate-300 mx-auto mb-2" />
                              <span className="text-[10px] font-bold text-slate-500">🖼️ Tap to Upload Main Banner</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const resized = await resizeCategoryAsset(e.target.files[0], 1600, 700);
                                setCatFormMainBanner(resized);
                                showToast("Main banner updated!");
                              }
                            }} 
                            className="hidden" 
                            id="cat_main_banner_input"
                          />
                        </label>
                      </div>

                      {/* Section Category Banner */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Section Category Banner (1600 × 700 px)</label>
                        <label className="relative group rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 hover:border-[#ff2f7d] transition-colors w-full h-32 flex flex-col items-center justify-center cursor-pointer">
                          {catFormSectionBanner ? (
                            <>
                              <img src={catFormSectionBanner} className="w-full h-full object-cover" alt="" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white font-bold text-sm flex items-center gap-2">
                                  <Upload size={18} /> Replace Banner
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <Upload size={24} className="text-slate-300 mx-auto mb-2" />
                              <span className="text-[10px] font-bold text-slate-500">🖼️ Tap to Upload Section Banner</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                
                                // Validation
                                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                                if (!validTypes.includes(file.type)) {
                                   showToast("❌ Image type must be JPG, PNG, or WEBP");
                                   return;
                                }
                                if (file.size > 10 * 1024 * 1024) {
                                   showToast("❌ Max file size is 10 MB");
                                   return;
                                }

                                const resized = await resizeCategoryAsset(file, 1600, 700);
                                setCatFormSectionBanner(resized);
                                showToast("Section banner updated!");
                              }
                            }} 
                            className="hidden" 
                            id="cat_section_banner_input"
                          />
                        </label>
                      </div>

                      {/* Grid for status & serial number */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Status Toggle */}
                        <div className="space-y-1 p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Status ON/OFF</span>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={catFormStatus}
                              onChange={e => setCatFormStatus(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff2f7d]"></div>
                            <span className="ml-2 text-xs font-bold text-slate-700">{catFormStatus ? 'Active' : 'Inactive'}</span>
                          </label>
                        </div>

                        {/* Serial Number */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Serial Number</label>
                          <input
                            type="number"
                            value={catFormSerialNumber}
                            onChange={e => setCatFormSerialNumber(Number(e.target.value))}
                            className="w-full text-[12px] font-bold border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#ff2f7d]"
                          />
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(null);
                            setIsCreatingCategory(false);
                          }}
                          className="flex-1 py-2.5 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          data-save-category="true"
                          disabled={isLoading}
                          onClick={async () => {
                            if (!catFormName.trim()) {
                              showToast("Please enter a category name!");
                              return;
                            }
                            if (!catFormImage) {
                              showToast("Please upload an icon image!");
                              return;
                            }
                            
                            setIsLoading(true);
                            setCategoryValidationError(null);
                            try {
                              const slug = catFormName.trim().toLowerCase().replace(/\s+/g, "-");

                              // Deep Database Validation for Categories
                              const valRes = await fetch("/api/db/validate-save", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  tableName: "categories",
                                  columns: [
                                    "id", "name", "image", "icon_image", "short_title", 
                                    "main_banner", "section_banner", "status", 
                                    "serial_number", "last_edited", "slug", "updated_at"
                                  ]
                                })
                              });
                              const valData = await valRes.json();
                              
                              if (!valData.valid) {
                                setCategoryValidationError(valData);
                                showToast(`❌ ডাটাবেজ সমস্যা: ${valData.message}`);
                                setIsLoading(false);
                                return;
                              }
                              
                              const categoryPayload = {
                                id: editingCategory?.id,
                                name: catFormName,
                                slug: slug,
                                iconImage: catFormImage,
                                mainBanner: catFormMainBanner,
                                sectionBanner: catFormSectionBanner,
                                status: catFormStatus,
                                serialNumber: catFormSerialNumber,
                                updatedAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                              };
                              const res = await fetch('/api/categories', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(categoryPayload)
                              });
                              if (res.ok) {
                                showToast(`✓ Category Saved Successfully to Database`);
                                setEditingCategory(null);
                                setIsCreatingCategory(false);
                                setCategoryValidationError(null);
                                // Reset fields
                                setCatFormName('');
                                setCatFormImage('');
                                setCatFormMainBanner('');
                                setCatFormSectionBanner('');
                                loadCategoriesFromApi();
                                forceSyncDatabase();
                              } else {
                                const err = await res.json();
                                setCategoryValidationError(err);
                                showToast(`❌ ডাটাবেজে সেভ হয়নি: ${err.message || err.error || 'Failed to save'}`);
                              }
                            } catch (err: any) {
                              console.error(err);
                              showToast("An error occurred during category save.");
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className={`flex-1 py-2.5 text-xs font-black text-white ${isLoading ? 'bg-slate-400' : 'bg-[#ff2f7d] hover:bg-[#e0246a]'} border-none rounded-lg cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-pink-500/10 flex items-center justify-center`}
                        >
                          {isLoading ? <RefreshCw size={14} className="animate-spin mr-2" /> : null}
                          {isLoading ? "Saving..." : "Save Category"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Category List */}
                      <div className="space-y-2.5">
                        {[...categoriesDb].sort((a,b) => (Number(a.serialNumber) || 99) - (Number(b.serialNumber) || 99)).map(cat => {
                          return (
                            <div key={cat.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between hover:shadow-md hover:shadow-slate-100/50 transition-all">
                              <div className="flex items-center gap-3">
                                <img src={cat.iconImage || cat.image} className="w-11 h-11 rounded-lg object-cover bg-slate-50 border border-slate-100" alt="" />
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                                    <span>{cat.name}</span>
                                    {cat.status === false && (
                                      <span className="px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-400 bg-slate-100 rounded">Inactive</span>
                                    )}
                                  </h4>
                                  <p className="text-[9px] text-[#ff2f7d] font-bold">
                                    {cat.shortTitle || "Standard Collection"} • Sl: {cat.serialNumber || 1}
                                  </p>
                                  <p className="text-[8px] text-slate-400 font-medium">
                                    Last edited: {cat.lastEdited || "Jun 12, 2026"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Share Button */}
                                <button
                                  onClick={() => {
                                    const slugName = cat.name.toLowerCase().replace(/\s+/g, '-');
                                    const categoryUrl = `${window.location.origin}/category/${slugName}`;
                                    navigator.clipboard.writeText(categoryUrl);
                                    showToast("🔗 Category path copied to clipboard!");
                                  }}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 border border-slate-100 hover:text-indigo-600 rounded-lg text-slate-400 cursor-pointer transition-all bg-white"
                                  title="Share Link"
                                >
                                  <Share2 size={13} />
                                </button>
                                
                                {/* Edit Button */}
                                <button
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setCatFormName(cat.name);
                                    setCatFormShortTitle(cat.shortTitle || cat.name);
                                    setCatFormImage(cat.image);
                                    setCatFormMainBanner(cat.mainBanner || '');
                                    setCatFormSectionBanner(cat.sectionBanner || '');
                                    setCatFormStatus(cat.status !== false);
                                    setCatFormSerialNumber(cat.serialNumber || 1);
                                  }}
                                  className="px-2.5 py-1.5 text-[9px] font-black text-slate-700 hover:text-[#ff2f7d] bg-slate-50 border border-slate-100 hover:border-[#ff2f7d]/20 rounded-lg cursor-pointer transition-all active:scale-95"
                                >
                                  Edit
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => {
                                    setCategoryToDelete(cat);
                                  }}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-rose-50 border border-slate-100 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-all bg-white pointer-events-auto"
                                  title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Category Button at bottom */}
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingCategory(true);
                            setEditingCategory(null);
                            setCatFormName('');
                            setCatFormShortTitle('');
                            setCatFormImage('');
                            setCatFormMainBanner('');
                            setCatFormSectionBanner('');
                            setCatFormStatus(true);
                            // Auto-increment serial number
                            const maxSerial = categoriesDb.reduce((max, c) => Math.max(max, c.serialNumber || 0), 0);
                            setCatFormSerialNumber(maxSerial + 1);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase text-white bg-[#ff2f7d] hover:bg-[#e0246a] border-none rounded-xl cursor-pointer shadow-md shadow-pink-500/10 transition-all active:scale-[0.98]"
                        >
                          <PlusCircle size={14} />
                          <span>Add Category</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ================= 4. SUBPAGE: ORDERS (REMOVED: Rendered as full page above) ================= */}

              {/* ================= 5. SUBPAGE: CUSTOMERS ================= */}
              {activeSubpage === 'customers' && (
                <CustomersPage />
              )}

              {/* ================= 5.5 SUBPAGE: MESSENGER CENTER ================= */}
              {activeSubpage === 'messenger' && (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 relative z-20 pointer-events-auto">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-[#059669]/10 text-[#059669] p-3 rounded-xl border border-[#059669]/20 flex flex-col items-center justify-center text-center">
                      <b className="text-sm font-black">{messengerAnalytics?.whatsapp || 0}</b>
                      <span className="text-[8px] uppercase tracking-wider font-bold">WhatsApp</span>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                      <b className="text-sm font-black">{messengerAnalytics?.messenger || 0}</b>
                      <span className="text-[8px] uppercase tracking-wider font-bold">Messenger</span>
                    </div>
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 flex flex-col items-center justify-center text-center">
                      <b className="text-sm font-black">{messengerAnalytics?.email || 0}</b>
                      <span className="text-[8px] uppercase tracking-wider font-bold">Email</span>
                    </div>
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl border border-indigo-100 flex flex-col items-center justify-center text-center">
                      <b className="text-sm font-black">{messengerAnalytics?.call || 0}</b>
                      <span className="text-[8px] uppercase tracking-wider font-bold">Calls</span>
                    </div>
                  </div>

                  {/* AI Support Controls */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-[11px] text-slate-800 block uppercase">AI Auto Reply Support</span>
                        <p className="text-[9px] text-slate-400 font-bold">Enable automated instant customer support using Gemini model.</p>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={aiAutoReplyEnabled} 
                          onChange={(e) => {
                            const val = e.target.checked;
                            setAiAutoReplyEnabled(val);
                            saveMessengerSettings(val, faqs);
                          }} 
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-[#059669] relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                        <span className={`text-[10px] font-black tracking-wider ${aiAutoReplyEnabled ? 'text-[#059669]' : 'text-slate-400'}`}>
                          {aiAutoReplyEnabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </label>
                    </div>

                    {/* Custom FAQ Form and List */}
                    <div className="border-t border-slate-200 pt-3.5 space-y-3">
                      <div>
                        <span className="font-extrabold text-[10px] text-slate-700 block uppercase">Custom FAQs & Store QnAs</span>
                        <p className="text-[9px] text-slate-400 font-bold">Train the AI with custom questions & answers to override standard replies.</p>
                      </div>

                      {/* Add FAQ form */}
                      <div className="space-y-2 bg-white p-2.5 rounded-lg border border-slate-150">
                        <div className="space-y-1">
                          <label className="text-[8.5px] text-slate-400 uppercase font-bold block">Question (প্রশ্ন)</label>
                          <input 
                            type="text" 
                            value={newFaqQuestion} 
                            onChange={e => setNewFaqQuestion(e.target.value)} 
                            placeholder="যেমন: আপনাদের শোরুম কোথায়?" 
                            className="w-full h-8 border border-slate-150 rounded px-2 text-xs font-bold focus:outline-none pointer-events-auto" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8.5px] text-slate-400 uppercase font-bold block">Answer (উত্তর)</label>
                          <textarea 
                            value={newFaqAnswer} 
                            onChange={e => setNewFaqAnswer(e.target.value)} 
                            placeholder="যেমন: আমাদের শো-রুম ঢাকার ধানমন্ডিতে অবস্থিত।" 
                            rows={2}
                            className="w-full border border-slate-150 rounded p-2 text-xs font-bold focus:outline-none resize-none pointer-events-auto" 
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
                              showToast("Please enter both question and answer!");
                              return;
                            }
                            const updated = [...faqs, { id: 'faq_' + Date.now(), question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }];
                            setFaqs(updated);
                            saveMessengerSettings(aiAutoReplyEnabled, updated);
                            setNewFaqQuestion("");
                            setNewFaqAnswer("");
                          }}
                          className="w-full py-1.5 bg-[#059669] hover:bg-[#047857] border-none font-bold text-white rounded text-[10px] cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1"
                        >
                          <Plus size={12} />
                          <span>Add Custom Q&A</span>
                        </button>
                      </div>

                      {/* FAQ List */}
                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-0.5 no-scrollbar">
                        {faqs.length === 0 ? (
                          <div className="text-center p-3 text-[9px] text-slate-400 font-bold bg-white rounded-lg border border-slate-100">No custom FAQs defined yet</div>
                        ) : (
                          faqs.map((f, i) => (
                            <div key={f.id || i} className="bg-white border border-slate-150 rounded-lg p-2.5 flex items-start justify-between gap-3 text-xs">
                              <div className="flex-1 space-y-1">
                                <b className="text-[10px] text-slate-800 block font-black leading-tight">Q: {f.question}</b>
                                <span className="text-[9px] text-slate-500 block leading-normal">A: {f.answer}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  const updated = faqs.filter((_, idx) => idx !== i);
                                  setFaqs(updated);
                                  saveMessengerSettings(aiAutoReplyEnabled, updated);
                                }} 
                                className="p-1 text-[#ff2f7d] hover:bg-rose-50 rounded cursor-pointer bg-transparent border-none shrink-0"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-extrabold text-[11px] text-slate-800 block uppercase">Real-time Conversations</span>
                    <div className="space-y-3">
                      {messengerMessages.length === 0 ? (
                        <div className="text-center p-6 text-slate-400 text-xs bg-white rounded-xl border border-slate-100">No conversations yet</div>
                      ) : (
                        [...messengerMessages].reverse().map(msg => (
                          <div key={msg.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <User size={16} className="text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <b className="text-[11px] text-slate-800 block leading-tight">{msg.customerName}</b>
                                  <span className="text-[9px] text-slate-500 block">{msg.customerEmail}</span>
                                </div>
                                <span className="text-[8px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              
                              <div className={`mt-2 p-2 rounded-lg text-[10px] ${msg.replyBy === 'customer' ? 'bg-indigo-50 text-indigo-900' : (msg.replyBy === 'ai' ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-700')}`}>
                                <b className="uppercase text-[8px] tracking-wider block mb-0.5 opacity-70 font-black">
                                  {msg.replyBy === 'customer' ? 'Customer Message' : (msg.replyBy === 'ai' ? '✨ NaimShop AI' : '👔 Moderator')}
                                </b>
                                {msg.message}
                                {msg.replyBy === 'ai' && msg.matchedSource && (
                                  <div className="mt-1 flex items-center gap-1 opacity-70">
                                    <span className="text-[8px] font-bold uppercase">Source:</span>
                                    <span className="text-[9px] font-black">{msg.matchedSource}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 6. SUBPAGE: BANNER MANAGER ================= */}
              {activeSubpage === 'banners' && <BannerManager />}
              {/* Old banner interface removed */}
              {/* ================= 7. SUBPAGE: OFFER MANAGER ================= */}
              {activeSubpage === 'offers' && (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  
                  {/* Coupon section */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <span className="font-extrabold text-[11px] text-[#ff2f7d] block uppercase">Create Active Coupons</span>
                    <form onSubmit={handleAddCouponObj} className="space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[8px] text-slate-400 uppercase block">Coupon Code</label>
                          <input required value={newCouponCode} onChange={e=>setNewCouponCode(e.target.value)} type="text" placeholder="E.g. EID30" className="w-full h-9 border border-slate-150 rounded px-2 font-bold uppercase" />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-400 uppercase block">Discount Value (৳)</label>
                          <input value={newCouponValue} onChange={e=>setNewCouponValue(e.target.value)} type="number" className="w-full h-9 border border-slate-150 rounded px-2 font-bold" />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-400 uppercase block">Min Cart (৳)</label>
                          <input value={newCouponMin} onChange={e=>setNewCouponMin(e.target.value)} type="number" className="w-full h-9 border border-slate-150 rounded px-2 font-bold" />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-2 bg-indigo-600 border-none font-bold text-white rounded text-[10px] cursor-pointer">Add Coupon Card</button>
                    </form>

                    <div className="space-y-1.5 pt-2">
                      <span className="text-[9px] text-slate-400 font-extrabold block">ACTIVE PROMO CATALOG:</span>
                      {coupons.map((c, i) => (
                        <div key={i} className="bg-white border border-slate-150 rounded-lg p-2 flex items-center justify-between text-xs font-bold leading-normal">
                          <div>
                            <span className="text-slate-800 text-[11px] bg-indigo-50 px-1.5 py-0.5 rounded mr-1.5 font-mono">{c.code}</span>
                            <span className="text-slate-450 text-[10px]">Flat code: ৳{c.value} off</span>
                          </div>
                          <button onClick={()=>handleDeleteCouponObj(c.code)} className="p-1 px-1.5 text-[#ff2f7d] cursor-pointer bg-transparent border-none">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ================= 8. SUBPAGE: PAYMENT SETTINGS ================= */}
              {activeSubpage === 'payments' && (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {selectedAccountIdx !== null && selectedMethodKey !== null ? (
                    <div className="space-y-4">
                      {/* Account Edit View */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <button 
                          type="button"
                          onClick={() => setSelectedAccountIdx(null)}
                          className="flex items-center gap-1 text-[10px] font-black text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          <ArrowLeft size={13} />
                          <span>Back to Accounts</span>
                        </button>
                        <h3 className="text-xs font-black uppercase text-[#ff2f7d] tracking-widest">
                          Edit {selectedMethodKey} Account
                        </h3>
                      </div>

                      <div className="bg-white p-4 border border-slate-100 rounded-xl space-y-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Active / Hidden Status */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Status</label>
                            <div className="flex items-center gap-4 py-1">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={editAccActive} onChange={e => setEditAccActive(e.target.checked)} className="sr-only peer" />
                                <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full"></div>
                                <span className={`text-[10px] font-bold ${editAccActive ? 'text-emerald-600' : 'text-slate-400'}`}>{editAccActive ? 'ON' : 'OFF'}</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={editAccHidden} onChange={e => setEditAccHidden(e.target.checked)} className="sr-only peer" />
                                <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:bg-amber-500 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full"></div>
                                <span className={`text-[10px] font-bold ${editAccHidden ? 'text-amber-600' : 'text-slate-400'}`}>{editAccHidden ? 'Hidden' : 'Visible'}</span>
                              </label>
                            </div>
                          </div>

                          {/* Type */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Account Type</label>
                            <input
                              type="text"
                              value={editAccType}
                              onChange={e => setEditAccType(e.target.value)}
                              placeholder="e.g. Personal, Merchant"
                              className="w-full text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#ff2f7d]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Account Name */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Account Name</label>
                            <input
                              type="text"
                              value={editAccName}
                              onChange={e => setEditAccName(e.target.value)}
                              placeholder="e.g. IYABD Fashion"
                              className="w-full text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#ff2f7d]"
                            />
                          </div>

                          {/* Account Number */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Number / Coordinate</label>
                            <input
                              type="text"
                              value={editAccNumber}
                              onChange={e => setEditAccNumber(e.target.value)}
                              placeholder="e.g. 017xxxxxxxx"
                              className="w-full text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#ff2f7d]"
                            />
                          </div>
                        </div>

                        {/* Instruction */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Custom Instruction</label>
                          <textarea
                            rows={2}
                            value={editAccInstruction}
                            onChange={e => setEditAccInstruction(e.target.value)}
                            placeholder="e.g. পেমেন্ট করার পর Transaction ID দিন।"
                            className="w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#ff2f7d] resize-none"
                          />
                        </div>

                        {/* Image Uploads */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Custom Logo</label>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded flex items-center justify-center overflow-hidden">
                                {editAccLogo ? <img src={editAccLogo} className="w-full h-full object-contain" alt="" /> : <ImageIcon size={20} className="text-slate-300" />}
                              </div>
                              <label className="flex-1 text-[8px] font-bold text-center border-2 border-dashed border-slate-200 rounded-lg p-2.5 cursor-pointer hover:border-[#ff2f7d]">
                                Upload Logo
                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    const resized = await resizePaymentAsset(e.target.files[0], 120, 120);
                                    setEditAccLogo(resized);
                                  }
                                }} />
                              </label>
                              {editAccLogo && <button onClick={() => setEditAccLogo('')} className="p-1 text-rose-500 bg-rose-50 rounded"><X size={12} /></button>}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">QR Code</label>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded flex items-center justify-center overflow-hidden">
                                {editAccQr ? <img src={editAccQr} className="w-full h-full object-contain" alt="" /> : <RefreshCw size={20} className="text-slate-300" />}
                              </div>
                              <label className="flex-1 text-[8px] font-bold text-center border-2 border-dashed border-slate-200 rounded-lg p-2.5 cursor-pointer hover:border-[#ff2f7d]">
                                Upload QR
                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    const resized = await resizePaymentAsset(e.target.files[0], 300, 300);
                                    setEditAccQr(resized);
                                  }
                                }} />
                              </label>
                              {editAccQr && <button onClick={() => setEditAccQr('')} className="p-1 text-rose-500 bg-rose-50 rounded"><X size={12} /></button>}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                           <button onClick={() => handleRemoveAccount(selectedMethodKey, selectedAccountIdx)} className="px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-lg text-[10px] hover:bg-rose-100 transition-colors">Delete Account</button>
                           <button onClick={handleSaveActiveAccount} className="flex-1 py-2 bg-[#ff2f7d] text-white font-black rounded-lg text-[11px] shadow-md hover:opacity-90 active:scale-95 transition-all">Save Account Changes</button>
                        </div>
                      </div>
                    </div>
                  ) : selectedMethodKey !== null ? (
                    <div className="space-y-4">
                      {/* Method Detailed List */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <button 
                          type="button"
                          onClick={() => setSelectedMethodKey(null)}
                          className="flex items-center gap-1 text-[10px] font-black text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          <ArrowLeft size={13} />
                          <span>Back to Gates</span>
                        </button>
                        <h3 className="text-xs font-black uppercase text-[#ff2f7d] tracking-widest">
                          {paymentConfigs[selectedMethodKey].label} Management
                        </h3>
                      </div>

                      {/* Gateway Main Settings (Logo/Label) */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center gap-3">
                         <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden relative shrink-0">
                            <img src={paymentConfigs[selectedMethodKey].logo || getMethodLogo(selectedMethodKey)} className="w-full h-full object-contain p-1" alt="" />
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                               if (e.target.files?.[0]) {
                                 const resized = await resizePaymentAsset(e.target.files[0], 120, 120);
                                 setPaymentConfigs({...paymentConfigs, [selectedMethodKey]: {...paymentConfigs[selectedMethodKey], logo: resized}});
                               }
                            }} />
                         </div>
                         <div className="flex-1">
                            <p className="text-[8px] font-black text-[#ff2f7d] uppercase tracking-widest mb-1">Official Gateway Logo</p>
                            <p className="text-[10px] font-bold text-slate-500 leading-tight">Click the icon to change the official {paymentConfigs[selectedMethodKey].label} brand logo for your store.</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                        {paymentConfigs[selectedMethodKey].accounts.map((acc: any, idx: number) => (
                          <div key={acc.id} className="bg-white p-3 border border-slate-150 rounded-xl flex items-center justify-between shadow-sm hover:border-[#ff2f7d]/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-50 rounded border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                <img src={acc.logo || getMethodLogo(selectedMethodKey)} className="w-full h-full object-contain" alt="" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-slate-800">{acc.type}: {acc.name || 'Untitled'}</span>
                                  {acc.hidden && <span className="text-[8px] bg-amber-50 text-amber-500 px-1 rounded font-bold">Hidden</span>}
                                  {!acc.active && <span className="text-[8px] bg-rose-50 text-rose-500 px-1 rounded font-bold">Offline</span>}
                                </div>
                                <div className="text-[9px] font-black text-slate-400 mt-0.5">{acc.number}</div>
                              </div>
                            </div>
                            <button onClick={() => openAccountDetail(selectedMethodKey, idx)} className="p-1.5 text-slate-400 hover:text-[#ff2f7d] transition-colors"><Settings size={16} /></button>
                          </div>
                        ))}

                        <button 
                          onClick={() => handleAddAnotherAccount(selectedMethodKey)}
                          className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-[#ff2f7d] rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 hover:text-[#ff2f7d] transition-all bg-slate-50/50"
                        >
                          <PlusCircle size={15} />
                          <span>Add Another Account</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Main Gates List */}
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] text-slate-500 block font-bold leading-relaxed mb-1">
                          Control checkout sequence, visibility, and account clusters:
                        </span>
                        <button 
                          onClick={() => setShowCheckoutPreview(true)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-150 rounded-lg text-[10px] font-black flex items-center gap-1.5 hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          <Eye size={13} />
                          Preview Checkout
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {Object.keys(paymentConfigs).sort((a,b) => paymentConfigs[a].order - paymentConfigs[b].order).map((key) => {
                          const method = paymentConfigs[key];
                          const activeAccCount = method.accounts.filter((a: any) => a.active && !a.hidden).length;
                          return (
                            <div 
                              key={key} 
                              className={`p-3 border rounded-xl flex items-center justify-between transition-all group ${method.hidden ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-150 shadow-sm hover:border-[#ff2f7d]/40'}`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Order Controls */}
                                <div className="flex flex-col gap-1 pr-1 border-r border-slate-100">
                                  <button onClick={() => handleUpdatePaymentMethodOrder(key, 'up')} className="text-slate-300 hover:text-[#ff2f7d]"><ArrowUp size={12} /></button>
                                  <button onClick={() => handleUpdatePaymentMethodOrder(key, 'down')} className="text-slate-300 hover:text-[#ff2f7d]"><ArrowDown size={12} /></button>
                                </div>
                                <div onClick={() => setSelectedMethodKey(key)} className="flex items-center gap-2.5 cursor-pointer">
                                  <img src={getMethodLogo(key)} className="w-9 h-9 rounded p-0.5 border border-slate-100 bg-slate-50" alt="" />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-black text-slate-800">{method.label}</span>
                                      {method.hidden && <span className="text-[8px] font-black uppercase px-1 bg-slate-200 text-slate-500 rounded">Temporarily Hidden</span>}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-400">{activeAccCount} Active Account{activeAccCount !== 1 ? 's' : ''}</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <button onClick={() => handleToggleMethodHide(key)} className={`p-1.5 rounded-lg transition-all ${method.hidden ? 'text-amber-500 bg-amber-50' : 'text-slate-400 bg-slate-50 hover:text-amber-500'}`} title="Temporarily Hide">
                                  <ShieldAlert size={16} />
                                </button>
                                <button onClick={() => setSelectedMethodKey(key)} className="p-1.5 text-slate-400 hover:text-[#ff2f7d] bg-slate-50 rounded-lg group-hover:bg-pink-50 transition-all">
                                  <ChevronRight size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                         <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                           <BadgeInfo size={14} />
                           <span className="text-[9px] font-black uppercase tracking-wider">Multi-Gate Support</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                           You can now add multiple bKash, Nagad, or Bank accounts. The sequence above determines how they appear to customers during checkout.
                         </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= PAYMENT CHECKOUT PREVIEW MODAL ================= */}
              <AnimatePresence>
                {showCheckoutPreview && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                      className="bg-slate-100 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative border-4 border-white"
                    >
                      <button onClick={() => setShowCheckoutPreview(false)} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md">
                        <X size={20} />
                      </button>

                      {/* Mock Device Status */}
                      <div className="bg-black text-white h-10 px-6 flex items-center justify-between text-[10px] font-bold">
                        <span>Checkout Preview (Customer View)</span>
                        <div className="flex items-center gap-1.5">
                           <span>9:41</span>
                           <Activity size={10} />
                        </div>
                      </div>

                      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto bg-white/50">
                         <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Select Payment Method</h4>
                           <div className="grid grid-cols-2 gap-2">
                              {/* Simple preview logic matching Cart.tsx */}
                              {Object.keys(paymentConfigs).sort((a,b) => paymentConfigs[a].order - paymentConfigs[b].order).map(key => {
                                 const m = paymentConfigs[key];
                                 if (m.hidden) return null;
                                 return (
                                   <div key={key} className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-2xl bg-slate-50/50">
                                      <img src={getMethodLogo(key)} className="w-7 h-7 rounded p-0.5 bg-white border border-slate-100" />
                                      <span className="text-[10px] font-black text-slate-800 tracking-tight">{m.label}</span>
                                   </div>
                                 );
                              })}
                           </div>
                           
                           <div className="pt-2">
                             <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                  <img src={getMethodLogo('bkash')} className="w-6 h-6" />
                                  <span className="text-[11px] font-black text-[#ff2f7d]">bKash Instruction:</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400">Account:</span>
                                    <span className="text-[11px] font-black text-slate-800">01712345678</span>
                                  </div>
                                  <button className="w-full py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-50">
                                    <Copy size={12} />
                                    <span>Copy Number</span>
                                  </button>
                                </div>
                                <div className="text-[9px] font-medium text-slate-500 italic leading-relaxed text-center">
                                  পেমেন্ট করার পর Transaction ID দিন।
                                </div>
                             </div>
                           </div>
                         </div>

                         <div className="bg-[#ff2f7d] text-white p-3.5 rounded-[24px] text-center font-black text-xs uppercase tracking-widest shadow-lg shadow-pink-200">
                           Confirm Purchase Order
                         </div>
                      </div>
                      
                      <div className="bg-white h-6 flex items-center justify-center">
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full"></div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ================= 9. SUBPAGE: COURIER / DELIVERY ================= */}
              {activeSubpage === 'courier' && (
                <div className="space-y-4 animate-fade-in pb-20">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          if (editingCourierKey) setEditingCourierKey(null);
                          else setActiveSubpage(null);
                        }}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="text-sm font-black text-slate-850 uppercase">
                        {editingCourierKey ? `Edit ${editingCourierKey}` : 'Courier / Delivery Manager'}
                      </h3>
                    </div>
                  </div>

                  {!editingCourierKey ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1 mb-4">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Shipping Policy</span>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[8px] text-indigo-400 uppercase font-black">Inside Dhaka</label>
                            <input value={deliveryInside} onChange={e=>setDeliveryInside(e.target.value)} type="number" className="w-full h-8 border border-indigo-150 rounded-lg px-2 text-xs font-bold" />
                          </div>
                          <div>
                            <label className="text-[8px] text-indigo-400 uppercase font-black">Outside Dhaka</label>
                            <input value={deliveryOutside} onChange={e=>setDeliveryOutside(e.target.value)} type="number" className="w-full h-8 border border-indigo-150 rounded-lg px-2 text-xs font-bold" />
                          </div>
                        </div>
                        <button onClick={handleSaveDeliveryOpts} className="w-full py-1.5 mt-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase">Update Base Rates</button>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {Object.keys(couriers).map(key => {
                          const c = couriers[key];
                          return (
                            <div key={key} className="courier-card shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center gap-3">
                                {c.logo ? (
                                  <img src={c.logo} className="courier-logo rounded" alt="" />
                                ) : (
                                  <div className="courier-logo bg-slate-100 rounded flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                    Logo
                                  </div>
                                )}
                                <div>
                                  <div className="courier-title text-slate-800">{c.name}</div>
                                  <div className="courier-sub">Inside: ৳{c.insideDhaka} • Outside: ৳{c.outsideDhaka}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end gap-1">
                                  <label className="relative inline-flex items-center cursor-pointer scale-75 origin-right">
                                    <input
                                      type="checkbox"
                                      checked={c.active}
                                      onChange={() => {
                                        const updated = { ...couriers, [key]: { ...c, active: !c.active } };
                                        setCouriers(updated);
                                        localStorage.setItem('naimshop_admin_courier_details', JSON.stringify(updated));
                                        showToast(`${key} is now ${!c.active ? 'Active' : 'Inactive'}`);
                                      }}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff2f7d]"></div>
                                  </label>
                                  <span className={`text-[8px] font-black uppercase ${c.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {c.active ? 'Active' : 'Offline'}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => setEditingCourierKey(key)}
                                  className="h-8 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all"
                                >
                                  Edit &gt;
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-fade-in mb-10">
                      {/* Edit Header / Logo + Name */}
                      <div className="p-5 bg-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-white rounded-xl border-4 border-slate-800 flex items-center justify-center overflow-hidden relative group">
                              {couriers[editingCourierKey].logo ? (
                                <img src={couriers[editingCourierKey].logo} className="w-full h-full object-contain" alt="" />
                              ) : (
                                <Truck size={20} className="text-slate-300" />
                              )}
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const dataUrl = await resizePaymentAsset(file, 200, 200);
                                    setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], logo: dataUrl}});
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                              />
                           </div>
                           <div className="space-y-0.5">
                             <input
                               type="text"
                               value={couriers[editingCourierKey].name}
                               onChange={e => setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], name: e.target.value}})}
                               className="bg-transparent border-none text-white font-black text-base outline-none focus:ring-0 p-0 w-full"
                               placeholder="Courier Name..."
                             />
                             <p className="text-[9px] text-[#ff2f7d] font-black uppercase tracking-widest">Configuration Active</p>
                           </div>
                        </div>
                        
                        {/* ON/OFF Toggle */}
                        <div className="flex flex-col items-end gap-1">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={couriers[editingCourierKey].active}
                              onChange={() => setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], active: !couriers[editingCourierKey].active}})}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                          <span className={`text-[8px] font-black uppercase ${couriers[editingCourierKey].active ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {couriers[editingCourierKey].active ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-6">
                        {/* Rate Settings */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Banknote size={12} className="text-[#ff2f7d]" /> Rate & Charge Settings
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Inside Dhaka</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                                <input value={couriers[editingCourierKey].insideDhaka || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], insideDhaka: e.target.value}})} type="text" className="w-full h-9 pl-5 pr-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-[#ff2f7d]" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Outside Dhaka</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                                <input value={couriers[editingCourierKey].outsideDhaka || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], outsideDhaka: e.target.value}})} type="text" className="w-full h-9 pl-5 pr-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-[#ff2f7d]" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">COD Charge</label>
                              <input value={couriers[editingCourierKey].codCharge || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], codCharge: e.target.value}})} type="text" className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-[#ff2f7d]" placeholder="e.g. 1%" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Return Fee</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                                <input value={couriers[editingCourierKey].returnCharge || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], returnCharge: e.target.value}})} type="text" className="w-full h-9 pl-5 pr-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-[#ff2f7d]" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pickup Settings */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Grid size={12} className="text-[#ff2f7d]" /> Pickup & Warehouse
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Pickup Address</label>
                               <textarea
                                 rows={2}
                                 value={couriers[editingCourierKey].pickupAddress || ''}
                                 onChange={e => setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], pickupAddress: e.target.value}})}
                                 className="w-full text-xs font-bold border border-slate-200 bg-slate-50 rounded-xl p-2.5 outline-none focus:border-[#ff2f7d] resize-none"
                                 placeholder="Full pickup location address..."
                               />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase">Pickup Phone</label>
                                  <input value={couriers[editingCourierKey].pickupPhone || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], pickupPhone: e.target.value}})} type="text" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-[#ff2f7d]" placeholder="017..." />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase">Support Phone</label>
                                  <input value={couriers[editingCourierKey].supportPhone || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], supportPhone: e.target.value}})} type="text" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-[#ff2f7d]" placeholder="019..." />
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* API / Tracking Settings */}
                        <div className="space-y-3 pt-2 border-t border-slate-50">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Activity size={12} className="text-[#ff2f7d]" /> API & Tracking Console
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">API Base URL</label>
                              <input value={couriers[editingCourierKey].apiUrl || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], apiUrl: e.target.value}})} type="text" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ff2f7d]" placeholder="https://api.courier.com/v1" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Merchant ID</label>
                              <input value={couriers[editingCourierKey].merchantId || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], merchantId: e.target.value}})} type="text" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ff2f7d]" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Store ID</label>
                              <input value={couriers[editingCourierKey].storeId || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], storeId: e.target.value}})} type="text" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ff2f7d]" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">API Key / Token</label>
                              <input value={couriers[editingCourierKey].apiKey || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], apiKey: e.target.value}})} type="password" title={couriers[editingCourierKey].apiKey} className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ff2f7d]" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Secret Token</label>
                              <input value={couriers[editingCourierKey].secretToken || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], secretToken: e.target.value}})} type="password" title={couriers[editingCourierKey].secretToken} className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ff2f7d]" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Webhook URL</label>
                              <input value={couriers[editingCourierKey].webhookUrl || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], webhookUrl: e.target.value}})} type="text" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ff2f7d]" placeholder="https://yoursite.com/webhook" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Tracking Page URL</label>
                              <input value={couriers[editingCourierKey].trackingUrl || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], trackingUrl: e.target.value}})} type="text" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ff2f7d]" placeholder="https://courier.com/track/{{tracking_id}}" />
                            </div>
                          </div>
                        </div>

                        {/* Sticker Template Section */}
                        <div className="space-y-3 pt-2 border-t border-slate-50">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Printer size={12} className="text-[#ff2f7d]" /> Sticker & Template Settings
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Original Sticker Template / API Sticker URL</label>
                               <div className="relative group h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-2 bg-slate-50 overflow-hidden">
                                 {couriers[editingCourierKey].stickerTemplate ? (
                                   <div className="w-full h-full relative">
                                     <img src={couriers[editingCourierKey].stickerTemplate} className="w-full h-full object-contain" alt="" />
                                     <button onClick={() => setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], stickerTemplate: ''}})} className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <X size={12} />
                                     </button>
                                   </div>
                                 ) : (
                                   <div className="text-center group-hover:scale-110 transition-transform">
                                      <Upload size={18} className="text-slate-300 mx-auto" />
                                      <span className="text-[8px] font-black text-slate-400 block mt-1 uppercase">Upload Image Template</span>
                                   </div>
                                 )}
                                 <input 
                                   type="file" 
                                   accept="image/*"
                                   onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const dataUrl = await resizeCategoryAsset(file, 600, 900);
                                        setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], stickerTemplate: dataUrl}});
                                      }
                                   }}
                                   className="absolute inset-0 opacity-0 cursor-pointer" 
                                 />
                               </div>
                               <input 
                                 value={couriers[editingCourierKey].apiStickerUrl || ''} 
                                 onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], apiStickerUrl: e.target.value}})} 
                                 type="text" 
                                 className="w-full h-8 px-3 mt-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-[#ff2f7d]" 
                                 placeholder="OR Paste API Sticker Base URL..." 
                               />
                            </div>
                            <div className="space-y-2">
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase">Print Format</label>
                                  <select 
                                    value={couriers[editingCourierKey].stickerFormat || 'local'} 
                                    onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], stickerFormat: e.target.value}})}
                                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl px-2 text-xs font-black outline-none"
                                  >
                                    <option value="local">Local Generated (Standard)</option>
                                    <option value="image_template">Original Image Template Overlay</option>
                                    <option value="api_url">External API URL (Dynamic)</option>
                                  </select>
                               </div>
                               <p className="text-[10px] text-slate-400 font-bold leading-tight uppercase italic mt-2">
                                 Select "API URL" if the courier provides a direct link to the sticker. "Image Template" will overlay order text on your uploaded background.
                               </p>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Info size={12} className="text-[#ff2f7d]" /> Miscellaneous Settings
                           </h4>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Default Weight (KG)</label>
                               <input value={couriers[editingCourierKey].defaultWeight || '0.5'} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], defaultWeight: e.target.value}})} type="text" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ff2f7d]" />
                             </div>
                             <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Special Note</label>
                               <input value={couriers[editingCourierKey].note || ''} onChange={e=>setCouriers({...couriers, [editingCourierKey]: {...couriers[editingCourierKey], note: e.target.value}})} type="text" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#ff2f7d]" placeholder="e.g. Daily 3PM pickup" />
                             </div>
                           </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                          <button 
                            type="button"
                            onClick={() => setEditingCourierKey(null)}
                            className="flex-1 h-12 bg-slate-50 text-slate-400 hover:bg-slate-100 font-extrabold text-sm border border-slate-100 cursor-pointer rounded-2xl transition-all"
                          >
                            Discard
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleSaveCourierDetails(editingCourierKey, couriers[editingCourierKey])}
                            className="flex-[2] h-12 bg-[#ff2f7d] hover:bg-pink-600 text-white font-black text-sm border-none cursor-pointer rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <Save size={18} /> Save Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= 10. SUBPAGE: REVIEWS ================= */}
              {activeSubpage === 'reviews' && (
                <div className="space-y-4">
                  {/* Reviews Configuration Panel */}
                  <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-3.5 shadow-sm">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                      <Star size={14} className="text-pink-500 fill-pink-500" />
                      <span>Review Settings Configuration</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <label className="flex items-center gap-2 font-bold text-slate-650 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={reviewSettings.enabled !== false}
                          onChange={(e) => handleSaveReviewSettings({ ...reviewSettings, enabled: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-[#ff2f7d] focus:ring-[#ff2f7d]"
                        />
                        <div>
                          <p className="font-extrabold text-slate-800">Enable Customer Reviews</p>
                          <p className="text-[10px] text-slate-450 font-bold">Whether customers can submit reviews</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 font-bold text-slate-650 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={reviewSettings.adminApproval === true}
                          onChange={(e) => handleSaveReviewSettings({ ...reviewSettings, adminApproval: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-[#ff2f7d] focus:ring-[#ff2f7d]"
                        />
                        <div>
                          <p className="font-extrabold text-slate-800">Admin Approval Required</p>
                          <p className="text-[10px] text-slate-450 font-bold">Reviews must be approved before showing</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 font-bold text-slate-650 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={reviewSettings.verifiedPurchaseOnly === true}
                          onChange={(e) => handleSaveReviewSettings({ ...reviewSettings, verifiedPurchaseOnly: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-[#ff2f7d] focus:ring-[#ff2f7d]"
                        />
                        <div>
                          <p className="font-extrabold text-slate-800">Verified Purchase Only</p>
                          <p className="text-[10px] text-slate-450 font-bold">Only customers with actual orders can review</p>
                        </div>
                      </label>

                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-800 text-[11px]">Media Upload Options</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 font-bold text-slate-650 cursor-pointer text-[11px]">
                            <input 
                              type="checkbox"
                              checked={reviewSettings.cameraEnabled !== false}
                              onChange={(e) => handleSaveReviewSettings({ ...reviewSettings, cameraEnabled: e.target.checked })}
                              className="w-3.5 h-3.5 text-[#ff2f7d] focus:ring-[#ff2f7d]"
                            />
                            <span>Camera</span>
                          </label>
                          <label className="flex items-center gap-1.5 font-bold text-slate-650 cursor-pointer text-[11px]">
                            <input 
                              type="checkbox"
                              checked={reviewSettings.galleryEnabled !== false}
                              onChange={(e) => handleSaveReviewSettings({ ...reviewSettings, galleryEnabled: e.target.checked })}
                              className="w-3.5 h-3.5 text-[#ff2f7d] focus:ring-[#ff2f7d]"
                            />
                            <span>Gallery</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between col-span-1 sm:col-span-2 pt-2 border-t border-slate-50">
                        <span className="font-bold text-slate-650">Maximum Images Allowed:</span>
                        <select
                          value={reviewSettings.maxImages || 2}
                          onChange={(e) => handleSaveReviewSettings({ ...reviewSettings, maxImages: Number(e.target.value) })}
                          className="h-8 border border-slate-200 bg-white rounded-lg px-2 text-xs font-black focus:outline-none focus:border-[#ff2f7d]"
                        >
                          <option value={1}>1 Image</option>
                          <option value={2}>2 Images</option>
                          <option value={3}>3 Images</option>
                          <option value={4}>4 Images</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Reviews Moderation List */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-450 block font-bold leading-normal">Moderate client product feedback logs. Approved reviews display, pending ones remain hidden:</span>
                    
                    <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                      {reviews.length > 0 ? (
                        reviews.map((rev) => {
                          const statusColor = rev.status === 'Approved' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : rev.status === 'Rejected' 
                              ? 'bg-rose-50 text-rose-600' 
                              : 'bg-amber-50 text-amber-600';

                          return (
                            <div key={rev.id} className="p-3.5 border border-slate-100 rounded-xl bg-white shadow-sm space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <div>
                                  <b className="text-slate-800 font-extrabold block text-[11px]">{rev.customerName || 'Anonymous'}</b>
                                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Product: {rev.productName || rev.productId}</span>
                                </div>
                                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${statusColor}`}>
                                  {rev.status || 'Pending validation'}
                                </span>
                              </div>
                              <p className="text-slate-600 italic leading-relaxed text-[10.5px]">"{rev.text}"</p>
                              
                              {rev.images && rev.images.length > 0 && (
                                <div className="flex gap-1.5 pt-1">
                                  {rev.images.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block relative">
                                      <img 
                                        src={img} 
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-sm" 
                                        alt="Uploaded attach" 
                                      />
                                    </a>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                                <span className="flex items-center gap-0.5 text-amber-500">
                                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                    <Star key={i} size={10} fill="currentColor" />
                                  ))}
                                </span>
                                <span>Date: <b>{rev.date || 'N/A'}</b></span>
                              </div>

                              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/40">
                                {rev.status !== 'Approved' && (
                                  <button
                                    onClick={() => handleApproveLiveReview(rev.id)}
                                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold border-none text-[8.5px] rounded-md cursor-pointer transition-colors"
                                  >
                                    Approve
                                  </button>
                                )}
                                {rev.status !== 'Rejected' && (
                                  <button
                                    onClick={() => handleRejectLiveReview(rev.id)}
                                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold border-none text-[8.5px] rounded-md cursor-pointer transition-colors"
                                  >
                                    Reject
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteLiveReview(rev.id)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#ff2f7d] font-bold border-none text-[8.5px] rounded-md cursor-pointer transition-colors"
                                >
                                  Delete Review
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center py-6 text-slate-400 text-[10.5px] font-bold">No customer reviews logs found in database.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 11. SUBPAGE: LIVE CHAT ================= */}
              {activeSubpage === 'chat' && (
                <div className="space-y-3 text-xs font-semibold">
                  <p className="text-[10px] text-slate-450 leading-normal">Simulated administrative reply engine widget. Open messages below support thread:</p>
                  
                  <div className="p-3 bg-slate-50 border border-slate-100 space-y-2 rounded-xl">
                    <span className="text-[8.5px] font-black text-slate-400 block uppercase">Support Chat Log Profile</span>
                    <div className="p-2 border border-slate-100 bg-white rounded-lg text-slate-650 space-y-1 text-[10px]">
                      <b className="text-slate-800 font-extrabold text-[11px] block">Client: Sumaiya Khan (sumaiya@gmail.com)</b>
                      <span className="block italic">"Assalamu Alaikum Naimshop. Amar ORD-3401 item delivery asbe kobe?"</span>
                      <span className="text-emerald-500 text-[8.5px] block font-black">● Live waiting ticket</span>
                    </div>

                    <div className="flex gap-2.5 mt-2.5">
                      <input type="text" placeholder="Type official administrative reply message..." className="flex-1 text-[11px] h-9 border border-slate-150 px-2 rounded-lg bg-white outline-none font-bold" />
                      <button onClick={()=>showToast('Support ticket reply submitted!')} className="px-3 bg-indigo-600 text-white border-none font-extrabold text-[10px] rounded-lg cursor-pointer">Submit Reply</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 12. SUBPAGE: TRACKING & ANALYTICS BAR ================= */}
              {activeSubpage === 'tracking' && (
                <div className="space-y-3 pb-8">
                  <span className="text-[10.5px] text-slate-500 block font-bold leading-relaxed mb-3">
                    Setup pixel and custom scripts. Toggle ON to activate for your storefront.
                  </span>

                  {editingTrackingKey ? (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-800 font-extrabold text-[13px]">
                          <button onClick={() => setEditingTrackingKey(null)} className="flex items-center gap-1 pl-1 pr-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold mr-1 border border-slate-200 shadow-sm transition-all">
                            <span className="text-[14px] leading-none mb-[1px]">&larr;</span> Back
                          </button>
                          <img 
                            src={trackingConfigs[editingTrackingKey].logo} 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logos/analytics/default.svg' }}
                            className="w-5 h-5 object-contain block" 
                            alt="logo" 
                          />
                          {trackingConfigs[editingTrackingKey].label}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                           <label className="text-[11px] font-bold text-slate-700">Status</label>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" checked={trackingConfigs[editingTrackingKey].active} onChange={(e) => handleSaveTrackingConfig(editingTrackingKey, { active: e.target.checked })} />
                             <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                           </label>
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            {editingTrackingKey === 'gtm' ? 'Container ID' : editingTrackingKey === 'ga' ? 'Measurement ID' : 'Tracking ID'}
                          </label>
                          <input type="text" value={trackingConfigs[editingTrackingKey].id} onChange={(e) => handleSaveTrackingConfig(editingTrackingKey, { id: e.target.value })} className="w-full h-9 border border-slate-200 rounded px-2 text-[11px] font-mono focus:outline-none bg-slate-50" placeholder={editingTrackingKey === 'gtm' ? "e.g. GTM-XXXXXXX" : editingTrackingKey === 'ga' ? "e.g. G-XXXXXXX" : "ID..."} />
                        </div>

                        {(editingTrackingKey === 'fb' || editingTrackingKey === 'tiktok' || editingTrackingKey === 'metaApi') && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Access Token</label>
                            <textarea value={trackingConfigs[editingTrackingKey].token} onChange={(e) => handleSaveTrackingConfig(editingTrackingKey, { token: e.target.value })} className="w-full h-12 border border-slate-200 rounded px-2 py-1 text-[10px] font-mono focus:outline-none bg-slate-50" />
                          </div>
                        )}

                        {(editingTrackingKey === 'fb' || editingTrackingKey === 'tiktok') && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Test Event Code</label>
                            <input type="text" value={trackingConfigs[editingTrackingKey].testEvent} onChange={(e) => handleSaveTrackingConfig(editingTrackingKey, { testEvent: e.target.value })} className="w-full h-9 border border-slate-200 rounded px-2 text-[11px] font-mono focus:outline-none bg-slate-50" placeholder="e.g. TEST12345" />
                          </div>
                        )}
                        
                        {editingTrackingKey === 'metaApi' && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dataset ID</label>
                            <input type="text" value={trackingConfigs[editingTrackingKey].datasetId} onChange={(e) => handleSaveTrackingConfig(editingTrackingKey, { datasetId: e.target.value })} className="w-full h-9 border border-slate-200 rounded px-2 text-[11px] font-mono focus:outline-none bg-slate-50" placeholder="Dataset ID..." />
                          </div>
                        )}

                        {trackingConfigs[editingTrackingKey].events && trackingConfigs[editingTrackingKey].events.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <label className="text-[11px] font-bold text-slate-700 block mb-2">Auto-Mapped Events</label>
                            <div className="flex flex-wrap gap-1.5">
                               {trackingConfigs[editingTrackingKey].events.map((evtName: string) => (
                                 <span key={evtName} className="px-2 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-black tracking-wide">
                                    ✓ {evtName}
                                 </span>
                               ))}
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 font-bold leading-relaxed italic">
                              These events will automatically trigger across your storefront. No manual setup required.
                            </p>
                          </div>
                        )}

                        <button onClick={() => setEditingTrackingKey(null)} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[12px] h-10 rounded-lg shadow-md shadow-indigo-200 transition-all">Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 analytics-list">
                      <style>{`
                        .analytics-list {
                          max-height: 70vh;
                          overflow-y: auto;
                          padding-right: 4px;
                        }
                        .analytics-card {
                          min-height: 60px;
                          border: 1px solid #eee;
                          border-radius: 12px;
                          padding: 8px 10px;
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          background: #fff;
                          transition: all 0.2s;
                        }
                        .analytics-card:hover {
                          border-color: #ddd;
                        }
                        .analytics-logo {
                          width: 36px;
                          height: 36px;
                          min-width: 36px;
                          object-fit: contain;
                          display: block;
                        }
                        .analytics-title {
                          font-size: 14px;
                          font-weight: 800;
                          color: #1e293b;
                        }
                        .tracking-sub {
                          font-size: 11px;
                          color: #777;
                        }
                        .tracking-right {
                          display: flex;
                          align-items: center;
                          gap: 12px;
                        }
                      `}</style>
                      
                      {Object.keys(trackingConfigs).map((key) => {
                        const cfg = trackingConfigs[key];
                        return (
                          <div key={key} className="analytics-card">
                             <div className="flex items-center gap-3">
                               <img 
                                 src={cfg.logo} 
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logos/analytics/default.svg' }} 
                                 className="analytics-logo" 
                                 alt={cfg.label} 
                                 loading="eager"
                               />
                               <div>
                                 <div className="analytics-title leading-tight">{cfg.label}</div>
                                 <div className="tracking-sub mt-0.5 flex items-center gap-1.5 font-bold">
                                   <div className={`w-1.5 h-1.5 rounded-full ${cfg.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                   {cfg.active ? 'Active' : 'Inactive'}
                                 </div>
                               </div>
                             </div>
                             <div className="tracking-right">
                               <label className="relative inline-flex items-center cursor-pointer m-0">
                                 <input type="checkbox" className="sr-only peer" checked={cfg.active} onChange={(e) => handleSaveTrackingConfig(key, { active: e.target.checked })} />
                                 <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                               </label>
                               <button 
                                  onClick={() => setEditingTrackingKey(key)}
                                  className="h-8 px-3 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-black rounded-lg transition-colors"
                               >
                                 Edit <span className="ml-1 text-slate-400">›</span>
                               </button>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ================= 13. SUBPAGE: SOCIAL MEDIA LINKS BAR ================= */}
              {activeSubpage === 'socials' && (
                <form onSubmit={handleSaveCompany} className="space-y-4 text-xs pr-1 max-h-[420px] overflow-y-auto">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <span className="font-extrabold text-[11px] text-[#ff2f7d] block uppercase font-black">Social Channels URLs</span>
                    
                    <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block">Facebook Page</label>
                        <input value={companySettings.socialLinks?.fbPage || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), fbPage: e.target.value}})} type="text" className="w-full h-8 border border-slate-150 rounded px-2 font-bold focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block">Messenger Link</label>
                        <input value={companySettings.socialLinks?.messenger || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), messenger: e.target.value}})} type="text" className="w-full h-8 border border-slate-150 rounded px-2 font-bold focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block">WhatsApp Direct Link</label>
                        <input value={companySettings.socialLinks?.whatsapp || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), whatsapp: e.target.value}})} type="text" className="w-full h-8 border border-slate-150 rounded px-2 font-bold focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block">Instagram Frame</label>
                        <input value={companySettings.socialLinks?.instagram || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), instagram: e.target.value}})} type="text" className="w-full h-8 border border-slate-150 rounded px-2 font-bold focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block">TikTok Handle link</label>
                        <input value={companySettings.socialLinks?.tiktok || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), tiktok: e.target.value}})} type="text" className="w-full h-8 border border-slate-150 rounded px-2 font-bold focus:outline-none" />
                      </div>
                    </div>

                    <button type="submit" className="w-full h-10 bg-[#ff2f7d] hover:bg-pink-600 text-white font-black text-xs border-none cursor-pointer rounded-xl transition-all shadow-sm">Save Social Links</button>
                  </div>
                </form>
              )}

              {/* ================= 15. SUBPAGE: ACCOUNT LOGIN SYSTEM ================= */}
              {activeSubpage === 'auth' && (
                <form onSubmit={handleSaveCompany} className="space-y-4 text-xs pr-1 max-h-[420px] overflow-y-auto">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                    
                    <div className="flex flex-col gap-1">
                      <span className="font-extrabold text-[12px] text-[#ff2f7d] block uppercase group cursor-pointer transition-colors hover:text-pink-600">Account Login System</span>
                      <p className="text-[10px] text-slate-500">Configure enabled login methods for the Account page.</p>
                    </div>

                    <div className="bg-white border text-[11px] border-slate-100 p-4 rounded-xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src="https://uidownload.com/math/assets/img/icon-google.png" alt="Google" className="w-4 h-4 object-contain" />
                          <span className="font-bold text-slate-800">Google Login</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={companySettings.authSettings?.googleLogin !== false} onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), googleLogin: e.target.checked}})} className="sr-only peer" />
                          <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#059669]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          <span className="font-bold text-slate-800">Facebook Login</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={companySettings.authSettings?.facebookLogin !== false} onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), facebookLogin: e.target.checked}})} className="sr-only peer" />
                          <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1877F2]"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-4 h-4 object-contain" />
                          <span className="font-bold text-slate-800">Gmail Login</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={companySettings.authSettings?.gmailLogin !== false} onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), gmailLogin: e.target.checked}})} className="sr-only peer" />
                          <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-slate-500" />
                          <span className="font-bold text-slate-800">Phone Login (OTP)</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={companySettings.authSettings?.phoneLogin !== false} onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), phoneLogin: e.target.checked}})} className="sr-only peer" />
                          <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#059669]"></div>
                        </label>
                      </div>

                      <div className="border-t border-slate-100 pt-4 space-y-3">
                        <span className="font-bold text-slate-800 block">Login Interface Branding</span>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-extrabold uppercase">Login Subtitle</label>
                          <input 
                            type="text" 
                            value={companySettings.authSettings?.loginSubtitle || ''} 
                            onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), loginSubtitle: e.target.value}})}
                            placeholder="e.g. Premium Experience Awaits"
                            className="w-full h-8 border border-slate-100 rounded-lg px-3 font-bold focus:outline-none focus:border-[#ff2f7d]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-extrabold uppercase">Theme Color</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={companySettings.authSettings?.themeColor || '#4f46e5'} 
                                onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), themeColor: e.target.value}})}
                                className="w-8 h-8 rounded border-none cursor-pointer p-0 bg-transparent"
                              />
                              <input 
                                type="text" 
                                value={companySettings.authSettings?.themeColor || '#4f46e5'} 
                                onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), themeColor: e.target.value}})}
                                className="flex-1 h-8 border border-slate-100 rounded-lg px-2 font-mono text-[10px]"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-extrabold uppercase">Button Color</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={companySettings.authSettings?.buttonColor || '#000000'} 
                                onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), buttonColor: e.target.value}})}
                                className="w-8 h-8 rounded border-none cursor-pointer p-0 bg-transparent"
                              />
                              <input 
                                type="text" 
                                value={companySettings.authSettings?.buttonColor || '#000000'} 
                                onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), buttonColor: e.target.value}})}
                                className="flex-1 h-8 border border-slate-100 rounded-lg px-2 font-mono text-[10px]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-slate-500" />
                            <span className="font-bold text-slate-800">Normal Login (Email & Password)</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={companySettings.authSettings?.normalLogin !== false} onChange={e=>setCompanySettings({...companySettings, authSettings: {...(companySettings.authSettings||{}), normalLogin: e.target.checked}})} className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      </div>

                    </div>
                    <button type="submit" className="w-full h-10 bg-[#ff2f7d] hover:bg-pink-600 text-white font-black text-xs border-none cursor-pointer rounded-xl transition-all shadow-sm">Save Login Settings</button>
                  </div>
                </form>
              )}

              {/* ================= 14. SUBPAGE: COMPANY SETTINGS ================= */}
              {activeSubpage === 'company' && (
                <form onSubmit={handleSaveCompany} className="space-y-4 text-xs pr-1 max-h-[420px] overflow-y-auto">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                    
                    <div className="flex items-center gap-2">
                       <span className="font-extrabold text-[12px] text-[#ff2f7d] block uppercase group cursor-pointer transition-colors hover:text-pink-600">Company Settings</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-3">
                       <label className="text-[9.5px] text-slate-400 font-extrabold uppercase block tracking-wider">Company Logo</label>
                       <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                           {companySettings.logo ? (
                              <img src={companySettings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                           ) : (
                              <ImageIcon size={20} className="text-slate-300" />
                           )}
                         </div>
                         <div className="flex-1">
                           <label className="bg-white border border-slate-200 text-slate-700 px-3 h-8 flex items-center justify-center font-bold text-[10px] rounded-lg cursor-pointer hover:bg-slate-50 transition-colors w-fit">
                             <Upload size={13} className="mr-1.5" />
                             Upload Logo
                             <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if(file) {
                                  const resized = await trimAndResizeLogo(file, 300, 150);
                                  setCompanySettings({...companySettings, logo: resized});
                               }
                             }} />
                           </label>
                           <p className="text-[9px] text-slate-400 mt-1 font-semibold">Auto-trims extra white canvas padding & resizes with transparency.</p>
                         </div>
                       </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Basic Information</span>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Company Name</label>
                        <input value={companySettings.name} onChange={e=>setCompanySettings({...companySettings, name: e.target.value})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Mobile No</label>
                          <input value={companySettings.mobile} onChange={e=>setCompanySettings({...companySettings, mobile: e.target.value})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">WhatsApp No</label>
                          <input value={companySettings.whatsapp} onChange={e=>setCompanySettings({...companySettings, whatsapp: e.target.value})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Primary Email</label>
                          <input value={companySettings.email} onChange={e=>setCompanySettings({...companySettings, email: e.target.value})} type="email" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Secondary Email</label>
                          <input value={companySettings.email2} onChange={e=>setCompanySettings({...companySettings, email2: e.target.value})} type="email" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Website URL</label>
                        <input value={companySettings.website} onChange={e=>setCompanySettings({...companySettings, website: e.target.value})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Location & Hours</span>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Full Warehouse Address</label>
                        <input value={companySettings.address} onChange={e=>setCompanySettings({...companySettings, address: e.target.value})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Support Active Hours</label>
                        <input value={companySettings.supportTime} onChange={e=>setCompanySettings({...companySettings, supportTime: e.target.value})} type="text" placeholder="e.g. 10:00 AM to 10:00 PM" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Social Network Integrations</span>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Facebook Page</label>
                          <input value={companySettings.socialLinks?.fbPage || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), fbPage: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Messenger Channel</label>
                            <input value={companySettings.socialLinks?.messenger || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), messenger: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                          </div>
                          <div>
                            <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Instagram Link</label>
                            <input value={companySettings.socialLinks?.instagram || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), instagram: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">TikTok Link</label>
                            <input value={companySettings.socialLinks?.tiktok || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), tiktok: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                          </div>
                          <div>
                            <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">YouTube Channel</label>
                            <input value={companySettings.socialLinks?.youtube || ''} onChange={e=>setCompanySettings({...companySettings, socialLinks: {...(companySettings.socialLinks||{}), youtube: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[12px] uppercase tracking-wider border-none cursor-pointer rounded-xl transition-all shadow-md mt-2 mb-2 flex items-center justify-center gap-2">
                       <Save size={16} /> Save Full Company Settings
                    </button>
                  </div>
                </form>
              )}

              {/* ================= 14B. SUBPAGE: FOOTER SETTINGS ================= */}
              {activeSubpage === 'footer' && (
                <form onSubmit={(e: React.FormEvent) => {
                  e.preventDefault();
                  localStorage.setItem('naimshop_company_settings', JSON.stringify(companySettings));
                  showToast('Footer settings updated successfully!');
                }} className="space-y-4 text-xs pr-1 max-h-[420px] overflow-y-auto">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                    
                    <div className="flex items-center gap-2">
                       <span className="font-extrabold text-[12px] text-[#ff2f7d] block uppercase group cursor-pointer transition-colors hover:text-pink-600">Footer Settings</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Company & Brand</span>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Company Name</label>
                        <input value={companySettings.footerSettings?.companyName || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), companyName: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Copyright Year</label>
                        <input value={companySettings.footerSettings?.copyrightYear || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), copyrightYear: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Social Network URLs</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Facebook URL</label>
                          <input value={companySettings.footerSettings?.facebookUrl || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), facebookUrl: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Instagram URL</label>
                          <input value={companySettings.footerSettings?.instagramUrl || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), instagramUrl: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">YouTube URL</label>
                          <input value={companySettings.footerSettings?.youtubeUrl || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), youtubeUrl: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">TikTok URL</label>
                          <input value={companySettings.footerSettings?.tiktokUrl || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), tiktokUrl: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Contact Channels</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">WhatsApp Number</label>
                          <input value={companySettings.footerSettings?.whatsappNumber || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), whatsappNumber: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Personal Phone Number</label>
                          <input value={companySettings.footerSettings?.personalNumber || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), personalNumber: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Support Email (1)</label>
                          <input value={companySettings.footerSettings?.emailOne || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), emailOne: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Support Email (2)</label>
                          <input value={companySettings.footerSettings?.emailTwo || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), emailTwo: e.target.value}})} type="text" className="w-full h-9 border border-slate-200 rounded-lg px-2.5 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Company Address & Developer Credit</span>
                      <div>
                        <label className="text-[8.5px] text-slate-400 uppercase block font-bold mb-1">Full Company Address</label>
                        <textarea rows={3} value={companySettings.footerSettings?.address || ''} onChange={e=>setCompanySettings({...companySettings, footerSettings: {...(companySettings.footerSettings || {}), address: e.target.value}})} className="w-full border border-slate-200 rounded-lg p-2 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 resize-none" />
                      </div>
                      <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 space-y-1">
                        <div className="text-[9px] text-rose-500 font-extrabold uppercase">Developer Credit (Static)</div>
                        <div className="font-bold text-slate-800">IMTIAZ STUDIO</div>
                        <div className="text-slate-500 text-[10px]">Web Developer</div>
                      </div>
                    </div>

                    <button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[12px] uppercase tracking-wider border-none cursor-pointer rounded-xl transition-all shadow-md mt-2 mb-2 flex items-center justify-center gap-2">
                       <Save size={16} /> Save Footer Settings
                    </button>
                  </div>
                </form>
              )}

              {/* ================= 14. SUBPAGE: DATABASE SETUP (db-planner) ================= */}
              {activeSubpage === 'db-planner' && (
                <div className="space-y-4 animate-fade-in pb-20">
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#ff2f7d]/10 rounded-2xl flex items-center justify-center">
                          <Database className="text-[#ff2f7d]" size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Database Setup</h2>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">MySQL Configuration & phpMyAdmin</p>
                        </div>
                      </div>
                      <a 
                        href="https://auth-db2141.hstgr.io/index.php?route=/database/structure&db=u103041740_modeststylio" 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-5 py-3 rounded-2xl border-none cursor-pointer flex items-center gap-2 transition-all no-underline shadow-lg w-full sm:w-auto justify-center"
                      >
                        <ExternalLink size={14} />
                        <span>Open Hostinger phpMyAdmin</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setActiveSubpage(null)}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="text-sm font-black text-slate-850 uppercase">Database Health Check</h3>
                    </div>
                  </div>

                  <DatabaseSetup />
                </div>
              )}

              {/* ================= 15. SUBPAGE: REPORTS ================= */}
              {activeSubpage === 'reports' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <span className="font-extrabold text-[10px] text-[#ff2f7d] block uppercase">Financial Sales Report</span>
                    <div className="space-y-2 text-xs font-bold leading-relaxed text-slate-600 pr-1.5 pt-1">
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span>Saree Division Sales:</span>
                        <b className="text-slate-900">৳284,200 (62%)</b>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span>Punjabi Division Sales:</span>
                        <b className="text-slate-900">৳128,300 (28%)</b>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span>Casual Cotton Polo:</span>
                        <b className="text-slate-900">৳46,000 (10%)</b>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-[#ff2f7d]">Total Gross Revenue:</span>
                        <b className="text-slate-900">৳458,500</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* ================= 16. SUBPAGE: ADMIN SETTINGS ================= */}
              {activeSubpage === 'settings' && (
                <div className="space-y-4">
                  <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); showToast('Security configuration updated!'); }} className="space-y-4 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                      <span className="font-extrabold text-[11px] text-[#ff2f7d] block uppercase font-black">Security Configurations</span>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] text-slate-450 uppercase block font-bold">Admin Panel Access Email</label>
                          <input readOnly value="modeststyleo@gmail.com" type="text" className="w-full h-10 border border-slate-150 rounded-xl px-3 font-bold bg-slate-100 text-slate-400" />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-450 uppercase block font-bold">New Security Access PIN</label>
                          <input placeholder="Enter numeric pin credentials..." defaultValue="98231" type="password" className="w-full h-10 border border-slate-150 rounded-xl px-3 font-bold bg-white" />
                        </div>
                      </div>

                      <button type="submit" className="w-full h-10 bg-[#ff2f7d] hover:bg-pink-600 text-white font-black text-xs border-none cursor-pointer rounded-xl transition-all shadow-sm">Save Security Configuration</button>
                    </div>
                  </form>

                  {/* Courier Gateway ON/OFF Manager */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <span className="font-extrabold text-[11px] text-[#ff2f7d] block uppercase font-black">Courier Status Switches</span>
                    <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Enable or disable delivery handlers selectively:</p>
                    <div className="divide-y divide-slate-100 bg-white p-3 rounded-xl border border-slate-100 space-y-2">
                      {Object.keys(couriers).map((name) => (
                        <div key={name} className="flex items-center justify-between pt-2 first:pt-0">
                          <span className="font-extrabold text-[#2d3748] text-[11.5px]">{name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...couriers, [name]: { ...couriers[name], active: !couriers[name].active } };
                              setCouriers(updated);
                              localStorage.setItem('naimshop_admin_courier_details', JSON.stringify(updated));
                              showToast(`${name} toggle saved!`);
                            }}
                            className={`px-3 py-1.5 text-[10px] border-none font-black rounded-lg cursor-pointer transition-all ${
                              couriers[name].active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            }`}
                          >
                            {couriers[name].active ? 'ONLINE' : 'OFFLINE'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 17. SUBPAGE: HELP ================= */}
              {activeSubpage === 'help' && (
                <div className="space-y-3 text-xs leading-relaxed text-slate-600 font-semibold">
                  <p>Welcome to <strong>NaimShop Bangladesh Admin Panel Management Hub</strong>!</p>
                  <p>Use this modular terminal space to quickly verify order transaction pipelines, configure live courier track rates, customize flash discounts, or approve user review ratings.</p>
                  <p>In case of system database conflicts, use the <b>Sync</b> button in the top header to force fetch live server details into physical memory.</p>
                </div>
              )}

              {/* ================= 18. SUBPAGE: INCOMPLETE ORDERS ================= */}
              {activeSubpage === 'incomplete-orders' && (
                <AdminIncompleteOrders />
              )}


            </div>
            </div>
          )}
        </div>
      )}
      {/* ================= INVOICE GENERATOR VIEW MODAL ================= */}
      <AnimatePresence>
        {selectedInvoiceOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedInvoiceOrder(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Invoice Layout */}
              <div className="space-y-4 text-slate-800">
                <div className="text-center pb-2 border-b border-dashed border-slate-200">
                  <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white font-black mx-auto text-lg mb-1">N</div>
                  <h4 className="font-black text-slate-900 text-sm tracking-tight">{companySettings.name}</h4>
                  <span className="text-[8px] text-slate-400 font-black tracking-wider uppercase block">{companySettings.address}</span>
                  <span className="text-[8.5px] text-slate-450 block font-bold">Contact No: {companySettings.mobile}</span>
                  <span className="text-[8px] bg-slate-100 text-slate-600 font-black px-1.5 py-0.5 rounded inline-block mt-1">VAT REGISTERED RETAILER</span>
                </div>

                {/* Client properties */}
                <div className="grid grid-cols-2 text-[9px] text-slate-500 font-bold leading-normal gap-2">
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase font-black">INVOICE NUMBER</span>
                    <b className="text-slate-800 text-[10px] uppercase font-mono">{selectedInvoiceOrder.id}</b>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase font-black">TRANSACTION DATE</span>
                    <b className="text-slate-800 text-[10px]">{selectedInvoiceOrder.date}</b>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase font-black">CLIENT RECIPIENT</span>
                    <b className="text-slate-800 text-[10px] block truncate">{selectedInvoiceOrder.customerName || 'Loyal Patron'}</b>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase font-black">SHIPPING COURIER</span>
                    <b className="text-slate-800 text-[10px] block truncate">{selectedInvoiceOrder.courierName || 'Pathao Dispatch'}</b>
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-2.5">
                  <span className="block text-[8px] text-slate-400 mb-1.5 uppercase font-black">ORDERED APPARELS</span>
                  <div className="space-y-1.5">
                    {selectedInvoiceOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-[10.5px] font-bold">
                        <span className="text-slate-800 truncate max-w-[200px]">{item.name} <strong className="text-slate-400">×{item.qty}</strong></span>
                        <span className="text-slate-900">৳{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-slate-150 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500 text-[10px] font-bold">
                    <span>Retail Goods Subtotal:</span>
                    <span>৳{selectedInvoiceOrder.total - (selectedInvoiceOrder.deliveryCharge !== undefined ? Number(selectedInvoiceOrder.deliveryCharge) : 60) + (selectedInvoiceOrder.discount !== undefined ? Number(selectedInvoiceOrder.discount) : 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px] font-bold">
                    <span>Shipping Handling Delivery:</span>
                    <span>৳{selectedInvoiceOrder.deliveryCharge !== undefined ? selectedInvoiceOrder.deliveryCharge : 60}</span>
                  </div>
                  {selectedInvoiceOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 text-[10px] font-bold">
                      <span>Promo Discount:</span>
                      <span>-৳{selectedInvoiceOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 text-[10px] font-bold">
                    <span>Vat Tax (0% Exempted):</span>
                    <span>৳0</span>
                  </div>
                  <div className="flex justify-between text-slate-900 border-t border-slate-100 pt-1.5 font-extrabold">
                    <span>INVOICE TOTAL DUE:</span>
                    <span className="text-[#ff2f7d]">৳{selectedInvoiceOrder.total}</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-100 text-center font-bold text-[8.5px] text-slate-500 leading-normal">
                  Thank you for shopping premium cotton & traditional fabrics from NaimShop. Enjoy hassle-free 7-days returns!
                </div>

                {/* Print button */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => { window.print(); }}
                    className="flex-1 bg-slate-900 text-white font-extrabold py-2 rounded-xl text-[10px] cursor-pointer hover:bg-slate-800 transition-all text-center flex items-center justify-center gap-1.5 border-none"
                  >
                    <Printer size={13} /> Print VAT Invoice
                  </button>
                  <button 
                    onClick={() => setSelectedInvoiceOrder(null)}
                    className="px-4 bg-slate-100 hover:bg-slate-150 text-slate-500 font-extrabold py-2 rounded-xl text-[10px] cursor-pointer border-none"
                  >
                    Close
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= BOTTOM ADMIN NAVIGATION BAR ================= */}
      <footer className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 text-white shadow-2xl h-16 border-t border-slate-800 z-[1001] flex items-center justify-around px-4">
        
        {/* Hotkey: Products (Instantly opens Products subpage) */}
        <button 
          onClick={() => {
            navigate('/admin/products');
          }}
          className={`flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer p-1 transition-all ${activeSubpage === 'products' ? 'text-[#ff2f7d]' : 'text-slate-400 hover:text-white'}`}
        >
          <ShoppingBag size={18} />
          <span className="text-[10px] font-black tracking-tight uppercase">Products</span>
        </button>

        {/* Hotkey: Home (Center button, returns to main admin grid) */}
        <div className="flex flex-col items-center -mt-6">
          <button 
            onClick={() => {
              navigate('/admin');
            }}
            className={`flex items-center justify-center w-12 h-12 bg-white text-slate-950 rounded-full cursor-pointer border-none shadow-xl transition-all active:scale-95 ${activeSubpage === null ? 'ring-4 ring-[#ff2f7d]/40' : 'hover:bg-slate-100'}`}
          >
            <Grid size={22} className={activeSubpage === null ? 'text-[#ff2f7d]' : 'text-slate-900'} />
          </button>
          <span className={`text-[10px] font-black tracking-tight uppercase mt-1 ${activeSubpage === null ? 'text-[#ff2f7d]' : 'text-slate-400'}`}>Home</span>
        </div>

        {/* Hotkey: Orders (Instantly opens Orders subpage) */}
        <button 
          onClick={() => {
            navigate('/admin/orders');
          }}
          className={`flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer p-1 transition-all ${activeSubpage === 'orders' ? 'text-[#ff2f7d]' : 'text-slate-400 hover:text-white'}`}
        >
          <ClipboardList size={18} />
          <span className="text-[10px] font-black tracking-tight uppercase">Orders</span>
        </button>

      </footer>

      {/* ================= DATABASE SETUP REQUIRED MODAL ================= */}
      <AnimatePresence>
      </AnimatePresence>

      </div> {/* Close of Main Content Area div */}
    </div>
  );
}
