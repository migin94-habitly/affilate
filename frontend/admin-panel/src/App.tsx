import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAdminAuth } from '@/store/auth'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AdminLayout } from '@/components/AdminLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PartnersPage } from '@/pages/PartnersPage'
import { CommissionsPage } from '@/pages/CommissionsPage'
import { PayoutsPage } from '@/pages/PayoutsPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { FraudPage } from '@/pages/FraudPage'
import { EventsPage } from '@/pages/EventsPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { FAQPage } from '@/pages/FAQPage'
import { RequestsPage } from '@/pages/RequestsPage'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAdminAuth(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAdminAuth(s => s.token)
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><AdminLayout><DashboardPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/dashboard"   element={<ProtectedRoute><AdminLayout><DashboardPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/partners"    element={<ProtectedRoute><AdminLayout><PartnersPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/events"      element={<ProtectedRoute><AdminLayout><EventsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/commissions" element={<ProtectedRoute><AdminLayout><CommissionsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/payouts"     element={<ProtectedRoute><AdminLayout><PayoutsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/documents"   element={<ProtectedRoute><AdminLayout><DocumentsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><AdminLayout><NotificationsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/requests"      element={<ProtectedRoute><AdminLayout><RequestsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/fraud"        element={<ProtectedRoute><AdminLayout><FraudPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/faq"         element={<ProtectedRoute><AdminLayout><FAQPage /></AdminLayout></ProtectedRoute>} />
            <Route path="*"            element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
