import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { loginUser, registerUser } from '../services/api';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const { access_token, user } = await loginUser(username, password);
        login(user, access_token);
      } else {
        await registerUser(username, email, password, fullName);
        const { access_token, user } = await loginUser(username, password);
        login(user, access_token);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        
        {error && (
          <div className="mb-4 text-red-500">{error}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              required
            />
          </div>
          
          {!isLogin && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                />
              </div>
            </>
          )}
          
          <div className="mb-6">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-blue-500 hover:text-blue-600"
        >
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
        
        <button
          onClick={onClose}
          className="mt-4 text-gray-500 hover:text-gray-600 block w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
AuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AuthModal;
