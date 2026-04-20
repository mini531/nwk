import { useState, type ComponentType, type SVGProps } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertIcon, CoinIcon, GlobeIcon, KitIcon, SparkIcon, TrainIcon } from '../components/icons'

type TabKey = 'arrival' | 'money' | 'connect' | 'phrases' | 'emergency'

interface TabDef {
  key: TabKey
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
}

const TABS: TabDef[] = [
  { key: 'arrival', Icon: TrainIcon },
  { key: 'money', Icon: CoinIcon },
  { key: 'connect', Icon: GlobeIcon },
  { key: 'phrases', Icon: SparkIcon },
  { key: 'emergency', Icon: AlertIcon },
]

interface CardItem {
  id: string
  value: string
}

const ARRIVAL: CardItem[] = [
  { id: 'arex', value: '₩4,450' },
  { id: 'limo', value: '₩17,000' },
  { id: 'tmoney', value: '₩2,500+' },
  { id: 'helpline', value: '1330' },
  { id: 'immigration', value: 'K-ETA' },
  { id: 'customs', value: '$800' },
  { id: 'kakaoT', value: 'APP' },
]

const MONEY: CardItem[] = [
  { id: 'atmGlobal', value: '₩1,000–1,500' },
  { id: 'atmAirport', value: '₩3,500–5,000' },
  { id: 'cardFirst', value: '99%' },
  { id: 'exchangeMyeongdong', value: '−15원' },
  { id: 'wowpass', value: 'T-money' },
  { id: 'taxRefund', value: '10–15%' },
  { id: 'tipCulture', value: '0%' },
]

const CONNECT: CardItem[] = [
  { id: 'esimKt', value: '₩33,000' },
  { id: 'sim5day', value: '₩27,500' },
  { id: 'wifiPublic', value: 'FREE' },
  { id: 'kakaoTalk', value: 'APP' },
  { id: 'naverMap', value: 'APP' },
  { id: 'papago', value: 'APP' },
]

const EMERGENCY: CardItem[] = [
  { id: 'police', value: '112' },
  { id: 'fire', value: '119' },
  { id: 'medical', value: '1339' },
  { id: 'tourist', value: '1330' },
  { id: 'lostItem', value: '182' },
  { id: 'sexualViolence', value: '1366' },
  { id: 'humanRights', value: '1345' },
]

// Korean phrases with standardized romanization. The `ko` is shown in
// Hangul for learning; `romaji` helps non-Korean speakers pronounce;
// `meaning` is translated per UI language via i18n.
interface Phrase {
  id: string
  ko: string
  romaji: string
}

const PHRASES: Phrase[] = [
  { id: 'hello', ko: '안녕하세요', romaji: 'an-nyeong-ha-se-yo' },
  { id: 'thanks', ko: '감사합니다', romaji: 'gam-sa-ham-ni-da' },
  { id: 'sorry', ko: '죄송합니다', romaji: 'joe-song-ham-ni-da' },
  { id: 'yes', ko: '네', romaji: 'ne' },
  { id: 'no', ko: '아니요', romaji: 'a-ni-yo' },
  { id: 'howMuch', ko: '얼마예요?', romaji: 'eol-ma-ye-yo?' },
  { id: 'tooExpensive', ko: '너무 비싸요', romaji: 'neo-mu bi-ssa-yo' },
  { id: 'cheaper', ko: '깎아주세요', romaji: 'kka-kka-ju-se-yo' },
  { id: 'english', ko: '영어 할 수 있어요?', romaji: 'yeong-eo hal su i-sseo-yo?' },
  { id: 'help', ko: '도와주세요', romaji: 'do-wa-ju-se-yo' },
  { id: 'restroom', ko: '화장실 어디예요?', romaji: 'hwa-jang-sil eo-di-ye-yo?' },
  { id: 'water', ko: '물 한 잔 주세요', romaji: 'mul han jan ju-se-yo' },
  { id: 'notSpicy', ko: '안 맵게 해주세요', romaji: 'an maep-ge hae-ju-se-yo' },
  { id: 'check', ko: '계산서 주세요', romaji: 'gye-san-seo ju-se-yo' },
  { id: 'takeOut', ko: '포장해 주세요', romaji: 'po-jang-hae ju-se-yo' },
  { id: 'receipt', ko: '영수증 주세요', romaji: 'yeong-su-jeung ju-se-yo' },
  { id: 'wifiPw', ko: '와이파이 비밀번호요?', romaji: 'wa-i-pa-i bi-mil-beon-ho-yo?' },
  { id: 'oneMore', ko: '하나 더 주세요', romaji: 'ha-na deo ju-se-yo' },
  { id: 'here', ko: '여기요!', romaji: 'yeo-gi-yo!' },
  { id: 'delicious', ko: '맛있어요', romaji: 'ma-si-sseo-yo' },
]

