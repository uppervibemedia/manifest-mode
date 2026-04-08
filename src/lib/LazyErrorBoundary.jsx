import { Component } from "react";

const RELOAD_KEY = "__lazy_reload_attempted__";

export default class LazyErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    const isChunkError =
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Importing a module script failed");

    if (isChunkError) {
      const attempts = parseInt(sessionStorage.getItem(RELOAD_KEY) || "0", 10);
      if (attempts < 3) {
        sessionStorage.setItem(RELOAD_KEY, String(attempts + 1));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
          <p className="text-base font-semibold text-foreground">Something went wrong</p>
          <p className="text-sm text-muted-foreground">A page failed to load.</p>
          <button
            onClick={() => {
              sessionStorage.removeItem(RELOAD_KEY);
              window.location.reload();
            }}
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