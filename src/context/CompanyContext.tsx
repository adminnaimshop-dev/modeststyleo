import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultSettings = {
  name: 'NaimShop Bangladesh',
  logo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80',
  mobile: '01712345678',
  whatsapp: '01700000000',
  email: 'admin.naimshop@gmail.com',
  email2: 'moderator@naimshop.com',
  helpDeskEmail: 'help@naimshop.com',
  website: 'https://naimshop.com',
  address: 'Shop 204, Sector 11, Landmark Tower, Uttara, Dhaka, Bangladesh.',
  supportTime: '10:00 AM to 10:00 PM',
  mapLink: 'https://maps.app.goo.gl/example',
  courierLogo: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&q=80',
  invoiceLogo: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
  authSettings: {
    googleLogin: true,
    facebookLogin: true,
    gmailLogin: true,
    normalLogin: true,
    phoneLogin: true,
    loginSubtitle: 'Premium Experience Awaits',
    themeColor: '#4f46e5', // Indigo-600
    buttonColor: '#000000'
  },
  socialLinks: {
    fbPage: 'https://facebook.com/naimshop',
    messenger: 'https://m.me/naimshop',
    whatsapp: 'https://wa.me/8801700000000',
    instagram: 'https://instagram.com/naimshop',
    tiktok: 'https://tiktok.com/@naimshop',
    youtube: 'https://youtube.com/c/naimshop',
    linkedin: 'https://linkedin.com/company/naimshop'
  },
  footerSettings: {
    companyName: "NAIM SHOP",
    logo: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
    facebookUrl: "https://facebook.com/naimshop",
    instagramUrl: "https://instagram.com/naimshop",
    youtubeUrl: "https://youtube.com/c/naimshop",
    tiktokUrl: "https://tiktok.com/@naimshop",
    whatsappNumber: "01719-188777",
    personalNumber: "01671-060679",
    emailOne: "help.iyabd@gmail.com",
    emailTwo: "admin.iyabd@gmail.com",
    address: "NAIM SHOP\nHasonabad Housing, Building No-373/2,\nAjir Chanmia Lane, Middle Badda, Dhaka-1212, Bangladesh.",
    copyrightYear: "2025"
  }
};

const CompanyContext = createContext<any>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companySettings, setCompanySettings] = useState(() => {
    try {
      const saved = localStorage.getItem('naimshop_company_settings');
      if (saved) return JSON.parse(saved);
      
      const oldCompany = localStorage.getItem('naimshop_admin_company');
      const oldSocials = localStorage.getItem('naimshop_admin_socials');
      
      let merged = { ...defaultSettings };
      
      if (oldCompany) {
        merged = { ...merged, ...JSON.parse(oldCompany) };
      }
      
      if (oldSocials) {
        merged.socialLinks = { ...merged.socialLinks, ...JSON.parse(oldSocials) };
      }
      
      return merged;
    } catch (e) {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem('naimshop_company_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  return (
    <CompanyContext.Provider value={{ companySettings, setCompanySettings }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
