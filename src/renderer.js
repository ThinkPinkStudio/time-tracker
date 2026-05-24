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

// ─── Calendar (iCalendar / .ics) interop ──────────────────────────────────────

const BYDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const BYDAY_TO_DOW = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

const pad2 = n => String(n).padStart(2, '0')

// UTC instant → "YYYYMMDDTHHMMSSZ"
function toIcsUtc(date) {
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
}

// "YYYY-MM-DD" + "HH:MM" → "YYYYMMDDTHHMM00" (floating, no separators)
function toIcsLocal(dateStr, timeStr) {
  return `${dateStr.replace(/-/g, '')}T${timeStr.replace(':', '')}00`
}

// UTC instant → local wall-clock "YYYYMMDDTHHMMSS" in the given timezone
function toIcsWallInTz(date, tz) {
  const parts = {}
  new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date).forEach(p => { parts[p.type] = p.value })
  const hour = parts.hour === '24' ? '00' : parts.hour
  return `${parts.year}${parts.month}${parts.day}T${hour}${parts.minute}${parts.second}`
}

function icsEscape(text) {
  return String(text)
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function icsUnescape(text) {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\' && i + 1 < text.length) {
      const next = text[++i]
      if (next === 'n' || next === 'N') out += '\n'
      else out += next
    } else {
      out += text[i]
    }
  }
  return out
}

// Fold lines longer than 75 octets per RFC 5545 (continuation lines start with a space)
function foldLine(line) {
  if (line.length <= 73) return line
  let folded = line.slice(0, 73)
  let rest = line.slice(73)
  while (rest.length > 72) {
    folded += '\r\n ' + rest.slice(0, 72)
    rest = rest.slice(72)
  }
  return folded + '\r\n ' + rest
}

