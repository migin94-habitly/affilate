import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EventsPage } from '@/pages/EventsPage'
import { PayoutsPage } from '@/pages/PayoutsPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { PromoCodesPage } from '@/pages/PromoCodesPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { FAQPage } from '@/pages/FAQPage'
import { RequestsPage } from '@/pages/RequestsPage'
import '@/i18n'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000
    }
  }
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  if (token) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <Routes>
            <Route path="/login"        element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register"     element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/events"       element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/payouts"      element={<ProtectedRoute><PayoutsPage /></ProtectedRoute>} />
            <Route path="/documents"    element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
            <Route path="/promo-codes"  element={<ProtectedRoute><PromoCodesPage /></ProtectedRoute>} />
            <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/faq"          element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
            <Route path="/requests"     element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
            <Route path="*"             element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
