"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallbackMessage?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * P2: Error boundary that wraps the canvas area.
 * Catches rendering errors (e.g. corrupted image data, NaN coordinates)
 * and shows a recovery UI instead of crashing the whole page.
 */
export default class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[CanvasErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#faf8f4] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="font-serif text-xl font-bold text-[#3f342d]">
            {this.props.fallbackMessage || "Something went wrong with the canvas"}
          </h3>
          <p className="max-w-md text-sm text-[#73685f]">
            {this.state.error?.message || "An unexpected error occurred while rendering the family tree."}
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-xl border border-[#dcc28e] bg-white px-6 py-2.5 text-sm font-semibold text-[#7b5a26] transition hover:bg-[#fffaf0]"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
