import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import i18n from "@/lib/i18n"

import { Button } from "@/components/ui/button"

type ErrorBoundaryProps = {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

/**
 * Class boundary around route/layout sections so unexpected render failures
 * show a recoverable UI instead of a blank screen.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  private handleReset = () => {
    this.props.onReset?.()
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const title =
      this.props.fallbackTitle ?? i18n.t("errors.boundaryTitle")

    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-card p-8 text-center shadow-sm">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {i18n.t("errors.boundaryDescription")}
        </p>
        {import.meta.env.DEV && this.state.error ? (
          <pre className="mt-4 max-w-full overflow-auto rounded-lg bg-muted p-3 text-start text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>
        ) : null}
        <div className="mt-6 flex gap-2">
          <Button type="button" onClick={this.handleReset}>
            {i18n.t("errors.tryAgain")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            {i18n.t("errors.reloadPage")}
          </Button>
        </div>
      </div>
    )
  }
}
