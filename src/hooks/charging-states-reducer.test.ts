import { describe, it, expect, vi, beforeEach } from "vitest";
import { add } from "date-fns";
import {
  chargingStatesReducer,
  estimateChargeDurationSeconds,
  type ChargingAction,
  type ChargingStateWithEvents,
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
      const initialChargerStates: ChargerState[] = [
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

      initialChargerStates.forEach((chargerState) => {
        const initialState: ChargingStateWithEvents = {
          chargerState,
          eventHistory: [],
        };
        const result = chargingStatesReducer(initialState, action);
        expect(result.chargerState).toEqual({ status: "unplugged" });
        expect(result.eventHistory.length).toBe(1);
        expect(result.eventHistory[0].type).toBe("connection");
      });
    });
  });

  describe("PLUG_IN_CAR action", () => {
    it("transitions from unplugged to idle", () => {
      const initialState: ChargingStateWithEvents = {
        chargerState: { status: "unplugged" },
        eventHistory: [],
      };
      const action: ChargingAction = { type: "PLUG_IN_CAR" };

      const result = chargingStatesReducer(initialState, action);
      expect(result.chargerState).toEqual({ status: "idle" });
      expect(result.eventHistory.length).toBe(1);
      expect(result.eventHistory[0].type).toBe("connection");
    });
  });

  describe("TRIGGER_OVERRIDE action", () => {
    it("transitions to charging-override with correct timing", () => {
      const initialState: ChargingStateWithEvents = {
        chargerState: { status: "idle" },
        eventHistory: [],
      };
      const action: ChargingAction = {
        type: "TRIGGER_OVERRIDE",
        timestamp: mockTimestamp,
      };

      const result = chargingStatesReducer(initialState, action);

      expect(result.chargerState.status).toBe("charging-override");
      if (result.chargerState.status === "charging-override") {
        expect(result.chargerState.charge.startTime).toEqual(mockTimestamp);
        expect(result.chargerState.charge.endTime).toEqual(
          add(mockTimestamp, { minutes: 60 })
        );
      }
      expect(result.eventHistory.length).toBe(1);
      expect(result.eventHistory[0].type).toBe("override");
    });
  });

  describe("CANCEL_OVERRIDE_CHARGE action", () => {
    it("transitions from charging-override to idle", () => {
      const initialState: ChargingStateWithEvents = {
        chargerState: {
          status: "charging-override",
          charge: {
            startTime: mockTimestamp,
            endTime: add(mockTimestamp, { minutes: 60 }),
          },
        },
        eventHistory: [],
      };
      const action: ChargingAction = { type: "CANCEL_OVERRIDE_CHARGE" };

      const result = chargingStatesReducer(initialState, action);
      expect(result.chargerState).toEqual({ status: "idle" });
      expect(result.eventHistory.length).toBe(1);
      expect(result.eventHistory[0].type).toBe("charging");
    });
  });

  describe("CANCEL_SCHEDULED_CHARGE action", () => {
    it("transitions to schedule-suspended with tomorrow 6 AM timing", () => {
      const initialState: ChargingStateWithEvents = {
        chargerState: { status: "idle" },
        eventHistory: [],
      };
      const action: ChargingAction = {
        type: "CANCEL_SCHEDULED_CHARGE",
        timestamp: mockTimestamp,
      };

      const result = chargingStatesReducer(initialState, action);

      expect(result.chargerState.status).toBe("schedule-suspended");
      if (result.chargerState.status === "schedule-suspended") {
        const expectedSuspendedUntil = new Date("2024-01-02T06:00:00Z"); // Tomorrow at 6 AM
        expect(result.chargerState.suspendedUntil).toEqual(expectedSuspendedUntil);
      }
      expect(result.eventHistory.length).toBe(1);
      expect(result.eventHistory[0].type).toBe("schedule");
    });
  });

  describe("SCHEDULE_CHARGE action", () => {
    it("transitions to awaiting-scheduled-charge with correct timing and target", () => {
      const initialState: ChargingStateWithEvents = {
        chargerState: { status: "idle" },
        eventHistory: [],
      };
      const action: ChargingAction = {
        type: "SCHEDULE_CHARGE",
        carState: mockCarState,
        timestamp: mockTimestamp,
      };

      const result = chargingStatesReducer(initialState, action);

      expect(result.chargerState.status).toBe("awaiting-scheduled-charge");
      if (result.chargerState.status === "awaiting-scheduled-charge") {
        const expectedStartTime = add(mockTimestamp, { minutes: 0.1 });
        const expectedDuration = estimateChargeDurationSeconds(50, 85); // 350 seconds
        const expectedEndTime = add(expectedStartTime, {
          seconds: expectedDuration,
        });

        expect(result.chargerState.charge.startTime).toEqual(expectedStartTime);
        expect(result.chargerState.charge.endTime).toEqual(expectedEndTime);
        expect(result.chargerState.charge.targetChargePercent).toBe(85);
      }
      expect(result.eventHistory.length).toBe(1);
      expect(result.eventHistory[0].type).toBe("schedule");
    });
  });

  describe("START_SCHEDULED_CHARGE action", () => {
    it("transitions from awaiting-scheduled-charge to charging-scheduled", () => {
      const charge = {
        startTime: mockTimestamp,
        endTime: add(mockTimestamp, { minutes: 30 }),
        targetChargePercent: 85,
      };
      const initialState: ChargingStateWithEvents = {
        chargerState: {
          status: "awaiting-scheduled-charge",
          charge,
        },
        eventHistory: [],
      };
      const action: ChargingAction = { type: "START_SCHEDULED_CHARGE" };

      const result = chargingStatesReducer(initialState, action);

      expect(result.chargerState.status).toBe("charging-scheduled");
      if (result.chargerState.status === "charging-scheduled") {
        expect(result.chargerState.charge).toEqual(charge);
      }
      expect(result.eventHistory.length).toBe(1);
      expect(result.eventHistory[0].type).toBe("charging");
    });

    it("does not transition if not in awaiting-scheduled-charge state", () => {
      const initialState: ChargingStateWithEvents = {
        chargerState: { status: "idle" },
        eventHistory: [],
      };
      const action: ChargingAction = { type: "START_SCHEDULED_CHARGE" };

      const result = chargingStatesReducer(initialState, action);
      expect(result).toEqual(initialState);
    });
  });

  describe("RESUME_FROM_SUSPENSION action", () => {
    it("transitions from schedule-suspended to idle", () => {
      const initialState: ChargingStateWithEvents = {
        chargerState: {
          status: "schedule-suspended",
          suspendedUntil: mockTimestamp,
        },
        eventHistory: [],
      };
      const action: ChargingAction = { type: "RESUME_FROM_SUSPENSION" };

      const result = chargingStatesReducer(initialState, action);
      expect(result.chargerState).toEqual({ status: "idle" });
      expect(result.eventHistory.length).toBe(1);
      expect(result.eventHistory[0].type).toBe("schedule");
    });
  });

  describe("State immutability", () => {
    it("does not mutate the original state", () => {
      const initialState: ChargingStateWithEvents = {
        chargerState: { status: "idle" },
        eventHistory: [],
      };
      const action: ChargingAction = { type: "PLUG_IN_CAR" };

      const result = chargingStatesReducer(initialState, action);

      expect(result).not.toBe(initialState); // Different object reference
      expect(initialState.chargerState).toEqual({ status: "idle" }); // Original unchanged
      expect(initialState.eventHistory).toEqual([]); // Original unchanged
    });
  });

  describe("Invalid actions", () => {
    it("returns current state for unknown action types", () => {
      const initialState: ChargingStateWithEvents = {
        chargerState: { status: "idle" },
        eventHistory: [],
      };
      const action = { type: "INVALID_ACTION" };

      // @ts-expect-error Testing invalid action type
      const result = chargingStatesReducer(initialState, action);
      expect(result).toEqual(initialState);
    });
  });

  describe("State transition combinations", () => {
    it("handles complex state transition sequence", () => {
      let state: ChargingStateWithEvents = {
        chargerState: { status: "unplugged" },
        eventHistory: [],
      };

      // Plug in car
      state = chargingStatesReducer(state, { type: "PLUG_IN_CAR" });
      expect(state.chargerState.status).toBe("idle");

      // Trigger override
      state = chargingStatesReducer(state, {
        type: "TRIGGER_OVERRIDE",
        timestamp: mockTimestamp,
      });
      expect(state.chargerState.status).toBe("charging-override");

      // Cancel override
      state = chargingStatesReducer(state, { type: "CANCEL_OVERRIDE_CHARGE" });
      expect(state.chargerState.status).toBe("idle");

      // Cancel scheduled charge (suspend)
      state = chargingStatesReducer(state, {
        type: "CANCEL_SCHEDULED_CHARGE",
        timestamp: mockTimestamp,
      });
      expect(state.chargerState.status).toBe("schedule-suspended");

      // Resume from suspension
      state = chargingStatesReducer(state, { type: "RESUME_FROM_SUSPENSION" });
      expect(state.chargerState.status).toBe("idle");
    });
  });
});
