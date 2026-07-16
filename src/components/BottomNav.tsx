/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home as HomeIcon, LayoutGrid, Tag, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <HomeIcon size={20} />
        <span>Home</span>
      </Link>
      <Link to="/categories" className={`nav-item ${isActive('/categories') ? 'active' : ''}`}>
        <LayoutGrid size={20} />
        <span>Category</span>
      </Link>
      <Link to="/offers" className={`nav-item ${isActive('/offers') ? 'active' : ''}`}>
        <Tag size={20} />
        <span>Offer</span>
      </Link>
      <Link to="/messenger" className={`nav-item ${isActive('/messenger') ? 'active' : ''}`}>
        <MessageCircle size={20} />
        <span>Messenger</span>
      </Link>
      <Link to="/account" className={`nav-item ${isActive('/account') ? 'active' : ''}`}>
        <User size={20} />
        <span>Account</span>
      </Link>
    </nav>
  );
}
