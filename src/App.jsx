import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowUpRight, Bell, CarFront, Check, ChevronDown, ClipboardList,
  FileText, Heart, Menu, MessageCircle, Phone, Plus, Search, Send, ShieldCheck,
  SlidersHorizontal, UploadCloud, UserRound, Users, X,
} from 'lucide-react'

const basePath = import.meta.env?.BASE_URL || '/drivematch-hk-demo/'
const asset = (name) => `${basePath}assets/${name}`

const brands = [
  ['F', 'Ferrari'], ['L', 'Lamborghini'], ['M', 'McLaren'], ['P', 'Porsche'],
  ['R', 'Rolls‑Royce'], ['B', 'BMW'], ['A', 'Audi'], ['T', 'Toyota'], ['L', 'Lexus'], ['M', 'Mercedes‑Benz'],
]

const cars = [
  { id: 1, brand: 'Ferrari', model: 'SF90 Stradale', type: '超級跑車', year: 2022, price: 5980000, mileage: 8200, owners: 1, added: 6, highlight: '4.0L V8 混能 · 780 匹馬力', image: asset('supercar-sf90.png') },
  { id: 2, brand: 'Porsche', model: '911 Carrera S', type: '跑車', year: 2021, price: 1598000, mileage: 12500, owners: 2, added: 11, highlight: '3.0L 雙渦輪 · Sport Chrono', image: asset('bmw-320i-studio.png') },
  { id: 3, brand: 'Tesla', model: 'Model S Plaid', type: '電動車', year: 2023, price: 928000, mileage: 9400, owners: 1, added: 2, highlight: '三電馬達 · 0–100km/h 2.1s', image: asset('ev-sedan.png') },
  { id: 4, brand: 'Toyota', model: 'Alphard 2.5 SC', type: '七人商務車', year: 2020, price: 898000, mileage: 37500, owners: 1, added: 4, highlight: '7 座豪華車廂 · 雙天窗', image: asset('toyota-alphard-studio.png') },
  { id: 5, brand: 'Mercedes‑Benz', model: 'E 300 AMG Line', type: '高級家庭車', year: 2021, price: 468000, mileage: 28500, owners: 1, added: 8, highlight: '2.0L 渦輪 · 全景天幕', image: asset('audi-q5-studio.png') },
  { id: 6, brand: 'Lexus', model: 'LS 500h Executive', type: '高級日本車', year: 2020, price: 568000, mileage: 41200, owners: 2, added: 15, highlight: '3.5L Hybrid · Mark Levinson', image: asset('bmw-320i-studio.png') },
]

const suggestions = [
  { label: 'Ferrari SF90 Stradale', brand: 'Ferrari', model: 'SF90 Stradale', image: asset('supercar-sf90.png') },
  { label: 'Ferrari SF90 Spider', brand: 'Ferrari', model: 'SF90 Spider', image: asset('supercar-sf90.png') },
  { label: 'Porsche 911 Carrera S', brand: 'Porsche', model: '911 Carrera S', image: asset('bmw-320i-studio.png') },
]

const submissionSeed = [
  { id: 'SUB-20260805-481', name: 'Mercedes‑Benz S 500 L AMG Line', year: 2021, mileage: '28,500 公里', owners: 1, color: '黑色', import: '平行進口', options: 'AMG Line Package、夜視輔助系統、Burmeister® 環迴立體聲、全景天窗', history: '沒有事故或維修紀錄；保養定期，外觀及內籠良好', image: asset('audi-q5-studio.png'), status: '待審閱' },
  { id: 'SUB-20260805-482', name: 'BMW 740Li M Sport', year: 2020, mileage: '31,000 公里', owners: 2, color: '白色', import: '原廠行貨', options: 'Executive Lounge、360 鏡頭', history: '定期保養', image: asset('bmw-320i-studio.png'), status: '待審閱' },
  { id: 'SUB-20260805-483', name: 'Tesla Model 3 Performance', year: 2022, mileage: '18,700 公里', owners: 1, color: '珍珠白', import: '原廠行貨', options: 'Premium Connectivity', history: '沒有事故', image: asset('ev-sedan.png'), status: '待審閱' },
]

const price = (value) => `HK$${value.toLocaleString('en-HK')}`

