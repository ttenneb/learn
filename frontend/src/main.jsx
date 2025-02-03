import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'
import MainChatLayout from './MainChatLayout.jsx'
import ChatPage from './pages/ChatPage'
import FlashcardsPage from './pages/FlashcardsPage'
import KnowledgePage from './pages/KnowledgePage'
// import LoginPage from './pages/LoginPage'
// import RegisterPage from './pages/RegisterPage'
// import RequireAuth from './components/RequireAuth'
import { AuthProvider } from './contexts/AuthContext'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainChatLayout />,
    children: [
      {
        path: '/',
        element: <ChatPage />
      },
      {
        path: '/flashcards',
        element: <FlashcardsPage />
      },
      {
        path: '/knowledge',
        element: <KnowledgePage />
      }
    ]
  },
  // ...remove login and register routes...
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
