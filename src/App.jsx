import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowUpRight, Bell, CarFront, Check, ChevronDown, ClipboardList,
  FileText, Grid2X2, Heart, List, Menu, MessageCircle, Phone, Plus, Search, Send,
  ShieldCheck, SlidersHorizontal, Sparkles, UploadCloud, UserRound, X,
} from 'lucide-react'
import { ensureVisitorSession, supabase } from './lib/supabase'
import { resolveVehicleMediaUrls } from './lib/vehicleMedia'
import AdminDashboard from './AdminDashboard'
import VehicleDetailDialog from './VehicleDetailDialog'
import { useCustomerChat } from './useCustomerChat'

const basePath = import.meta.env?.BASE_URL || './'
const asset = (name) => `${basePath}assets/${name}`
const adminIdleTimeoutMs = 30 * 60 * 1000
const adminIdleKey = (userId) => `alphamotor-admin-last-activity-${userId}`
const fallbackImages = { Ferrari: asset('supercar-sf90.png'), Porsche: asset('porsche-911-carrera-studio-v2.png'), Tesla: asset('ev-sedan.png'), Toyota: asset('toyota-alphard-studio.png'), 'Mercedes-Benz': asset('mercedes-e300-studio-v2.png'), 'Mercedes‑Benz': asset('mercedes-e300-studio-v2.png'), Lexus: asset('lexus-ls500h-studio-v2.png') }
const vehiclePhotoLabels = ['車頭', '車尾', '車身左側', '車身右側', '車內籠']
const galleryForVehicle = async (hero, images = []) => {
  const ordered = [...images]
    .sort((a, b) => a.sort_order - b.sort_order)
  const signedUrls = await resolveVehicleMediaUrls(ordered.map((image) => image.storage_path))
  const uploaded = ordered
    .map((image, index) => ({ url: signedUrls[image.storage_path], alt: image.alt_text || vehiclePhotoLabels[index] }))
    .filter((image) => Boolean(image.url))
  const filler = Array.from({ length: Math.max(0, 5 - uploaded.length) }, (_, index) => ({ url: hero, alt: vehiclePhotoLabels[uploaded.length + index] }))
  return [...uploaded, ...filler].slice(0, 5)
}

const cars = [
  { id: 1, brand: 'Ferrari', model: 'SF90 Stradale', type: '超級跑車', year: 2022, price: 5980000, mileage: 8200, owners: 1, added: 6, highlight: '4.0L V8 混能 · 780 匹馬力', image: asset('supercar-sf90.png') },
  { id: 2, brand: 'Porsche', model: '911 Carrera S', type: '跑車', year: 2021, price: 1598000, mileage: 12500, owners: 2, added: 11, highlight: '3.0L 雙渦輪 · Sport Chrono', image: asset('porsche-911-carrera-studio-v2.png') },
  { id: 3, brand: 'Tesla', model: 'Model S Plaid', type: '電動車', year: 2023, price: 928000, mileage: 9400, owners: 1, added: 2, highlight: '三電馬達 · 0–100km/h 2.1s', image: asset('ev-sedan.png') },
  { id: 4, brand: 'Toyota', model: 'Alphard 2.5 SC', type: '七人商務車', year: 2020, price: 898000, mileage: 37500, owners: 1, added: 4, highlight: '7 座豪華車廂 · 雙天窗', image: asset('toyota-alphard-studio.png') },
  { id: 5, brand: 'Mercedes‑Benz', model: 'E 300 AMG Line', type: '高級家庭車', year: 2021, price: 468000, mileage: 28500, owners: 1, added: 8, highlight: '2.0L 渦輪 · 全景天幕', image: asset('mercedes-e300-studio-v2.png') },
  { id: 6, brand: 'Lexus', model: 'LS 500h Executive', type: '高級日本車', year: 2020, price: 568000, mileage: 41200, owners: 2, added: 15, highlight: '3.5L Hybrid · Mark Levinson', image: asset('lexus-ls500h-studio-v2.png') },
]

const vehicleTypes = [...new Set(cars.map((car) => car.type))]
const suggestions = [
  { label: 'Ferrari SF90 Stradale', brand: 'Ferrari', model: 'SF90 Stradale', image: asset('supercar-sf90.png') },
  { label: 'Ferrari SF90 Spider', brand: 'Ferrari', model: 'SF90 Spider', image: asset('supercar-sf90.png') },
  { label: 'Porsche 911 Carrera S', brand: 'Porsche', model: '911 Carrera S', image: asset('bmw-320i-studio.png') },
]

const submissionSeed = [
  { id: 'SUB-20260805-481', name: 'Mercedes‑Benz S 500 L AMG Line', year: 2021, mileage: '28,500 公里', owners: 1, color: '黑色', import: '平行進口', options: 'AMG Line Package、夜視輔助系統、Burmeister® 環迴立體聲、全景天窗', history: '沒有事故或維修紀錄；保養定期，外觀及內籠良好', image: asset('mercedes-e300-studio-v2.png'), status: '待審閱' },
  { id: 'SUB-20260805-482', name: 'BMW 740Li M Sport', year: 2020, mileage: '31,000 公里', owners: 2, color: '白色', import: '原廠行貨', options: 'Executive Lounge、360 鏡頭', history: '定期保養', image: asset('bmw-320i-studio.png'), status: '待審閱' },
  { id: 'SUB-20260805-483', name: 'Tesla Model 3 Performance', year: 2022, mileage: '18,700 公里', owners: 1, color: '珍珠白', import: '原廠行貨', options: 'Premium Connectivity', history: '沒有事故', image: asset('ev-sedan.png'), status: '待審閱' },
]

const price = (value) => `HK$${value.toLocaleString('en-HK')}`

