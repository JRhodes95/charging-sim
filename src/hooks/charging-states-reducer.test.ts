import { describe, it, expect, vi, beforeEach } from "vitest";
import { add } from "date-fns";
import {
  chargingStatesReducer,
  estimateChargeDurationSeconds,
  type ChargingAction,
} from "./charging-states-reducer";
import type { ChargerState } from "./use-charging-state";
import type { CarState } from "./use-car-state";

describe("chargingStatesReducer", () => {
  let mockTimestamp: Date;
  let mockCarState: CarState;

  beforeEach(() => {
    mockTimestamp = new Date("2024-01-01T12:00:00Z");
    mockCarState = {
      model: "Test Car",
      nickname: "Test",
      stateOfCharge: 50.0,
    };
  });

  describe("estimateChargeDurationSeconds", () => {
    it("calculates correct duration for normal charging scenario", () => {
      const result = estimateChargeDurationSeconds(50, 85);
      expect(result).toBe(350); // (85 - 50) / 0.1 = 350 seconds
    });

    it("handles zero charge difference", () => {
      const result = estimateChargeDurationSeconds(85, 85);
      expect(result).toBe(0);
    });

    it("handles negative charge difference", () => {
      const result = estimateChargeDurationSeconds(80, 70);
      expect(result).toBe(-100); // (70 - 80) / 0.1 = -100 seconds
    });
  });

  describe("UNPLUG_CAR action", () => {
    it("transitions from any state to unplugged", () => {
      const initialStates: ChargerState[] = [
        { status: "idle" },
        {
          status: "charging-override",
          charge: { startTime: mockTimestamp, endTime: mockTimestamp },
        },
        {
          status: "awaiting-scheduled-charge",
          charge: {
            startTime: mockTimestamp,
            endTime: mockTimestamp,
            targetChargePercent: 85,
          },
        },
        { status: "schedule-suspended", suspendedUntil: mockTimestamp },
      ];

      const action: ChargingAction = { type: "UNPLUG_CAR" };

      initialStates.forEach((initialState) => {
        const result = chargingStatesReducer(initialState, action);
        expect(result).toEqual({ status: "unplugged" });
      });
    });
  });

  describe("PLUG_IN_CAR action", () => {
    it("transitions from unplugged to idle", () => {
      const initialState: ChargerState = { status: "unplugged" };
      const action: ChargingAction = { type: "PLUG_IN_CAR" };

      const result = chargingStatesReducer(initialState, action);
      expect(result).toEqual({ status: "idle" });
    });
  });

  describe("TRIGGER_OVERRIDE action", () => {
    it("transitions to charging-override with correct timing", () => {
      const initialState: ChargerState = { status: "idle" };
      const action: ChargingAction = {
        type: "TRIGGER_OVERRIDE",
        timestamp: mockTimestamp,
      };

      const result = chargingStatesReducer(initialState, action);

      expect(result.status).toBe("charging-override");
      if (result.status === "charging-override") {
        expect(result.charge.startTime).toEqual(mockTimestamp);
        expect(result.charge.endTime).toEqual(
          add(mockTimestamp, { minutes: 60 })
        );
      }
    });
  });

  describe("CANCEL_OVERRIDE_CHARGE action", () => {
    it("transitions from charging-override to idle", () => {
      const initialState: ChargerState = {
        status: "charging-override",
        charge: {
          startTime: mockTimestamp,
          endTime: add(mockTimestamp, { minutes: 60 }),
        },
      };
      const action: ChargingAction = { type: "CANCEL_OVERRIDE_CHARGE" };

      const result = chargingStatesReducer(initialState, action);
      expect(result).toEqual({ status: "idle" });
    });
  });

  describe("CANCEL_SCHEDULED_CHARGE action", () => {
    it("transitions to schedule-suspended with tomorrow 6 AM timing", () => {
      const initialState: ChargerState = { status: "idle" };
      const action: ChargingAction = {
        type: "CANCEL_SCHEDULED_CHARGE",
        timestamp: mockTimestamp,
      };

      const result = chargingStatesReducer(initialState, action);

      expect(result.status).toBe("schedule-suspended");
      if (result.status === "schedule-suspended") {
        const expectedSuspendedUntil = new Date("2024-01-02T06:00:00Z"); // Tomorrow at 6 AM
        expect(result.suspendedUntil).toEqual(expectedSuspendedUntil);
      }
    });
  });

  describe("SCHEDULE_CHARGE action", () => {
    it("transitions to awaiting-scheduled-charge with correct timing and target", () => {
      const initialState: ChargerState = { status: "idle" };
      const action: ChargingAction = {
        type: "SCHEDULE_CHARGE",
        carState: mockCarState,
        timestamp: mockTimestamp,
      };

      const result = chargingStatesReducer(initialState, action);

      expect(result.status).toBe("awaiting-scheduled-charge");
      if (result.status === "awaiting-scheduled-charge") {
        const expectedStartTime = add(mockTimestamp, { minutes: 0.1 });
        const expectedDuration = estimateChargeDurationSeconds(50, 85); // 350 seconds
        const expectedEndTime = add(expectedStartTime, {
          seconds: expectedDuration,
        });

        expect(result.charge.startTime).toEqual(expectedStartTime);
        expect(result.charge.endTime).toEqual(expectedEndTime);
        expect(result.charge.targetChargePercent).toBe(85);
      }
    });
  });

  describe("START_SCHEDULED_CHARGE action", () => {
    it("transitions from awaiting-scheduled-charge to charging-scheduled", () => {
      const charge = {
        startTime: mockTimestamp,
        endTime: add(mockTimestamp, { minutes: 30 }),
        targetChargePercent: 85,
      };
      const initialState: ChargerState = {
        status: "awaiting-scheduled-charge",
        charge,
      };
      const action: ChargingAction = { type: "START_SCHEDULED_CHARGE" };

      const result = chargingStatesReducer(initialState, action);

      expect(result.status).toBe("charging-scheduled");
      if (result.status === "charging-scheduled") {
        expect(result.charge).toEqual(charge);
      }
    });

    it("does not transition if not in awaiting-scheduled-charge state", () => {
      const initialState: ChargerState = { status: "idle" };
      const action: ChargingAction = { type: "START_SCHEDULED_CHARGE" };

      const result = chargingStatesReducer(initialState, action);
      expect(result).toEqual(initialState);
    });
  });

  describe("RESUME_FROM_SUSPENSION action", () => {
    it("transitions from schedule-suspended to idle", () => {
      const initialState: ChargerState = {
        status: "schedule-suspended",
        suspendedUntil: mockTimestamp,
      };
      const action: ChargingAction = { type: "RESUME_FROM_SUSPENSION" };

      const result = chargingStatesReducer(initialState, action);
      expect(result).toEqual({ status: "idle" });
    });
  });

  describe("State immutability", () => {
    it("does not mutate the original state", () => {
      const initialState: ChargerState = { status: "idle" };
      const action: ChargingAction = { type: "PLUG_IN_CAR" };

      const result = chargingStatesReducer(initialState, action);

      expect(result).not.toBe(initialState); // Different object reference
      expect(initialState).toEqual({ status: "idle" }); // Original unchanged
    });
  });

  describe("Invalid actions", () => {
    it("returns current state for unknown action types", () => {
      const initialState: ChargerState = { status: "idle" };
      const action = { type: "INVALID_ACTION" };

      // @ts-expect-error Testing invalid action type
      const result = chargingStatesReducer(initialState, action);
      expect(result).toEqual(initialState);
    });
  });

  describe("State transition combinations", () => {
    it("handles complex state transition sequence", () => {
      let state: ChargerState = { status: "unplugged" };

      // Plug in car
      state = chargingStatesReducer(state, { type: "PLUG_IN_CAR" });
      expect(state.status).toBe("idle");

      // Trigger override
      state = chargingStatesReducer(state, {
        type: "TRIGGER_OVERRIDE",
        timestamp: mockTimestamp,
      });
      expect(state.status).toBe("charging-override");

      // Cancel override
      state = chargingStatesReducer(state, { type: "CANCEL_OVERRIDE_CHARGE" });
      expect(state.status).toBe("idle");

      // Cancel scheduled charge (suspend)
      state = chargingStatesReducer(state, {
        type: "CANCEL_SCHEDULED_CHARGE",
        timestamp: mockTimestamp,
      });
      expect(state.status).toBe("schedule-suspended");

      // Resume from suspension
      state = chargingStatesReducer(state, { type: "RESUME_FROM_SUSPENSION" });
      expect(state.status).toBe("idle");
    });
  });
});
