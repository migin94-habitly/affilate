import api from './client'
import type {
  AuthResult, Partner, PartnerKYC, PartnerBalance,
  Event, GeneratedLink, PartnerStats, ClickDataPoint,
  Payout, LegalDocument, LegalStatus, Paginated, PromoCode,
  Notification, FAQItem, ContactInfo, PartnerRequest
} from '@/types'

// Auth
export const register = (data: {
  email: string; password: string; full_name: string
  segment: string; language: string; country: string; phone?: string
}) => api.post<AuthResult>('/partner/auth/register', data).then(r => r.data)

export const login = (email: string, password: string) =>
  api.post<AuthResult>('/partner/auth/login', { email, password }).then(r => r.data)

// Profile
export const getProfile = () =>
  api.get<{ partner: Partner; kyc: PartnerKYC | null; offer_accepted: boolean; balance: PartnerBalance }>
    ('/partner/profile').then(r => r.data)

export const updateProfile = (data: Partial<Partner>) =>
  api.put<Partner>('/partner/profile', data).then(r => r.data)

export const submitKYC = (data: {
  iin?: string
  bank_name?: string
  bank_account?: string
  bank_bic?: string
  account_holder?: string
  freedom_pay_account?: string
}) => api.post<PartnerKYC>('/partner/kyc', data).then(r => r.data)

export const acceptOffer = (language: string) =>
  api.post('/partner/offer/accept', { language }).then(r => r.data)

// Events
export const getEvents = (params: {
  page?: number; per_page?: number; city?: string; category?: string; search?: string
}) => api.get<Paginated<Event>>('/partner/events', { params }).then(r => r.data)

export const getEvent = (id: string) =>
  api.get<Event>(`/partner/events/${id}`).then(r => r.data)

export const getEventFilters = () =>
  api.get<{ cities: string[]; categories: string[] }>('/partner/events/filters').then(r => r.data)

// Links
export const generateLink = (data: { event_id?: string; channel?: string }) =>
  api.post<GeneratedLink>('/partner/links/generate', data).then(r => r.data)

export const getStats = (period: 'day' | 'week' | 'month' = 'month') =>
  api.get<PartnerStats>('/partner/stats', { params: { period } }).then(r => r.data)

export const getTimeSeries = (days: number = 30) =>
  api.get<ClickDataPoint[]>('/partner/stats/series', { params: { days } }).then(r => r.data)

// Payouts
export const getPayouts = (page = 1) =>
  api.get<Paginated<Payout>>('/partner/payouts', { params: { page } }).then(r => r.data)

export const requestPayout = (amount: number) =>
  api.post<Payout>('/partner/payouts/request', { amount }).then(r => r.data)

export const getBalance = () =>
  api.get<PartnerBalance>('/partner/payouts/balance').then(r => r.data)

// Documents
export const getDocuments = () =>
  api.get<LegalDocument[]>('/partner/documents').then(r => r.data)

export const initiateDocuments = (legal_status: LegalStatus) =>
  api.post<LegalDocument[]>('/partner/documents', { legal_status }).then(r => r.data)

export const uploadSignedDoc = (docId: string, file_url: string) =>
  api.post(`/partner/documents/${docId}/upload-signed`, { file_url }).then(r => r.data)

export const getDocDownloadURL = (docId: string, type: 'partner' | 'final' = 'final') =>
  api.get<{ url: string }>(`/partner/documents/${docId}/download`, { params: { type } }).then(r => r.data)

// Promo Codes
export const getPromoCodes = () =>
  api.get<PromoCode[]>('/partner/promo-codes').then(r => r.data)

export const createPromoCode = (data: { code: string; event_id?: string }) =>
  api.post<PromoCode>('/partner/promo-codes', data).then(r => r.data)

export const deactivatePromoCode = (id: string) =>
  api.delete(`/partner/promo-codes/${id}`).then(r => r.data)

// Auth refresh
export const refreshToken = (refresh_token: string) =>
  api.post<AuthResult>('/partner/auth/refresh', { refresh_token }).then(r => r.data)

// Notifications
export const getNotifications = (page = 1) =>
  api.get<Paginated<Notification>>('/partner/notifications', { params: { page } }).then(r => r.data)

export const getUnreadCount = () =>
  api.get<{ unread: number }>('/partner/notifications/unread-count').then(r => r.data)

export const markNotificationRead = (id: string) =>
  api.patch(`/partner/notifications/${id}/read`).then(r => r.data)

export const markAllNotificationsRead = () =>
  api.post('/partner/notifications/read-all').then(r => r.data)

// FAQ & Contacts
export const getFAQ = () =>
  api.get<FAQItem[]>('/partner/faq').then(r => r.data)

export const getContacts = () =>
  api.get<ContactInfo[]>('/partner/contacts').then(r => r.data)

// Partner Requests
export const getRequests = (page = 1) =>
  api.get<Paginated<PartnerRequest>>('/partner/requests', { params: { page } }).then(r => r.data)

export const createRequest = (data: { type: string; subject: string; body: string }) =>
  api.post<PartnerRequest>('/partner/requests', data).then(r => r.data)
