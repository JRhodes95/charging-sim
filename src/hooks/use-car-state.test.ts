import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCarState } from "./use-car-state";
import { formatChargePercentage } from "../lib/utils";

describe("formatChargePercentage", () => {
  it("formats whole numbers to one decimal place", () => {
    expect(formatChargePercentage(50)).toBe("50.0");
    expect(formatChargePercentage(100)).toBe("100.0");
    expect(formatChargePercentage(0)).toBe("0.0");
  });

  it("formats decimal numbers to one decimal place", () => {
    expect(formatChargePercentage(50.5)).toBe("50.5");
    expect(formatChargePercentage(75.2)).toBe("75.2");
    expect(formatChargePercentage(33.333)).toBe("33.3");
  });

  it("rounds to one decimal place", () => {
    expect(formatChargePercentage(50.15)).toBe("50.1");
    expect(formatChargePercentage(50.14)).toBe("50.1");
    expect(formatChargePercentage(50.16)).toBe("50.2");
    expect(formatChargePercentage(99.999)).toBe("100.0");
  });

  it("handles edge cases", () => {
    expect(formatChargePercentage(0.1)).toBe("0.1");
    expect(formatChargePercentage(0.05)).toBe("0.1");
    expect(formatChargePercentage(0.04)).toBe("0.0");
  });
});

describe("useCarState", () => {
  it("returns correct initial state", () => {
    const initialState = {
      model: "Mini Cooper E",
      nickname: "kEVin",
      stateOfCharge: 21.0,
    };
    const { result } = renderHook(() => useCarState(initialState));

    expect(result.current.carState).toEqual(initialState);
  });

  it("increments charge when incrementCharge is called", () => {
    const initialState = {
      model: "Tesla Model S",
      nickname: "Test Car",
      stateOfCharge: 50.0,
    };
    const { result } = renderHook(() => useCarState(initialState));

    const initialCharge = result.current.carState.stateOfCharge;

    act(() => {
      result.current.incrementCharge();
    });

    expect(result.current.carState.stateOfCharge).toBe(initialCharge + 0.1);
  });

  it("cannot brute force charge past 100% - caps at 100%", () => {
    const initialState = {
      model: "Test Car",
      nickname: "Test",
      stateOfCharge: 99.8,
    };
    const { result } = renderHook(() => useCarState(initialState));

    // Brute force increment way past 100%
    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.incrementCharge();
      }
    });

    // The hook now prevents going over 100% - it caps at exactly 100%
    expect(result.current.carState.stateOfCharge).toBe(100);
  });

  it("cannot increment from exactly 100% - stays at 100%", () => {
    const initialState = {
      model: "Test Car",
      nickname: "Test",
      stateOfCharge: 100.0,
    };
    const { result } = renderHook(() => useCarState(initialState));

    // Try incrementing from exactly 100%
    act(() => {
      result.current.incrementCharge();
    });

    expect(result.current.carState.stateOfCharge).toBe(100);

    // Try incrementing multiple times from 100%
    act(() => {
      for (let i = 0; i < 50; i++) {
        result.current.incrementCharge();
      }
    });

    expect(result.current.carState.stateOfCharge).toBe(100);
  });

  it("maintains other car state properties when incrementing charge", () => {
    const initialState = {
      model: "BMW i3",
      nickname: "Electric Blue",
      stateOfCharge: 30.0,
    };
    const { result } = renderHook(() => useCarState(initialState));

    act(() => {
      result.current.incrementCharge();
    });

    expect(result.current.carState.model).toBe("BMW i3");
    expect(result.current.carState.nickname).toBe("Electric Blue");
  });

  it("accepts initial state override", () => {
    const initialState = {
      model: "Tesla Model 3",
      nickname: "Sparky",
      stateOfCharge: 50.5,
    };
    const { result } = renderHook(() => useCarState(initialState));

    expect(result.current.carState).toEqual(initialState);
  });

  it("accepts custom initial state", () => {
    const customState = {
      model: "Nissan Leaf",
      nickname: "Green Machine",
      stateOfCharge: 75.5,
    };
    const { result } = renderHook(() => useCarState(customState));

    expect(result.current.carState).toEqual(customState);
  });
});
