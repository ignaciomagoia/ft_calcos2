"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type NavigationLoadingContextValue = {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
};

const NavigationLoadingContext =
  createContext<NavigationLoadingContextValue | null>(null);

const MIN_VISIBLE_MS = 180;
const FAILSAFE_MS = 12000;

const isModifiedClick = (event: MouseEvent) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

const shouldStartForAnchor = (anchor: HTMLAnchorElement) => {
  if (anchor.dataset.navLoader === "off") return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href) return false;
  if (
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }

  let nextUrl: URL;
  try {
    nextUrl = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }

  if (nextUrl.origin !== window.location.origin) return false;

  const currentUrl = new URL(window.location.href);
  const samePathAndSearch =
    nextUrl.pathname === currentUrl.pathname &&
    nextUrl.search === currentUrl.search;

  const onlyHashChange = samePathAndSearch && nextUrl.hash !== currentUrl.hash;
  const noNavigation =
    samePathAndSearch && (nextUrl.hash || "") === (currentUrl.hash || "");

  if (onlyHashChange || noNavigation) return false;

  return true;
};

export const NavigationLoadingProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const startedAtRef = useRef(0);
  const failsafeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFailsafe = useCallback(() => {
    if (failsafeTimeoutRef.current) {
      clearTimeout(failsafeTimeoutRef.current);
      failsafeTimeoutRef.current = null;
    }
  }, []);

  const stopLoading = useCallback(() => {
    clearFailsafe();
    isLoadingRef.current = false;
    setIsLoading(false);
  }, [clearFailsafe]);

  const startLoading = useCallback(() => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    startedAtRef.current = Date.now();
    setIsLoading(true);

    clearFailsafe();
    failsafeTimeoutRef.current = setTimeout(() => {
      stopLoading();
    }, FAILSAFE_MS);
  }, [clearFailsafe, stopLoading]);

  useEffect(() => {
    if (!isLoadingRef.current) return;

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const timeout = setTimeout(() => {
      stopLoading();
    }, remaining);

    return () => clearTimeout(timeout);
  }, [pathname, stopLoading]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (isModifiedClick(event)) return;

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      if (shouldStartForAnchor(anchor)) {
        startLoading();
      }
    };

    const onPopState = () => {
      startLoading();
    };

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [startLoading]);

  useEffect(() => {
    return () => {
      clearFailsafe();
    };
  }, [clearFailsafe]);

  return (
    <NavigationLoadingContext.Provider
      value={{
        isLoading,
        startLoading,
        stopLoading,
      }}
    >
      {children}
      {isLoading ? <NavigationLoadingOverlay /> : null}
    </NavigationLoadingContext.Provider>
  );
};

const NavigationLoadingOverlay = () => {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-white/18 backdrop-blur-[1.5px]"
      role="status"
      aria-live="polite"
      aria-label="Cargando"
    >
      <div className="inline-flex items-center justify-center rounded-full bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
        <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-[var(--color-secondary)] border-t-[var(--color-primary)]" />
      </div>
    </div>
  );
};

export const useNavigationLoading = () => {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error(
      "useNavigationLoading debe usarse dentro de NavigationLoadingProvider."
    );
  }
  return context;
};
