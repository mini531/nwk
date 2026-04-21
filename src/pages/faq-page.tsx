import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon, ChevronRightIcon } from '../components/icons'

// Canonical FAQ list — slugs are stable so translators/contest reviewers
// see the same question ordering across locales. Keep this short; deep
// reference material belongs in page.kit, not here.
const FAQ_SLUGS = [
  'entry',
  'payment',
  'wifi',
  'transport',
  'emergency',
  'tipping',
  'bagaji',
  'language',
] as const

export const FaqPage = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState<string | null>(FAQ_SLUGS[0])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-6">
      <header className="flex items-center gap-2 text-ink-3">
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm hover:text-ink">
          <ChevronRightIcon size={16} className="rotate-180" />
          {t('nav.profile')}
        </Link>
      </header>

      <section className="space-y-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
          {t('page.faq.label')}
        </p>
        <h1 className="nwk-display text-[24px] font-bold tracking-tight text-ink">
          {t('page.faq.title')}
        </h1>
        <p className="text-[13px] text-ink-2">{t('page.faq.subtitle')}</p>
      </section>

      <ul className="space-y-2">
        {FAQ_SLUGS.map((slug) => {
          const isOpen = open === slug
          return (
            <li key={slug} className="nwk-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : slug)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-canvas-2/40"
                aria-expanded={isOpen}
              >
                <span className="text-[14px] font-semibold text-ink">
                  {t(`page.faq.items.${slug}.q`)}
                </span>
                <ChevronDownIcon
                  size={14}
                  className={`shrink-0 text-ink-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-line px-4 py-3">
                  <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-2">
                    {t(`page.faq.items.${slug}.a`)}
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <section className="nwk-card p-4">
        <p className="text-[13px] font-semibold text-ink">{t('page.faq.more.title')}</p>
        <p className="mt-1 text-[12px] text-ink-2">{t('page.faq.more.body')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/kit"
            className="rounded-full bg-brand px-3 py-1.5 text-[12px] font-semibold text-on-brand"
          >
            {t('page.faq.more.kit')}
          </Link>
          <Link
            to="/check"
            className="rounded-full bg-canvas-2/80 px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:text-ink"
          >
            {t('page.faq.more.check')}
          </Link>
        </div>
      </section>
    </div>
  )
}
