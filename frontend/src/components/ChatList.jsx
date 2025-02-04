import { useState, useEffect } from 'react';
import { FiSearch, FiTag, FiPlus, FiLoader, FiX, FiMenu } from 'react-icons/fi';  // Add FiX and FiMenu
import PropTypes from 'prop-types';
import { fetchTags, fetchSubjects, fetchTopics, fetchSubtopics } from '../services/api';
import UserMenu from './UserMenu';

const ChatList = ({ chats, activeChat, onChatSelect, onToggleSidebar, isDarkMode, onToggleTheme, isSidebarOpen, onStartNewChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [subtopicsByTopic, setSubtopicsByTopic] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const tagsPerPage = 10;

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

  useEffect(() => {
    // Replace previous tag fetching logic with paginated, searchable fetch
    const loadTags = async () => {
      try {
        // Example: load first 10 tags with no search term
        const data = await fetchTags(0, tagsPerPage, tagSearchQuery);
        setAvailableTags(data.items);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    loadTags();
  }, [tagSearchQuery]);

  useEffect(() => {
    // Fetch subtopics when a topic is selected
    const loadSubtopics = async () => {
      if (selectedTopic) {
        try {
          const subtopics = await fetchSubtopics(selectedTopic.id);
          setSubtopicsByTopic(prev => ({
            ...prev,
            [selectedTopic.id]: subtopics
          }));
        } catch (error) {
          console.error('Error loading subtopics:', error);
        }
      }
    };
    loadSubtopics();
  }, [selectedTopic]);

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

  // Determine tags to display based on search and selection
  const displayTags = () => {
    if (tagSearchQuery) {
      return availableTags;
    } else if (selectedTopic) {
      return subtopicsByTopic[selectedTopic.id] || [];
    } else if (selectedSubject) {
      return topicsBySubject[selectedSubject.id];
    } else {
      return subjects;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with toggle button */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isSidebarOpen ? (
              <FiX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
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
              {/* Tag Search Bar */}
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 
                    border border-gray-200 dark:border-gray-700
                    text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    placeholder-gray-500 dark:placeholder-gray-400
                    text-sm"
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                />
              </div>

              {/* Display Tags */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedTopic ? 'Subtopics' : selectedSubject ? 'Topics' : 'Subjects'}
                  </h3>
                  {(selectedTopic || selectedSubject) && (
                    <button
                      onClick={() => {
                        if (selectedTopic) {
                          setSelectedTopic(null);
                        } else if (selectedSubject) {
                          setSelectedSubject(null);
                          setSelectedTopic(null);
                        }
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    >
                      <FiX className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayTags().map((tag) => (
                    <button
                      key={tag.id}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTags.includes(tag.name)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      onClick={() => {
                        if (selectedTopic) {
                          setSelectedTags(prev =>
                            prev.includes(tag.name) 
                              ? prev.filter(t => t !== tag.name) 
                              : [...prev, tag.name]
                          );
                        } else if (selectedSubject) {
                          setSelectedTopic(tag);
                        } else {
                          setSelectedSubject(tag);
                        }
                      }}
                    >
                      <span>{tag.name}</span>
                      {selectedTags.includes(tag.name) && (
                        <FiX
                          className="ml-2 w-4 h-4 inline-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTags(prev => prev.filter(t => t !== tag.name));
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="p-2">
          {filteredChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={activeChat?.id === chat.id}
              onClick={onChatSelect}
            />
          ))}
        </div>
      </div>

      {/* User Menu at bottom */}
      <div className="mt-auto border-t border-gray-100 dark:border-gray-800">
        <UserMenu 
          onToggleSidebar={onToggleSidebar}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          isSidebarOpen={isSidebarOpen}
        />
      </div>
    </div>
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
