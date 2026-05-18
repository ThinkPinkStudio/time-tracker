// ─── Language settings ────────────────────────────────────────────────────────

const langList = document.getElementById('lang-list')
LANGUAGE_OPTIONS.forEach(({ code, label, flag }) => {
  const btn = document.createElement('button')
  btn.className = 'lang-option' + (code === getCurrentLang() ? ' active' : '')
  btn.dataset.lang = code
  btn.innerHTML = `<span class="lang-flag">${flag}</span><span class="lang-name">${label}</span>`
  btn.addEventListener('click', () => {
    setLanguage(code)
    updateOffset()
    renderAppointments()
  })
  langList.appendChild(btn)
})

applyTranslations()

// ─── Navigation ───────────────────────────────────────────────────────────────

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'))
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    item.classList.add('active')
    document.getElementById(`page-${item.dataset.page}`).classList.add('active')
  })
})

// ─── Timezone selectors ───────────────────────────────────────────────────────

const REGION_ORDER = ['Europe','America','Asia','Africa','Australia','Pacific','Atlantic','Indian','Arctic','Antarctica']

function populateSelect(el) {
  const all = Intl.supportedValuesOf('timeZone')
  const groups = {}
  all.forEach(tz => {
    const region = tz.includes('/') ? tz.split('/')[0] : 'Other'
    ;(groups[region] = groups[region] || []).push(tz)
  })

  const orderedRegions = [
    ...REGION_ORDER.filter(r => groups[r]),
    ...Object.keys(groups).filter(r => !REGION_ORDER.includes(r))
  ]

  orderedRegions.forEach(region => {
    const og = document.createElement('optgroup')
    og.label = region
    groups[region].forEach(tz => {
      const opt = document.createElement('option')
      opt.value = tz
      opt.textContent = tz.replace(/_/g, ' ')
      og.appendChild(opt)
    })
    el.appendChild(og)
  })
}

const tzFrom = document.getElementById('tz-from')
const tzTo   = document.getElementById('tz-to')

populateSelect(tzFrom)
populateSelect(tzTo)

const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone
tzFrom.value = localTz || 'Europe/Rome'
tzTo.value   = 'America/New_York'

// ─── Tick generation ──────────────────────────────────────────────────────────

function buildTicks(groupId) {
  const g = document.getElementById(groupId)
  for (let i = 0; i < 60; i++) {
    const angle   = i * 6 * (Math.PI / 180)
    const major   = i % 5 === 0
    const innerR  = major ? 78 : 86
    const outerR  = 92
    const x1 = 100 + innerR * Math.sin(angle)
    const y1 = 100 - innerR * Math.cos(angle)
    const x2 = 100 + outerR * Math.sin(angle)
    const y2 = 100 - outerR * Math.cos(angle)

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', x1); line.setAttribute('y1', y1)
    line.setAttribute('x2', x2); line.setAttribute('y2', y2)
    line.setAttribute('stroke', major ? '#e91e8c' : 'rgba(233,30,140,0.28)')
    line.setAttribute('stroke-width', major ? '2.5' : '1')
    line.setAttribute('stroke-linecap', 'round')
    g.appendChild(line)
  }
}

buildTicks('ticks-from')
buildTicks('ticks-to')

// ─── Clock engine ─────────────────────────────────────────────────────────────

function getTimeParts(timezone) {
  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false
  })
  const parts = {}
  fmt.formatToParts(now).forEach(p => { parts[p.type] = parseInt(p.value) })
  const ms = now.getMilliseconds()
  return {
    h: parts.hour   || 0,
    m: parts.minute || 0,
    s: (parts.second || 0) + ms / 1000,
  }
}

function rotate(el, deg) {
  el.setAttribute('transform', `rotate(${deg}, 100, 100)`)
}

