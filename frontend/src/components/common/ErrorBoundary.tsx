import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null })
        window.location.reload()
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                    <div className="bg-destructive/10 p-4 rounded-full mb-4">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Coś poszło nie tak</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Wystąpił nieoczekiwany błąd w aplikacji. Przepraszamy za utrudnienia.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="bg-muted p-4 rounded text-left text-sm mb-6 overflow-auto max-w-full">
                            {this.state.error?.message}
                        </pre>
                    )}
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Odśwież aplikację
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
