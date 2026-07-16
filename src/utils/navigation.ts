/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * RouteTracker component listens to location changes and saves
 * the last non-product route path into sessionStorage.
 */
export function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Only save the route if it's not a product details page
    if (!location.pathname.startsWith('/product/')) {
      sessionStorage.setItem('lastCustomerPage', location.pathname + location.search);
    }
  }, [location]);

  return null;
}

/**
 * Custom hook to provide standard, unified back navigation logic
 * for the customer panel.
 */
export function useGoBack() {
  const navigate = useNavigate();

  const goBack = () => {
    const lastPage = sessionStorage.getItem('lastCustomerPage');
    if (window.history.length > 1) {
      navigate(-1);
    } else if (lastPage) {
      navigate(lastPage);
    } else {
      navigate('/');
    }
  };

  return goBack;
}
