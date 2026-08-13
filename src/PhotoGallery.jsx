import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const imageLabel = (image, index) => image?.label || image?.alt || `相片 ${index + 1}`

/**
 * Shared five-photo inspection gallery used by both the public site and admin.
 * It deliberately keeps all supplied photos visible in one thumbnail row.
 */
export default function PhotoGallery({ images = [], title = '車輛相片', initialIndex = 0, resetKey, className = '' }) {
  const gallery = useMemo(() => images.filter((image) => image?.url), [images])
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, Math.min(initialIndex, gallery.length - 1)))

  useEffect(() => {
    setSelectedIndex(Math.max(0, Math.min(initialIndex, gallery.length - 1)))
  }, [resetKey, initialIndex, gallery.length])

  if (!gallery.length) return null

  const activePhoto = gallery[selectedIndex] || gallery[0]
  const selectPrevious = () => setSelectedIndex((current) => (current + gallery.length - 1) % gallery.length)
  const selectNext = () => setSelectedIndex((current) => (current + 1) % gallery.length)

  return <div className={`photo-gallery ${className}`.trim()}>
    <div className="photo-gallery-main">
      <img src={activePhoto.url} alt={`${title} · ${imageLabel(activePhoto, selectedIndex)}`}/>
      {gallery.length > 1 && <>
        <button type="button" className="photo-gallery-arrow previous" onClick={selectPrevious} aria-label="查看上一張相片"><ChevronLeft size={23}/></button>
        <button type="button" className="photo-gallery-arrow next" onClick={selectNext} aria-label="查看下一張相片"><ChevronRight size={23}/></button>
      </>}
      <span className="photo-gallery-count" aria-live="polite">第 {selectedIndex + 1} / {gallery.length} 張</span>
    </div>
    <div className="photo-gallery-thumbnails" aria-label={`${title}，共 ${gallery.length} 張相片`}>
      {gallery.map((photo, index) => {
        const label = imageLabel(photo, index)
        const active = selectedIndex === index
        return <button key={`${photo.url}-${index}`} type="button" className={active ? 'active' : ''} onClick={() => setSelectedIndex(index)} aria-label={`查看第 ${index + 1} 張：${label}`} aria-pressed={active}>
          <img src={photo.url} alt=""/>
          <span>第 {index + 1} 張 · {label}</span>
        </button>
      })}
    </div>
  </div>
}
