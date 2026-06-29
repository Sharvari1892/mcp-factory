import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import ServerDetail from "./pages/ServerDetail";

// Main Layout for Protected Routes
function AppLayout({ children }) {
    const { logout, user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Header / Navbar */}
            <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                                MCP Factory
                            </span>
                        </Link>
                        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                            <Link to="/dashboard" className="text-slate-300 hover:text-white transition">
                                Dashboard
                            </Link>
                            <Link to="/generate" className="text-slate-300 hover:text-white transition">
                                Generate
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user && (
                            <span className="text-xs px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400 font-medium">
                                User: {user.userId.slice(0, 8)}...
                            </span>
                        )}
                        <button
                            onClick={logout}
                            className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {children}
            </main>
        </div>
    );
}



export function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/generate"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Generate />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/servers/:id"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <ServerDetail />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback & Redirects */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