function updateClock(suffix, timezone) {
  const { h, m, s } = getTimeParts(timezone)

  const secDeg = s * 6
  const minDeg = (m + s / 60) * 6
  const hrDeg  = ((h % 12) + m / 60 + s / 3600) * 30

  rotate(document.getElementById(`hour-${suffix}`),   hrDeg)
  rotate(document.getElementById(`minute-${suffix}`), minDeg)
  rotate(document.getElementById(`second-${suffix}`), secDeg)

  const hh = String(h).padStart(2,'0')
  const mm = String(m).padStart(2,'0')
  const ss = String(Math.floor(s)).padStart(2,'0')
  document.getElementById(`time-${suffix}`).textContent = `${hh}:${mm}:${ss}`

  const dateFmt = new Intl.DateTimeFormat(getDateLocale(), {
    timeZone: timezone,
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  document.getElementById(`date-${suffix}`).textContent = dateFmt.format(new Date())
}

// ─── Offset badge ─────────────────────────────────────────────────────────────

function getUTCOffsetHours(timezone) {
  const now = new Date()
  const utcStr = now.toLocaleString('sv-SE', { timeZone: 'UTC' })
  const tzStr  = now.toLocaleString('sv-SE', { timeZone: timezone })
  return (new Date(tzStr) - new Date(utcStr)) / 3_600_000
}

function updateOffset() {
  const diff = getUTCOffsetHours(tzTo.value) - getUTCOffsetHours(tzFrom.value)
  if (diff === 0) {
    document.getElementById('offset-text').textContent = t('same_timezone')
    return
  }
  const sign = diff > 0 ? '+' : '-'
  const abs  = Math.abs(diff)
  const hh   = Math.floor(abs)
  const mm   = Math.round((abs - hh) * 60)
  document.getElementById('offset-text').textContent =
    mm === 0 ? `${sign}${hh}h` : `${sign}${hh}h ${mm}m`
}

tzFrom.addEventListener('change', updateOffset)
tzTo.addEventListener('change', updateOffset)
updateOffset()

// ─── Animation loop ───────────────────────────────────────────────────────────

function tick() {
  updateClock('from', tzFrom.value)
  updateClock('to',   tzTo.value)
  requestAnimationFrame(tick)
}

tick()

// ─── Preferred timezone (Settings) ───────────────────────────────────────────

const prefTzSelect = document.getElementById('preferred-tz-select')
populateSelect(prefTzSelect)
prefTzSelect.value = localStorage.getItem('preferredTz') || localTz || 'UTC'

prefTzSelect.addEventListener('change', () => {
  localStorage.setItem('preferredTz', prefTzSelect.value)
  renderAppointments()
})

function getPreferredTz() {
  return localStorage.getItem('preferredTz') || localTz || 'UTC'
}

// ─── Appointments – core helpers ──────────────────────────────────────────────

function loadAppointments() {
  try { return JSON.parse(localStorage.getItem('appointments') || '[]') }
  catch { return [] }
}

function saveAppointments(list) {
  localStorage.setItem('appointments', JSON.stringify(list))
}

function getOffsetAtDate(date, tz) {
  const utcStr = date.toLocaleString('sv-SE', { timeZone: 'UTC' })
  const tzStr  = date.toLocaleString('sv-SE', { timeZone: tz })
  return (new Date(tzStr) - new Date(utcStr)) / 3_600_000
}

// Convert "HH:MM on YYYY-MM-DD in <tz>" to an absolute UTC Date
function apptLocalToUTC(dateStr, timeStr, tz) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [h, mi]    = timeStr.split(':').map(Number)
  const approxUTC  = new Date(Date.UTC(y, mo - 1, d, h, mi))
  const offset     = getOffsetAtDate(approxUTC, tz)
  return new Date(approxUTC.getTime() - offset * 3_600_000)
}

function formatTimeInTZ(utcDate, tz) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(utcDate)
}

function formatDateLocalized(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat(getDateLocale(), {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, mo - 1, d)))
}

function getDayName(dow) {
  // Jan 7 2024 is a Sunday → dow 0 = Jan 7, dow 1 = Jan 8, …
  return new Intl.DateTimeFormat(getDateLocale(), { weekday: 'long' })
    .format(new Date(2024, 0, 7 + dow))
}

function nextDateForDow(dow) {
  const today    = new Date()
  const daysAhead = (dow - today.getDay() + 7) % 7
  const next     = new Date(today)
  next.setDate(today.getDate() + daysAhead)
  const y  = next.getFullYear()
  const mo = String(next.getMonth() + 1).padStart(2, '0')
  const dd = String(next.getDate()).padStart(2, '0')
  return `${y}-${mo}-${dd}`
}