function buildVEvent(appt) {
  const tz = appt.organizerTz
  const startDate = appt.type === 'once' ? appt.date : nextDateForDow(appt.dayOfWeek)
  const startUTC = apptLocalToUTC(startDate, appt.time, tz)
  const endUTC = new Date(startUTC.getTime() + 3_600_000)

  const lines = [
    'BEGIN:VEVENT',
    `UID:${appt.id}@thinkpinkstudio`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    foldLine(`SUMMARY:${icsEscape(appt.title)}`),
    `DTSTART;TZID=${tz}:${toIcsLocal(startDate, appt.time)}`,
    `DTEND;TZID=${tz}:${toIcsWallInTz(endUTC, tz)}`,
  ]
  if (appt.type === 'weekly') {
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${BYDAY_CODES[appt.dayOfWeek]}`)
  }
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

function buildIcs(appts) {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ThinkPink Studio//Timezone Converter//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  return [...header, ...appts.map(buildVEvent), 'END:VCALENDAR'].join('\r\n') + '\r\n'
}

function parseRrule(value) {
  const out = {}
  value.split(';').forEach(part => {
    const [k, v] = part.split('=')
    if (k) out[k.toUpperCase()] = v
  })
  return out
}

function bydayToDow(byday) {
  const code = (byday || '').replace(/[^A-Za-z]/g, '').slice(-2).toUpperCase()
  return BYDAY_TO_DOW[code]
}

function eventToAppt(ev) {
  if (!ev.dtstart) return null
  const { value, params } = ev.dtstart

  let tzid = null
  let dateOnly = false
  params.forEach(p => {
    const [k, v] = p.split('=')
    if (!k) return
    if (k.toUpperCase() === 'TZID') tzid = v
    if (k.toUpperCase() === 'VALUE' && (v || '').toUpperCase() === 'DATE') dateOnly = true
  })

  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?/)
  if (!m) return null
  const [, year, month, day, hour, minute, , utcFlag] = m

  const date = `${year}-${month}-${day}`
  const time = (dateOnly || hour === undefined) ? '00:00' : `${hour}:${minute}`

  let organizerTz
  if (tzid) organizerTz = tzid
  else if (utcFlag) organizerTz = 'UTC'
  else organizerTz = getPreferredTz()

  const rrule = ev.rrule ? parseRrule(ev.rrule) : null
  const isWeekly = rrule && (rrule.FREQ || '').toUpperCase() === 'WEEKLY'

  const appt = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    title: ev.summary || 'Untitled',
    time,
    organizerTz,
    type: isWeekly ? 'weekly' : 'once',
  }

  if (isWeekly) {
    let dow = rrule.BYDAY ? bydayToDow(rrule.BYDAY.split(',')[0]) : undefined
    if (dow === undefined) dow = new Date(Date.UTC(+year, +month - 1, +day)).getUTCDay()
    appt.dayOfWeek = dow
  } else {
    appt.date = date
  }
  return appt
}

function parseIcs(text) {
  const unfolded = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '')
  const events = []
  let cur = null

  unfolded.split('\n').forEach(line => {
    if (line === 'BEGIN:VEVENT') { cur = {}; return }
    if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; return }
    if (!cur) return

    const idx = line.indexOf(':')
    if (idx < 0) return
    const [name, ...params] = line.slice(0, idx).split(';')
    const value = line.slice(idx + 1)

    switch (name.toUpperCase()) {
      case 'SUMMARY': cur.summary = icsUnescape(value); break
      case 'DTSTART': cur.dtstart = { value, params }; break
      case 'RRULE':   cur.rrule = value; break
    }
  })

  return events.map(eventToAppt).filter(Boolean)
}

function googleCalUrl(appt) {
  const startDate = appt.type === 'once' ? appt.date : nextDateForDow(appt.dayOfWeek)
  const startUTC = apptLocalToUTC(startDate, appt.time, appt.organizerTz)
  const endUTC = new Date(startUTC.getTime() + 3_600_000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: appt.title,
    dates: `${toIcsUtc(startUTC)}/${toIcsUtc(endUTC)}`,
  })
  if (appt.type === 'weekly') {
    params.set('recur', `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY_CODES[appt.dayOfWeek]}`)
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function sanitizeFileName(title) {
  return (title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 40)) || 'event'
}

async function exportAllAppointments() {
  const appts = loadAppointments()
  if (!appts.length || !window.calendarAPI) return
  await window.calendarAPI.exportIcs('appointments.ics', buildIcs(appts))
}

async function exportSingleAppointment(appt) {
  if (!window.calendarAPI) return
  await window.calendarAPI.exportIcs(`${sanitizeFileName(appt.title)}.ics`, buildIcs([appt]))
}

async function importAppointments() {
  if (!window.calendarAPI) return
  const res = await window.calendarAPI.importIcs()
  if (!res || !res.ok) return
  const parsed = parseIcs(res.content)
  if (!parsed.length) return
  const appts = loadAppointments()
  parsed.forEach(p => appts.push(p))
  saveAppointments(appts)
  renderAppointments()
}

function openInGoogleCalendar(appt) {
  if (!window.calendarAPI) return
  window.calendarAPI.openExternal(googleCalUrl(appt))
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
        <div class="appt-card-actions">
          <button class="appt-icon-btn appt-google-btn" title="${escapeHtml(t('appt_add_to_google'))}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="12" y1="13" x2="12" y2="19"/>
              <line x1="9" y1="16" x2="15" y2="16"/>
            </svg>
          </button>
          <button class="appt-icon-btn appt-export-btn" title="${escapeHtml(t('appt_export_one'))}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button class="appt-icon-btn appt-delete-btn" data-id="${appt.id}" title="${escapeHtml(t('appt_delete'))}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
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

    card.querySelector('.appt-google-btn').addEventListener('click', () => openInGoogleCalendar(appt))
    card.querySelector('.appt-export-btn').addEventListener('click', () => exportSingleAppointment(appt))
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

const importBtn = document.getElementById('appt-import-btn')
const exportBtn = document.getElementById('appt-export-btn')
if (importBtn) importBtn.addEventListener('click', importAppointments)
if (exportBtn) exportBtn.addEventListener('click', exportAllAppointments)

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
