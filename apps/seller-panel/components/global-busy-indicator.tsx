"use client";

import { useEffect, useRef, useState } from "react";

export function GlobalBusyIndicator() {
  const [visible, setVisible] = useState(false);
  const pending = useRef(0);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      pending.current += 1;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (pending.current === 1) {
        showTimer.current = setTimeout(() => {
          shownAt.current = Date.now();
          setVisible(true);
        }, 180);
      }

      try {
        return await originalFetch(...args);
      } finally {
        pending.current = Math.max(0, pending.current - 1);
        if (pending.current === 0) {
          if (showTimer.current) clearTimeout(showTimer.current);
          const remaining = Math.max(0, 320 - (Date.now() - shownAt.current));
          hideTimer.current = setTimeout(() => setVisible(false), remaining);
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="global-busy-overlay" role="status" aria-label="İşlem sürüyor">
      <div className="global-busy-mark">
        <img src="/img/anayazi.png" alt="" />
      </div>
    </div>
  );
}
