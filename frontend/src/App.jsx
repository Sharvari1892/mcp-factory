import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

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

// Placeholder Pages
function Dashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
                <p className="text-slate-400 mt-2">Manage your generated Model Context Protocol servers.</p>
            </div>
            <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/10">
                <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-semibold text-white">No servers created yet</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                    Create custom servers by uploading openapi specifications and let the worker generate execution tools.
                </p>
                <div className="mt-6">
                    <Link
                        to="/generate"
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-indigo-500/20"
                    >
                        Generate Server
                    </Link>
                </div>
            </div>
        </div>
    );
}

function Generate() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Generate Server</h1>
                <p className="text-slate-400 mt-2">Bootstrap custom MCP servers in seconds.</p>
            </div>
            <div className="glass rounded-2xl p-8 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4">Under Construction</h3>
                <p className="text-slate-400 text-sm">
                    This module is currently pending integration. Check back shortly!
                </p>
            </div>
        </div>
    );
}

function ServerDetail() {
    const { id } = useParams();
    return (
        <div className="space-y-6">
            <div>
                <Link to="/dashboard" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                    <span>&larr; Back to Dashboard</span>
                </Link>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-4">Server Details</h1>
                <p className="text-slate-400 mt-2">Server ID: <code className="text-indigo-400 bg-indigo-950/30 px-2 py-1 rounded-md text-xs">{id}</code></p>
            </div>
            <div className="glass rounded-2xl p-8 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4">Log Streaming & Downloads</h3>
                <p className="text-slate-400 text-sm">
                    Detailed statistics and log downloads for this server will appear here.
                </p>
            </div>
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
                                <AppLayout>
                                    <Dashboard />
                                </AppLayout>
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
