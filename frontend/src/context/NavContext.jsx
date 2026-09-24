import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavContext = createContext({});

export function NavProvider({ children }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile drawer when navigating to a new route
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Lock body scroll on mobile when sidebar drawer is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.classList.add('sv-drawer-open');
    } else {
      document.body.classList.remove('sv-drawer-open');
    }
    return () => {
      document.body.classList.remove('sv-drawer-open');
    };
  }, [isMobileNavOpen]);

  const toggleMobileNav = () => setIsMobileNavOpen(prev => !prev);
  const closeMobileNav = () => setIsMobileNavOpen(false);
  const openMobileNav = () => setIsMobileNavOpen(true);

  return (
    <NavContext.Provider value={{
      isMobileNavOpen,
      setIsMobileNavOpen,
      toggleMobileNav,
      closeMobileNav,
      openMobileNav
    }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  return useContext(NavContext);
}
