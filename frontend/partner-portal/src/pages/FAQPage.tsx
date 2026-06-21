import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getFAQ, getContacts } from '@/api/partner'
import type { FAQItem, ContactInfo } from '@/types'

const contactIcons: Record<string, string> = {
  email: '✉️',
  telegram: '💬',
  whatsapp: '📱',
  phone: '📞',
  vk: '🔵',
  instagram: '📸',
}

function FAQItemCard({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 pr-4">{item.question}</span>
        <span className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3 leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  )
}

function ContactCard({ contact }: { contact: ContactInfo }) {
  const icon = contactIcons[contact.type] || '📞'
  const href =
    contact.type === 'email' ? `mailto:${contact.value}` :
    contact.type === 'telegram' ? `https://t.me/${contact.value.replace('@', '')}` :
    contact.type === 'whatsapp' ? `https://wa.me/${contact.value.replace(/\D/g, '')}` :
    contact.type === 'phone' ? `tel:${contact.value.replace(/\s/g, '')}` :
    undefined

  const content = (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 transition-colors">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{contact.label}</p>
        <p className="text-sm font-medium text-gray-900">{contact.value}</p>
      </div>
    </div>
  )

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>
  }
  return content
}

export function FAQPage() {
  const { t } = useTranslation()

  const { data: faqItems, isLoading: faqLoading } = useQuery({
    queryKey: ['faq'],
    queryFn: getFAQ,
    staleTime: 5 * 60 * 1000
  })

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
    staleTime: 5 * 60 * 1000
  })

  const categories = faqItems
    ? [...new Set(faqItems.map(item => item.category))]
    : []

  const categoryLabels: Record<string, string> = {
    general: t('faq.categories.general'),
    payments: t('faq.categories.payments'),
    commissions: t('faq.categories.commissions'),
    tracking: t('faq.categories.tracking'),
    documents: t('faq.categories.documents'),
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('faq.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('faq.subtitle')}</p>
      </div>

      {/* FAQ */}
      {faqLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => {
            const items = faqItems?.filter(i => i.category === cat) ?? []
            if (items.length === 0) return null
            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {categoryLabels[cat] || cat}
                </h2>
                <div className="space-y-2">
                  {items.map(item => (
                    <FAQItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contacts */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('faq.contacts')}</h2>
        {contactsLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !contacts || contacts.length === 0 ? (
          <p className="text-sm text-gray-500">{t('faq.noContacts')}</p>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <ContactCard key={c.id} contact={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
