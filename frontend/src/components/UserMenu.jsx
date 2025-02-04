import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { FiMoon, FiSun, FiLogOut } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

const UserMenu = ({ 
  isDarkMode = false,
  onToggleTheme = () => {} 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, logout } = useAuth();

  const handleToggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  return (
    <>
      <div className="flex items-center p-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={handleToggleMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="ml-2 text-gray-700 dark:text-gray-200">{user?.is_guest ? 'Guest' : user?.username}</span>
            </button>
            
            {showMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 z-50">
                <div className="py-1">
                  {user?.is_guest ? (
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => { setShowAuthModal(true); setShowMenu(false); }}
                    >
                      Login / Register
                    </button>
                  ) : (
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={handleLogout}
                    >
                      <FiLogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDarkMode ? (
              <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>

      {createPortal(
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />,
        document.body
      )}
    </>
  );
};

UserMenu.propTypes = {
  isSidebarOpen: PropTypes.bool,
  isDarkMode: PropTypes.bool,
  onToggleSidebar: PropTypes.func,
  onToggleTheme: PropTypes.func
};

export default UserMenu;
