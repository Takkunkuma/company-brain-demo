import { Component, type ReactNode } from 'react'

/** If saved demo state ever breaks rendering, offer a one-click way out instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg">
          <p className="text-base font-semibold text-slate-900">Something went wrong in the demo</p>
          <p className="mt-2 text-sm text-slate-600">Resetting clears the demo's saved state in this browser and starts again from Thursday 9:00 AM.</p>
          <button
            className="mt-5 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
            onClick={() => {
              localStorage.removeItem('company-brain-demo')
              window.location.hash = '/inventory'
              window.location.reload()
            }}
          >
            Reset demo
          </button>
        </div>
      </div>
    )
  }
}
