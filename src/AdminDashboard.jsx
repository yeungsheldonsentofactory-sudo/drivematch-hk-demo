import { useEffect, useState } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from './lib/supabase'

const blank = { brand: '', model: '', vehicle_type: '高級家庭車', year: '', price_hkd: '', mileage_km: '', owner_count: '', import_type: '行貨', color: '', highlight: '', plate_fee_hkd: '0', transfer_fee_hkd: '0', warranty_months: '0', inspection_status: 'pending', status: 'draft' }

export default function AdminDashboard({ onSignOut }) {
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
    if (error) setNotice(`未能讀取車盤：${error.message}`); else setVehicles(data || [])
  }
  useEffect(() => { load() }, [])
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const edit = (vehicle) => { setEditing(vehicle.id); setForm(Object.fromEntries(Object.entries(blank).map(([key, value]) => [key, vehicle[key] ?? value]))) }
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setNotice('')
    const numeric = ['year', 'price_hkd', 'mileage_km', 'owner_count', 'plate_fee_hkd', 'transfer_fee_hkd', 'warranty_months']
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, numeric.includes(key) ? Number(value) : value]))
    payload.published_at = payload.status === 'published' ? new Date().toISOString() : null
    const result = editing ? await supabase.from('vehicles').update(payload).eq('id', editing) : await supabase.from('vehicles').insert(payload)
    if (result.error) setNotice(`儲存失敗：${result.error.message}`); else { setNotice(editing ? '車盤已更新。' : '新車盤已建立。'); setEditing(null); setForm(blank); await load() }
    setBusy(false)
  }
  const remove = async (id) => { if (!window.confirm('確定永久刪除此車盤？')) return; const { error } = await supabase.from('vehicles').delete().eq('id', id); if (error) setNotice(`刪除失敗：${error.message}`); else { setNotice('車盤已刪除。'); await load() } }
  const statusLabel = { draft: '草稿', published: '已上架', sold: '已售', archived: '已下架' }
  return <div className="admin-shell admin-live"><aside className="admin-sidebar"><div className="admin-logo">APEX<small>MOTOR GALLERY · HONG KONG</small></div><nav><button className="active"><Plus size={20}/>車盤管理 <b>{vehicles.length}</b></button></nav><button className="admin-return" onClick={onSignOut}>登出管理系統</button></aside><main className="admin-main"><header className="admin-top"><div><h1>真實車盤管理</h1></div><span>已連接 Supabase</span></header><div className="admin-live-grid"><section className="live-list"><div className="live-list-head"><h2>所有車盤</h2><button className="dark-button" onClick={() => { setEditing(null); setForm(blank) }}><Plus size={16}/>新增車盤</button></div>{vehicles.length === 0 ? <p className="live-empty">尚未有車盤。請從右側建立第一架車。</p> : vehicles.map((vehicle) => <article key={vehicle.id} className="live-vehicle"><div><b>{vehicle.brand} {vehicle.model}</b><small>{vehicle.year} · HK${Number(vehicle.price_hkd).toLocaleString('en-HK')} · {statusLabel[vehicle.status]}</small></div><div><button aria-label={`編輯 ${vehicle.brand} ${vehicle.model}`} onClick={() => edit(vehicle)}><Pencil size={16}/></button><button aria-label={`刪除 ${vehicle.brand} ${vehicle.model}`} onClick={() => remove(vehicle.id)}><Trash2 size={16}/></button></div></article>)}</section><section className="live-editor"><div><span className="eyeline">{editing ? '編輯車盤' : '新增車盤'}</span><h2>{editing ? '更新現貨資料' : '建立新現貨車盤'}</h2><p>發佈後會即時出現在公開車盤頁。</p></div><form onSubmit={save} className="live-form"><label>車廠<input required value={form.brand} onChange={(e) => change('brand', e.target.value)} placeholder="例如 Ferrari"/></label><label>型號<input required value={form.model} onChange={(e) => change('model', e.target.value)} placeholder="例如 SF90 Stradale"/></label><label>車種<select value={form.vehicle_type} onChange={(e) => change('vehicle_type', e.target.value)}>{['超級跑車','跑車','電動車','七人商務車','高級家庭車','高級日本車'].map((item) => <option key={item}>{item}</option>)}</select></label><label>出廠年份<input required type="number" min="1900" max="2100" value={form.year} onChange={(e) => change('year', e.target.value)}/></label><label>售價（HK$）<input required type="number" min="0" value={form.price_hkd} onChange={(e) => change('price_hkd', e.target.value)}/></label><label>里數（公里）<input required type="number" min="0" value={form.mileage_km} onChange={(e) => change('mileage_km', e.target.value)}/></label><label>車主數目<input required type="number" min="0" value={form.owner_count} onChange={(e) => change('owner_count', e.target.value)}/></label><label>行貨／水貨<select value={form.import_type} onChange={(e) => change('import_type', e.target.value)}><option>行貨</option><option>水貨 / 平行進口</option></select></label><label>顏色<input value={form.color} onChange={(e) => change('color', e.target.value)}/></label><label>車牌／留牌費（HK$）<input type="number" min="0" value={form.plate_fee_hkd} onChange={(e) => change('plate_fee_hkd', e.target.value)}/></label><label>轉名費（HK$）<input type="number" min="0" value={form.transfer_fee_hkd} onChange={(e) => change('transfer_fee_hkd', e.target.value)}/></label><label>保養（月）<input type="number" min="0" value={form.warranty_months} onChange={(e) => change('warranty_months', e.target.value)}/></label><label>驗車狀態<select value={form.inspection_status} onChange={(e) => change('inspection_status', e.target.value)}><option value="pending">待驗證</option><option value="verified">已驗證</option><option value="not_available">未提供</option></select></label><label>上架狀態<select value={form.status} onChange={(e) => change('status', e.target.value)}><option value="draft">草稿</option><option value="published">立即上架</option><option value="sold">已售</option><option value="archived">下架</option></select></label><label className="full">車盤亮點<input value={form.highlight} onChange={(e) => change('highlight', e.target.value)} placeholder="例如 全景天幕、原廠保養、低里數"/></label><button className="dark-button" disabled={busy}>{busy ? '儲存中…' : <><Check size={17}/>{editing ? '儲存更改' : '建立車盤'}</>}</button>{editing && <button type="button" className="outline-button" onClick={() => { setEditing(null); setForm(blank) }}>取消編輯</button>}</form>{notice && <p className="admin-notice live-notice"><Check size={16}/>{notice}</p>}</section></div></main></div>
}
