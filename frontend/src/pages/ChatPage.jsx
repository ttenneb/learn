/* eslint-disable no-unused-vars */
import { useRef, useState, useEffect } from 'react';
import { FiCode, FiRefreshCw, FiSettings, FiFileText, FiX, FiSend, FiUpload, FiCpu } from 'react-icons/fi';
import { RiRobot2Line, RiUser3Line } from 'react-icons/ri';
import { useOutletContext } from 'react-router-dom';
import { Resizable } from 're-resizable';
import MarkdownView from '../components/MarkdownView';
import Latex from 'react-latex';
import YouTubeEmbed from '../components/YouTubeEmbed';

const ChatPage = () => {
  const {
    messages,
    handleSendMessage,
    inputMessage,
    setInputMessage,
    renderMessageContent,
    activeChat,
    isSidebarOpen
  } = useOutletContext();

  const messagesEndRef = useRef(null);
  const [inputRows, setInputRows] = useState(1);
  const textareaRef = useRef(null);

  // Calculate initial width based on screen size
  const calculateInitialWidth = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth > 1920) return 800;
    if (screenWidth > 1440) return 600;
    return 400;
  };

  const [markdownWidth, setMarkdownWidth] = useState(calculateInitialWidth());
  const [isMarkdownVisible, setIsMarkdownVisible] = useState(true);
  const [previousWidth, setPreviousWidth] = useState(null);
  const [isFormattingToolbarOpen, setIsFormattingToolbarOpen] = useState(false);

  // Handle markdown toggle
  const toggleMarkdown = () => {
    setIsMarkdownVisible(!isMarkdownVisible);
  };

  // Update width on window resize
  useEffect(() => {
    const handleResize = () => {
      const maxWidth = Math.min(1200, window.innerWidth * 0.4);
      if (markdownWidth > maxWidth) {
        setMarkdownWidth(maxWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [markdownWidth]);

  // Handle input change with dynamic height adjustment
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Reset rows to 1 to get accurate scrollHeight
    e.target.rows = 1;
    
    // Calculate required rows based on scrollHeight
    const newRows = Math.min(5, Math.floor(e.target.scrollHeight / 24));
    setInputRows(newRows);
    e.target.rows = newRows;
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    // Implement file upload logic
    console.log('File upload:', e.target.files);
  };

  // Render input area
  const renderInputArea = () => (
    <div className="fixed bottom-0 border-t border-gray-100 dark:border-gray-800 
      bg-white dark:bg-gray-900 p-4 transition-[left,width] duration-150 ease-out" 
      style={{ 
        left: isSidebarOpen ? '16rem' : '0', 
        right: 0, 
        width: `calc(100% - ${(isSidebarOpen ? 256 : 0) + (isMarkdownVisible ? markdownWidth : 0)}px)` 
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end space-x-2">
          {/* Main textarea input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={inputRows}
              placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-lg
                border border-gray-200 dark:border-gray-700
                bg-gray-50 dark:bg-gray-800 
                text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-1 focus:ring-blue-500 
                placeholder-gray-500 dark:placeholder-gray-400
                text-base resize-none"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            
            {/* Action buttons floating on the right */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-2">
              {/* File upload */}
              <label className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 
                cursor-pointer text-gray-500 dark:text-gray-400 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple
                />
                <FiUpload className="w-4 h-4" />
              </label>
              
              {/* Model selection */}
              <button
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 
                  text-gray-500 dark:text-gray-400 transition-colors"
                onClick={() => {/* Implement model selection */}}
              >
                <FiCpu className="w-4 h-4" />
              </button>
              
              {/* Format code/text */}
              <button
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 
                  text-gray-500 dark:text-gray-400 transition-colors"
                onClick={() => setIsFormattingToolbarOpen(!isFormattingToolbarOpen)}
              >
                <FiCode className="w-4 h-4" />
              </button>

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className={`p-1.5 rounded-md transition-colors ${
                  inputMessage.trim() 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="flex-1 flex relative"
      style={{
        marginRight: isMarkdownVisible ? `${markdownWidth}px` : 0,
        transition: 'margin-right 150ms ease-out',
      }}
    >
      {/* Header - fixed position and aligned with sidebar */}
      <div className="fixed top-0 left-0 right-0 h-[73px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-30"
        style={{ 
          left: isSidebarOpen ? '16rem' : '0',
          right: isMarkdownVisible ? `${markdownWidth}px` : '0',
          transition: 'left 150ms ease-out, right 150ms ease-out'
        }}
      >
        <div className="h-full flex items-center justify-center relative">
          <h1 className="text-2xl font-semibold relative bg-gradient-to-r from-blue-600/40 via-purple-600/40 to-blue-600/40 bg-clip-text text-transparent">
            lecture.me
          </h1>
        </div>
      </div>

      {/* Floating markdown toggle button - visible when markdown is hidden */}
      {!isMarkdownVisible && (
        <button
          onClick={toggleMarkdown}
          className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg 
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FiFileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Chat Section - Add top padding to accommodate header */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative pt-[73px]">
        <div className="flex-1 px-6 pb-24"> {/* Added pb-24 to prevent overlap with fixed input */}
          <div className="max-w-4xl mx-auto py-6 space-y-8">
            {messages?.map((message, index) => (
              <div key={`${message.id || index}-${Date.now()}`} className="flex justify-center">
                {renderMessageContent({
                  content: message.content || [{type: 'text', value: ''}],
                  isBot: message.is_bot
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - dynamically positioned */}
        {renderInputArea()}
      </div>

      {/* Resizable Markdown Section with toggle button */}
      <Resizable
        size={{ width: markdownWidth, height: '100vh' }}
        enable={{ left: isMarkdownVisible }}
        minWidth={isMarkdownVisible ? Math.max(400, window.innerWidth * 0.2) : 0}
        maxWidth={Math.min(1200, window.innerWidth * 0.5)}
        onResize={(e, direction, ref, d) => {
          const newWidth = ref.offsetWidth;
          const maxWidth = Math.min(1200, window.innerWidth * 0.5);
          const minWidth = 300;
          
          if (newWidth >= minWidth && newWidth <= maxWidth) {
            setMarkdownWidth(newWidth);
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          transform: isMarkdownVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 150ms ease-out',
        }}
      >
        <div className="h-full bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 relative pt-10">
          {/* Updated button and icon size to match chatlist */}
          <button
            onClick={toggleMarkdown}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg
              hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <MarkdownView 
            content={activeChat?.notes || '# No Notes\nThis chat has no notes yet.'} 
          />
        </div>
      </Resizable>
    </div>
  );
};

export default ChatPage;
