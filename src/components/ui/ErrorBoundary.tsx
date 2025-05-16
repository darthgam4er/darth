import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log error info here or send to a service
    // console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto mt-20">
          <Alert variant="destructive">
            <AlertTitle>Something went wrong.</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || "An unexpected error occurred. Please refresh the page or try again later."}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}
