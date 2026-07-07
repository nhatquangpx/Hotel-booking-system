import { useState, useLayoutEffect, useRef } from 'react';

/**
 * Tính số mục vừa khít vùng danh sách (đo qua phần tử probe ẩn).
 */
export function useFillListPageSize(items, enabled, listGap = 8) {
  const wrapRef = useRef(null);
  const probeRef = useRef(null);
  const [pageSize, setPageSize] = useState(1);

  useLayoutEffect(() => {
    if (!enabled) return undefined;

    if (!items.length) {
      setPageSize(1);
      return undefined;
    }

    const measure = () => {
      const wrap = wrapRef.current;
      const probe = probeRef.current;
      if (!wrap || !probe) return;

      const wrapH = wrap.clientHeight;
      const itemH = probe.offsetHeight;
      if (wrapH <= 0 || itemH <= 0) return;

      const listEl = wrap.querySelector('.staff-dashboard-panel__list');
      const gap = listEl
        ? parseFloat(getComputedStyle(listEl).rowGap || getComputedStyle(listEl).gap) || listGap
        : listGap;

      const fit = Math.max(1, Math.floor((wrapH + gap) / (itemH + gap)));
      setPageSize(Math.min(fit, items.length));
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [enabled, items, items.length, items[0]?.id, listGap]);

  return { wrapRef, probeRef, pageSize: enabled ? pageSize : null };
}