const Row = ({ left, title, body }: { left: string; title: string; body: string }) => (
  <li className="flex items-start gap-3 px-4 py-3.5 sm:gap-4">
    <p className="w-[76px] shrink-0 text-[13px] font-semibold tabular-nums tracking-tight text-ink sm:w-[92px] sm:text-[14px]">
      {left}
    </p>
    <div className="min-w-0 flex-1">
      <p className="text-[14px] font-semibold tracking-tight text-ink sm:text-[15px]">{title}</p>
      <p className="mt-0.5 text-[12px] leading-snug text-ink-3 sm:text-[13px]">{body}</p>
    </div>
  </li>
)

const CardList = ({ items, scope }: { items: CardItem[]; scope: string }) => {
  const { t } = useTranslation()
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {items.map((item) => (
        <Row
          key={item.id}
          left={item.value}
          title={t(`${scope}.${item.id}.title`)}
          body={t(`${scope}.${item.id}.body`)}
        />
      ))}
    </ul>
  )
}

const PhraseList = () => {
  const { t } = useTranslation()
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {PHRASES.map((p) => (
        <li key={p.id} className="px-4 py-3.5">
          <p className="text-[16px] font-semibold leading-tight tracking-tight text-ink sm:text-[17px]">
            {p.ko}
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-brand">{p.romaji}</p>
          <p className="mt-1 text-[12px] leading-snug text-ink-2 sm:text-[13px]">
            {t(`page.kit.phrases.${p.id}`)}
          </p>
        </li>
      ))}
    </ul>
  )
}

const SectionHeader = ({ title, subhead }: { title: string; subhead?: string }) => (
  <header className="mb-3 space-y-1 px-1">
    <h2 className="text-[17px] font-semibold tracking-tight text-ink sm:text-[18px]">{title}</h2>
    {subhead && <p className="text-[12px] leading-snug text-ink-3 sm:text-[13px]">{subhead}</p>}
  </header>
)

export const KitPage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabKey>('arrival')

  return (
    <div className="pb-6">
      <header className="mb-5 max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1">
          <KitIcon size={13} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">{t('page.kit.eyebrow')}</p>
        </div>
        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[30px]">
          {t('page.kit.title')}
        </h1>
        <p className="text-[13px] leading-relaxed text-ink-2 sm:text-[14px]">
          {t('page.kit.subhead')}
        </p>
      </header>

      {/* Mobile-first tab bar: horizontally scrollable row. On larger screens
          it lays out normally within the content width. */}
      <nav
        aria-label={t('page.kit.tabs.label')}
        className="-mx-5 mb-5 overflow-x-auto px-5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max gap-1.5">
          {TABS.map(({ key, Icon }) => {
            const active = tab === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  active
                    ? 'border-ink bg-ink text-on-ink shadow-pop'
                    : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                {t(`page.kit.tabs.${key}`)}
              </button>
            )
          })}
        </div>
      </nav>

      {tab === 'arrival' && (
        <section className="space-y-4">
          <SectionHeader
            title={t('page.kit.sections.arrival')}
            subhead={t('page.kit.sectionSubs.arrival')}
          />
          <CardList items={ARRIVAL} scope="page.kit.arrival" />
        </section>
      )}

      {tab === 'money' && (
        <section className="space-y-4">
          <SectionHeader
            title={t('page.kit.sections.money')}
            subhead={t('page.kit.sectionSubs.money')}
          />
          <CardList items={MONEY} scope="page.kit.money" />
        </section>
      )}

      {tab === 'connect' && (
        <section className="space-y-4">
          <SectionHeader
            title={t('page.kit.sections.connect')}
            subhead={t('page.kit.sectionSubs.connect')}
          />
          <CardList items={CONNECT} scope="page.kit.connect" />
        </section>
      )}

      {tab === 'phrases' && (
        <section className="space-y-4">
          <SectionHeader
            title={t('page.kit.sections.phrases')}
            subhead={t('page.kit.sectionSubs.phrases')}
          />
          <PhraseList />
        </section>
      )}

      {tab === 'emergency' && (
        <section className="space-y-4">
          <SectionHeader
            title={t('page.kit.sections.emergency')}
            subhead={t('page.kit.sectionSubs.emergency')}
          />
          <CardList items={EMERGENCY} scope="page.kit.emergency" />
        </section>
      )}
    </div>
  )
}
