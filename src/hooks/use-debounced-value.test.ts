import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./use-debounced-value";

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("abc"));
    expect(result.current).toBe("abc");
  });

  it("keeps the old value until the delay elapses", () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 350),
        { initialProps: { value: "a" } },
      );

      rerender({ value: "b" });
      act(() => vi.advanceTimersByTime(349));
      expect(result.current).toBe("a");

      act(() => vi.advanceTimersByTime(1));
      expect(result.current).toBe("b");
    } finally {
      vi.useRealTimers();
    }
  });

  it("only emits the last value when several changes happen in a row", () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 100),
        { initialProps: { value: 1 } },
      );

      rerender({ value: 2 });
      rerender({ value: 3 });
      act(() => vi.advanceTimersByTime(100));

      expect(result.current).toBe(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
