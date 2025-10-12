/**
 * Tool Error Boundary
 * Wraps individual tool components to prevent one tool's error from crashing the entire app
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    toolName?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ToolErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: undefined,
            errorInfo: undefined
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error for debugging
        console.error('Tool Error Boundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: undefined,
            errorInfo: undefined
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const { toolName } = this.props;
            const { error } = this.state;

            return (
                <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className="max-w-md w-full space-y-6 text-center">
                        {/* Error Icon */}
                        <div className="flex justify-center">
                            <div className="rounded-full bg-destructive/10 p-4">
                                <AlertCircle className="h-12 w-12 text-destructive" />
                            </div>
                        </div>

                        {/* Error Title */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">
                                {toolName ? `Error in ${toolName}` : 'Something went wrong'}
                            </h2>
                            <p className="text-muted-foreground">
                                This tool encountered an unexpected error and couldn't be displayed.
                            </p>
                        </div>

                        {/* Error Details */}
                        {error && (
                            <div className="bg-muted rounded-lg p-4 text-left">
                                <p className="text-sm font-mono text-destructive break-words">
                                    {error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={this.handleReset}
                                variant="default"
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                            <Button
                                onClick={this.handleGoHome}
                                variant="outline"
                                className="gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-muted-foreground">
                            If this error persists, try refreshing the page or selecting a different tool.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
