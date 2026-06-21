import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFAQ, createFAQ, updateFAQ, deleteFAQ,
  getContacts, createContact, updateContact, deleteContact
} from '@/api/admin'
import { Btn, Badge, Card, Table, TD } from '@/components/ui'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  sort_order: number
  is_active: boolean
}

interface ContactInfo {
  id: string
  type: string
  label: string
  value: string
  sort_order: number
  is_active: boolean
}

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'Общие' },
  { value: 'payments', label: 'Выплаты' },
  { value: 'commissions', label: 'Комиссии' },
  { value: 'tracking', label: 'Отслеживание' },
  { value: 'documents', label: 'Документы' },
]

const CONTACT_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Телефон' },
]

function FAQForm({
  initial,
  onSave,
  onCancel,
  loading
}: {
  initial?: Partial<FAQItem>
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    question: initial?.question || '',
    answer: initial?.answer || '',
    category: initial?.category || 'general',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  })

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Вопрос *</label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={form.question}
          onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
          placeholder="Как начать работу?"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Ответ *</label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={form.answer}
          onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
          placeholder="Подробный ответ..."
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Категория</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          >
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Порядок</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.sort_order}
            onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            Активен
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <Btn size="sm" loading={loading} onClick={() => onSave(form)}>Сохранить</Btn>
        <Btn size="sm" variant="outline" onClick={onCancel}>Отмена</Btn>
      </div>
    </div>
  )
}

function ContactForm({
  initial,
  onSave,
  onCancel,
  loading
}: {
  initial?: Partial<ContactInfo>
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    type: initial?.type || 'email',
    label: initial?.label || '',
    value: initial?.value || '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  })

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Тип</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          >
            {CONTACT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Метка *</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="Email поддержки"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Значение *</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.value}
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            placeholder="partners@ticketon.kz"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Порядок</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.sort_order}
            onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4 rounded"
          />
          Активен
        </label>
        <div className="flex gap-2">
          <Btn size="sm" loading={loading} onClick={() => onSave(form)}>Сохранить</Btn>
          <Btn size="sm" variant="outline" onClick={onCancel}>Отмена</Btn>
        </div>
      </div>
    </div>
  )
}

export function FAQPage() {
  const qc = useQueryClient()
  const [editingFAQ, setEditingFAQ] = useState<string | 'new' | null>(null)
  const [editingContact, setEditingContact] = useState<string | 'new' | null>(null)
  const [tab, setTab] = useState<'faq' | 'contacts'>('faq')

  const { data: faqItems = [], isLoading: faqLoading } = useQuery({
    queryKey: ['admin-faq'],
    queryFn: getFAQ
  })

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: getContacts
  })

  const createFAQMut = useMutation({
    mutationFn: createFAQ,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-faq'] }); setEditingFAQ(null) }
  })
  const updateFAQMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateFAQ(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-faq'] }); setEditingFAQ(null) }
  })
  const deleteFAQMut = useMutation({
    mutationFn: deleteFAQ,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-faq'] })
  })

  const createContactMut = useMutation({
    mutationFn: createContact,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-contacts'] }); setEditingContact(null) }
  })
  const updateContactMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateContact(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-contacts'] }); setEditingContact(null) }
  })
  const deleteContactMut = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-contacts'] })
  })

  const categoryLabel = (cat: string) =>
    CATEGORY_OPTIONS.find(o => o.value === cat)?.label || cat

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">FAQ и контакты</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('faq')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
            ${tab === 'faq' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Вопросы ({faqItems.length})
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
            ${tab === 'contacts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Контакты ({contacts.length})
        </button>
      </div>

      {/* FAQ Tab */}
      {tab === 'faq' && (
        <Card
          title="Часто задаваемые вопросы"
          action={
            editingFAQ !== 'new' && (
              <Btn size="sm" onClick={() => setEditingFAQ('new')}>+ Добавить вопрос</Btn>
            )
          }
        >
          {editingFAQ === 'new' && (
            <div className="mb-4">
              <FAQForm
                onSave={data => createFAQMut.mutate(data)}
                onCancel={() => setEditingFAQ(null)}
                loading={createFAQMut.isPending}
              />
            </div>
          )}

          {faqLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : faqItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Вопросы не добавлены</p>
          ) : (
            <Table headers={['#', 'Вопрос', 'Категория', 'Статус', '']}>
              {faqItems.map((item: FAQItem) => (
                <tr key={item.id}>
                  {editingFAQ === item.id ? (
                    <td colSpan={5} className="px-4 py-2">
                      <FAQForm
                        initial={item}
                        onSave={data => updateFAQMut.mutate({ id: item.id, data })}
                        onCancel={() => setEditingFAQ(null)}
                        loading={updateFAQMut.isPending}
                      />
                    </td>
                  ) : (
                    <>
                      <TD className="w-10 text-gray-400">{item.sort_order}</TD>
                      <TD>
                        <p className="font-medium text-gray-900 text-sm">{item.question}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.answer}</p>
                      </TD>
                      <TD>{categoryLabel(item.category)}</TD>
                      <TD>
                        <Badge
                          label={item.is_active ? 'Активен' : 'Скрыт'}
                          variant={item.is_active ? 'success' : 'default'}
                        />
                      </TD>
                      <TD>
                        <div className="flex gap-2">
                          <Btn size="sm" variant="ghost" onClick={() => setEditingFAQ(item.id)}>
                            ✏️
                          </Btn>
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick={() => window.confirm('Удалить вопрос?') && deleteFAQMut.mutate(item.id)}
                          >
                            🗑️
                          </Btn>
                        </div>
                      </TD>
                    </>
                  )}
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {/* Contacts Tab */}
      {tab === 'contacts' && (
        <Card
          title="Контакты поддержки"
          action={
            editingContact !== 'new' && (
              <Btn size="sm" onClick={() => setEditingContact('new')}>+ Добавить контакт</Btn>
            )
          }
        >
          {editingContact === 'new' && (
            <div className="mb-4">
              <ContactForm
                onSave={data => createContactMut.mutate(data)}
                onCancel={() => setEditingContact(null)}
                loading={createContactMut.isPending}
              />
            </div>
          )}

          {contactsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Контакты не добавлены</p>
          ) : (
            <Table headers={['#', 'Тип', 'Метка', 'Значение', 'Статус', '']}>
              {contacts.map((c: ContactInfo) => (
                <tr key={c.id}>
                  {editingContact === c.id ? (
                    <td colSpan={6} className="px-4 py-2">
                      <ContactForm
                        initial={c}
                        onSave={data => updateContactMut.mutate({ id: c.id, data })}
                        onCancel={() => setEditingContact(null)}
                        loading={updateContactMut.isPending}
                      />
                    </td>
                  ) : (
                    <>
                      <TD className="w-10 text-gray-400">{c.sort_order}</TD>
                      <TD>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{c.type}</span>
                      </TD>
                      <TD className="font-medium">{c.label}</TD>
                      <TD className="text-brand-600 font-medium">{c.value}</TD>
                      <TD>
                        <Badge
                          label={c.is_active ? 'Активен' : 'Скрыт'}
                          variant={c.is_active ? 'success' : 'default'}
                        />
                      </TD>
                      <TD>
                        <div className="flex gap-2">
                          <Btn size="sm" variant="ghost" onClick={() => setEditingContact(c.id)}>
                            ✏️
                          </Btn>
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick={() => window.confirm('Удалить контакт?') && deleteContactMut.mutate(c.id)}
                          >
                            🗑️
                          </Btn>
                        </div>
                      </TD>
                    </>
                  )}
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}