function Header({ screen, onScreen }) {
  return <header className="apex-header">
    <a className="skip-link" href="#main-content">跳至主要內容</a>
    <button className="apex-brand" onClick={() => onScreen('buyer')} aria-label="ALPHA Motor Gallery 首頁">ALPHA <span>Motor Gallery</span></button>
    <div className="header-actions"><button className={`header-cta ${screen === 'buyer' ? 'soft-active' : ''}`} onClick={() => onScreen('buyer')} aria-label="我是買家"><UserRound size={16}/><span className="cta-full">我是買家</span><span className="cta-compact">買家</span></button><button className={`header-cta sell ${screen === 'seller' ? 'sell-active' : ''}`} onClick={() => onScreen('seller')} aria-label="我是賣家"><CarFront size={16}/><span className="cta-full">我是賣家</span><span className="cta-compact">賣車</span></button><button className="admin-entry" onClick={() => onScreen('login')}>管理員登入</button></div>
  </header>
}

function BuyerHome({ onScreen }) {
  const [liveCars, setLiveCars] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [sort, setSort] = useState('random')
  const [viewMode, setViewMode] = useState('grid')
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alphamotor-saved-vehicles') || '[]') } catch { return [] }
  })
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeCar, setActiveCar] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const customerChat = useCustomerChat({ enabled: chatOpen, subject: '買車查詢' })
  const searchMatches = query.trim().length > 1 ? liveCars.filter((item) => `${item.brand} ${item.model}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5).map((item) => ({ label: `${item.brand} ${item.model}`, brand: item.brand, model: item.model, image: item.image })) : []
  const filterCount = selectedTypes.length + Number(Boolean(selectedBrand))
  const inventory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const found = liveCars.filter((car) => (!selectedBrand || car.brand === selectedBrand) && (!selectedTypes.length || selectedTypes.includes(car.type)) && (!normalizedQuery || `${car.brand} ${car.model} ${car.type}`.toLowerCase().includes(normalizedQuery)))
    const result = [...found]
    const rules = { low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, new: (a, b) => a.added - b.added, old: (a, b) => b.added - a.added, year: (a, b) => b.year - a.year, mileage: (a, b) => a.mileage - b.mileage, owners: (a, b) => a.owners - b.owners }
    return sort === 'random' ? result : result.sort(rules[sort])
  }, [liveCars, query, selectedBrand, selectedTypes, sort])
  const loadInventory = useCallback(async () => {
    const { data, error } = await supabase.from('vehicles').select('*, vehicle_images(id, storage_path, alt_text, sort_order)').eq('status', 'published').order('published_at', { ascending: false })
    if (error) { setInventoryError('即時車盤暫時未能更新，正顯示已儲存的預覽資料。'); setLiveCars(cars); setInventoryLoading(false); return }
    setInventoryError('')
    const live = await Promise.all((data || []).map(async (car) => {
      const fallback = car.hero_image_url || fallbackImages[car.brand] || asset('ev-sedan.png')
      const gallery = await galleryForVehicle(fallback, car.vehicle_images)
      const image = gallery[0]?.url || fallback
      return {
        id: car.id, brand: car.brand, model: car.model, type: car.vehicle_type, year: car.year, price: car.price_hkd,
        mileage: car.mileage_km, owners: car.owner_count, added: 0, highlight: car.highlight || '已由 ALPHA Motor Gallery 團隊核實', image,
        gallery, firstRegistrationYear: car.first_registration_year, importType: car.import_type,
        options: car.options, history: car.history, inspectionStatus: car.inspection_status, warrantyMonths: car.warranty_months,
      }
    }))
    setLiveCars(live)
    setInventoryLoading(false)
  }, [])
  useEffect(() => { void loadInventory() }, [loadInventory])
  useEffect(() => { localStorage.setItem('alphamotor-saved-vehicles', JSON.stringify(saved)) }, [saved])
  useEffect(() => {
    const sharedCarId = new URLSearchParams(window.location.search).get('car')
    if (!sharedCarId) return
    const sharedCar = liveCars.find((car) => String(car.id) === sharedCarId)
    if (sharedCar) setActiveCar(sharedCar)
  }, [liveCars])
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') { setActiveCar(null); setFilterOpen(false) } }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])
  const selectSuggestion = (item) => { setSelectedBrand(item.brand); setQuery(item.model === 'SF90 Spider' ? 'SF90' : item.model) }
  const clearFilters = () => { setSelectedBrand(''); setSelectedTypes([]); setQuery('') }
  const toggleType = (type) => setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])
  const openVehicle = (car) => {
    setActiveCar(car)
    const url = new URL(window.location.href)
    url.searchParams.set('car', car.id)
    window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }
  const closeVehicle = () => {
    setActiveCar(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('car')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }
  return <div className="site-shell"><Header screen="buyer" onScreen={onScreen}/><main id="main-content" className="buyer-main">
    <section className="search-stage" aria-labelledby="buyer-title"><span className="eyeline search-eyeline"><Sparkles size={14}/>精選現貨 · 香港</span><h1 id="buyer-title">每架現貨，都值得親身細看。</h1><p>從超級跑車到七人商務車，精選現貨即時更新。</p><div className="intelligent-search"><Search size={22} aria-hidden="true"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋車款、品牌或型號，例如 Ferrari SF" aria-label="智能搜尋車款" autoComplete="off"/><button className={query ? 'search-clear visible' : 'search-clear'} aria-label="清除搜尋" onClick={() => setQuery('')} disabled={!query}><X size={18}/></button></div>{searchMatches.length > 0 && <div className="suggestion-menu" role="listbox" aria-label="搜尋建議">{searchMatches.map((item) => <button role="option" key={item.label} onClick={() => selectSuggestion(item)}><img src={item.image} alt=""/><span>{item.label}</span><ArrowUpRight size={17}/></button>)}</div>}</section>
    <section className="inventory-section" aria-labelledby="inventory-title"><div className="inventory-toolbar"><div><span className="eyeline">現貨車盤</span><h2 id="inventory-title">{selectedBrand ? `${selectedBrand} 精選現貨` : '今日精選現貨'}</h2><p className="result-count" aria-live="polite">共 {inventory.length} 架符合條件的現貨{filterCount ? ` · 已套用 ${filterCount} 個篩選` : ''}</p></div><div className="toolbar-controls"><button className={`filter-button ${filterCount ? 'filter-active' : ''}`} onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen} aria-controls="inventory-filters"><SlidersHorizontal size={17}/>篩選條件{filterCount ? <b>{filterCount}</b> : null}</button><label className="sort-select"><span className="sr-only">排序</span>排序：<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="random">隨機顯示</option><option value="low">價錢：低至高</option><option value="high">價錢：高至低</option><option value="new">上架日期：最新</option><option value="old">上架日期：最舊</option><option value="year">出廠年份</option><option value="mileage">行駛里數</option><option value="owners">車主擁有數</option></select><ChevronDown size={15}/></label><div className="view-mode-toggle" role="group" aria-label="車盤顯示方式"><button type="button" className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'}><Grid2X2 size={16}/><span>圖片</span></button><button type="button" className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'}><List size={17}/><span>列表</span></button></div></div></div>
      {filterOpen && <div id="inventory-filters" className="filter-panel"><div><span className="filter-label">車種</span><div className="filter-chips">{vehicleTypes.map((type) => <button key={type} className={selectedTypes.includes(type) ? 'selected' : ''} aria-pressed={selectedTypes.includes(type)} onClick={() => toggleType(type)}>{type}</button>)}</div></div><div className="filter-panel-footer"><span>{filterCount ? '選擇更多條件以縮小範圍' : '未選擇額外篩選條件'}</span><button onClick={clearFilters} disabled={!filterCount && !query}>清除全部</button></div></div>}
      {inventoryError && <p className="inventory-status" role="status">{inventoryError}<button type="button" onClick={() => void loadInventory()}>重試連線</button></p>}
      {inventoryLoading ? <p className="inventory-status" role="status">正在載入現貨車盤…</p> : viewMode === 'grid' ? <div className="inventory-grid">{inventory.map((car) => <article className="vehicle-card" key={car.id}><button className="vehicle-card-main" onClick={() => openVehicle(car)} aria-label={`查看 ${car.brand} ${car.model} 詳情`}><div className="vehicle-image"><img src={car.image} alt={`${car.brand} ${car.model}`}/><span>{car.type}</span><i>查看詳情 <ArrowUpRight size={15}/></i></div><div className="vehicle-copy"><div className="vehicle-line"><h3>{car.brand} {car.model}</h3><strong>{price(car.price)}</strong></div><p>{car.year} ・ {Number(car.mileage || 0).toLocaleString()} 公里 ・ {car.owners} 手</p><div className="vehicle-highlight">{car.highlight}</div></div></button><button className={`save-button ${saved.includes(car.id) ? 'saved' : ''}`} onClick={() => setSaved((current) => current.includes(car.id) ? current.filter((id) => id !== car.id) : [...current, car.id])} aria-label={saved.includes(car.id) ? `取消收藏 ${car.model}` : `收藏 ${car.model}`} aria-pressed={saved.includes(car.id)}><Heart size={21} fill={saved.includes(car.id) ? 'currentColor' : 'none'}/></button></article>)}</div> : <div className="inventory-list" role="list">{inventory.map((car) => <article className="vehicle-listing" role="listitem" key={car.id}><button className="vehicle-listing-main" onClick={() => openVehicle(car)} aria-label={`查看 ${car.brand} ${car.model} 詳情`}><img src={car.image} alt={`${car.brand} ${car.model}`}/><div className="vehicle-listing-copy"><div className="vehicle-listing-head"><div><span>{car.type}</span><h3>{car.brand} {car.model}</h3></div><strong>{price(car.price)}</strong></div><div className="listing-specs"><span>{car.year} 年</span><span>{Number(car.mileage || 0).toLocaleString()} 公里</span><span>{car.owners} 手</span></div><p>{car.highlight}</p></div><ArrowUpRight className="listing-arrow" size={18}/></button><button className={`listing-save ${saved.includes(car.id) ? 'saved' : ''}`} onClick={() => setSaved((current) => current.includes(car.id) ? current.filter((id) => id !== car.id) : [...current, car.id])} aria-label={saved.includes(car.id) ? `取消收藏 ${car.model}` : `收藏 ${car.model}`} aria-pressed={saved.includes(car.id)}><Heart size={20} fill={saved.includes(car.id) ? 'currentColor' : 'none'}/></button></article>)}</div>}
      {inventory.length === 0 && <div className="empty-state"><Search size={28}/><h3>未找到相關車盤</h3><p>可嘗試搜尋品牌、型號，或移除部分篩選條件。</p><button onClick={clearFilters}>顯示所有現貨</button></div>}
    </section>
    <section className="trust-band"><div className="years">30<small>YEARS</small></div><div><h2>汽車業界 30 年經驗</h2><p>合作夥伴及團隊成員曾於香港 Ferrari、Lamborghini、McLaren 及 Porsche 等品牌擔任管理職位，並與品牌香港持有人緊密合作。</p></div><ShieldCheck size={34}/></section>
  </main><VehicleDetailDialog car={activeCar} onClose={closeVehicle} onChat={() => { closeVehicle(); setChatOpen(true) }}/><ChatWidget open={chatOpen} setOpen={setChatOpen} {...customerChat}/></div>
}

function ChatWidget({ open, setOpen, messages, message, setMessage, send, status, error }) {
  const connected = status === 'ready' || status === 'sending'
  return <div className="chat-wrap">{open && <section className="chat-panel" aria-label="線上客服對話"><header><div><MessageCircle size={18}/>線上客服<small>{status === 'connecting' ? '正在安全連接客服…' : '客服會親自回覆，對話會保留於此裝置。'}</small></div><button onClick={() => setOpen(false)} aria-label="關閉線上客服"><X size={18}/></button></header><div className="chat-log" aria-live="polite">{messages.length === 0 && <p className="chat-empty">請留下訊息，客服團隊會親自回覆。</p>}{messages.map((item) => <p key={item.id} className={item.from}>{item.body}</p>)}</div>{error && <p className="chat-error" role="alert">{error}</p>}<form onSubmit={send}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="輸入訊息…" aria-label="輸入客服訊息" disabled={!connected}/><button aria-label="發送訊息" disabled={!connected || status === 'sending'}>{status === 'sending' ? '…' : <Send size={18}/>}</button></form></section>}<button className="chat-launcher" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="線上客服"><MessageCircle size={23}/><b>線上客服</b></button></div>
}

const requiredSellerPhotos = [
  { key: 'front', label: '車頭', hint: '正面完整車頭' },
  { key: 'rear', label: '車尾', hint: '正面完整車尾' },
  { key: 'left', label: '車身左側', hint: '左側全車身' },
  { key: 'right', label: '車身右側', hint: '右側全車身' },
  { key: 'interior', label: '車內籠', hint: '前排與內籠狀況' },
]
const sellerDraftKey = 'alphamotor-seller-vehicle-draft-v1'
const sellerDraftFields = ['carName', 'year', 'registrationYear', 'import', 'owners', 'mileage', 'color', 'options', 'history']

function SellerPageRequiredPhotos({ onScreen }) {
  const photoRefs = useRef({})
  const formRef = useRef(null)
  const [photos, setPhotos] = useState({})
  const [form, setForm] = useState(() => {
    try { return { ...emptySellerForm, ...JSON.parse(localStorage.getItem(sellerDraftKey) || '{}') } } catch { return emptySellerForm }
  })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const customerChat = useCustomerChat({ enabled: chatOpen, subject: '賣車查詢' })
  const completePhotos = requiredSellerPhotos.every((slot) => photos[slot.key]?.file)
  const errors = {
    carName: !form.carName.trim() ? '請填寫車廠及型號。' : '',
    year: !/^20\d{2}$/.test(form.year) ? '請輸入四位數出廠年份。' : '',
    import: !form.import ? '請選擇水貨或行貨。' : '',
    owners: !form.owners ? '請填寫車主數目。' : '',
    mileage: !form.mileage ? '請填寫總行駛里程。' : '',
    name: !form.name.trim() ? '請填寫聯絡人姓名。' : '',
    phone: !form.phone.trim() ? '請填寫電話號碼。' : '',
    email: form.email && !/^\S+@\S+\.\S+$/.test(form.email) ? '請輸入有效電郵地址。' : '',
    photos: completePhotos ? '' : '請按指定角度上載全部 5 張相片。',
  }
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  useEffect(() => {
    const draft = Object.fromEntries(sellerDraftFields.map((key) => [key, form[key]]))
    localStorage.setItem(sellerDraftKey, JSON.stringify(draft))
  }, [form])
  const clearDraft = () => {
    localStorage.removeItem(sellerDraftKey)
    setForm(emptySellerForm)
    setTouched({})
    setSubmitError('已清除本裝置的車輛資料草稿。相片及聯絡資料不會被保存。')
  }
  const touch = (name) => setTouched((current) => ({ ...current, [name]: true }))
  const setPhoto = (slot, file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setSubmitError('請選擇 JPG、PNG、WEBP 等圖片檔案。'); return }
    if (file.size > 10 * 1024 * 1024) { setSubmitError('每張相片不可超過 10MB。'); return }
    setSubmitError('')
    setPhotos((current) => {
      if (current[slot.key]?.url) URL.revokeObjectURL(current[slot.key].url)
      return { ...current, [slot.key]: { file, url: URL.createObjectURL(file) } }
    })
    touch('photos')
  }
  const removePhoto = (slot) => {
    setPhotos((current) => {
      if (current[slot.key]?.url) URL.revokeObjectURL(current[slot.key].url)
      const next = { ...current }
      delete next[slot.key]
      return next
    })
    touch('photos')
  }
  const submit = async (event) => {
    event.preventDefault()
    setTouched(Object.fromEntries(Object.keys(errors).map((key) => [key, true])))
    if (Object.values(errors).some(Boolean)) {
      window.requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setUploading(true)
    setSubmitError('')
    try {
      await ensureVisitorSession()
      const body = new FormData()
      body.set('car_name', form.carName.trim())
      body.set('year', form.year)
      body.set('registration_year', form.registrationYear)
      body.set('import_type', form.import)
      body.set('owner_count', form.owners)
      body.set('mileage_km', String(form.mileage).replace(/[^0-9]/g, ''))
      body.set('color', form.color.trim())
      body.set('options', form.options.trim())
      body.set('history', form.history.trim())
      body.set('contact_name', form.name.trim())
      body.set('phone', form.phone.trim())
      body.set('email', form.email.trim())
      requiredSellerPhotos.forEach((slot) => body.set(`photo_${slot.key}`, photos[slot.key].file, photos[slot.key].file.name))
      const { error } = await supabase.functions.invoke('seller-submission-intake', { body })
      if (error) throw error
      localStorage.removeItem(sellerDraftKey)
      setSubmitted(true)
    } catch (error) {
      setSubmitError(`提交失敗：${error.message || '請稍後再試。'}`)
    } finally {
      setUploading(false)
    }
  }
  if (submitted) return <div className="site-shell"><Header screen="seller" onScreen={onScreen}/><main id="main-content" className="seller-layout confirmation"><Check size={36}/><h1>已收到你的車輛資料</h1><p>五張指定角度相片及車輛資料已安全送交內部審閱；車盤不會直接公開。</p><button className="dark-button" onClick={() => onScreen('buyer')}>返回現貨車盤</button></main></div>
  const hasVisibleErrors = Object.values(touched).some(Boolean) && Object.values(errors).some(Boolean)
  return <div className="site-shell"><Header screen="seller" onScreen={onScreen}/><main id="main-content" className="seller-layout"><button className="back-link" onClick={() => onScreen('buyer')}><ArrowLeft size={17}/>返回買家瀏覽</button><div className="seller-heading"><span className="eyeline">賣家專區</span><h1>讓專業團隊，替你的愛車找對下一位車主。</h1><p>提交資料後由內部審閱，不會直接顯示在網站。</p></div><div className="seller-choice"><section><FileText size={26}/><h2>提交車輛資訊</h2><p>請提供五個指定角度的相片，讓團隊可先作初步評估。</p></section><section><MessageCircle size={26}/><h2>線上客服查詢賣車</h2><p>即時與顧問討論估值、交車及寄賣安排。</p><button className="outline-button" onClick={() => setChatOpen(true)}>開啟線上客服</button></section></div><form ref={formRef} className="seller-form" onSubmit={submit} noValidate><div className="form-title"><div><h2>車輛資料及相片</h2><p>五張指定角度相片均為必填，資料會安全保留作內部審閱。</p></div><span className="form-progress" aria-label="表單進度">1 車輛資料 <i/> 2 聯絡方式</span></div>{hasVisibleErrors && <div className="form-error-summary" role="alert"><strong>請先處理標示的必填欄位。</strong><span>必須上載全部五個指定角度的相片。</span></div>}<section className={`required-photo-section ${touched.photos && errors.photos ? 'field-invalid' : ''}`} aria-labelledby="required-photo-title"><div className="required-photo-heading"><div><span className="eyeline">必填相片</span><h3 id="required-photo-title">上載 5 張指定角度相片</h3></div><b>{Object.keys(photos).length} / 5</b></div><div className="required-photo-grid">{requiredSellerPhotos.map((slot) => { const photo = photos[slot.key]; return <div className="required-photo-slot" key={slot.key}><button type="button" className={photo ? 'photo-slot-filled' : ''} onClick={() => photoRefs.current[slot.key]?.click()} aria-label={`上載${slot.label}`}>{photo ? <img src={photo.url} alt={`${slot.label}預覽`}/> : <><UploadCloud size={25}/><strong>{slot.label}</strong><span>{slot.hint}</span></>} </button><input ref={(node) => { photoRefs.current[slot.key] = node }} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setPhoto(slot, event.target.files?.[0]); event.target.value = '' }}/>{photo && <button className="replace-photo" type="button" onClick={() => photoRefs.current[slot.key]?.click()}>更換</button>}{photo && <button className="remove-photo" type="button" onClick={() => removePhoto(slot)} aria-label={`移除${slot.label}`}><X size={14}/></button>}</div> })}</div><small className="required-photo-note">JPG、PNG 或 WEBP；每張最多 10MB。上載後可隨時更換。</small></section>{touched.photos && errors.photos && <p className="field-error" role="alert">{errors.photos}</p>}<div className="form-grid"><Field label="車廠及型號" name="carName" value={form.carName} onChange={update} onBlur={touch} error={touched.carName && errors.carName} required placeholder="例如 Mercedes‑Benz S 500 L" autoComplete="off"/><Field label="出廠年份" name="year" value={form.year} onChange={update} onBlur={touch} error={touched.year && errors.year} required placeholder="例如 2021" inputMode="numeric" maxLength="4"/><Field label="香港首次登記年份" name="registrationYear" value={form.registrationYear} onChange={update} onBlur={touch} placeholder="例如 2021" inputMode="numeric" maxLength="4"/><SelectField label="水貨 / 行貨" name="import" value={form.import} onChange={update} onBlur={touch} error={touched.import && errors.import} required options={['水貨 / 平行進口', '行貨']}/><Field label="車主數目" name="owners" value={form.owners} onChange={update} onBlur={touch} error={touched.owners && errors.owners} required placeholder="例如 1" inputMode="numeric"/><Field label="總行駛里程數" name="mileage" value={form.mileage} onChange={update} onBlur={touch} error={touched.mileage && errors.mileage} required placeholder="例如 28,500 公里" inputMode="numeric"/><Field label="車輛顏色" name="color" value={form.color} onChange={update} onBlur={touch} placeholder="例如 黑色"/><TextField label="車輛選配" name="options" value={form.options} onChange={update} onBlur={touch} placeholder="例如 全景天窗、升級音響、駕駛輔助套件"/><TextField label="事故及維修紀錄" name="history" value={form.history} onChange={update} onBlur={touch} placeholder="請如實填寫事故、維修或保養紀錄"/></div><div className="contact-block"><div><span className="eyeline">聯絡方式</span><h2>方便我們聯絡你</h2><p>資料只會用於本次車輛評估及跟進。</p></div><div className="form-grid"><Field label="聯絡人姓名" name="name" value={form.name} onChange={update} onBlur={touch} error={touched.name && errors.name} required placeholder="你的姓名" autoComplete="name"/><Field label="電話號碼" name="phone" value={form.phone} onChange={update} onBlur={touch} error={touched.phone && errors.phone} required placeholder="例如 9123 4567" type="tel" autoComplete="tel" inputMode="tel"/><Field label="電郵地址（選填）" name="email" value={form.email} onChange={update} onBlur={touch} error={touched.email && errors.email} placeholder="name@example.com" type="email" autoComplete="email"/></div></div>{submitError && <p className="form-submit-error" role="alert">{submitError}</p>}<button className="dark-button submit-sale" disabled={uploading}>{uploading ? '正在安全上載 5 張相片…' : <>提交資料供內部審閱 <ArrowUpRight size={17}/></>}</button></form></main><ChatWidget open={chatOpen} setOpen={setChatOpen} {...customerChat}/></div>
}

const emptySellerForm = { carName: '', year: '', registrationYear: '', import: '', owners: '', mileage: '', color: '', options: '', history: '', name: '', phone: '', email: '' }

/* Removed legacy local-only seller/chat prototype. Customer support now always
   uses useCustomerChat and Supabase messages, with no automated replies. */
/*
function SellerPage({ onScreen }) {
  const fileRef = useRef(null)
  const formRef = useRef(null)
  const [files, setFiles] = useState([])
  const [form, setForm] = useState(emptySellerForm)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chat, setChat] = useState(() => JSON.parse(localStorage.getItem('alphamotor-chat') || '[{"from":"agent","body":"你好，有咩車款想了解？"}]'))
  const [message, setMessage] = useState('')
  const errors = { carName: !form.carName.trim() ? '請填寫車廠及型號。' : '', year: !/^20\d{2}$/.test(form.year) ? '請輸入四位數出廠年份。' : '', import: !form.import ? '請選擇水貨或行貨。' : '', owners: !form.owners ? '請填寫車主數目。' : '', mileage: !form.mileage ? '請填寫總行駛里程。' : '', name: !form.name.trim() ? '請填寫聯絡人姓名。' : '', phone: !form.phone.trim() ? '請填寫電話號碼。' : '', email: form.email && !/^\S+@\S+\.\S+$/.test(form.email) ? '請輸入有效電郵地址。' : '', photos: !files.length ? '請至少上載一張車輛相片。' : '' }
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const touch = (name) => setTouched((current) => ({ ...current, [name]: true }))
  const addFiles = (list) => setFiles((current) => [...current, ...Array.from(list || []).filter((file) => file.type.startsWith('image/')).slice(0, 8 - current.length).map((file) => ({ name: file.name, url: URL.createObjectURL(file) }))])
  const submit = (event) => {
    event.preventDefault()
    setTouched(Object.fromEntries(Object.keys(errors).map((key) => [key, true])))
    if (Object.values(errors).some(Boolean)) {
      window.requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setSubmitted(true)
  }
  const send = (event) => { event.preventDefault(); if (!message.trim()) return; const next = [...chat, { from: 'buyer', body: message.trim() }]; setChat(next); localStorage.setItem('alphamotor-chat', JSON.stringify(next)); setMessage('') }
  if (submitted) return <div className="site-shell"><Header screen="seller" onScreen={onScreen}/><main id="main-content" className="seller-layout confirmation"><Check size={36}/><h1>已收到你的車輛資料</h1><p>車盤不會直接公開；我們的團隊會先審閱，再以電話或線上客服聯絡你。</p><button className="dark-button" onClick={() => onScreen('buyer')}>返回現貨車盤</button></main></div>
  const hasVisibleErrors = Object.values(touched).some(Boolean) && Object.values(errors).some(Boolean)
  return <div className="site-shell"><Header screen="seller" onScreen={onScreen}/><main id="main-content" className="seller-layout"><button className="back-link" onClick={() => onScreen('buyer')}><ArrowLeft size={17}/>返回買家瀏覽</button><div className="seller-heading"><span className="eyeline">賣家專區</span><h1>讓專業團隊，替你的愛車找對下一位車主。</h1><p>提交資料後由內部審閱，不會直接顯示在網站。</p></div><div className="seller-choice"><section><FileText size={26}/><h2>提交車輛資訊</h2><p>填寫基本資料、車況與相片，我們會主動評估及聯絡。</p></section><section><MessageCircle size={26}/><h2>線上客服查詢賣車</h2><p>即時與顧問討論估值、交車及寄賣安排。</p><button className="outline-button" onClick={() => setChatOpen(true)}>開啟線上客服</button></section></div><form ref={formRef} className="seller-form" onSubmit={submit} noValidate><div className="form-title"><div><h2>車輛資料</h2><p>先填基本資料，未完成的欄位會保留於此瀏覽器。</p></div><span className="form-progress" aria-label="表單進度">1 車輛資料 <i/> 2 聯絡方式</span></div>{hasVisibleErrors && <div className="form-error-summary" role="alert"><strong>請先處理標示的必填欄位。</strong><span>系統已帶你到第一個需要補充的欄位。</span></div>}<div className={`photo-drop ${touched.photos && errors.photos ? 'field-invalid' : ''}`} onClick={() => fileRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); touch('photos') }}><UploadCloud size={34}/><strong>上載車輛相片 <em>*</em></strong><span>拖放相片到這裡，或按此選擇檔案</span><small>JPG、PNG；最多 8 張</small><input ref={fileRef} type="file" accept="image/*" multiple onChange={(event) => { addFiles(event.target.files); touch('photos') }}/></div>{touched.photos && errors.photos && <p className="field-error" role="alert">{errors.photos}</p>}{files.length > 0 && <div className="seller-thumbs">{files.map((file, index) => <div key={file.url}><img src={file.url} alt={file.name}/><button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} aria-label={`移除 ${file.name}`}><X size={13}/></button></div>)}</div>}<div className="form-grid"><Field label="車廠及型號" name="carName" value={form.carName} onChange={update} onBlur={touch} error={touched.carName && errors.carName} required placeholder="例如 Mercedes‑Benz S 500 L" autoComplete="off"/><Field label="出廠年份" name="year" value={form.year} onChange={update} onBlur={touch} error={touched.year && errors.year} required placeholder="例如 2021" inputMode="numeric" maxLength="4"/><Field label="香港首次登記年份" name="registrationYear" value={form.registrationYear} onChange={update} onBlur={touch} placeholder="例如 2021" inputMode="numeric" maxLength="4"/><SelectField label="水貨 / 行貨" name="import" value={form.import} onChange={update} onBlur={touch} error={touched.import && errors.import} required options={['水貨 / 平行進口', '行貨']}/><Field label="車主數目" name="owners" value={form.owners} onChange={update} onBlur={touch} error={touched.owners && errors.owners} required placeholder="例如 1" inputMode="numeric"/><Field label="總行駛里程數" name="mileage" value={form.mileage} onChange={update} onBlur={touch} error={touched.mileage && errors.mileage} required placeholder="例如 28,500 公里" inputMode="numeric"/><Field label="車輛顏色" name="color" value={form.color} onChange={update} onBlur={touch} placeholder="例如 黑色"/><TextField label="車輛選配" name="options" value={form.options} onChange={update} onBlur={touch} placeholder="例如 全景天窗、升級音響、駕駛輔助套件"/><TextField label="事故及維修紀錄" name="history" value={form.history} onChange={update} onBlur={touch} placeholder="請如實填寫事故、維修或保養紀錄"/></div><div className="contact-block"><div><span className="eyeline">聯絡方式</span><h2>方便我們聯絡你</h2><p>資料只會用於本次車輛評估及跟進。</p></div><div className="form-grid"><Field label="聯絡人姓名" name="name" value={form.name} onChange={update} onBlur={touch} error={touched.name && errors.name} required placeholder="你的姓名" autoComplete="name"/><Field label="電話號碼" name="phone" value={form.phone} onChange={update} onBlur={touch} error={touched.phone && errors.phone} required placeholder="例如 9123 4567" type="tel" autoComplete="tel" inputMode="tel"/><Field label="電郵地址（選填）" name="email" value={form.email} onChange={update} onBlur={touch} error={touched.email && errors.email} placeholder="name@example.com" type="email" autoComplete="email"/></div></div><button className="dark-button submit-sale">提交資料供內部審閱 <ArrowUpRight size={17}/></button></form></main><ChatWidget open={chatOpen} setOpen={setChatOpen} chat={chat} message={message} setMessage={setMessage} send={send}/></div>
}
*/

function Field({ label, name, value, onChange, onBlur, error, required, ...props }) { return <label className={`form-field ${error ? 'field-invalid' : ''}`}><span>{label}{required && <em> *</em>}</span><input name={name} value={value} onChange={(event) => onChange(name, event.target.value)} onBlur={() => onBlur(name)} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...props}/>{error && <small id={`${name}-error`} className="field-error" role="alert">{error}</small>}</label> }
function SelectField({ label, name, value, onChange, onBlur, error, required, options }) { return <label className={`form-field ${error ? 'field-invalid' : ''}`}><span>{label}{required && <em> *</em>}</span><select name={name} value={value} onChange={(event) => onChange(name, event.target.value)} onBlur={() => onBlur(name)} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}><option value="" disabled>請選擇</option>{options.map((option) => <option key={option}>{option}</option>)}</select>{error && <small id={`${name}-error`} className="field-error" role="alert">{error}</small>}</label> }
function TextField({ label, name, value, onChange, onBlur, error, placeholder }) { return <label className={`form-field full ${error ? 'field-invalid' : ''}`}><span>{label}</span><textarea name={name} value={value} onChange={(event) => onChange(name, event.target.value)} onBlur={() => onBlur(name)} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}/>{error && <small id={`${name}-error`} className="field-error" role="alert">{error}</small>}</label> }

function AdminLogin({ onScreen, onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) { setError('電郵或密碼不正確。'); setLoading(false); return }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role, display_name').eq('id', data.user.id).single()
    if (profileError || !['admin', 'manager', 'staff'].includes(profile.role)) { await supabase.auth.signOut(); setError('此帳戶沒有內部系統權限。'); setLoading(false); return }
    onAuthenticated({ user: data.user, profile }); onScreen('admin')
  }
  return <div className="site-shell"><Header screen="login" onScreen={onScreen}/><main id="main-content" className="admin-login"><form onSubmit={submit}><span className="eyeline">內部系統</span><h1>管理員登入</h1><p>只限獲授權的 ALPHA Motor Gallery 團隊成員。</p><label>電郵地址<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required/></label><label>密碼<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required/></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="dark-button" disabled={loading}>{loading ? '正在驗證…' : '登入管理系統'} <ArrowUpRight size={17}/></button><button type="button" className="back-link" onClick={() => onScreen('buyer')}>返回公開車盤</button></form></main></div>
}

function LegacyAdminPanel({ onSignOut }) {
  const [selected, setSelected] = useState(submissionSeed[0])
  const [notes, setNotes] = useState(['需要留牌', '無牌費', '進口車'])
  const [action, setAction] = useState('')
  const toggleNote = (note) => setNotes((current) => current.includes(note) ? current.filter((item) => item !== note) : [...current, note])
  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-logo">ALPHA<small>MOTOR GALLERY · HONG KONG</small></div><nav><button className="active"><CarFront size={20}/>車盤審閱 <b>12</b></button><button><Plus size={20}/>新增車盤</button><button><ClipboardList size={20}/>已上架</button><button><MessageCircle size={20}/>客戶訊息 <b>2</b></button></nav><button className="admin-return" onClick={onSignOut}>登出管理系統</button></aside><main className="admin-main"><header className="admin-top"><div><Menu size={23}/><h1>車盤審閱及上架</h1></div><div><Bell size={21}/><span>共享收件箱</span><UserRound size={22}/><b>管理員</b><ChevronDown size={15}/></div></header><div className="admin-workspace"><section className="submission-list"><div className="review-tabs"><button className="tab-active">待審閱 <b>12</b></button><button>已聯絡 <b>3</b></button><button>已拒絕 <b>4</b></button><button>全部 <b>19</b></button></div><div className="list-tools"><button><SlidersHorizontal size={16}/>篩選</button><button>最新提交 <ChevronDown size={15}/></button></div><div className="review-table">{submissionSeed.map((item) => <button className={`review-row ${selected.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelected(item)}><span className="radio"/><img src={item.image} alt=""/><span><b>{item.name}</b><small>{item.id} · {item.year}</small></span><span>{item.mileage}</span><span>{item.owners} 手</span><strong>{item.status}</strong></button>)}</div></section><section className="review-detail"><header><h2>審閱詳情</h2><button aria-label="關閉詳情"><X size={19}/></button></header><div className="submission-id"><span>提交編號<b>{selected.id}</b></span><span>提交時間<b>今天 14:28</b></span></div><h3>車輛資訊</h3><div className="review-photos"><img src={selected.image} alt={selected.name}/><img src={selected.image} alt="車尾示意"/><img src={selected.image} alt="車廂示意"/></div><div className="detail-specs"><div><span>車型 / 型號</span><b>{selected.name}</b></div><div><span>年份</span><b>{selected.year}</b></div><div><span>首次登記（香港）</span><b>2021 年 03 月</b></div><div><span>平行 / 進口</span><b>{selected.import}</b></div><div><span>車主數目</span><b>{selected.owners}</b></div><div><span>里數</span><b>{selected.mileage}</b></div><div><span>車身顏色</span><b>{selected.color}</b></div><div><span>車輛選配</span><b>{selected.options}</b></div><div><span>事故 / 維修紀錄</span><b>{selected.history}</b></div></div><div className="internal-tags"><h3>內部備註（可多選）</h3>{['需要留牌', '無牌費', '事故車輛', '進口車', '寄賣車', '公司自購車'].map((note) => <label key={note}><input type="checkbox" checked={notes.includes(note)} onChange={() => toggleNote(note)}/>{note}</label>)}</div><div className="review-actions"><button onClick={() => setAction('已拒絕此車盤。')}>拒絕</button><button onClick={() => setAction('已開啟 WhatsApp 聯絡流程。')}><Phone size={17}/>WhatsApp 聯絡</button><button className="approve" onClick={() => setAction('已轉入上架流程，等待專業照片及最終覆核。')}>採用並上架</button></div>{action && <p className="admin-notice"><Check size={16}/>{action}</p>}</section><aside className="team-chat"><header><h2>內部討論</h2><span>3 位同事參與</span></header>{[['陳志偉', '這部 S 500 外觀內籠不錯，里數合理，有平行進口文件。'], ['張嘉豪', '同意，可以查一下維修記錄同保養單。'], ['李思敏', '我會聯絡客人了解留牌同估價期望。']].map(([name, text]) => <article key={name}><span>{name.slice(0, 1)}</span><p><b>{name}</b>{text}</p><time>14:35</time></article>)}<form><input placeholder="輸入訊息…" aria-label="輸入內部訊息"/><button aria-label="發送內部訊息"><Send size={18}/></button></form></aside></div></main></div>
}

