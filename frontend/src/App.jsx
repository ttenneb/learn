import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="bg-blue-100 min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold text-blue-600">
          React + Tailwind CSS + Vite
        </h1>
      </div>
    </AuthProvider>
  )
}

export default App