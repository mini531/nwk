import { useTranslation } from 'react-i18next'
import { KitIcon } from '../components/icons'

const ARRIVAL = [
  { id: 'arex', value: '₩4,450' },
  { id: 'limo', value: '₩17,000' },
  { id: 'tmoney', value: '₩2,500+' },
  { id: 'helpline', value: '1330' },
] as const

const MONEY = [
  { id: 'atmGlobal', value: '₩1,000–1,500' },
  { id: 'atmAirport', value: '₩3,500–5,000' },
  { id: 'cardFirst', value: '99%' },
  { id: 'exchangeMyeongdong', value: '−15원' },
] as const

const CONNECT = [
  { id: 'esimKt', value: '₩33,000' },
  { id: 'sim5day', value: '₩27,500' },
  { id: 'wifiPublic', value: 'FREE' },
] as const

const EMERGENCY = [
  { id: 'police', value: '112' },
  { id: 'fire', value: '119' },
  { id: 'medical', value: '1339' },
  { id: 'tourist', value: '1330' },
] as const

const PHRASES = [
  { id: 'hello', ko: '안녕하세요' },
  { id: 'thanks', ko: '감사합니다' },
  { id: 'howMuch', ko: '얼마예요?' },
  { id: 'tooExpensive', ko: '너무 비싸요' },
  { id: 'help', ko: '도와주세요' },
  { id: 'english', ko: '영어 할 수 있어요?' },
] as const

interface Section<T extends readonly { id: string }[]> {
  label: string
  items: T
  scope: string
}

const Row = ({ left, title, body }: { left: string; title: string; body: string }) => (
  <li className="flex items-start gap-4 px-4 py-3.5">
    <p className="w-[88px] shrink-0 text-[14px] font-semibold tabular-nums tracking-tight text-ink">
      {left}
    </p>
    <div className="min-w-0 flex-1">
      <p className="text-[15px] font-semibold tracking-tight text-ink">{title}</p>
      <p className="mt-0.5 text-[13px] leading-snug text-ink-3">{body}</p>
    </div>
  </li>
)

const Block = <T extends readonly { id: string; value: string }[]>({
  section,
}: {
  section: Section<T>
}) => {
  const { t } = useTranslation()
  return (
    <section>
      <p className="mb-2 px-1 text-[12px] font-semibold text-ink-3">{section.label}</p>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {section.items.map((item) => (
          <Row
            key={item.id}
            left={item.value}
            title={t(`${section.scope}.${item.id}.title`)}
            body={t(`${section.scope}.${item.id}.body`)}
          />
        ))}
      </ul>
    </section>
  )
}

export const KitPage = () => {
  const { t } = useTranslation()

  return (
    <div className="pb-4">
      <header className="mb-8 max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1">
          <KitIcon size={13} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">{t('page.kit.eyebrow')}</p>
        </div>
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[32px]">
          {t('page.kit.title')}
        </h1>
        <p className="text-[14px] leading-relaxed text-ink-2">{t('page.kit.subhead')}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        <Block
          section={{
            label: t('page.kit.sections.arrival'),
            items: ARRIVAL,
            scope: 'page.home.arrival',
          }}
        />
        <Block
          section={{
            label: t('page.kit.sections.money'),
            items: MONEY,
            scope: 'page.kit.money',
          }}
        />
        <Block
          section={{
            label: t('page.kit.sections.connect'),
            items: CONNECT,
            scope: 'page.kit.connect',
          }}
        />
        <Block
          section={{
            label: t('page.kit.sections.emergency'),
            items: EMERGENCY,
            scope: 'page.kit.emergency',
          }}
        />
      </div>

      <div className="mt-6 lg:mt-8">
        <section>
          <p className="mb-2 px-1 text-[12px] font-semibold text-ink-3">
            {t('page.kit.sections.phrases')}
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {PHRASES.map((p) => (
              <li key={p.id} className="flex items-start gap-4 px-4 py-3.5">
                <p className="w-[128px] shrink-0 text-[14px] font-semibold tracking-tight text-ink">
                  {p.ko}
                </p>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-snug text-ink-2">
                    {t(`page.kit.phrases.${p.id}`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
