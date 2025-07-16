import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Brain, User, LogOut, LogIn, UserPlus, HelpCircle, X, LayoutDashboard, MessageCircle, Map } from 'lucide-react';
import { useUser } from '../context/UserContext';
import LoginModal from './auth/LoginModal';
import SignupModal from './auth/SignupModal';
import Quiz from './Quiz';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/roadmap', label: 'Roadmap', icon: Map },
    { path: '/resources', label: 'Resources', icon: BookOpen },
    { path: '/account', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doubt-clarifier', label: 'Doubt Clarifier', icon: HelpCircle },
  ];

  const handleQuizClick = () => {
    setShowQuizModal(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="text-2xl font-bold text-white">
                  GeethaTeaches
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <Icon size={20} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="text-right">
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-300">
                        {user.streak} day streak
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-white hover:text-blue-400 transition-colors flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-800"
                  >
                    <LogIn size={20} />
                    <span>Sign in</span>
                  </button>
                  <button
                    onClick={() => setShowSignupModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-500 transition-colors flex items-center gap-2 font-medium"
                  >
                    <UserPlus size={20} />
                    <span>Sign up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-500 transition-colors z-40 flex items-center justify-center group"
      >
        <MessageCircle size={24} />
        <span className="absolute right-full mr-4 bg-gray-800 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Chat with AI
        </span>
      </button>

      {/* Chat Window */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Geetha</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-3 text-white">
                Hello! I'm Geetha, your AI study assistant. How can I help you today?
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Quiz</h2>
              <button
                onClick={() => setShowQuizModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <Quiz />
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation; 