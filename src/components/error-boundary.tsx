import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="nwk-card w-full p-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">NWK</p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight text-ink">
              Something went wrong.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Please reload the app. If the problem persists, try clearing the app data.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 w-full rounded-xl bg-ink py-3 text-sm font-medium tracking-tight text-on-ink transition hover:bg-ink/90 active:scale-[0.98]"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
