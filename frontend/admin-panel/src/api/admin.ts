import api from './client'

export const loginAdmin = (email: string, password: string) =>
  api.post('/admin/auth/login', { email, password }).then(r => r.data)

export const getAdminMe = () =>
  api.get('/admin/me').then(r => r.data)

// Partners
export const getPartners = (params: any) =>
  api.get('/admin/partners', { params }).then(r => r.data)

export const getPartner = (id: string) =>
  api.get(`/admin/partners/${id}`).then(r => r.data)

export const updatePartnerStatus = (id: string, status: string) =>
  api.patch(`/admin/partners/${id}/status`, { status }).then(r => r.data)

export const updatePartnerTier = (id: string, tier: string) =>
  api.patch(`/admin/partners/${id}/tier`, { tier }).then(r => r.data)

// Tariffs & Commissions
export const getTariffs = () =>
  api.get('/admin/tariffs').then(r => r.data)

export const updateTariff = (data: any) =>
  api.put('/admin/tariffs', data).then(r => r.data)

export const getCommissions = (params: any) =>
  api.get('/admin/commissions', { params }).then(r => r.data)

export const approveAllCommissions = () =>
  api.post('/admin/commissions/approve-all').then(r => r.data)

// Payouts
export const getPayouts = (params: any) =>
  api.get('/admin/payouts', { params }).then(r => r.data)

export const updatePayoutStatus = (id: string, status: string, freedom_pay_ref?: string) =>
  api.patch(`/admin/payouts/${id}/status`, { status, freedom_pay_ref }).then(r => r.data)

export const exportPayouts = () =>
  api.get('/admin/payouts/export', { responseType: 'blob' }).then(r => r.data)

export const exportPayoutsCSV = exportPayouts

// Analytics
export const getAnalytics = (period: string) =>
  api.get('/admin/analytics', { params: { period } }).then(r => r.data)

// Documents
export const getDocuments = (params: any) =>
  api.get('/admin/documents', { params }).then(r => r.data)

export const getDocument = (id: string) =>
  api.get(`/admin/documents/${id}`).then(r => r.data)

export const signDocument = (id: string, ticketon_file_url: string, final_file_url: string) =>
  api.post(`/admin/documents/${id}/sign`, { ticketon_file_url, final_file_url }).then(r => r.data)

export const adminSignDocument = (id: string, url: string) =>
  api.post(`/admin/documents/${id}/sign`, { ticketon_file_url: url, final_file_url: url }).then(r => r.data)

export const rejectDocument = (id: string, reason: string) =>
  api.post(`/admin/documents/${id}/reject`, { reason }).then(r => r.data)

export const adminRejectDocument = rejectDocument

export const getDocumentDownloadUrl = (id: string) =>
  api.get(`/admin/documents/${id}/download-url`).then(r => r.data)

// Fraud
export const getFraudSignals = () =>
  api.get('/admin/fraud/signals').then(r => r.data)

// Events
export const getAdminEvents = (params: any) =>
  api.get('/admin/events', { params }).then(r => r.data)

// FAQ
export const getFAQ = () =>
  api.get('/admin/faq').then(r => r.data)

export const createFAQ = (data: any) =>
  api.post('/admin/faq', data).then(r => r.data)

export const updateFAQ = (id: string, data: any) =>
  api.put(`/admin/faq/${id}`, data).then(r => r.data)

export const deleteFAQ = (id: string) =>
  api.delete(`/admin/faq/${id}`).then(r => r.data)

// Contacts
export const getContacts = () =>
  api.get('/admin/contacts').then(r => r.data)

export const createContact = (data: any) =>
  api.post('/admin/contacts', data).then(r => r.data)

export const updateContact = (id: string, data: any) =>
  api.put(`/admin/contacts/${id}`, data).then(r => r.data)

export const deleteContact = (id: string) =>
  api.delete(`/admin/contacts/${id}`).then(r => r.data)
