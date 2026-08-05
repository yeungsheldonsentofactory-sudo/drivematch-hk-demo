import { useMemo, useRef, useState } from 'react'
import {
  ArrowRight, CalendarDays, Camera, Check, ChevronDown, ChevronRight, CircleDollarSign,
  Fuel, Heart, Menu, Search, SlidersHorizontal, UploadCloud, X,
} from 'lucide-react'

const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`
const carPhoto = asset('audi-q5-studio.png')

const seedCars = [
  { id: 1, brand: 'Toyota', name: 'Alphard 2.5 SC', year: 2019, mileage: 48000, price: 538000, type: 'MPV', seats: '7座位', image: asset('toyota-alphard-studio.png') },
  { id: 2, brand: 'Audi', name: 'Q5 40 TFSI Quattro', year: 2021, mileage: 36000, price: 298000, type: 'SUV', seats: '5座位', image: carPhoto, selected: true },
  { id: 3, brand: 'BMW', name: '320i Sport', year: 2018, mileage: 62000, price: 178000, type: '房車', seats: '5座位', image: asset('bmw-320i-studio.png') },
]

const dealers = [
  ['信誠車行', '九龍灣', 'HK$298,000'],
  ['駿達汽車', '慈雲山', 'HK$308,000'],
  ['永興車行', '元朗', 'HK$318,000'],
]

function FilterTitle({ children }) {
  return <div className="filter-title"><span>{children}</span><ChevronDown size={15} /></div>
}

function Nav() {
  return <header className="nav"><a className="brand" href="#top">Drive<span>Match</span></a><nav><a href="#cars">瀏覽車盤</a><a href="#sell">賣車</a><a href="#saved">我的收藏</a></nav><button className="account"><span className="avatar">何</span>登入 / 註冊 <ChevronDown size={15} /></button></header>
}

function SearchHero({ query, setQuery, onSearch }) {
  return <section className="hero" id="top"><div className="hero-inner"><h1>找到最抵的下一架車</h1><p>比較全港車行報價、睇清規格、里數同車況，幫你慳更多。</p><form className="searchbar" onSubmit={(e) => { e.preventDefault(); onSearch() }}><label className="keyword"><Search size={23}/><input aria-label="搜尋車款" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="輸入車款、品牌或型號，例如：Toyota Alphard" /></label><div className="quick-field"><Camera size={21}/><span>車身類型<em>不限</em></span><ChevronDown size={17}/></div><div className="quick-field"><CircleDollarSign size={21}/><span>價格上限<em>不限</em></span><ChevronDown size={17}/></div><div className="quick-field"><CalendarDays size={21}/><span>年份<em>不限</em></span><ChevronDown size={17}/></div><button className="primary search-submit">搜尋車盤</button></form></div></section>
}

function Filters({ brands, toggleBrand }) {
  return <aside className="filters"><div className="filter-heading"><strong>篩選條件</strong><button>清除全部</button></div><div className="filter-block"><FilterTitle>品牌</FilterTitle><label className="brand-search"><Search size={14}/><input placeholder="搜尋品牌" /></label><label className="checkrow"><input type="checkbox" checked={brands.length === 0} readOnly /><span>所有品牌</span></label>{['Toyota (1,256)', 'Honda (842)', 'Mercedes-Benz (623)', 'BMW (611)', 'Audi (512)'].map((b) => { const name=b.split(' ')[0]; return <label className="checkrow" key={b}><input type="checkbox" checked={brands.includes(name)} onChange={() => toggleBrand(name)} /><span>{b}</span></label>})}<button className="more">顯示更多</button></div><div className="filter-block"><FilterTitle>價格範圍 (HKD)</FilterTitle><div className="range-line"><i/><i/></div><div className="price-range"><span>$50,000</span><span>$3,000,000+</span></div></div><div className="filter-block"><FilterTitle>年份</FilterTitle><div className="select-pair"><button>2010 <ChevronDown size={14}/></button><span>至</span><button>2024 <ChevronDown size={14}/></button></div></div><div className="filter-block"><FilterTitle>里數 (公里)</FilterTitle><div className="range-line"><i/><i/></div><div className="price-range"><span>0 公里</span><span>200,000+ 公里</span></div></div></aside>
}

function ListingRow({ car, active, onSelect, saved, onSave }) {
  return <article className={`listing ${active ? 'listing-active' : ''}`} onClick={() => onSelect(car.id)}><div className="listing-photo"><img src={car.image} alt={`${car.brand} ${car.name}`}/></div><div className="listing-info"><h3>{car.brand} {car.name}</h3><p>{car.year} ・ {car.mileage.toLocaleString()} 公里 ・ 自動波 ・ {car.seats}</p></div><div className="listing-price"><small>3 間車行報價</small><strong>HK${car.price.toLocaleString()} - {(car.price + 20000).toLocaleString()}</strong></div><button className={`row-save ${saved ? 'is-saved':''}`} onClick={(e)=>{ e.stopPropagation(); onSave(car.id) }} aria-label="收藏"><Heart size={19} fill={saved ? 'currentColor' : 'none'} /></button><ChevronRight className="row-chevron" size={21}/></article>
}

function DetailPanel({ onBook, saved, onSave }) {
  const details = [['首次登記年份', '2021'], ['行車里數', '36,000 公里'], ['引擎', '1,984c.c. 直四 Turbo'], ['波箱', '7速自動波 S tronic'], ['座位', '5 座位'], ['燃料種類', '汽油'], ['車身類型', 'SUV'], ['驅動方式', '四輪驅動 (Quattro)']]
  return <section className="detail"><div className="detail-car"><img src={carPhoto} alt="Audi Q5 40 TFSI Quattro"/><button className={`save-link ${saved ? 'is-saved':''}`} onClick={onSave}><Heart size={18} fill={saved ? 'currentColor':'none'}/> {saved ? '已加入收藏' : '加入收藏'}</button></div><div className="specs"><h2>Audi Q5 40 TFSI Quattro</h2><p className="subline">2021 ・ 36,000 公里</p><dl>{details.map(([term, desc]) => <div key={term}><dt>{term}</dt><dd>{desc}</dd></div>)}</dl></div><div className="quote-card"><h3>3 間車行報價</h3>{dealers.map(([name, area, price])=><div className="dealer" key={name}><span><b>{name}</b><small>{area}</small></span><strong>{price}</strong><button>聯絡</button></div>)}<button className="more-dealers">查看全部車行 (3)</button></div><div className="detail-actions"><button className="outline" onClick={() => alert('已開啟完整車輛資料。')}>查看詳細資料</button><button className="primary" onClick={onBook}>預約睇車 <ArrowRight size={18}/></button></div></section>
}

function Uploader({ files, setFiles }) {
  const fileRef = useRef(null)
  const add = (list) => { const incoming = Array.from(list || []).filter((f) => f.type.startsWith('image/')).slice(0, 6 - files.length).map((f)=>({name:f.name,url:URL.createObjectURL(f)})); setFiles([...files, ...incoming]) }
  return <aside className="uploader" id="sell"><h2>賣車上傳相片</h2><div className="dropzone" onClick={()=>fileRef.current?.click()} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();add(e.dataTransfer.files)}}><UploadCloud size={46}/><strong>將相片拖放到此處</strong><span>或</span><button type="button" className="primary">選擇相片</button><small>支援 JPG、PNG，最多 10 張，每張不超過 10MB</small><input ref={fileRef} onChange={(e)=>add(e.target.files)} accept="image/*" multiple type="file" /></div>{files.length > 0 ? <><div className="thumbs">{files.map((file, i)=><div className="thumb" key={file.url}><img src={file.url} alt={file.name}/><button onClick={()=>setFiles(files.filter((_,n)=>n!==i))}><X size={13}/></button></div>)}</div><p className="upload-count">已選擇 {files.length} 張相片</p></> : <p className="empty-upload">上傳相片後，買家更容易找到你的車。</p>}</aside>
}

function App() {
  const [query, setQuery] = useState('')
  const [brands, setBrands] = useState([])
  const [selected, setSelected] = useState(2)
  const [saved, setSaved] = useState([])
  const [files, setFiles] = useState([])
  const [notice, setNotice] = useState('')
  const filtered = useMemo(()=>seedCars.filter((car)=>{ const text=`${car.brand} ${car.name}`.toLowerCase(); return (!query || text.includes(query.toLowerCase())) && (!brands.length || brands.includes(car.brand)) }),[query,brands])
  const toggleBrand=(brand)=>setBrands((current)=>current.includes(brand)?current.filter((b)=>b!==brand):[...current,brand])
  const toggleSave=(id)=>setSaved((current)=>current.includes(id)?current.filter((item)=>item!==id):[...current,id])
  const book=()=>{setNotice('預約申請已送出，車行會盡快與你聯絡。'); window.setTimeout(()=>setNotice(''), 4000)}
  return <><Nav/><SearchHero query={query} setQuery={setQuery} onSearch={()=>document.querySelector('#cars')?.scrollIntoView({behavior:'smooth'})}/><main id="cars"><Filters brands={brands} toggleBrand={toggleBrand}/><div className="inventory"><div className="inventory-top"><span>找到 <b>{filtered.length ? 512 : 0}</b> 個車盤</span><div><button className="sort">排序：推薦 <ChevronDown size={16}/></button><button className="view-toggle active"><Menu size={20}/></button><button className="view-toggle"><SlidersHorizontal size={18}/></button></div></div><div className="listing-rail">{filtered.map((car)=><ListingRow key={car.id} car={car} active={selected===car.id} onSelect={setSelected} saved={saved.includes(car.id)} onSave={toggleSave}/>)}</div>{selected === 2 ? <DetailPanel onBook={book} saved={saved.includes(2)} onSave={()=>toggleSave(2)}/> : <div className="selection-empty"><Fuel size={30}/><h2>{seedCars.find(c=>c.id===selected)?.brand} {seedCars.find(c=>c.id===selected)?.name}</h2><p>選取 Audi Q5 以查看完整規格及三間車行報價。</p></div>}</div><Uploader files={files} setFiles={setFiles}/></main>{notice && <div className="toast"><Check size={18}/>{notice}</div>}</>
}

export default App
