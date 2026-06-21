export type PartnerSegment = 'influencer' | 'ugc' | 'webservice'
export type PartnerTier = 'bronze' | 'silver' | 'gold'
export type PartnerStatus = 'pending' | 'active' | 'suspended' | 'banned'
export type LegalStatus = 'legal_entity' | 'sole_proprietor' | 'individual'

export interface Partner {
  id: string
  email: string
  phone?: string
  full_name: string
  segment: PartnerSegment
  tier: PartnerTier
  status: PartnerStatus
  language: string
  country: string
  legal_status?: LegalStatus
  created_at: string
  updated_at: string
}

export interface PartnerKYC {
  id: string
  partner_id: string
  iin?: string
  freedom_pay_account: string
  status: 'pending' | 'verified' | 'rejected'
  verified_at?: string
}

export interface PartnerBalance {
  partner_id: string
  pending_amount: number
  available_amount: number
  paid_out_amount: number
}

export interface Event {
  id: string
  external_id: string
  title: string
  city: string
  category: string
  date?: string
  venue: string
  image_url: string
  base_url: string
  min_price: number
  currency: string
  service_fee_pct: number
  is_active: boolean
  special_rate?: number
}

export interface GeneratedLink {
  click_id: string
  tracking_url: string
  destination_url: string
  qr_code_url: string
}

export interface PartnerStats {
  period: string
  total_clicks: number
  total_orders: number
  conversion_rate: number
  total_earned: number
  pending_amount: number
  available_amount: number
}

export interface ClickDataPoint {
  date: string
  clicks: number
  orders: number
}

export type PayoutStatus = 'requested' | 'processing' | 'paid' | 'failed'

export interface Payout {
  id: string
  partner_id: string
  amount: number
  currency: string
  freedom_pay_account: string
  status: PayoutStatus
  freedom_pay_ref?: string
  requested_at: string
  processed_at?: string
  paid_at?: string
}

export type DocumentStatus =
  | 'draft'
  | 'awaiting_partner_signature'
  | 'under_ticketon_review'
  | 'awaiting_ticketon_signature'
  | 'signed'
  | 'archived'
  | 'rejected'

export interface LegalDocument {
  id: string
  partner_id: string
  legal_status: LegalStatus
  doc_type: string
  version: number
  status: DocumentStatus
  partner_file_url?: string
  ticketon_file_url?: string
  final_signed_url?: string
  rejection_reason?: string
  partner_signed_at?: string
  ticketon_signed_at?: string
  created_at: string
  updated_at: string
}

export interface PromoCode {
  id: string
  code: string
  partner_id: string
  event_id?: string
  is_active: boolean
  uses_count: number
  created_at: string
  updated_at: string
}

export interface AuthResult {
  token: string
  refresh_token: string
  partner: Partner
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages?: number
}
