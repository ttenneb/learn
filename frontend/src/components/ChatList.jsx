import { useState, useEffect } from 'react';
import { FiSearch, FiTag, FiPlus, FiLoader } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { fetchTags, fetchSubjects, fetchTopics } from '../services/api';
import UserMenu from './UserMenu';

const ChatList = ({ chats, activeChat, onChatSelect, onToggleSidebar, isDarkMode, onToggleTheme, isSidebarOpen, onStartNewChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({});

  useEffect(() => {
    const loadTagsAndSubjects = async () => {
      try {
        const [tagsData, subjectsData] = await Promise.all([
          fetchTags(),
          fetchSubjects()
        ]);
        
        setAvailableTags(tagsData);
        setSubjects(subjectsData);

        // Fetch topics for each subject
        const topicsMap = {};
        for (const subject of subjectsData) {
          const topics = await fetchTopics(subject.id);
          topicsMap[subject.id] = topics;
        }
        setTopicsBySubject(topicsMap);
      } catch (err) {
        console.error('Failed to load tags and subjects:', err);
      }
    };

    loadTagsAndSubjects();
  }, []);

  // Filter chats by tags and search query
  const filteredChats = chats.filter((chat) => {
    const validTags = chat.tags.filter(tag => tag && tag.trim());  // Filter out empty tags
    const matchesTags = selectedTags.length === 0 || 
      validTags.some((tag) => selectedTags.includes(tag));
    const matchesSearch = chat.title.toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTags && matchesSearch;
  });

  return (
    <>
      <UserMenu 
        onToggleSidebar={onToggleSidebar}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        isSidebarOpen={isSidebarOpen}
      />
      
      {/* Search and Tags Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">Chats</h2>
          <button
            onClick={onStartNewChat}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
              text-gray-600 dark:text-gray-300 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
              placeholder-gray-500 dark:placeholder-gray-400
              text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tag Filter */}
        <button
          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 
            hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
        >
          <FiTag className="w-4 h-4" />
          <span>Filter by tags</span>
        </button>
        
        {isTagDropdownOpen && (
          <div className="mt-2">
            <div className="space-y-4">
              {/* Subjects */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subjects
                </h3>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTags.includes(subject.name)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedTags(prev =>
                        prev.includes(subject.name) 
                          ? prev.filter(t => t !== subject.name) 
                          : [...prev, subject.name]
                      )}
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics by Subject */}
              {subjects.map((subject) => (
                topicsBySubject[subject.id] && (
                  <div key={subject.id}>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {subject.name} Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {topicsBySubject[subject.id].map((topic) => (
                        <button
                          key={topic.id}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            selectedTags.includes(topic.name)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => setSelectedTags(prev =>
                            prev.includes(topic.name) 
                              ? prev.filter(t => t !== topic.name) 
                              : [...prev, topic.name]
                          )}
                        >
                          {topic.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}

              {/* Other Tags */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Other Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedTags(prev =>
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag) 
                          : [...prev, tag]
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={activeChat?.id === chat.id}
            onClick={onChatSelect}
          />
        ))}
      </div>
    </>
  );
};

const ChatItem = ({ chat, isActive, onClick }) => {
  const isGeneratingTitle = chat.title?.includes('(generating title...)');
  const displayTitle = isGeneratingTitle 
    ? <FiLoader className="w-5 h-5 text-blue-500 animate-spin" />
    : chat.title;

  return (
    <div className="border-b border-gray-100 dark:border-gray-800">
      <button
        onClick={() => onClick(chat)}
        className={`w-full text-left px-4 py-3
          ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
          transition-colors`}
      >
        <div className="flex-1 min-w-0">
          {/* Title and Loading State */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {displayTitle}
            </span>
          </div>

          {/* Tags Section */}
          <div className="flex flex-wrap gap-1 mb-2">
            {chat.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 
                  text-gray-600 dark:text-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Last Message */}
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {chat.lastMessage || "No messages yet"}
          </p>
        </div>
      </button>
    </div>
  );
};

ChatItem.propTypes = {
  chat: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    lastMessage: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

ChatList.propTypes = {
  chats: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    lastMessage: PropTypes.string,  // Make it optional
    timestamp: PropTypes.string,    // Make it optional
  })).isRequired,
  activeChat: PropTypes.object,
  onChatSelect: PropTypes.func.isRequired,
  isSidebarOpen: PropTypes.bool.isRequired,
  onToggleSidebar: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  onStartNewChat: PropTypes.func.isRequired,
};

export default ChatList;
