/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { Camera, Menu, Search, ShoppingCart } from 'lucide-react';
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import CustomerSideMenu from './CustomerSideMenu';
import { useCompany } from '../context/CompanyContext';

export default function Header() {
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const { companySettings } = useCompany();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <header className="header flex items-center gap-3 md:gap-5 sticky top-0 bg-white z-50 px-3 py-2 md:px-5 md:py-3 shadow-sm border-b border-gray-100">
        {/* 1. Hamburger Menu */}
        <button 
          type="button" 
          onClick={() => setMenuOpen(true)} 
          className="p-2 cursor-pointer border-none bg-transparent flex items-center justify-center text-slate-700 hover:text-black transition-colors shrink-0"
        >
          <Menu size={24} />
        </button>
        
        {/* 2. Company Logo */}
        <Link to="/" className="header-brand shrink-0">
          {companySettings?.logo ? (
            <div className="header-logo-box">
              <img src={companySettings.logo} alt="Shop Logo" />
            </div>
          ) : (
            <span className="brand-name">
              {companySettings?.name || "NAIM SHOP"}
            </span>
          )}
        </Link>

        {/* 3. Search Bar with Camera Icon Inside */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center relative min-w-0 max-w-xl">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="search-box w-full pr-20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-2 flex items-center gap-1">
            {/* Camera Icon inside search bar */}
            <div className="relative">
              <button 
                type="button"
                className="text-gray-400 hover:text-black bg-transparent border-none p-1.5 cursor-pointer flex items-center justify-center transition-colors"
                onClick={() => setShowCameraDropdown(!showCameraDropdown)}
              >
                <Camera size={18} />
              </button>

              <AnimatePresence>
                {showCameraDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-[34px] right-0 bg-white border border-gray-100 rounded-xl shadow-xl p-2 w-36 z-[60]"
                  >
                    <button type="button" className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-2 border-none bg-transparent cursor-pointer">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Phone
                    </button>
                    <button type="button" className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-2 border-none bg-transparent cursor-pointer">
                      <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                      Gallery
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Icon */}
            <button type="submit" className="text-gray-400 hover:text-black bg-transparent border-none p-1.5 cursor-pointer flex items-center justify-center transition-colors">
              <Search size={16} />
            </button>
          </div>
        </form>

        {/* 4. Cart Icon */}
        <button 
          className="icon-btn relative cursor-pointer shrink-0"
          onClick={() => navigate('/cart')}
        >
          <ShoppingCart size={18} />
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-bold">
            {cartCount}
          </span>
        </button>
      </header>

      {/* Customer Side Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <CustomerSideMenu onClose={() => setMenuOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
