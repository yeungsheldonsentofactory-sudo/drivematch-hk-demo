import { useMemo, useState } from 'react'
import { CalendarDays, Check, Copy, MessageCircle, Phone, Send, Share2, ShieldCheck, WalletCards, X } from 'lucide-react'
import { ensureVisitorSession, supabase } from './lib/supabase'
import PhotoGallery from './PhotoGallery'

const formatMoney = (value) => `HK$${Number(value || 0).toLocaleString('en-HK')}`
const whatsappNumber = (import.meta.env?.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')

const leadTypes = [
  { value: 'viewing', label: '預約睇車', icon: CalendarDays },
  { value: 'finance', label: '融資查詢', icon: WalletCards },
  { value: 'trade_in', label: 'Trade-in', icon: ShieldCheck },
]

function monthlyRepayment(principal, annualRate, months) {
  if (!principal || !months) return 0
  const rate = annualRate / 12
  return rate ? principal * rate * ((1 + rate) ** months) / (((1 + rate) ** months) - 1) : principal / months
}

export default function VehicleDetailDialog({ car, onClose, onChat }) {
  const [leadType, setLeadType] = useState('viewing')
  const [form, setForm] = useState({ name: '', phone: '', email: '', preferredAt: '', note: '' })
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [term, setTerm] = useState(60)
  const [downPercent, setDownPercent] = useState(30)

  const gallery = car?.gallery?.length ? car.gallery : Array.from({ length: 5 }, () => ({ url: car?.image, alt: '車輛展示相片' })).filter((image) => image.url)
  const finance = useMemo(() => {
    const downPayment = Math.round(Number(car?.price || 0) * (Number(downPercent) / 100))
    const loan = Math.max(0, Number(car?.price || 0) - downPayment)
    return { downPayment, loan, monthly: Math.round(monthlyRepayment(loan, 0.04, Number(term))) }
  }, [car?.price, downPercent, term])

  if (!car) return null

  const change = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const share = async () => {
    const url = window.location.href
    const text = `${car.brand} ${car.model} · ${formatMoney(car.price)} · ALPHA Motor Gallery`
    try {
      if (navigator.share) await navigator.share({ title: `${car.brand} ${car.model}`, text, url })
      else if (navigator.clipboard) { await navigator.clipboard.writeText(url); setNotice('車盤連結已複製，可直接分享給朋友。') }
      else setNotice('請從瀏覽器網址列複製此車盤連結。')
    } catch (error) {
      if (error?.name !== 'AbortError') setNotice('未能開啟分享功能，請從瀏覽器網址列複製連結。')
    }
  }
  const openWhatsapp = () => {
    if (!whatsappNumber) { setNotice('請先提交查詢；顧問會以你留下的電話或電郵聯絡。'); return }
    const body = encodeURIComponent(`你好，我想查詢 ${car.brand} ${car.model}（${formatMoney(car.price)}）。`)
    window.open(`https://wa.me/${whatsappNumber}?text=${body}`, '_blank', 'noopener,noreferrer')
  }
  const submitLead = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) { setNotice('請填寫姓名及電話號碼，讓顧問可以親自跟進。'); return }
    setSubmitting(true)
    setNotice('')
    try {
      await ensureVisitorSession()
      const messagePrefix = leadType === 'finance'
        ? `融資查詢（${term} 個月、首期約 ${downPercent}%）：`
        : leadType === 'trade_in' ? 'Trade-in 查詢：' : '預約睇車：'
      const { error } = await supabase.from('viewing_appointments').insert({
        vehicle_id: car.id,
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        preferred_at: form.preferredAt ? new Date(form.preferredAt).toISOString() : null,
        note: `${messagePrefix} ${form.note.trim()}`.trim(),
        lead_type: leadType,
        status: 'new',
        source: 'vehicle_detail',
      })
      if (error) throw error
      setNotice('已送交顧問團隊；這是一個真實查詢，團隊會親自跟進。')
      setForm({ name: '', phone: '', email: '', preferredAt: '', note: '' })
    } catch (error) {
      setNotice(`未能送出查詢：${error.message || '請稍後再試。'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const trustItems = [
    ['香港首次登記', car.firstRegistrationYear ? `${car.firstRegistrationYear} 年` : '待顧問確認'],
    ['行貨／水貨', car.importType || '待顧問確認'],
    ['驗車狀態', car.inspectionStatus === 'verified' ? '已驗證' : car.inspectionStatus === 'pending' ? '待驗證' : '未提供'],
    ['保養', car.warrantyMonths ? `${car.warrantyMonths} 個月` : '請向顧問查詢'],
  ]

  return <div className="vehicle-dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="vehicle-dialog vehicle-detail-85" role="dialog" aria-modal="true" aria-labelledby="vehicle-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="dialog-close" onClick={onClose} aria-label="關閉車輛詳情"><X size={22}/></button>
      <div className="vehicle-detail-media"><PhotoGallery className="vehicle-gallery" images={gallery} title={`${car.brand} ${car.model} 相片集`} resetKey={car.id}/></div>
      <div className="dialog-copy vehicle-detail-copy">
        <div className="detail-title-row"><span className="eyeline">{car.type} · 現貨</span><button type="button" className="share-button" onClick={share}><Share2 size={16}/>分享</button></div>
        <h2 id="vehicle-dialog-title">{car.brand} {car.model}</h2>
        <strong>{formatMoney(car.price)}</strong><p>{car.highlight}</p>
        <dl><div><dt>出廠年份</dt><dd>{car.year}</dd></div><div><dt>行駛里數</dt><dd>{Number(car.mileage || 0).toLocaleString()} 公里</dd></div><div><dt>車主數目</dt><dd>{car.owners} 手</dd></div></dl>
        <section className="vehicle-trust-card" aria-label="車況透明資料"><header><ShieldCheck size={17}/><b>車況及交易資料</b></header><div>{trustItems.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>{car.history && <p className="trust-note"><span>事故／維修紀錄</span>{car.history}</p>}{car.options && <p className="trust-note"><span>主要選配</span>{car.options}</p>}</section>
        <div className="detail-contact-actions"><button type="button" className="dialog-cta" onClick={onChat}><MessageCircle size={17}/>線上查詢</button><button type="button" className="outline-detail-button" onClick={openWhatsapp}><Phone size={16}/>WhatsApp</button></div>
      </div>
      <section className="vehicle-conversion-panel" aria-label="預約、融資及 Trade-in 查詢">
        <div className="lead-type-tabs" role="tablist" aria-label="查詢類型">{leadTypes.map(({ value, label, icon: Icon }) => <button key={value} type="button" role="tab" aria-selected={leadType === value} className={leadType === value ? 'active' : ''} onClick={() => setLeadType(value)}><Icon size={15}/>{label}</button>)}</div>
        {leadType === 'finance' && <section className="finance-estimate"><div><span>首期比例</span><select value={downPercent} onChange={(event) => setDownPercent(event.target.value)}><option value="20">20%</option><option value="30">30%</option><option value="40">40%</option></select></div><div><span>還款期</span><select value={term} onChange={(event) => setTerm(event.target.value)}><option value="36">36 個月</option><option value="48">48 個月</option><option value="60">60 個月</option></select></div><p>首期約 <b>{formatMoney(finance.downPayment)}</b> · 每月約 <b>{formatMoney(finance.monthly)}</b></p><small>以年利率 4% 作示範估算，最終條款以金融機構批核為準。</small></section>}
        <form className="vehicle-lead-form" onSubmit={submitLead}><div className="lead-form-heading"><div><span className="eyeline">顧問親自跟進</span><h3>{leadType === 'viewing' ? '預約睇車' : leadType === 'finance' ? '取得融資方案' : '了解 Trade-in 估值'}</h3></div><span>不會自動回覆</span></div><div className="lead-form-grid"><label>姓名<input required value={form.name} onChange={(event) => change('name', event.target.value)} autoComplete="name"/></label><label>電話<input required type="tel" value={form.phone} onChange={(event) => change('phone', event.target.value)} autoComplete="tel" inputMode="tel"/></label><label>電郵（選填）<input type="email" value={form.email} onChange={(event) => change('email', event.target.value)} autoComplete="email"/></label><label>{leadType === 'viewing' ? '理想睇車時間（選填）' : '方便聯絡時間（選填）'}<input type="datetime-local" value={form.preferredAt} onChange={(event) => change('preferredAt', event.target.value)}/></label><label className="full">備註（選填）<textarea value={form.note} onChange={(event) => change('note', event.target.value)} placeholder={leadType === 'trade_in' ? '可填寫你現有車輛的品牌、型號及年份' : '可留下特別要求或問題'}/></label></div>{notice && <p className={notice.startsWith('已送交') ? 'lead-notice success' : 'lead-notice'} role="status">{notice.startsWith('已送交') ? <Check size={15}/> : <Copy size={15}/>} {notice}</p>}<button className="lead-submit" disabled={submitting}>{submitting ? '正在送出…' : <><Send size={16}/>{leadType === 'viewing' ? '送出預約申請' : '送出顧問查詢'}</>}</button></form>
      </section>
    </section>
  </div>
}