function Header({ screen, onScreen, selectedBrand, setSelectedBrand }) {
  return <header className="apex-header">
    <button className="apex-brand" onClick={() => onScreen('buyer')} aria-label="返回首頁">Apex <span>Motor Gallery</span></button>
    {screen === 'buyer' && <div className="brand-rail" aria-label="品牌快速篩選">{brands.map(([mark, name]) => <button className={`brand-mark ${selectedBrand === name ? 'selected' : ''}`} key={name} title={name} onClick={() => setSelectedBrand(selectedBrand === name ? '' : name)}><b>{mark}</b><small>{name.replace('Mercedes‑Benz', 'Mercedes')}</small></button>)}</div>}
    <div className="header-actions"><button className={`header-cta ${screen === 'buyer' ? 'soft-active' : ''}`} onClick={() => onScreen('buyer')}><UserRound size={16}/>我是買家</button><button className={`header-cta sell ${screen === 'seller' ? 'sell-active' : ''}`} onClick={() => onScreen('seller')}><CarFront size={16}/>我是賣家</button></div>
  </header>
}

function BuyerHome({ onScreen }) {
  const [query, setQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [sort, setSort] = useState('random')
  const [saved, setSaved] = useState([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chat, setChat] = useState(() => JSON.parse(localStorage.getItem('apex-chat') || '[{"from":"agent","body":"你好，有咩車款想了解？"}]'))
  const [message, setMessage] = useState('')
  const searchMatches = query.trim().length > 1 ? suggestions.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())) : []
  const inventory = useMemo(() => {
    const found = cars.filter((car) => (!selectedBrand || car.brand === selectedBrand) && (!query || `${car.brand} ${car.model} ${car.type}`.toLowerCase().includes(query.toLowerCase())))
    const result = [...found]
    const rules = { low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, new: (a, b) => a.added - b.added, old: (a, b) => b.added - a.added, year: (a, b) => b.year - a.year, mileage: (a, b) => a.mileage - b.mileage, owners: (a, b) => a.owners - b.owners }
    return sort === 'random' ? result : result.sort(rules[sort])
  }, [query, selectedBrand, sort])
  const send = (event) => { event.preventDefault(); if (!message.trim()) return; const next = [...chat, { from: 'buyer', body: message.trim() }]; setChat(next); localStorage.setItem('apex-chat', JSON.stringify(next)); setMessage(''); window.setTimeout(() => { const reply = [...next, { from: 'agent', body: '已收到，你的專屬顧問會盡快回覆。' }]; setChat(reply); localStorage.setItem('apex-chat', JSON.stringify(reply)) }, 450) }
  const selectSuggestion = (item) => { setSelectedBrand(item.brand); setQuery(item.model) }
  return <div className="site-shell"><Header screen="buyer" onScreen={onScreen} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand}/><main className="buyer-main">
    <section className="search-stage"><h1>每架現貨，都值得親身細看。</h1><p>從超級跑車到七人商務車，精選現貨即時更新。</p><div className="intelligent-search"><Search size={22}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋車款、品牌或型號，例如 Ferrari SF" aria-label="智能搜尋車款"/><button aria-label="清除搜尋" onClick={() => setQuery('')}>{query && <X size={18}/>}</button></div>{searchMatches.length > 0 && <div className="suggestion-menu">{searchMatches.map((item) => <button key={item.label} onClick={() => selectSuggestion(item)}><img src={item.image} alt=""/><span>{item.label}</span><ArrowUpRight size={17}/></button>)}</div>}</section>
    <section className="inventory-section"><div className="inventory-toolbar"><div><span className="eyeline">現貨車盤</span><h2>{selectedBrand ? `${selectedBrand} 精選現貨` : '今日精選現貨'}</h2></div><div className="toolbar-controls"><button className="filter-button"><SlidersHorizontal size={17}/>篩選條件</button><label className="sort-select">排序：<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="random">隨機顯示</option><option value="low">價錢：低至高</option><option value="high">價錢：高至低</option><option value="new">上架日期：最新</option><option value="old">上架日期：最舊</option><option value="year">出廠年份</option><option value="mileage">行駛里數</option><option value="owners">車主擁有數</option></select><ChevronDown size={15}/></label></div></div><div className="inventory-grid">{inventory.map((car) => <article className="vehicle-card" key={car.id}><div className="vehicle-image"><img src={car.image} alt={`${car.brand} ${car.model}`}/><button className={saved.includes(car.id) ? 'saved' : ''} onClick={() => setSaved((current) => current.includes(car.id) ? current.filter((id) => id !== car.id) : [...current, car.id])}><Heart size={21} fill={saved.includes(car.id) ? 'currentColor' : 'none'}/></button><span>{car.type}</span></div><div className="vehicle-copy"><div className="vehicle-line"><h3>{car.brand} {car.model}</h3><strong>{price(car.price)}</strong></div><p>{car.year} ・ {car.mileage.toLocaleString()} 公里 ・ {car.owners} 手</p><div className="vehicle-highlight">{car.highlight}</div></div></article>)}</div>{inventory.length === 0 && <div className="empty-state"><Search size={28}/><h3>未找到相關車盤</h3><button onClick={() => { setSelectedBrand(''); setQuery('') }}>顯示所有現貨</button></div>}</section>
    <section className="trust-band"><div className="years">30<small>YEARS</small></div><div><h2>汽車業界 30 年經驗</h2><p>合作夥伴及團隊成員曾於香港 Ferrari、Lamborghini、McLaren 及 Porsche 等品牌擔任管理職位，並與品牌香港持有人緊密合作。</p></div><ShieldCheck size={34}/></section>
  </main><ChatWidget open={chatOpen} setOpen={setChatOpen} chat={chat} message={message} setMessage={setMessage} send={send}/></div>
}