function App() {
  const [screen, setScreen] = useState(() => window.location.hash === '#admin' ? 'admin' : window.location.hash === '#login' ? 'login' : 'buyer')
  const [admin, setAdmin] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  useEffect(() => { const sync = () => setScreen(window.location.hash === '#admin' ? 'admin' : window.location.hash === '#login' ? 'login' : 'buyer'); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync) }, [])
  const navigate = useCallback((next) => { if (next === 'admin' || next === 'login') window.location.hash = next; else { window.history.replaceState(null, '', window.location.pathname); setScreen(next) } }, [])
  const completeAdminLogin = useCallback((identity) => {
    localStorage.setItem(adminIdleKey(identity.user.id), String(Date.now()))
    setAdmin(identity)
  }, [])
  const signOut = useCallback(async () => {
    if (admin?.user?.id) localStorage.removeItem(adminIdleKey(admin.user.id))
    await supabase.auth.signOut({ scope: 'local' })
    setAdmin(null)
    navigate('buyer')
  }, [admin?.user?.id, navigate])
  useEffect(() => {
    let active = true
    let restoreVersion = 0
    const fallbackTimer = window.setTimeout(() => {
      if (active) setAuthReady(true)
    }, 5500)
    const restoreAdmin = async (session) => {
      const version = ++restoreVersion
      if (!session?.user) {
        if (active && version === restoreVersion) { setAdmin(null); setAuthReady(true) }
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role, display_name').eq('id', session.user.id).single()
      if (!active || version !== restoreVersion) return
      if (profile && ['admin', 'manager', 'staff'].includes(profile.role)) {
        setAdmin({ user: session.user, profile })
        if (window.location.hash !== '#admin') window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#admin`)
        setScreen('admin')
      } else {
        setAdmin(null)
      }
      setAuthReady(true)
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { void restoreAdmin(session) })
    void supabase.auth.getSession().then(({ data }) => restoreAdmin(data.session))
    return () => { active = false; window.clearTimeout(fallbackTimer); subscription.unsubscribe() }
  }, [])
  useEffect(() => {
    const userId = admin?.user?.id
    if (!userId) return undefined
    const storageKey = adminIdleKey(userId)
    let timeoutId
    let completed = false
    const lastActivity = () => Number(localStorage.getItem(storageKey)) || 0
    const endIdleSession = async () => {
      if (completed) return
      completed = true
      localStorage.removeItem(storageKey)
      await supabase.auth.signOut({ scope: 'local' })
      setAdmin(null)
      navigate('buyer')
    }
    const scheduleLogout = () => {
      const storedTime = lastActivity()
      const activeAt = storedTime || Date.now()
      if (!storedTime) localStorage.setItem(storageKey, String(activeAt))
      window.clearTimeout(timeoutId)
      const remaining = adminIdleTimeoutMs - (Date.now() - activeAt)
      timeoutId = window.setTimeout(() => { void endIdleSession() }, Math.max(0, remaining))
    }
    const recordBackendActivity = () => {
      if (screen !== 'admin') return
      localStorage.setItem(storageKey, String(Date.now()))
      scheduleLogout()
    }
    const syncAcrossTabs = (event) => { if (event.key === storageKey) scheduleLogout() }
    const rescheduleWhenVisible = () => { if (!document.hidden) scheduleLogout() }
    const activityEvents = ['pointerdown', 'keydown', 'input', 'change', 'wheel', 'touchstart']
    if (screen === 'admin') activityEvents.forEach((event) => window.addEventListener(event, recordBackendActivity, { passive: true }))
    window.addEventListener('storage', syncAcrossTabs)
    document.addEventListener('visibilitychange', rescheduleWhenVisible)
    scheduleLogout()
    return () => {
      window.clearTimeout(timeoutId)
      if (screen === 'admin') activityEvents.forEach((event) => window.removeEventListener(event, recordBackendActivity))
      window.removeEventListener('storage', syncAcrossTabs)
      document.removeEventListener('visibilitychange', rescheduleWhenVisible)
    }
  }, [admin?.user?.id, navigate, screen])
  if (!authReady) return <div className="site-shell app-loading" role="status" aria-live="polite"><div><span>ALPHA</span><p>正在安全載入車盤…</p></div></div>
  if (screen === 'admin') return admin ? <AdminDashboard onReturnFrontend={() => navigate('buyer')} onSignOut={signOut}/> : <AdminLogin onScreen={navigate} onAuthenticated={completeAdminLogin}/>
  if (screen === 'login') return <AdminLogin onScreen={navigate} onAuthenticated={completeAdminLogin}/>
  return screen === 'seller' ? <SellerPageRequiredPhotos onScreen={navigate}/> : <BuyerHome onScreen={navigate}/>
}

export default App
