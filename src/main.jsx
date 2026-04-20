import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CommitteeProvider } from './context/CommitteeContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AuthProvider>
            <CommitteeProvider>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        className: 'rounded-xl',
                        style: {
                            background: '#09090b',
                            color: '#e4e4e7',
                            border: '1px solid #3f3f46',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
                        },
                        success: {
                            style: {
                                background: 'rgba(16, 185, 129, 0.14)',
                                color: '#d1fae5',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                            },
                        },
                        error: {
                            style: {
                                background: 'rgba(239, 68, 68, 0.14)',
                                color: '#fee2e2',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                            },
                        },
                    }}
                />
            </CommitteeProvider>
        </AuthProvider>
    </BrowserRouter>,
)
