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
                        style: {
                            background: '#0f172a',
                            color: '#e2e8f0',
                            border: '1px solid #334155',
                        },
                    }}
                />
            </CommitteeProvider>
        </AuthProvider>
    </BrowserRouter>,
)
