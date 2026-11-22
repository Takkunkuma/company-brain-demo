import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, X } from 'lucide-react'
import { useStore } from '../../store/store'
import { useDerived } from '../../store/derive'
import { SourceChip } from '../../components/FactValue'
import { Button, cx } from '../../components/ui'
import { answer, suggestions } from './intents'

export function Assistant() {
  const open = useStore((s) => s.assistantOpen)
  const setOpen = useStore((s) => s.setAssistant)
  const chat = useStore((s) => s.chat)
  const push = useStore((s) => s.pushChat)
  const log = useStore((s) => s.log)
  const d = useDerived()
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, typing])
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || useStore.getState().drawerKey) return
      e.preventDefault()
      setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, setOpen])

  const ask = (q: string) => {
    if (!q.trim() || typing) return
    push({ role: 'user', parts: [q] })
    setText('')
    setTyping(true)
    setTimeout(() => {
      push({ role: 'bot', parts: answer(q, d, log) })
      setTyping(false)
    }, 550)
  }

  if (!open) return null
  return (
    <aside role="dialog" aria-label="Ask Company Brain" className="slide-in fixed right-0 top-0 z-[65] flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl" data-tour="assistant">
      <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="flex size-7 items-center justify-center rounded-lg bg-accent-700 text-white"><Sparkles className="size-3.5" /></span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Ask Company Brain</p>
          <p className="text-[11px] text-slate-500">Answers only with sources</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close assistant"><X className="size-4" /></Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {chat.length === 0 && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Hi Maya. Ask me about any number. Every answer cites its source; click a chip to see the record.
          </div>
        )}
        {chat.map((t, i) => (
          <div key={i} className={cx('flex', t.role === 'user' && 'justify-end')}>
            <div className={cx('max-w-[90%] whitespace-pre-line rounded-xl px-3 py-2 text-sm leading-relaxed', t.role === 'user' ? 'bg-accent-700 text-white' : 'bg-slate-100 text-slate-800')}>
              {t.parts.map((p, k) =>
                typeof p === 'string' ? (
                  <span key={k}>{p}</span>
                ) : (
                  <span key={k} className="mx-0.5 inline-flex items-center gap-1 align-middle">
                    <b className="tnum">{d.facts[p.cite]?.display}</b>
                    <SourceChip factKey={p.cite} compact />
                  </span>
                ),
              )}
            </div>
          </div>
        ))}
        {typing && <div className="w-14 rounded-xl bg-slate-100 px-3 py-2 text-center text-slate-400">•••</div>}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-200 px-4 pb-3 pt-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button key={s} onClick={() => ask(s)} className="rounded-full border border-slate-200 px-2.5 py-1 text-left text-xs text-slate-600 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-800">
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(text) }} className="flex gap-2">
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about a number…" aria-label="Ask a question" className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-sm" />
          <Button variant="primary" type="submit" aria-label="Send question" disabled={!text.trim() || typing}><Send className="size-4" /></Button>
        </form>
        <p className="mt-2 text-center text-[11px] text-slate-500">The assistant explains and drafts. People make every decision.</p>
      </div>
    </aside>
  )
}
