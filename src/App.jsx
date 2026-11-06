import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const API = `${API_BASE}/api/memories`

const blankForm = () => ({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  location: '',
  importantPerson: '',
  notes: '',
})

async function parseResponse(response) {
  const raw = await response.text()
  let payload = {}
  if (raw) {
    try { payload = JSON.parse(raw) }
    catch { throw new Error(`The server returned an unreadable response (${response.status}).`) }
  }
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status}).`)
  return payload
}



function imageSource(photo) {
  if (!photo?.path) return ''

  if (photo.path.startsWith('http')) {
    return photo.path
  }

  return `${API_BASE}${photo.path}`
}

function shortDate(value) {
  if (!value) return 'Date not set'
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function monthLabel(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function App() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('journal')
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [newPhotos, setNewPhotos] = useState([])
  const [removedPhotos, setRemovedPhotos] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function loadMemories() {
    setLoading(true)
    setError('')
    try {
      const result = await parseResponse(await fetch(API))
      setMemories(Array.isArray(result) ? result : [])
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? 'Can’t reach your journal server. Check that the backend is running.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMemories() }, [])

  const years = useMemo(() => [...new Set(memories.map((m) => String(new Date(m.date).getFullYear())))].sort((a, b) => b.localeCompare(a)), [memories])
  const visibleMemories = useMemo(() => {
    const term = search.trim().toLowerCase()
    return memories
      .filter((m) => yearFilter === 'all' || String(new Date(m.date).getFullYear()) === yearFilter)
      .filter((m) => !term || [m.title, m.location, m.notes, m.importantPerson].some((v) => String(v || '').toLowerCase().includes(term)))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [memories, search, yearFilter])

  const totalPhotos = memories.reduce((sum, memory) => sum + (memory.photos?.length || 0), 0)
  const latestMemory = [...memories].sort((a, b) => new Date(b.date) - new Date(a.date))[0]

  function openCreate() {
    setEditing(null)
    setForm(blankForm())
    setNewPhotos([])
    setRemovedPhotos([])
    setModalOpen(true)
  }

  function openEdit(memory) {
    setEditing(memory)
    setForm({
      title: memory.title || '',
      date: memory.date ? new Date(memory.date).toISOString().slice(0, 10) : blankForm().date,
      location: memory.location || '',
      importantPerson: memory.importantPerson || '',
      notes: memory.notes || '',
    })
    setNewPhotos([])
    setRemovedPhotos([])
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setNewPhotos([])
    setRemovedPhotos([])
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function choosePhotos(event) {
    setNewPhotos((current) => [...current, ...Array.from(event.target.files || [])].slice(0, 10))
    event.target.value = ''
  }

  async function saveMemory(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = new FormData()
      Object.entries(form).forEach(([key, value]) => body.append(key, value))
      newPhotos.forEach((photo) => body.append('photos', photo))
      removedPhotos.forEach((filename) => body.append('removePhotoFilenames', filename))
      const url = editing ? `${API}/${editing._id}` : API
      const method = editing ? 'PUT' : 'POST'
      await parseResponse(await fetch(url, { method, body }))
      closeModal()
      await loadMemories()
      setToast(editing ? 'Your memory has been updated ✨' : 'A lovely moment has been saved 💗')
      window.setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteMemory(memory) {
    if (!window.confirm(`Delete “${memory.title}” and its photos?`)) return
    try {
      await parseResponse(await fetch(`${API}/${memory._id}`, { method: 'DELETE' }))
      setMemories((items) => items.filter((item) => item._id !== memory._id))
      setToast('Memory deleted')
      window.setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setError(err.message)
    }
  }

  const allPhotos = visibleMemories.flatMap((memory) => (memory.photos || []).map((photo, index) => ({ memory, photo, index })))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Dear Days home">
          <span className="brand-mark">d<span>✿</span></span>
          <span className="brand-name">dear days<small>YOUR MEMORY SPACE</small></span>
        </a>

        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="side-nav">
          <button className={activeView === 'journal' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('journal')}><span className="nav-icon">▤</span> My journal <span className="nav-count">{memories.length}</span></button>
          <button className={activeView === 'gallery' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('gallery')}><span className="nav-icon">▧</span> Photo gallery</button>
          <button className={activeView === 'years' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('years')}><span className="nav-icon">▦</span> By year</button>
        </nav>

        <div className="sidebar-label years-label">MEMORY YEARS</div>
        <div className="year-list">
          {years.length ? years.map((year) => (
            <button key={year} className={yearFilter === year ? 'year-link chosen' : 'year-link'} onClick={() => { setYearFilter(year); setActiveView('journal') }}>
              <span className="year-dot" />{year}
            </button>
          )) : <p className="muted-small">Your years will appear here.</p>}
          {years.length > 0 && <button className="year-link all-years" onClick={() => setYearFilter('all')}>Show all years</button>}
        </div>

        <div className="sidebar-note">
          <span className="note-sparkle">✦</span>
          <p>Little moments make a lovely life.</p>
          <small>Keep them close.</small>
        </div>
        <div className="sidebar-bottom"><span className="avatar">♡</span><span>made with a little love</span><span className="tiny-heart">♥</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">MY LITTLE WORLD <span>/</span> {activeView === 'gallery' ? 'GALLERY' : activeView === 'years' ? 'YEARS' : 'JOURNAL'}</div>
          <div className="top-actions">
            <label className="search-field"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a memory..." /><kbd>⌘ K</kbd></label>
            <button className="top-add" onClick={openCreate}><span>＋</span> New memory</button>
          </div>
        </header>

        <section className="welcome-row">
          <div>
            <div className="hello-chip"><span className="hello-dot" /> YOUR HAPPY PLACE</div>
            <h1>Collect the moments<span> that matter.</span></h1>
            <p className="welcome-sub">A little home for your big feelings, tiny wins and everyday magic.</p>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <span className="art-flower">✿</span><span className="art-star star-a">✦</span><span className="art-star star-b">✧</span>
            <div className="art-label">make it<br />memorable</div>
          </div>
        </section>

        <section className="stats-row">
          <div className="stat-card stat-pink"><span className="stat-icon">♡</span><div><strong>{memories.length}</strong><small>little memories</small></div><span className="stat-decoration">✧</span></div>
          <div className="stat-card stat-lilac"><span className="stat-icon">▧</span><div><strong>{totalPhotos}</strong><small>photos saved</small></div><span className="stat-decoration">✧</span></div>
          <div className="stat-card stat-mint"><span className="stat-icon">✿</span><div><strong>{years.length}</strong><small>years collected</small></div><span className="stat-decoration">✧</span></div>
          <div className="quote-card"><span>“</span><p>Life is made of<br /><b>little lovely things.</b></p><i>— a gentle reminder</i></div>
        </section>

        <section className="content-heading">
          <div><div className="section-kicker">{activeView === 'gallery' ? 'THE PRETTY DETAILS' : activeView === 'years' ? 'YOUR TIMELINE' : 'YOUR STORY, SO FAR'}</div><h2>{activeView === 'gallery' ? 'The photo corner' : activeView === 'years' ? 'Memories by year' : 'Your memories'} <span className="heading-flower">✿</span></h2></div>
          <div className="view-switch">
            <button className={activeView === 'journal' ? 'view-active' : ''} onClick={() => setActiveView('journal')}>Cards</button>
            <button className={activeView === 'gallery' ? 'view-active' : ''} onClick={() => setActiveView('gallery')}>Photos</button>
          </div>
        </section>

        {error && <div className="error-banner"><span>!</span>{error}<button onClick={() => setError('')}>×</button></div>}

        {loading ? <div className="loading-state"><span className="loader-heart">♡</span><p>Gathering your little moments...</p></div> : activeView === 'years' ? (
          <div className="years-grid">
            {years.length ? years.map((year) => {
              const entries = memories.filter((m) => String(new Date(m.date).getFullYear()) === year)
              const photos = entries.reduce((sum, m) => sum + (m.photos?.length || 0), 0)
              return <button className="year-tile" key={year} onClick={() => { setYearFilter(year); setActiveView('journal') }}><span className="tile-flower">✿</span><strong>{year}</strong><small>{entries.length} memories · {photos} photos</small><span className="tile-arrow">↗</span></button>
            }) : <EmptyState onAdd={openCreate} />}
          </div>
        ) : activeView === 'gallery' ? (
          allPhotos.length ? <div className="gallery-grid">{allPhotos.map(({ memory, photo, index }) => <figure className="gallery-photo" key={`${memory._id}-${photo.filename || index}`}><div className="gallery-image-wrap"><img src={imageSource(photo)} alt={`${memory.title} ${index + 1}`} loading="lazy" /></div><figcaption><span>{memory.title}</span><small>{shortDate(memory.date)}</small></figcaption></figure>)}</div> : <EmptyState onAdd={openCreate} title="Your gallery is waiting" description="Add photos to your memories and they’ll show up here." />
        ) : visibleMemories.length ? (
          <div className="memory-grid">
            {visibleMemories.map((memory, index) => <MemoryCard key={memory._id} memory={memory} index={index} onEdit={() => openEdit(memory)} onDelete={() => deleteMemory(memory)} />)}
            <button className="add-memory-card" onClick={openCreate}><span className="add-card-icon">＋</span><strong>Save another moment</strong><small>There’s always something worth keeping.</small></button>
          </div>
        ) : <EmptyState onAdd={openCreate} title={search ? 'No moments found' : 'Your story starts here'} description={search ? 'Try a different search word.' : 'Your favorite memories deserve a little home.'} />}

        {latestMemory && activeView === 'journal' && !search && yearFilter === 'all' && <div className="last-kept"><span>✧</span> Your latest little moment was saved on {shortDate(latestMemory.date)}. Keep collecting! <span>♡</span></div>}
        <footer className="main-footer"><span>dear days</span><span>made for remembering the good stuff <b>♥</b></span><span>✿</span></footer>
      </main>

      {toast && <div className="toast-message">{toast}</div>}

      {modalOpen && <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal() }}>
        <form className="memory-modal" onSubmit={saveMemory}>
          <button type="button" className="modal-x" onClick={closeModal}>×</button>
          <div className="modal-kicker">A LITTLE MOMENT, A BIG KEEPSAKE</div>
          <div className="modal-title-row"><span className="modal-flower">✿</span><h2>{editing ? 'Edit your memory' : 'Save a new memory'}</h2></div>
          <p className="modal-subtitle">The details you write today become the memories you love tomorrow.</p>
          <label className="form-label">What shall we call this moment?<input required maxLength="120" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. A sunny Sunday with my people" /></label>
          <div className="form-two">
            <label className="form-label">When did it happen?<input required type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} /></label>
            <label className="form-label">Where were you?<input maxLength="120" value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="A place or city" /></label>
          </div>
          <label className="form-label">Who was part of it?<input maxLength="120" value={form.importantPerson} onChange={(e) => updateField('importantPerson', e.target.value)} placeholder="Friends, family, or someone special" /></label>
          <label className="form-label">Tell the story<textarea rows="4" maxLength="5000" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="The funny bits, the little details, how it felt..." /></label>
          {editing?.photos?.length > 0 && <div className="existing-photo-section"><span className="form-label-text">Already in this memory · tap × to remove</span><div className="existing-photo-list">{editing.photos.filter((p) => !removedPhotos.includes(p.filename)).map((photo) => <div className="existing-photo" key={photo.filename}><img src={imageSource(photo)} alt="Saved memory" /><button type="button" onClick={() => setRemovedPhotos((items) => [...items, photo.filename])}>×</button></div>)}</div></div>}
          <label className="upload-zone"><span className="upload-icon">↥</span><span><b>Add your photos</b><small>Choose up to 10 images · 5 MB each</small></span><input type="file" accept="image/*" multiple onChange={choosePhotos} /></label>
          {newPhotos.length > 0 && <div className="selected-files">{newPhotos.map((photo, index) => <span key={`${photo.name}-${index}`}>♡ {photo.name}<button type="button" onClick={() => setNewPhotos((items) => items.filter((_, i) => i !== index))}>×</button></span>)}</div>}
          <button className="modal-submit" disabled={saving}>{saving ? 'Saving your moment...' : editing ? 'Save my changes  ♥' : 'Keep this memory  ♥'}</button>
        </form>
      </div>}
    </div>
  )
}

function MemoryCard({ memory, index, onEdit, onDelete }) {
  const photos = memory.photos || []
  const colorClass = ['card-rose', 'card-lavender', 'card-peach', 'card-sage'][index % 4]
  return (
    <article className={`memory-card ${colorClass}`} style={{ '--card-delay': `${Math.min(index, 8) * 55}ms` }}>
      <div className="card-photo-area">
        {photos.length ? <><img className="card-cover" src={imageSource(photos[0])} alt={memory.title} loading="lazy" />{photos.length > 1 && <span className="photo-count">▧ {photos.length} photos</span>}</> : <div className="card-no-photo"><span>✿</span><small>A moment worth keeping</small></div>}
        <div className="card-hover-actions"><button onClick={onEdit} aria-label="Edit memory">✎</button><button onClick={onDelete} aria-label="Delete memory">⌫</button></div>
        <span className="card-date-sticker">{new Date(memory.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
      </div>
      <div className="card-body">
        <div className="card-location">{memory.location ? <><span>⌖</span> {memory.location}</> : <span className="no-location">A little moment</span>}</div>
        <h3>{memory.title}</h3>
        <p className="card-notes">{memory.notes || 'A lovely little piece of your story.'}</p>
        <div className="card-bottom"><span>{memory.importantPerson ? `♡ with ${memory.importantPerson}` : '♡ saved with love'}</span><span className="card-heart">♥</span></div>
      </div>
    </article>
  )
}

function EmptyState({ onAdd, title = 'Nothing here just yet', description = 'Start collecting your favorite little moments.' }) {
  return <div className="empty-panel"><div className="empty-illustration"><span>✿</span><i>✧</i><b>♡</b></div><h3>{title}</h3><p>{description}</p><button onClick={onAdd}>＋ Add your first memory</button></div>
}

export default App