function ChatWidget({ open, setOpen, chat, message, setMessage, send }) {
  return <div className="chat-wrap">{open && <section className="chat-panel"><header><div><span className="online-dot"/>線上客服<small>通常 5 分鐘內回覆</small></div><button onClick={() => setOpen(false)}><X size={18}/></button></header><div className="chat-log">{chat.map((item, index) => <p key={`${item.body}-${index}`} className={item.from}>{item.body}</p>)}</div><form onSubmit={send}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="輸入訊息…"/><button aria-label="發送訊息"><Send size={18}/></button></form></section>}<button className="chat-launcher" onClick={() => setOpen(!open)}><span className="online-dot"/><MessageCircle size={23}/><b>線上客服</b></button></div>
}

function SellerPage({ onScreen }) {
  const fileRef = useRef(null)
  const [files, setFiles] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const addFiles = (list) => setFiles((current) => [...current, ...Array.from(list || []).filter((file) => file.type.startsWith('image/')).slice(0, 8 - current.length).map((file) => ({ name: file.name, url: URL.createObjectURL(file) }))])
  if (submitted) return <div className="site-shell"><Header screen="seller" onScreen={onScreen}/><main className="seller-layout confirmation"><Check size={36}/><h1>已收到你的車輛資料</h1><p>車盤不會直接公開；我們的團隊會先審閱，再以電話或線上客服聯絡你。</p><button className="dark-button" onClick={() => onScreen('buyer')}>返回現貨車盤</button></main></div>
  return <div className="site-shell"><Header screen="seller" onScreen={onScreen}/><main className="seller-layout"><button className="back-link" onClick={() => onScreen('buyer')}><ArrowLeft size={17}/>返回買家瀏覽</button><div className="seller-heading"><span className="eyeline">賣家專區</span><h1>讓專業團隊，替你的愛車找對下一位車主。</h1><p>提交資料後由內部審閱，不會直接顯示在網站。</p></div><div className="seller-choice"><section><FileText size={26}/><h2>提交車輛資訊</h2><p>填寫基本資料、車況與相片，我們會主動評估及聯絡。</p></section><section><MessageCircle size={26}/><h2>線上客服查詢賣車</h2><p>即時與顧問討論估值、交車及寄賣安排。</p><button className="outline-button">開啟線上客服</button></section></div><form className="seller-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}><div className="form-title"><h2>車輛資料</h2><p>標示 * 的欄位為必填。</p></div><div className="photo-drop" onClick={() => fileRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files) }}><UploadCloud size={34}/><strong>上載車輛相片</strong><span>拖放相片到這裡，或按此選擇檔案</span><small>JPG、PNG；最多 8 張</small><input ref={fileRef} type="file" accept="image/*" multiple onChange={(event) => addFiles(event.target.files)}/></div>{files.length > 0 && <div className="seller-thumbs">{files.map((file, index) => <div key={file.url}><img src={file.url} alt={file.name}/><button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}><X size={13}/></button></div>)}</div>}<div className="form-grid"><Field label="出廠年份 *" placeholder="例如 2021"/><Field label="香港首次登記年份" placeholder="例如 2021"/><SelectField label="水貨 / 行貨 *" options={['請選擇', '水貨 / 平行進口', '行貨']}/><Field label="車主數目 *" placeholder="例如 1"/><Field label="總行駛里程數 *" placeholder="例如 28,500 公里"/><Field label="車輛顏色" placeholder="例如 黑色"/><TextField label="車輛選配" placeholder="例如 全景天窗、升級音響、駕駛輔助套件"/><TextField label="事故及維修紀錄" placeholder="請如實填寫事故、維修或保養紀錄"/></div><button className="dark-button submit-sale">提交資料供內部審閱 <ArrowUpRight size={17}/></button></form></main></div>
}

function Field({ label, placeholder }) { return <label className="form-field"><span>{label}</span><input placeholder={placeholder}/></label> }
function SelectField({ label, options }) { return <label className="form-field"><span>{label}</span><select>{options.map((option) => <option key={option}>{option}</option>)}</select></label> }
function TextField({ label, placeholder }) { return <label className="form-field full"><span>{label}</span><textarea placeholder={placeholder}/></label> }

function AdminPanel() {
  const [selected, setSelected] = useState(submissionSeed[0])
  const [notes, setNotes] = useState(['需要留牌', '無牌費', '進口車'])
  const [action, setAction] = useState('')
  const toggleNote = (note) => setNotes((current) => current.includes(note) ? current.filter((item) => item !== note) : [...current, note])
  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-logo">APEX<small>MOTOR GALLERY · HONG KONG</small></div><nav><button className="active"><CarFront size={20}/>車盤審閱 <b>12</b></button><button><Plus size={20}/>新增車盤</button><button><ClipboardList size={20}/>已上架</button><button><MessageCircle size={20}/>客戶訊息 <b>2</b></button></nav><span className="admin-return">內部系統示範 · #admin</span></aside><main className="admin-main"><header className="admin-top"><div><Menu size={23}/><h1>車盤審閱及上架</h1></div><div><Bell size={21}/><span>共享收件箱</span><UserRound size={22}/><b>陳志偉</b><ChevronDown size={15}/></div></header><div className="admin-workspace"><section className="submission-list"><div className="review-tabs"><button className="tab-active">待審閱 <b>12</b></button><button>已聯絡 <b>3</b></button><button>已拒絕 <b>4</b></button><button>全部 <b>19</b></button></div><div className="list-tools"><button><SlidersHorizontal size={16}/>篩選</button><button>最新提交 <ChevronDown size={15}/></button></div><div className="review-table">{submissionSeed.map((item) => <button className={`review-row ${selected.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelected(item)}><span className="radio"/><img src={item.image} alt=""/><span><b>{item.name}</b><small>{item.id} · {item.year}</small></span><span>{item.mileage}</span><span>{item.owners} 手</span><strong>{item.status}</strong></button>)}</div></section><section className="review-detail"><header><h2>審閱詳情</h2><button><X size={19}/></button></header><div className="submission-id"><span>提交編號<b>{selected.id}</b></span><span>提交時間<b>今天 14:28</b></span></div><h3>車輛資訊</h3><div className="review-photos"><img src={selected.image} alt={selected.name}/><img src={selected.image} alt="車尾"/><img src={selected.image} alt="車廂"/></div><div className="detail-specs"><div><span>車型 / 型號</span><b>{selected.name}</b></div><div><span>年份</span><b>{selected.year}</b></div><div><span>首次登記（香港）</span><b>2021 年 03 月</b></div><div><span>平行 / 進口</span><b>{selected.import}</b></div><div><span>車主數目</span><b>{selected.owners}</b></div><div><span>里數</span><b>{selected.mileage}</b></div><div><span>車身顏色</span><b>{selected.color}</b></div><div><span>車輛選配</span><b>{selected.options}</b></div><div><span>事故 / 維修紀錄</span><b>{selected.history}</b></div></div><div className="internal-tags"><h3>內部備註（可多選）</h3>{['需要留牌', '無牌費', '事故車輛', '進口車', '寄賣車', '公司自購車'].map((note) => <label key={note}><input type="checkbox" checked={notes.includes(note)} onChange={() => toggleNote(note)}/>{note}</label>)}</div><div className="review-actions"><button onClick={() => setAction('已拒絕此車盤。')}>拒絕</button><button onClick={() => setAction('已開啟 WhatsApp 聯絡流程。')}><Phone size={17}/>WhatsApp 聯絡</button><button className="approve" onClick={() => setAction('已轉入上架流程，等待專業照片及最終覆核。')}>採用並上架</button></div>{action && <p className="admin-notice"><Check size={16}/>{action}</p>}</section><aside className="team-chat"><header><h2>內部討論</h2><span>3 位同事參與</span></header>{[['陳志偉', '這部 S 500 外觀內籠不錯，里數合理，有平行進口文件。'], ['張嘉豪', '同意，可以查一下維修記錄同保養單。'], ['李思敏', '我會聯絡客人了解留牌同估價期望。']].map(([name, text]) => <article key={name}><span>{name.slice(0, 1)}</span><p><b>{name}</b>{text}</p><time>14:35</time></article>)}<form><input placeholder="輸入訊息…"/><button><Send size={18}/></button></form></aside></div></main></div>
}

function App() {
  const [screen, setScreen] = useState(() => window.location.hash === '#admin' ? 'admin' : 'buyer')
  useEffect(() => { const sync = () => setScreen(window.location.hash === '#admin' ? 'admin' : 'buyer'); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync) }, [])
  const navigate = (next) => { if (next === 'admin') window.location.hash = 'admin'; else { window.history.replaceState(null, '', window.location.pathname); setScreen(next) } }
  if (screen === 'admin') return <AdminPanel/>
  return screen === 'seller' ? <SellerPage onScreen={navigate}/> : <BuyerHome onScreen={navigate}/>
}

export default App
