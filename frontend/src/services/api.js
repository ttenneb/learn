const API_URL = 'http://localhost:8000';

// Add default headers configuration
const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const fetchChats = async () => {
  const response = await fetch(`${API_URL}/chats/`);
  if (!response.ok) throw new Error('Failed to fetch chats');
  return response.json();
};

export const fetchChatMessages = async (chatId) => {
  const response = await fetch(`${API_URL}/chats/${chatId}/messages/`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
};

export const sendMessage = async (chatId, content, isBot = false) => {
  // Ensure content is properly formatted
  const formattedContent = Array.isArray(content) 
    ? content 
    : [{ type: 'text', value: String(content) }];

  const response = await fetch(`${API_URL}/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      content: formattedContent,
      is_bot: isBot,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to send message' }));
    throw new Error(error.detail || 'Failed to send message');
  }
  
  return response.json();
};

// Update createChat function to handle the response message properly
export const createChat = async (title, tags) => {
  const token = localStorage.getItem('token');
  try {
    if (!title) {
      title = 'New Chat';
    }

    const response = await fetch(`${API_URL}/chats/`, {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ title, tags }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create chat');
    }

    const chatData = await response.json();
    return chatData;
  } catch (error) {
    console.error('Create chat error:', error);
    throw error;
  }
};

export const fetchTags = async (skip = 0, limit = 10, search = '') => {
  const params = new URLSearchParams({ skip, limit });
  if (search) {
    params.append('search', search);
  }
  const response = await fetch(`${API_URL}/tags/?${params.toString()}`, {
    method: 'GET',
    headers: defaultHeaders,
  });
  if (!response.ok) throw new Error('Error fetching tags');
  return await response.json();
};

export const fetchChatNotes = async (chatId) => {
  const response = await fetch(`${API_URL}/chats/${chatId}/notes`);
  if (!response.ok) throw new Error('Failed to fetch notes');
  const data = await response.json();
  return data.notes;
};

export const updateChatNotes = async (chatId, notes) => {
  const response = await fetch(`${API_URL}/chats/${chatId}/notes`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notes),
  });
  if (!response.ok) throw new Error('Failed to update notes');
  return response.json();
};

// Update fetchCurrentUser function
export const fetchCurrentUser = async (token = null) => {
  const authToken = token || localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/users/me/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    },
    mode: 'cors',
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
    }
    throw new Error('Failed to fetch current user');
  }
  
  return response.json();
};

export const registerUser = async (username, email, password, fullName) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: defaultHeaders,
    credentials: 'include',  // Important to include cookies
    mode: 'cors',
    body: JSON.stringify({
      username,
      email,
      password,
      full_name: fullName,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to register');
  }
  
  return response.json();
};

export const loginUser = async (username, password) => {
  const response = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    credentials: 'include',
    mode: 'cors',
    body: new URLSearchParams({
      username,
      password,
      grant_type: 'password',
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to login');
  }
  
  const { access_token } = await response.json();
  localStorage.setItem('token', access_token);
  const user = await fetchCurrentUser(access_token);
  return { access_token, user };
};

export const claimGuestAccount = async (username, email, password, fullName) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/claim-guest-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
      email,
      password,
      full_name: fullName,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to claim account');
  }
  
  return response.json();
};

// Update createGuestSession function
export const createGuestSession = async () => {
  const response = await fetch(`${API_URL}/guest-token`, {
    method: 'POST',
    credentials: 'include',
    headers: defaultHeaders,
    mode: 'cors',
  });
  
  if (!response.ok) {
    console.error('Guest session creation failed:', await response.text());
    throw new Error('Failed to create guest session');
  }
  
  return response.json();
};

export const generateTitle = async (text) => {
  try {
    const response = await fetch(`${API_URL}/generate-title/`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate title');
    }

    const data = await response.json();
    return data.title;
  } catch (error) {
    console.error('Generate title error:', error);
    throw error;
  }
};

export const updateChatTitle = async (chatId, newTitle) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/chats/${chatId}/title`, {
    method: 'PUT',
    headers: {
      ...defaultHeaders,
      Authorization: token ? `Bearer ${token}` : '',
    },
    credentials: 'include',
    body: JSON.stringify({ title: newTitle }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update chat title');
  }

  return response.json();
};

export const fetchSubjects = async () => {
  const response = await fetch(`${API_URL}/subjects/`);
  if (!response.ok) throw new Error('Failed to fetch subjects');
  return response.json();
};

export const fetchTopics = async (subjectId) => {
  const response = await fetch(`${API_URL}/subjects/${subjectId}/topics/`);
  if (!response.ok) throw new Error('Failed to fetch topics');
  return response.json();
};

export const fetchSubtopics = async (topicId) => {
  const response = await fetch(`${API_URL}/topics/${topicId}/subtopics/`);
  if (!response.ok) throw new Error('Failed to fetch subtopics');
  return response.json();
};

export const classifySubject = async (question) => {
  const response = await fetch(`${API_URL}/classify-subject/`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error('Failed to classify subject');
  }

  return response.json();
};

export const classifyTopic = async (question, subject) => {
  const response = await fetch(`${API_URL}/classify-topic/`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ question, subject }),
  });

  if (!response.ok) {
    throw new Error('Failed to classify topic');
  }

  return response.json();
};

export const generateResponse = async (chatId, question, subjects) => {
  const questionText = Array.isArray(question) 
    ? question[0]?.value || ''
    : typeof question === 'string' 
      ? question 
      : question?.value || '';

  const response = await fetch(`${API_URL}/generate-response/`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      chat_id: chatId,
      question: questionText,
      subjects: Array.isArray(subjects) ? subjects : [subjects]
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate response');
  }

  const responseData = await response.json();
  // Ensure response content is properly formatted
  responseData.response = responseData.response.replace(/```json|```/g, '');
  return responseData;
};

export const generateStreamingResponse = async (chatId, question, subjects, onChunk) => {
  const questionText = Array.isArray(question) 
    ? question[0]?.value || ''
    : typeof question === 'string' 
      ? question 
      : question?.value || '';

  const response = await fetch(`${API_URL}/generate-response/`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      chat_id: chatId,
      question: questionText,
      subjects: Array.isArray(subjects) ? subjects : [subjects]
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate response');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    accumulatedResponse += chunk;
    onChunk(accumulatedResponse);
  }

  return accumulatedResponse;
};
