import { DEMO_START } from '../data/scenario'

const nf = new Intl.NumberFormat('en-US')
const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 })

export const num = (n: number) => nf.format(Math.round(n))
export const usd = (n: number) => usd0.format(Math.round(n))
export const usdExact = (n: number) => usd2.format(n)
export const pct = (n: number) => `${n > 0 ? '+' : ''}${n}%`

function parse(iso: string) {
  // treat all demo timestamps as local wall-clock time
  const d = iso.length <= 10 ? new Date(iso + 'T00:00:00') : new Date(iso)
  return d
}

/** "Thu 9:04 AM" */
export function when(iso: string): string {
  const d = parse(iso)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' })
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} ${t}`
}

/** "Dec 9" */
export function day(iso: string): string {
  return parse(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "Thu, Nov 19" */
export function longDay(iso: string): string {
  return parse(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function clockToIso(minutes: number): string {
  const d = new Date(DEMO_START)
  d.setMinutes(d.getMinutes() + minutes)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}
