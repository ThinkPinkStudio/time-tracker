// ─── Navigation ──────────────────────────────────────────────────────────────

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

  const dateFmt = new Intl.DateTimeFormat('it-IT', {
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
    document.getElementById('offset-text').textContent = 'Stesso fuso orario'
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
