import { add } from "date-fns";
import type { ChargerState } from "./use-charging-state";
import type { CarState } from "./use-car-state";

export type ChargingAction =
  | { type: "UNPLUG_CAR" }
  | { type: "PLUG_IN_CAR" }
  | { type: "TRIGGER_OVERRIDE"; timestamp: Date }
  | { type: "CANCEL_OVERRIDE_CHARGE" }
  | { type: "CANCEL_SCHEDULED_CHARGE"; timestamp: Date }
  | { type: "SCHEDULE_CHARGE"; carState: CarState; timestamp: Date }
  | { type: "START_SCHEDULED_CHARGE" }
  | { type: "RESUME_FROM_SUSPENSION" };

const overrideTimerDuration = { minutes: 60 };
const optimalChargePercentage = 85.0;

export const estimateChargeDurationSeconds = (
  currentChargePercent: number,
  targetChargePercent: number
) => {
  const chargeDifference = targetChargePercent - currentChargePercent;
  return chargeDifference / 0.1; // chargeRatePerSecond = 0.1
};

export function chargingStatesReducer(
  state: ChargerState,
  action: ChargingAction
): ChargerState {
  switch (action.type) {
    case "UNPLUG_CAR":
      return { status: "unplugged" };

    case "PLUG_IN_CAR":
      return { status: "idle" };

    case "TRIGGER_OVERRIDE":
      return {
        status: "charging-override",
        charge: {
          startTime: action.timestamp,
          endTime: add(action.timestamp, overrideTimerDuration),
        },
      };

    case "CANCEL_OVERRIDE_CHARGE":
      return { status: "idle" };

    case "CANCEL_SCHEDULED_CHARGE": {
      const tomorrow = new Date(action.timestamp);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(6, 0, 0, 0);

      return {
        status: "schedule-suspended",
        suspendedUntil: tomorrow,
      };
    }

    case "SCHEDULE_CHARGE": {
      const startTime = add(action.timestamp, { minutes: 0.1 });
      const chargeDurationSeconds = estimateChargeDurationSeconds(
        action.carState.stateOfCharge,
        optimalChargePercentage
      );
      const endTime = add(startTime, { seconds: chargeDurationSeconds });

      return {
        status: "awaiting-scheduled-charge",
        charge: {
          startTime,
          endTime,
          targetChargePercent: optimalChargePercentage,
        },
      };
    }

    case "START_SCHEDULED_CHARGE":
      if (state.status === "awaiting-scheduled-charge") {
        return {
          status: "charging-scheduled",
          charge: state.charge,
        };
      }
      return state;

    case "RESUME_FROM_SUSPENSION":
      return { status: "idle" };

    default:
      return state;
  }
}