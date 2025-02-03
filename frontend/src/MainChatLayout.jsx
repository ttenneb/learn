/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiSearch, FiBook, FiStar, FiTag, FiCode, FiRefreshCw, FiUser, FiSettings, FiMenu } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import Latex from 'react-latex';
import 'katex/dist/katex.min.css';
import YouTube from 'react-youtube';
import { Routes, Route, NavLink, useLocation, Outlet } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import FlashcardsPage from './pages/FlashcardsPage';
import KnowledgePage from './pages/KnowledgePage';
import ChatList from './components/ChatList';
import { fetchChats, fetchChatMessages, sendMessage, fetchChatNotes, createChat, generateTitle, updateChatTitle, generateResponse } from './services/api';  // Add updateChatTitle
import StartChat from './components/StartChat';
import UserMenu from './components/UserMenu';

const MainChatLayout = () => {
  // State management
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [isFormattingToolbarOpen, setIsFormattingToolbarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showToggleButton, setShowToggleButton] = useState(false);
  const [isStartChatOpen, setIsStartChatOpen] = useState(false);

  const location = useLocation();

  // Handle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Add effect to handle toggle button visibility with shorter delay
  useEffect(() => {
    let timeoutId;
    if (!isSidebarOpen) {
      timeoutId = setTimeout(() => {
        setShowToggleButton(true);
      }, 150); // Reduced from 300ms to 150ms to make it snappier
    } else {
      setShowToggleButton(false);
    }
    return () => clearTimeout(timeoutId);
  }, [isSidebarOpen]);

  // Update useEffect to format chat data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const chatsData = await fetchChats();
        // Add timestamp if not present
        const formattedChats = chatsData.map(chat => ({
          ...chat,
          timestamp: new Date(chat.created_at).toLocaleDateString(),
          lastMessage: chat.lastMessage || "No messages yet"
        }));
        setChats(formattedChats);
        
        if (formattedChats.length > 0) {
          const [chatMessages, chatNotes] = await Promise.all([
            fetchChatMessages(formattedChats[0].id),
            fetchChatNotes(formattedChats[0].id)
          ]);
          setMessages(chatMessages);
          setActiveChat({
            ...formattedChats[0],
            notes: chatNotes
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update chat selection handler
  const handleChatSelect = async (chat) => {
    try {
      setLoading(true);
      const [chatMessages, chatNotes] = await Promise.all([
        fetchChatMessages(chat.id),
        fetchChatNotes(chat.id)
      ]);
      
      setMessages(chatMessages);
      setActiveChat({
        ...chat,
        notes: chatNotes
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update message sending
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return;

    const content = [{ type: 'text', value: inputMessage }];
    
    try {
      const newMessage = await sendMessage(activeChat.id, content, false);
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartNewChat = async ({ question, topic, knowledgeLevel, tags }) => {
    try {
      // Create chat immediately with temporary title
      const tempTitle = `${topic} (generating title...)`;
      const newChat = await createChat(tempTitle, tags);
      
      // Add chat to state and set as active immediately
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
      setIsStartChatOpen(false);
      
      // Clear messages for new chat
      setMessages([]);

      // Add user's question as first message
      const userMessage = await sendMessage(newChat.id, question);
      setMessages([userMessage]);

      // Start both title and response generation in parallel
      Promise.all([
        // Generate and update title
        generateTitle(question[0]?.value || topic)
          .then(async (generatedTitle) => {
            if (generatedTitle) {
              const updatedChat = await updateChatTitle(newChat.id, generatedTitle);
              setChats(prev => prev.map(chat => 
                chat.id === newChat.id ? updatedChat : chat
              ));
              if (activeChat?.id === newChat.id) {
                setActiveChat(updatedChat);
              }
            }
          })
          .catch(err => console.warn('Failed to generate title:', err)),

        // Generate and add bot response
        generateResponse(newChat.id, question[0]?.value || topic, tags)
          .then(async ({ response: botResponse }) => {
            const botMessage = await sendMessage(newChat.id, [
              { type: 'text', value: botResponse }
            ], true);
            setMessages(prev => [...prev, botMessage]);
          })
          .catch(err => console.error('Failed to generate response:', err))
      ]).catch(console.error); // Handle any errors from Promise.all
      
    } catch (err) {
      setError(err.message);
    }
  };

  // Available tags for filtering
  const availableTags = ['Mathematics', 'Algebra', 'Biology', 'Cellular', 'Physics', 'Advanced'];


  // Message renderer
  const renderMessageContent = (message) => {
    const MessageIcon = message.isBot ? RiRobot2Line : FiUser;
    
    return (
      <div className="w-full max-w-4xl">
        {/* Icon - with conditional positioning */}
        <div className={`flex items-center gap-3 mb-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center 
            ${message.isBot ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <MessageIcon className={`w-5 h-5 ${message.isBot ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
        </div>

        {/* Small icon controls (only for bot messages) */}
        {message.isBot && (
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <button className="hover:text-gray-600 transition-colors">
              <FiRefreshCw className="w-4 h-4" />
            </button>
            <button className="hover:text-gray-600 transition-colors">
              <FiSettings className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Separator line */}
        <div className="h-px w-full bg-gray-200 my-3" />

        {/* Content */}
        <div className="text-gray-800 space-y-4">
          {message.content.map((item, index) => {
            switch (item.type) {
              case 'latex':
                return (
                  <div key={index} className={`latex-container ${item.value.startsWith('$$') ? 'flex justify-center' : ''}`}>
                    <Latex>{item.value}</Latex>
                  </div>
                );
              case 'video':
                return (
                  <div key={index} className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <YouTube
                      videoId={item.value}
                      opts={{
                        height: '100%',
                        width: '100%',
                        playerVars: { 
                          autoplay: 0,
                          controls: 1,
                          modestbranding: 1,
                          rel: 0
                        },
                      }}
                      iframeClassName="absolute top-0 left-0 w-full h-full rounded-lg"
                      className="absolute top-0 left-0 w-full h-full"
                    />
                  </div>
                );
              case 'text':
              default:
                return (
                  <p key={index} className="text-lg leading-relaxed">{item.value}</p>
                );
            }
          })}
        </div>
      </div>
    );
  };

  // Add error display
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 font-sans relative">
      {/* Top-right user menu */}
      <div className="absolute top-4 right-4">
        <UserMenu />
      </div>

      {/* Floating toggle button with faster transition */}
      <div className={`fixed top-4 left-4 z-50 transition-opacity duration-150 
        ${showToggleButton ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg 
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Sidebar with ChatList - faster transition */}
      <div className={`fixed top-0 left-0 bottom-0 w-64 border-r border-gray-100 
        dark:border-gray-800 bg-white dark:bg-gray-900 
        transition-transform duration-150 ease-out z-40 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <ChatList 
          chats={chats}
          activeChat={activeChat}
          onChatSelect={handleChatSelect}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onStartNewChat={() => setIsStartChatOpen(true)}
        />
      </div>

      {/* Start Chat Modal */}
      {isStartChatOpen && (
        <StartChat
          onClose={() => setIsStartChatOpen(false)}
          onSubmit={handleStartNewChat}
        />
      )}

      {/* Main Content - faster transition */}
      <div className={`flex-1 transition-[margin] duration-150 ease-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Outlet context={{
          messages,
          handleSendMessage,
          inputMessage,
          setInputMessage,
          isFormattingToolbarOpen,
          setIsFormattingToolbarOpen,
          renderMessageContent,
          activeChat, // Add this line
          isSidebarOpen,
        }} />
      </div>
    </div>
  );
};

export default MainChatLayout;