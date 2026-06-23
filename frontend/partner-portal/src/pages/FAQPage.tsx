import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getFAQ, getContacts } from '@/api/partner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { IconChevronDown } from '@/components/ui/Icons'
import type { FAQItem, ContactInfo } from '@/types'

const contactTypeInfo: Record<string, { icon: string; color: string }> = {
  email:    { icon: '✉️',  color: 'bg-blue-50 dark:bg-blue-500/10' },
  telegram: { icon: '💬',  color: 'bg-blue-50 dark:bg-blue-500/10' },
  whatsapp: { icon: '📱',  color: 'bg-green-50 dark:bg-green-500/10' },
  phone:    { icon: '📞',  color: 'bg-gray-50 dark:bg-gray-800' },
  vk:       { icon: '🔵',  color: 'bg-blue-50 dark:bg-blue-500/10' },
  instagram:{ icon: '📸',  color: 'bg-pink-50 dark:bg-pink-500/10' },
}

function FAQItemCard({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200
        ${open
          ? 'border-brand-200 dark:border-brand-500/30 shadow-card'
          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
        }
        bg-white dark:bg-gray-900 animate-slide-up`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 pr-4 leading-snug">
          {item.question}
        </span>
        <span className={`text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <IconChevronDown className="w-4 h-4" />
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed animate-fade-in">
          {item.answer}
        </div>
      )}
    </div>
  )
}

function ContactCard({ contact }: { contact: ContactInfo }) {
  const info = contactTypeInfo[contact.type] ?? { icon: '📞', color: 'bg-gray-50 dark:bg-gray-800' }
  const href =
    contact.type === 'email' ? `mailto:${contact.value}` :
    contact.type === 'telegram' ? `https://t.me/${contact.value.replace('@', '')}` :
    contact.type === 'whatsapp' ? `https://wa.me/${contact.value.replace(/\D/g, '')}` :
    contact.type === 'phone' ? `tel:${contact.value.replace(/\s/g, '')}` :
    undefined

  const inner = (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-500/40 hover:shadow-card transition-all duration-150 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${info.color}`}>
        {info.icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{contact.label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
          {contact.value}
        </p>
      </div>
      {href && (
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto flex-shrink-0 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14"/>
        </svg>
      )}
    </div>
  )

  if (href) return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
  return inner
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

  const categories = faqItems ? [...new Set(faqItems.map(item => item.category))] : []
  const categoryLabels: Record<string, string> = {
    general:     t('faq.categories.general'),
    payments:    t('faq.categories.payments'),
    commissions: t('faq.categories.commissions'),
    tracking:    t('faq.categories.tracking'),
    documents:   t('faq.categories.documents'),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('faq.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('faq.subtitle')}</p>
      </div>

      {/* FAQ sections */}
      {faqLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !faqItems?.length ? (
        <EmptyState
          variant="default"
          title="FAQ пока пусто"
          description="Раздел с часто задаваемыми вопросами скоро появится"
        />
      ) : (
        <div className="space-y-6">
          {categories.map(cat => {
            const items = faqItems.filter(i => i.category === cat)
            if (!items.length) return null
            return (
              <div key={cat}>
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {categoryLabels[cat] || cat}
                </h2>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <FAQItemCard key={item.id} item={item} index={idx} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contacts */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('faq.contacts')}</h2>
        {contactsLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !contacts?.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('faq.noContacts')}</p>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => <ContactCard key={c.id} contact={c} />)}
          </div>
        )}
      </div>
    </div>
  )
}
