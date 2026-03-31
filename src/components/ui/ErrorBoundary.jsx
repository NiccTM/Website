import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      if (this.props.silent) return null
      return (
        <div className="px-6 py-6 sm:px-10 md:px-16 lg:px-24">
          <div
            className="rounded-xl border-subtle p-4 font-mono-data text-xs"
            style={{ background: 'var(--bg-surface-1)', color: 'var(--text-muted)' }}
          >
            Section failed to load.
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
