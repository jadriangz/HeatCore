import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-8">
                    <div className="max-w-md space-y-4 text-center">
                        <h1 className="text-4xl font-bold text-destructive">Oops!</h1>
                        <p className="text-xl font-semibold">Something went wrong.</p>
                        <div className="bg-muted p-4 rounded-md text-left overflow-auto max-h-40 text-sm font-mono border">
                            {this.state.error?.message}
                        </div>
                        <p className="text-muted-foreground text-sm">
                            If this is a "Missing Supabase Environment Variables" error, please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel Project Settings.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
