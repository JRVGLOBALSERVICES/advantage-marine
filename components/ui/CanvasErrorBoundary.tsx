"use client";

import { Component, type ReactNode } from "react";

/* A WebGL/R3F scene can THROW during render or init (software-GL on headless
   browsers, weak GPUs, Linux Firefox — the highest-yield WebGL regression
   surface). Without a boundary that throw propagates and Next.js replaces the
   whole page with "Application error: a client-side exception has occurred".
   This boundary catches it and calls onError so the parent can swap to its
   static fallback — the canvas can fail, the page cannot. */
export default class CanvasErrorBoundary extends Component<
  { children: ReactNode; onError?: () => void; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