function getNextOccurrenceMs(appt) {
  if (appt.type === 'once') {
    return apptLocalToUTC(appt.date, appt.time, appt.organizerTz).getTime()
  }
  return apptLocalToUTC(nextDateForDow(appt.dayOfWeek), appt.time, appt.organizerTz).getTime()
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ─── Appointments – render ────────────────────────────────────────────────────

function renderAppointments() {
  const appts  = loadAppointments()
  const list   = document.getElementById('appt-list')
  const empty  = document.getElementById('appt-empty')
  const prefTz = getPreferredTz()

  list.innerHTML = ''

  if (appts.length === 0) {
    empty.style.display = 'block'
    return
  }
  empty.style.display = 'none'

  const now    = Date.now()
  const sorted = [...appts].sort((a, b) => getNextOccurrenceMs(a) - getNextOccurrenceMs(b))

  sorted.forEach(appt => {
    const card = document.createElement('div')
    card.className = 'appt-card'

    const refDate   = appt.type === 'once' ? appt.date : nextDateForDow(appt.dayOfWeek)
    const utcMoment = apptLocalToUTC(refDate, appt.time, appt.organizerTz)
    const userTime  = formatTimeInTZ(utcMoment, prefTz)
    const isPast    = appt.type === 'once' && utcMoment.getTime() < now

    if (isPast) card.classList.add('appt-card--past')

    const recurrenceLabel = appt.type === 'weekly'
      ? `${t('appt_every')} ${getDayName(appt.dayOfWeek)}`
      : formatDateLocalized(appt.date)

    const orgTzLabel  = appt.organizerTz.split('/').pop().replace(/_/g, ' ')
    const userTzLabel = prefTz.split('/').pop().replace(/_/g, ' ')

    card.innerHTML = `
      <div class="appt-card-header">
        <span class="appt-card-title">${escapeHtml(appt.title)}</span>
        <button class="appt-delete-btn" data-id="${appt.id}" title="${escapeHtml(t('appt_delete'))}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
      <div class="appt-card-recurrence">${recurrenceLabel}</div>
      <div class="appt-card-times">
        <span class="appt-time-org">${escapeHtml(appt.time)}</span>
        <span class="appt-tz-name">${escapeHtml(orgTzLabel)}</span>
        <span class="appt-arrow">→</span>
        <span class="appt-time-user">${userTime}</span>
        <span class="appt-tz-name">${escapeHtml(userTzLabel)}</span>
      </div>
    `

    card.querySelector('.appt-delete-btn').addEventListener('click', () => {
      saveAppointments(loadAppointments().filter(a => a.id !== appt.id))
      renderAppointments()
    })

    list.appendChild(card)
  })
}

// ─── Appointments – modal ─────────────────────────────────────────────────────

const modal      = document.getElementById('appt-modal')
const addBtn     = document.getElementById('appt-add-btn')
const closeBtn   = document.getElementById('appt-modal-close')
const cancelBtn  = document.getElementById('appt-cancel-btn')
const saveBtn    = document.getElementById('appt-save-btn')
const titleInput = document.getElementById('appt-form-title')
const timeInput  = document.getElementById('appt-form-time')
const orgTzSel   = document.getElementById('appt-form-org-tz')
const typeToggle = document.getElementById('appt-type-toggle')
const dateGroup  = document.getElementById('appt-date-group')
const dowGroup   = document.getElementById('appt-dow-group')
const dateInput  = document.getElementById('appt-form-date')
const dowContainer = document.getElementById('appt-form-dow')

populateSelect(orgTzSel)
orgTzSel.value = localTz || 'Europe/Rome'

// Build day-of-week buttons (Mon first, abbreviated English)
const DOW_ABBR  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]
let selectedDow = 5 // Friday default

DOW_ORDER.forEach(dow => {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'dow-btn' + (dow === selectedDow ? ' active' : '')
  btn.dataset.dow = dow
  btn.textContent = DOW_ABBR[dow]
  btn.addEventListener('click', () => {
    selectedDow = dow
    dowContainer.querySelectorAll('.dow-btn').forEach(b =>
      b.classList.toggle('active', parseInt(b.dataset.dow) === dow)
    )
  })
  dowContainer.appendChild(btn)
})

let apptType = 'once'

typeToggle.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    apptType = btn.dataset.type
    typeToggle.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b === btn))
    dateGroup.style.display = apptType === 'once' ? '' : 'none'
    dowGroup.style.display  = apptType === 'weekly' ? '' : 'none'
  })
})

function todayDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function openModal() {
  apptType = 'once'
  typeToggle.querySelectorAll('.type-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.type === 'once')
  )
  titleInput.value = ''
  timeInput.value  = '18:30'
  orgTzSel.value   = localTz || 'Europe/Rome'
  dateInput.value  = todayDateString()
  dateGroup.style.display = ''
  dowGroup.style.display  = 'none'
  modal.classList.add('open')
  titleInput.focus()
}

function closeModal() {
  modal.classList.remove('open')
}

addBtn.addEventListener('click', openModal)
closeBtn.addEventListener('click', closeModal)
cancelBtn.addEventListener('click', closeModal)
modal.addEventListener('click', e => { if (e.target === modal) closeModal() })
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal() })

saveBtn.addEventListener('click', () => {
  const title = titleInput.value.trim()
  if (!title) { titleInput.focus(); return }
  if (apptType === 'once' && !dateInput.value) { dateInput.focus(); return }

  const appt = {
    id:          Date.now().toString(),
    title,
    time:        timeInput.value || '00:00',
    organizerTz: orgTzSel.value,
    type:        apptType,
  }

  if (apptType === 'once') {
    appt.date = dateInput.value
  } else {
    appt.dayOfWeek = selectedDow
  }

  const appts = loadAppointments()
  appts.push(appt)
  saveAppointments(appts)
  closeModal()
  renderAppointments()
})

renderAppointments()
