import React from 'react';
import { useCompany } from '../context/CompanyContext';
import { Code, MapPin, Phone, Mail, ChevronRight } from 'lucide-react';

export default function CustomerFooter() {
  const { companySettings } = useCompany();
  const fs = companySettings?.footerSettings || {
    companyName: "NAIM SHOP",
    logo: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
    facebookUrl: "https://facebook.com/naimshop",
    instagramUrl: "https://instagram.com/naimshop",
    youtubeUrl: "https://youtube.com/c/naimshop",
    tiktokUrl: "https://tiktok.com/@naimshop",
    whatsappNumber: "01719188777",
    personalNumber: "01671060679",
    emailOne: "help.iyabd@gmail.com",
    emailTwo: "admin.iyabd@gmail.com",
    address: "NAIM SHOP\nHasonabad Housing, Building No-373/2,\nAjir Chanmia Lane, Middle Badda, Dhaka-1212, Bangladesh.",
    copyrightYear: "2025"
  };

  const getWhatsAppUrl = (num: string) => {
    const clean = num.replace(/[^0-9]/g, '');
    return `https://wa.me/${clean || '01719188777'}`;
  };

  return (
    <div className="footer-contact-section border-t border-neutral-900">
      <style>{`
        .footer-contact-section {
          padding: 24px 18px 90px;
          background: #000000 !important;
          margin-left: -18px;
          margin-right: -18px;
          margin-bottom: -90px;
        }

        @media (max-width: 480px) {
          .footer-contact-section {
            padding: 20px 14px 82px;
            margin-left: -14px;
            margin-right: -14px;
            margin-bottom: -82px;
          }
        }

        .footer-contact-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .footer-contact-card {
          height: 78px;
          padding: 8px 4px;
          border: none !important;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-decoration: none;
          box-shadow: none !important;
          transition: all 0.2s ease;
          cursor: pointer;
          background: transparent !important;
        }

        .footer-contact-card:hover {
          transform: translateY(-2px);
          box-shadow: none !important;
          background: transparent !important;
          border-color: transparent !important;
        }

        .footer-contact-card:active {
          transform: translateY(-2px) scale(0.97);
        }

        .icon-box {
          width: 38px;
          height: 38px;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: transparent !important;
        }

        .footer-contact-title {
          font-size: 10.5px;
          font-weight: 700;
          color: #ffffff !important;
          text-align: center;
          line-height: 1.1;
        }

        .developer-wide-card {
          margin-top: 12px;
          height: 74px;
          padding: 12px 14px;
          border: 1px solid #222222 !important;
          border-radius: 16px;
          background: linear-gradient(135deg, #111111 0%, #1a1a1a 100%) !important;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .developer-wide-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 47, 125, 0.15);
          border-color: #FF2F7D !important;
        }

        .developer-wide-card:active {
          transform: translateY(-2px) scale(0.98);
        }

        .developer-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FF2F7D;
          color: white;
        }

        .developer-title {
          font-size: 15px;
          font-weight: 800;
          color: #ffffff !important;
        }

        .developer-subtitle {
          font-size: 12px;
          color: #aaaaaa !important;
        }

        .developer-arrow {
          margin-left: auto;
          font-size: 22px;
          color: #ffffff !important;
        }

        .footer-address-card {
          margin-top: 12px;
          background: #111111 !important;
          border: 1px solid #222222 !important;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          width: 100%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        .footer-address-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          border-color: #333333 !important;
        }

        .footer-address-card:active {
          transform: translateY(-2px) scale(0.98);
        }

        .footer-address-icon-wrap {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #222222 !important;
          color: #ffffff !important;
        }

        .footer-address-title {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff !important;
        }

        .footer-address-subtitle {
          font-size: 11px;
          color: #cccccc !important;
          line-height: 1.4;
          margin-top: 2px;
        }

        .copyright {
          text-align: center;
          font-size: 13px;
          color: #888888 !important;
          margin: 18px 0 8px;
        }
      `}</style>

      {/* 4x2 Grid Layout for 8 Icon Cards with Soft Premium Pastel Backgrounds */}
      <div className="footer-contact-grid">
        
        {/* Facebook - Soft Blue */}
        <a 
          href={fs.facebookUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="footer-contact-card"
        >
          <div className="icon-box">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1877F2]">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <span className="footer-contact-title">Facebook</span>
        </a>

        {/* Instagram - Soft Pink */}
        <a 
          href={fs.instagramUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="footer-contact-card"
        >
          <div className="icon-box">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#EE2A7B]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
          <span className="footer-contact-title">Instagram</span>
        </a>

        {/* YouTube - Soft Red */}
        <a 
          href={fs.youtubeUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="footer-contact-card"
        >
          <div className="icon-box">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#FF0000]">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <span className="footer-contact-title">YouTube</span>
        </a>

        {/* TikTok - Soft Gray */}
        <a 
          href={fs.tiktokUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="footer-contact-card"
        >
          <div className="icon-box">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#FFFFFF]">
              <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v6.39c.02 2.1-.65 4.24-2.22 5.61-1.66 1.48-4.04 1.99-6.16 1.43-2.1-.53-3.92-2.13-4.63-4.18-.84-2.36-.33-5.18 1.44-7.01 1.54-1.62 3.92-2.31 6.1-1.89v4.03c-1.25-.33-2.67-.1-3.61.79-.88.82-1.07 2.18-.62 3.28.42 1.08 1.56 1.83 2.72 1.83 1.34.05 2.58-.93 2.82-2.26.06-.32.06-.65.06-.97V.02h.15z"/>
            </svg>
          </div>
          <span className="footer-contact-title">TikTok</span>
        </a>

        {/* WhatsApp - Soft Green */}
        <a 
          href={getWhatsAppUrl(fs.whatsappNumber)} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="footer-contact-card"
        >
          <div className="icon-box">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.62.962 3.21 1.47 4.887 1.472 5.514 0 10.017-4.502 10.02-10.02.002-2.673-1.037-5.186-2.927-7.078-1.89-1.891-4.401-2.934-7.082-2.936-5.524 0-10.024 4.501-10.027 10.026 0 1.745.469 3.45 1.357 4.966L1.082 22.86l4.221-1.107c1.554.85 3.12 1.294 1.344.601zM17.65 14.51c-.307-.154-1.82-.9-2.1-.1-.28.1-.553.408-.679.553-.127.145-.254.163-.561.01-.307-.154-1.3-.48-2.477-1.528-.916-.819-1.534-1.83-1.714-2.137-.18-.307-.018-.473.136-.626.139-.138.307-.359.461-.539.154-.18.205-.307.307-.512.103-.205.051-.384-.026-.538-.077-.154-.683-1.647-.935-2.25-.245-.588-.493-.508-.679-.518-.175-.01-.377-.01-.58-.01-.203 0-.533.076-.812.384-.28.307-1.066 1.042-1.066 2.54 0 1.498 1.09 2.943 1.239 3.148.15.205 2.148 3.28 5.206 4.59.728.312 1.296.499 1.739.639.731.233 1.396.2 1.921.122.585-.087 1.819-.743 2.074-1.459.255-.717.255-1.332.179-1.459-.076-.128-.282-.205-.59-.359z"/>
            </svg>
          </div>
          <span className="footer-contact-title">WhatsApp</span>
        </a>

        {/* Personal - Soft Purple */}
        <a 
          href={`tel:${fs.personalNumber || '01671060679'}`} 
          className="footer-contact-card"
        >
          <div className="icon-box">
            <Phone className="w-5 h-5 text-[#6366F1]" strokeWidth={2.5} />
          </div>
          <span className="footer-contact-title">Personal</span>
        </a>

        {/* Email 1 - Soft Yellow */}
        <a 
          href={`mailto:${fs.emailOne || 'help.iyabd@gmail.com'}`} 
          className="footer-contact-card"
        >
          <div className="icon-box">
            <Mail className="w-5 h-5 text-[#F59E0B]" strokeWidth={2.5} />
          </div>
          <span className="footer-contact-title">Email 1</span>
        </a>

        {/* Email 2 - Soft Mint */}
        <a 
          href={`mailto:${fs.emailTwo || 'admin.iyabd@gmail.com'}`} 
          className="footer-contact-card"
        >
          <div className="icon-box">
            <Mail className="w-5 h-5 text-[#10B981]" strokeWidth={2.5} />
          </div>
          <span className="footer-contact-title">Email 2</span>
        </a>

      </div>

      {/* 2. Web Developer Card (Premium wide horizontal design) */}
      <div className="developer-wide-card">
        <div className="developer-icon shadow-sm">
          <Code className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="developer-title">IMTIAZ STUDIO</div>
          <div className="developer-subtitle">Web Developer</div>
        </div>
        <ChevronRight className="developer-arrow" size={18} />
      </div>

      {/* 3. Company Address Card */}
      {fs.address && (
        <div className="footer-address-card">
          <div className="footer-address-icon-wrap">
            <MapPin className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="footer-address-title">{fs.companyName || 'NAIM SHOP'}</div>
            <div className="footer-address-subtitle text-slate-400 whitespace-pre-line leading-relaxed">{fs.address}</div>
          </div>
          <ChevronRight className="text-white ml-auto" size={18} />
        </div>
      )}

      {/* 4. Copyright */}
      <div className="copyright">
        © {fs.copyrightYear || '2025'} {fs.companyName || 'NAIM SHOP'}. All rights reserved.
      </div>
    </div>
  );
}
