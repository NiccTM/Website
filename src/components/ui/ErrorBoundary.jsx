import { Component } from 'react'

/**
 * Props:
 *   silent   — render nothing on error (for background WebGL canvases)
 *   fallback — React node or render-prop fn(error, reset) for custom UI
 *   label    — section name shown in the default error UI (e.g. "Vinyl Archive")
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  reset() {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.silent) return null

    // Custom fallback: render-prop or static node
    if (this.props.fallback) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback(error, this.reset)
        : this.props.fallback
    }

    // Default: minimal error tile with retry
    return (
      <div className="px-5 py-6 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
        <div
          className="rounded-xl border-subtle p-5 flex flex-col gap-3"
          style={{ background: 'var(--bg-surface-1)' }}
        >
          <p className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
            {this.props.label
              ? `${this.props.label} failed to load.`
              : 'Section failed to load.'}
          </p>
          <button
            onClick={this.reset}
            className="self-start flex items-center gap-1.5 font-mono-data text-xs px-3 py-1.5 rounded-lg border-subtle transition-colors duration-150"
            style={{ color: 'var(--accent)', background: 'var(--bg-surface-2)' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-sm">refresh</span>
            Retry
          </button>
        </div>
      </div>
    )
  }
}
