import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Initialize with guest account on mount
  useEffect(() => {
    if (!user) {
      setUser({ 
        is_guest: true, 
        username: 'Guest',
        id: 'guest'
      });
    }
  }, []);

  const login = async (credentials) => {
    try {
      // TODO: Implement actual login API call
      const response = { 
        user: { 
          id: '123',
          username: credentials.username,
          is_guest: false 
        }
      };
      
      // Transfer data from guest to new user if needed
      if (user?.is_guest) {
        await transferGuestData(user.id, response.user.id);
      }
      
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      // TODO: Implement actual registration API call
      const response = { 
        user: { 
          id: '123',
          username: userData.username,
          is_guest: false 
        }
      };
      
      // Transfer data from guest to new user if needed
      if (user?.is_guest) {
        await transferGuestData(user.id, response.user.id);
      }
      
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // TODO: Implement actual logout API call
      const newGuestUser = { 
        is_guest: true, 
        username: 'Guest',
        id: 'guest'
      };
      setUser(newGuestUser);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const transferGuestData = async (oldUserId, newUserId) => {
    try {
      // TODO: Implement actual data transfer API call
      console.log(`Transferring data from ${oldUserId} to ${newUserId}`);
    } catch (error) {
      console.error('Data transfer failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      isAuthenticated: !!user && !user.is_guest
    }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
