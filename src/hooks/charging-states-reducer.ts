import { add, addDays, getTime, setHours, startOfDay } from "date-fns";
import type { ChargerState } from "./use-charging-state";
import type { CarState } from "./use-car-state";

export type ChargingEvent = {
  id: string;
  timestamp: Date;
  type: "connection" | "charging" | "schedule" | "override" | "completion";
  action: string;
  description: string;
  details?: Record<string, unknown>;
};

export type ChargingStateWithEvents = {
  chargerState: ChargerState;
  eventHistory: ChargingEvent[];
};

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

const createEvent = (
  type: ChargingEvent["type"],
  action: string,
  description: string,
  timestamp: Date = new Date(),
  details?: Record<string, unknown>
): ChargingEvent => ({
  id: `${getTime(timestamp)}-${Math.random().toString(36).substring(2, 11)}`,
  timestamp,
  type,
  action,
  description,
  details,
});

const addEvent = (
  state: ChargingStateWithEvents,
  event: ChargingEvent
): ChargingStateWithEvents => ({
  ...state,
  eventHistory: [event, ...state.eventHistory].slice(0, 50), // Keep last 50 events
});

export function chargingStatesReducer(
  state: ChargingStateWithEvents,
  action: ChargingAction
): ChargingStateWithEvents {
  const now = new Date();

  switch (action.type) {
    case "UNPLUG_CAR": {
      const newState = {
        ...state,
        chargerState: { status: "unplugged" as const },
      };
      return addEvent(
        newState,
        createEvent(
          "connection",
          "Vehicle Disconnected",
          "Vehicle was unplugged from charger",
          now
        )
      );
    }

    case "PLUG_IN_CAR": {
      const newState = {
        ...state,
        chargerState: { status: "idle" as const },
      };
      return addEvent(
        newState,
        createEvent(
          "connection",
          "Vehicle Connected",
          "Vehicle connected to charger and ready",
          now
        )
      );
    }

    case "TRIGGER_OVERRIDE": {
      const newChargerState = {
        status: "charging-override" as const,
        charge: {
          startTime: action.timestamp,
          endTime: add(action.timestamp, overrideTimerDuration),
        },
      };
      const newState = {
        ...state,
        chargerState: newChargerState,
      };
      return addEvent(
        newState,
        createEvent(
          "override",
          "Manual Charging Started",
          "Override charging session initiated",
          action.timestamp,
          { endTime: newChargerState.charge.endTime }
        )
      );
    }

    case "CANCEL_OVERRIDE_CHARGE": {
      const newState = {
        ...state,
        chargerState: { status: "idle" as const },
      };
      return addEvent(
        newState,
        createEvent(
          "charging",
          "Charging Stopped",
          "Manual charging session ended",
          now
        )
      );
    }

    case "CANCEL_SCHEDULED_CHARGE": {
      const tomorrow = setHours(
        startOfDay(addDays(action.timestamp, 1)),
        6
      );

      const newChargerState = {
        status: "schedule-suspended" as const,
        suspendedUntil: tomorrow,
      };
      const newState = {
        ...state,
        chargerState: newChargerState,
      };
      return addEvent(
        newState,
        createEvent(
          "schedule",
          "Scheduled Charging Cancelled",
          "Charging schedule suspended until tomorrow 6 AM",
          action.timestamp,
          { suspendedUntil: tomorrow }
        )
      );
    }

    case "SCHEDULE_CHARGE": {
      const startTime = add(action.timestamp, { minutes: 0.1 });
      const chargeDurationSeconds = estimateChargeDurationSeconds(
        action.carState.stateOfCharge,
        optimalChargePercentage
      );
      const endTime = add(startTime, { seconds: chargeDurationSeconds });

      const newChargerState = {
        status: "awaiting-scheduled-charge" as const,
        charge: {
          startTime,
          endTime,
          targetChargePercent: optimalChargePercentage,
        },
      };
      const newState = {
        ...state,
        chargerState: newChargerState,
      };
      return addEvent(
        newState,
        createEvent(
          "schedule",
          "Charging Scheduled",
          `Charging scheduled to reach ${optimalChargePercentage}%`,
          action.timestamp,
          {
            startTime,
            endTime,
            targetCharge: optimalChargePercentage,
            currentCharge: action.carState.stateOfCharge,
          }
        )
      );
    }

    case "START_SCHEDULED_CHARGE": {
      if (state.chargerState.status === "awaiting-scheduled-charge") {
        const newChargerState = {
          status: "charging-scheduled" as const,
          charge: state.chargerState.charge,
        };
        const newState = {
          ...state,
          chargerState: newChargerState,
        };
        return addEvent(
          newState,
          createEvent(
            "charging",
            "Scheduled Charging Started",
            "Automatic charging session began as scheduled",
            now,
            { targetCharge: newChargerState.charge.targetChargePercent }
          )
        );
      }
      return state;
    }

    case "RESUME_FROM_SUSPENSION": {
      const newState = {
        ...state,
        chargerState: { status: "idle" as const },
      };
      return addEvent(
        newState,
        createEvent(
          "schedule",
          "Schedule Resumed",
          "Charging schedule suspension lifted",
          now
        )
      );
    }

    default:
      return state;
  }
}