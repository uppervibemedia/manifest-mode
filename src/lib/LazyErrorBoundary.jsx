import { Component } from "react";

/**
 * Catches dynamic-import failures (chunk load errors) and auto-retries
 * by reloading the page once. After that it shows a friendly UI.
 */
export default class LazyErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, retried: false };
  }

  static getDerivedStateFromError(error) {
    const isChunkError =
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Importing a module script failed");
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error) {
    const isChunkError =
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Importing a module script failed");

    // Auto-reload once on chunk errors to pick up fresh module cache
    if (isChunkError && !this.state.retried) {
      this.setState({ retried: true });
      // Small delay so the new build has time to register
      setTimeout(() => window.location.reload(), 500);
    }
  }

  render() {
    if (this.state.hasError && this.state.retried) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Refreshing app…</p>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
          <p className="text-base font-semibold text-foreground">Something went wrong</p>
          <p className="text-sm text-muted-foreground">A page failed to load.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 gold-gradient text-background font-semibold rounded-xl text-sm"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}