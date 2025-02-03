import { useState, useRef, useEffect, useCallback } from 'react';
import { FiX, FiSend, FiChevronDown } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { fetchTags, fetchSubjects, fetchTopics, classifySubject, classifyTopic } from '../services/api';
import KnowledgeSlider from './KnowledgeSlider';

const MAX_CHARS = 500;

const StartChat = ({ onClose, onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [knowledgeLevel, setKnowledgeLevel] = useState(50);
  const [tags, setTags] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [allAvailableOptions, setAllAvailableOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const modalRef = useRef(null);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const classificationTimeoutRef = useRef(null);

  // Load available tags, subjects, and topics
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [tagsData, subjectsData] = await Promise.all([
          fetchTags(),
          fetchSubjects()
        ]);

        const topicsMap = {};
        await Promise.all(
          subjectsData.map(async (subject) => {
            try {
              const topics = await fetchTopics(subject.id);
              topicsMap[subject.id] = topics;
            } catch (err) {
              console.error(`Failed to fetch topics for subject ${subject.id}:`, err);
            }
          })
        );

        // Get all subject and topic names
        const subjectNames = new Set(subjectsData.map(subject => subject.name.toLowerCase()));
        const topicNames = new Set(
          Object.values(topicsMap)
            .flat()
            .map(topic => topic.name.toLowerCase())
        );

        // Filter out tags that are already subjects or topics
        const uniqueTags = tagsData.filter(tag => 
          !subjectNames.has(tag.toLowerCase()) && 
          !topicNames.has(tag.toLowerCase())
        );

        // Create all available options
        const allOptions = [
          ...subjectsData.map(subject => ({ id: subject.id, name: subject.name, type: 'subject' })),
          ...Object.values(topicsMap)
            .flat()
            .map(topic => ({ ...topic, type: 'topic' })),
          ...uniqueTags.map(tag => ({ id: tag, name: tag, type: 'tag' }))
        ];

        setAllAvailableOptions(allOptions);
        setFilteredTags(allOptions);

      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load options. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Update filtering logic to handle null/undefined values
  useEffect(() => {
    const filterTags = () => {
      if (!allAvailableOptions?.length) return [];

      const searchTerm = topicInput.toLowerCase().trim();
      if (!searchTerm) {
        return allAvailableOptions.filter(option => !tags.includes(option.name));
      }

      return allAvailableOptions.filter(option => 
        option?.name?.toLowerCase().includes(searchTerm) &&
        !tags.includes(option.name)
      );
    };

    const filtered = filterTags();
    setFilteredTags(filtered);
  }, [topicInput, tags, allAvailableOptions]);

  // Animation on mount + focus on textarea
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
      textareaRef.current?.focus();
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced classification function
  const classifyQuestion = useCallback(async (text) => {
    if (!text.trim() || text.length < 10) return; // Don't classify very short texts
    
    try {
      setIsClassifying(true);
      // Clear existing tags before new classification
      setTags([]);
      
      // First, classify the subject
      const subjectResult = await classifySubject(text);
      if (subjectResult.relevant_subjects?.length > 0) {
        // Get the most relevant subject
        const mainSubject = subjectResult.relevant_subjects[0];
        
        // Then, classify topics for this subject
        const topicResult = await classifyTopic(text, mainSubject);
        
        // Update tags with both subject and topics
        const newTags = [
          mainSubject,
          ...(topicResult.relevant_topics || []).slice(0, 2) // Take up to 2 topics
        ];
        
        setTags(newTags.slice(0, 5)); // Limit to 5 tags maximum
      }
    } catch (error) {
      console.error('Classification error:', error);
    } finally {
      setIsClassifying(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  // Update handleTextareaChange to include classification
  const handleTextareaChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setQuestion(text);
      
      // Clear existing timeout
      if (classificationTimeoutRef.current) {
        clearTimeout(classificationTimeoutRef.current);
      }
      
      // Set new timeout for classification
      classificationTimeoutRef.current = setTimeout(() => {
        classifyQuestion(text);
      }, 1000); // Wait 1 second after typing stops
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (classificationTimeoutRef.current) {
        clearTimeout(classificationTimeoutRef.current);
      }
    };
  }, []);

  const addTag = (option) => {
    if (!option?.name || tags.includes(option.name)) return;
    setTags(prev => [...prev, option.name]);
    setTopicInput('');
    setIsDropdownOpen(false);
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ 
      question: [{ type: 'text', value: question }],
      topic: tags[0] || 'General',
      knowledgeLevel,
      tags
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-150
          ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-xl 
          w-full max-w-2xl mx-4 transition-all duration-150
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Start New Lecture
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Begin your learning journey with an AI-powered lecture
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
              transition-colors text-gray-500 dark:text-gray-400"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Question Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              What would you like to learn about?
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={handleTextareaChange}
                rows={3} // Fixed to 3 rows
                className={`w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700
                  bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all
                  ${isClassifying ? 'pr-24' : 'pr-16'}`}
                placeholder="What would you like to learn about?"
                required
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {isClassifying && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                    Classifying...
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full
                  ${question.length >= MAX_CHARS * 0.9 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {question.length}/{MAX_CHARS}
                </span>
              </div>
            </div>
          </div>

          {/* Topics Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Topics
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Choose subjects relevant to your question
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full
                    bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400
                    text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex-1 relative" ref={dropdownRef}>
              <div
                className="relative flex items-center"
                onClick={() => setIsDropdownOpen(true)}
              >
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => {
                    setTopicInput(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700
                    bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Search topics..."
                  disabled={isLoading}
                />
                <FiChevronDown className={`absolute right-3 w-4 h-4 text-gray-400 transition-transform
                  ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                />
              </div>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 py-1 bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg 
                  max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                      Loading options...
                    </div>
                  ) : error ? (
                    <div className="px-4 py-2 text-red-500 dark:text-red-400">
                      {error}
                    </div>
                  ) : filteredTags.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredTags.map((option) => (
                        <button
                          key={`${option.type}-${option.id}`}
                          type="button"
                          onClick={() => addTag(option)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 
                            dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center"
                        >
                          <span className="flex-1">{option.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full
                            ${option.type === 'subject' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                              option.type === 'topic' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                            {option.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                      No matching options found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Knowledge Level Section */}
          <KnowledgeSlider
            value={knowledgeLevel}
            onChange={setKnowledgeLevel}
            maxAllowed={80}
          />

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={!question.trim() || tags.length === 0}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                question.trim() && tags.length > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiSend className="w-5 h-5" />
              <span>Start Lecture</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

StartChat.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default StartChat;
