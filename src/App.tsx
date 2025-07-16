import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import Home from './pages/Home';
import Roadmap from './pages/Roadmap';
import Chat from './pages/Chat';
import Resources from './pages/Resources';
import Career from './pages/Career';
import Progress from './pages/Progress';
import Account from './pages/Account';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChatBot from './components/ChatBot';
import Navigation from './components/Navigation';
import { ChatProvider } from './context/ChatContext';
import { UserProvider } from './context/UserContext';
import DoubtClarifier from './pages/DoubtClarifier';

function App() {
  return (
    <UserProvider>
      <ChatProvider>
        <Router>
          <div className="relative min-h-screen bg-gray-900">
            <Navigation />
            <main className="flex-grow pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/career" element={<Career />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/account" element={<Account />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/doubt-clarifier" element={<DoubtClarifier />} />
              </Routes>
            </main>
            <ChatBot />
            <Footer />
          </div>
        </Router>
      </ChatProvider>
    </UserProvider>
  );
}

export default App;