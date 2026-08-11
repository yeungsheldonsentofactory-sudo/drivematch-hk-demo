import { useEffect, useState } from 'react'
import { Archive, Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from './lib/supabase'

const blank = {
  brand: '', model: '', vehicle_type: '高級家庭車', year: '', price_hkd: '', mileage_km: '', owner_count: '',
  import_type: '行貨', color: '', highlight: '', hero_image_url: '', plate_fee_hkd: '0', transfer_fee_hkd: '0',
  warranty_months: '0', inspection_status: 'pending', status: 'draft',
}
const numeric = ['year', 'price_hkd', 'mileage_km', 'owner_count', 'plate_fee_hkd', 'transfer_fee_hkd', 'warranty_months']
const vehicleTypes = ['超級跑車', '跑車', '電動車', '七人商務車', '高級家庭車', '高級日本車']

export default function AdminDashboard({ onSignOut }) {
  const [vehicles, setVehicles] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = async () => {
    const [vehicleResult, submissionResult] = await Promise.all([
      supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
      supabase.from('seller_submissions').select('*').order('created_at', { ascending: false }),
    ])
    if (vehicleResult.error) setNotice(`未能讀取車盤：${vehicleResult.error.message}`)
    else setVehicles(vehicleResult.data || [])
    if (submissionResult.error) setNotice(`未能讀取客戶提交：${submissionResult.error.message}`)
    else setSubmissions(submissionResult.data || [])
  }

  useEffect(() => { load() }, [])

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const startNew = () => { setEditing(null); setForm(blank); setNotice('') }
  const startEdit = (vehicle) => {
    setEditing(vehicle)
    setForm(Object.fromEntries(Object.entries(blank).map(([key, fallback]) => [key, vehicle[key] ?? fallback])))
    setNotice(`正在修改：${vehicle.brand} ${vehicle.model}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async (event) => {
    event.preventDefault()
    setBusyId('save')
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, numeric.includes(key) ? Number(value) : value]))
    payload.published_at = payload.status === 'published' ? editing?.published_at || new Date().toISOString() : null
    const result = editing
      ? await supabase.from('vehicles').update(payload).eq('id', editing.id).select('id').single()
      : await supabase.from('vehicles').insert(payload).select('id').single()
    if (result.error) setNotice(`儲存失敗：${result.error.message}`)
    else {
      setNotice(editing ? '車盤已更新，前台重新整理後會顯示最新資料。' : '新車盤已建立。')
      setEditing(null)
      setForm(blank)
      await load()
    }
    setBusyId('')
  }

  const review = async (id, status) => {
    setBusyId(`submission-${id}`)
    const { data } = await supabase.auth.getUser()
    const { error } = await supabase.from('seller_submissions').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: data.user?.id ?? null }).eq('id', id)
    setNotice(error ? `更新失敗：${error.message}` : status === 'accepted' ? '已採用提交；請建立正式車盤、設定售價及上載專業照片。' : '已拒絕客戶提交。')
    if (!error) await load()
    setBusyId('')
  }

  const archive = async (vehicle) => {
    if (!window.confirm(`確定下架「${vehicle.brand} ${vehicle.model}」？\n下架後不會在前台顯示，但資料會保留。`)) return
    setBusyId(`archive-${vehicle.id}`)
    const { error } = await supabase.from('vehicles').update({ status: 'archived', published_at: null }).eq('id', vehicle.id)
    setNotice(error ? `下架失敗：${error.message}` : '車盤已下架，已不會在前台顯示。')
    if (!error) await load()
    setBusyId('')
  }

  const remove = async (vehicle) => {
    if (!window.confirm(`確定永久刪除「${vehicle.brand} ${vehicle.model}」？\n此操作無法復原。`)) return
    setBusyId(`delete-${vehicle.id}`)
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicle.id)
    setNotice(error ? `刪除失敗：${error.message}` : '車盤已永久刪除，前台已同步移除。')
    if (!error) {
      if (editing?.id === vehicle.id) startNew()
      await load()
    }
    setBusyId('')
  }

  return <div className="admin-shell admin-live">
    <aside className="admin-sidebar">
      <div className="admin-logo">APEX<small>MOTOR GALLERY · HONG KONG</small></div>
      <nav><button className="active"><Plus size={20}/>車盤管理 <b>{vehicles.length}</b></button></nav>
      <button className="admin-return" onClick={onSignOut}>登出管理系統</button>
    </aside>
    <main className="admin-main">
      <header className="admin-top"><h1>真實車盤管理</h1><span>已連接 Supabase</span></header>
      <div className="admin-live-grid">
        <section className="live-list">
          <div className="live-list-head"><h2>客戶提交</h2><b>{submissions.filter((item) => item.status === 'pending').length} 待審閱</b></div>
          {submissions.length === 0 ? <p className="live-empty">暫未收到客戶賣車提交。</p> : submissions.map((item) => <article className="live-submission" key={item.id}><b>{item.car_name}</b><small>{item.year} · {item.mileage_km.toLocaleString()} 公里 · {item.contact_name}</small><small>狀態：{item.status}</small>{item.status === 'pending' && <div><button disabled={Boolean(busyId)} onClick={() => review(item.id, 'rejected')}>拒絕</button><button disabled={Boolean(busyId)} className="approve" onClick={() => review(item.id, 'accepted')}>採用</button></div>}</article>)}
          <hr/>
          <div className="live-list-head"><h2>已上架及草稿</h2><button className="dark-button" onClick={startNew}><Plus size={16}/>新增車盤</button></div>
          {vehicles.length === 0 ? <p className="live-empty">尚未有車盤。</p> : vehicles.map((vehicle) => <article className="live-vehicle" key={vehicle.id}>
            <div><b>{vehicle.brand} {vehicle.model}</b><small>{vehicle.year} · HK${Number(vehicle.price_hkd).toLocaleString('en-HK')} · {vehicle.status === 'published' ? '已上架' : vehicle.status === 'archived' ? '已下架' : '草稿'}</small></div>
            <div className="live-vehicle-actions">
              <button className="edit-action" onClick={() => startEdit(vehicle)} disabled={Boolean(busyId)}><Pencil size={15}/>修改</button>
              {vehicle.status === 'published' && <button className="archive-action" onClick={() => archive(vehicle)} disabled={Boolean(busyId)}><Archive size={15}/>下架</button>}
              <button className="delete-action" onClick={() => remove(vehicle)} disabled={Boolean(busyId)}><Trash2 size={15}/>刪除</button>
            </div>
          </article>)}
        </section>
        <section className="live-editor">
          <span className="eyeline">{editing ? '修改車盤' : '新增車盤'}</span>
          <h2>{editing ? `${editing.brand} ${editing.model}` : '建立新現貨車盤'}</h2>
          <p>{editing ? '儲存後會即時更新資料庫；若目前已上架，前台重新整理便會看到改動。' : '設定為「立即上架」後，會在公開車盤頁出現。'}</p>
          <form onSubmit={save} className="live-form">
            <label>車廠<input required value={form.brand} onChange={(event) => change('brand', event.target.value)}/></label>
            <label>型號<input required value={form.model} onChange={(event) => change('model', event.target.value)}/></label>
            <label>車種<select value={form.vehicle_type} onChange={(event) => change('vehicle_type', event.target.value)}>{vehicleTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>出廠年份<input required min="1900" max="2100" type="number" value={form.year} onChange={(event) => change('year', event.target.value)}/></label>
            <label>售價（HK$）<input required min="0" type="number" value={form.price_hkd} onChange={(event) => change('price_hkd', event.target.value)}/></label>
            <label>里數（公里）<input required min="0" type="number" value={form.mileage_km} onChange={(event) => change('mileage_km', event.target.value)}/></label>
            <label>車主數目<input required min="0" type="number" value={form.owner_count} onChange={(event) => change('owner_count', event.target.value)}/></label>
            <label>行貨／水貨<select value={form.import_type} onChange={(event) => change('import_type', event.target.value)}><option>行貨</option><option>水貨 / 平行進口</option></select></label>
            <label>顏色<input value={form.color} onChange={(event) => change('color', event.target.value)}/></label>
            <label>留牌費（HK$）<input min="0" type="number" value={form.plate_fee_hkd} onChange={(event) => change('plate_fee_hkd', event.target.value)}/></label>
            <label>轉名費（HK$）<input min="0" type="number" value={form.transfer_fee_hkd} onChange={(event) => change('transfer_fee_hkd', event.target.value)}/></label>
            <label>保養（月）<input min="0" type="number" value={form.warranty_months} onChange={(event) => change('warranty_months', event.target.value)}/></label>
            <label>驗車<select value={form.inspection_status} onChange={(event) => change('inspection_status', event.target.value)}><option value="pending">待驗證</option><option value="verified">已驗證</option><option value="not_available">未提供</option></select></label>
            <label>狀態<select value={form.status} onChange={(event) => change('status', event.target.value)}><option value="draft">草稿</option><option value="published">立即上架</option><option value="sold">已售</option><option value="archived">下架</option></select></label>
            <label className="full">車輛主圖網址<input type="url" placeholder="https://…" value={form.hero_image_url} onChange={(event) => change('hero_image_url', event.target.value)}/></label>
            <label className="full">車盤亮點<input value={form.highlight} onChange={(event) => change('highlight', event.target.value)}/></label>
            <div className="editor-actions"><button className="dark-button" disabled={Boolean(busyId)}>{busyId === 'save' ? '儲存中…' : <><Check size={17}/>{editing ? '儲存修改' : '建立車盤'}</>}</button>{editing && <button className="cancel-edit" type="button" onClick={startNew} disabled={Boolean(busyId)}>取消修改</button>}</div>
          </form>
          {notice && <p className="admin-notice live-notice"><Check size={16}/>{notice}</p>}
        </section>
      </div>
    </main>
  </div>
}
