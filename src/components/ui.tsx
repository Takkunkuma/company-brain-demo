import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AlertTriangle, Check, FileSpreadsheet, FileText, Database, Mail, MessageCircle, Sigma, LineChart, type LucideIcon } from 'lucide-react'
import type { PersonId, SourceKind } from '../data/scenario'
import { people } from '../data/scenario'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function Card({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]', className)} {...rest}>
      {children}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber'
export function Button({ variant = 'secondary', size = 'md', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  const v: Record<Variant, string> = {
    primary: 'bg-accent-700 text-white hover:bg-accent-800 shadow-sm disabled:bg-slate-300',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 disabled:text-slate-400',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    amber: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
  }
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
        v[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

type Tone = 'slate' | 'green' | 'amber' | 'red' | 'indigo' | 'sky' | 'violet'
export function Badge({ tone = 'slate', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const t: Record<Tone, string> = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    indigo: 'bg-accent-50 text-accent-700 ring-accent-200',
    sky: 'bg-sky-50 text-sky-700 ring-sky-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  }
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset', t[tone], className)}>{children}</span>
}

export const sourceMeta: Record<SourceKind, { icon: LucideIcon; cls: string }> = {
  ERP: { icon: Database, cls: 'text-sky-700 bg-sky-50 ring-sky-200' },
  Excel: { icon: FileSpreadsheet, cls: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  Email: { icon: Mail, cls: 'text-violet-700 bg-violet-50 ring-violet-200' },
  Chat: { icon: MessageCircle, cls: 'text-teal-700 bg-teal-50 ring-teal-200' },
  PDF: { icon: FileText, cls: 'text-rose-700 bg-rose-50 ring-rose-200' },
  Derived: { icon: Sigma, cls: 'text-slate-700 bg-slate-100 ring-slate-200' },
  Analysis: { icon: LineChart, cls: 'text-accent-700 bg-accent-50 ring-accent-200' },
}

export function SourceIcon({ kind, className }: { kind: SourceKind; className?: string }) {
  const Icon = sourceMeta[kind].icon
  return <Icon aria-hidden className={cx('size-3.5', className)} />
}

export function Avatar({ who, size = 'sm' }: { who: PersonId; size?: 'xs' | 'sm' | 'md' }) {
  const p = people[who]
  const s = size === 'xs' ? 'size-4 text-[8px]' : size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-xs'
  return (
    <span aria-hidden className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', p.color, s)}>
      {p.initials}
    </span>
  )
}

export function StatusDot({ tone }: { tone: 'green' | 'amber' | 'red' | 'slate' }) {
  const c = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', slate: 'bg-slate-400' }[tone]
  return <span aria-hidden className={cx('inline-block size-1.5 rounded-full', c)} />
}

export function ConflictIcon() {
  return <AlertTriangle aria-label="Conflict" className="size-3.5 text-amber-500" />
}
export function CheckIcon({ className }: { className?: string }) {
  return <Check aria-hidden className={cx('size-3.5', className)} />
}

/** Counts up/down to a new value when it changes and briefly highlights. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value)
  const [flash, setFlash] = useState(0)
  const from = useRef(value)
  useEffect(() => {
    if (from.current === value) return
    const start = from.current
    const t0 = performance.now()
    const dur = 450
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      setShown(start + (value - start) * e)
      if (k < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    setFlash((f) => f + 1)
    return () => {
      cancelAnimationFrame(raf)
      from.current = value
    }
  }, [value])
  return (
    <span key={flash} className={cx('tnum', flash > 0 && 'flash')}>
      {format(shown)}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-slate-900">{children}</h2>
      {right}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-accent-600' : 'bg-slate-300')}
      >
        <span className={cx('inline-block size-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4.5' : 'translate-x-0.5')} />
      </button>
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  )
}
