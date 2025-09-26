import { add, addDays, getTime, setHours, startOfDay } from "date-fns";
import type { CarState } from "./use-car-state";
import { estimateChargeDurationSeconds } from "../lib/utils";

export type ScheduledCharge = {
  startTime: Date;
  endTime: Date;
  targetChargePercent: number;
};

export type OverrideCharge = {
  startTime: Date;
  endTime: Date;
};

export type ChargerUnpluggedState = {
  status: "unplugged";
};

export type ChargerIdleState = {
  status: "idle";
};

export type ChargerScheduledState = {
  status: "awaiting-scheduled-charge" | "charging-scheduled";
  charge: ScheduledCharge;
};

export type ChargerOverrideState = {
  status: "charging-override";
  charge: OverrideCharge;
};

export type ChargerSuspendedState = {
  status: "schedule-suspended";
  suspendedUntil: Date;
};

export type ChargerState =
  | ChargerUnpluggedState
  | ChargerIdleState
  | ChargerScheduledState
  | ChargerOverrideState
  | ChargerSuspendedState;

export type ChargingEvent = {
  id: string;
  timestamp: Date;
  type: ChargingAction["type"];
  description: string;
  details?: Record<string, unknown>;
};

export type ChargingStateWithEvents = {
  chargerState: ChargerState;
  eventHistory: ChargingEvent[];
};

export type ChargingAction =
  | { type: "UNPLUG_CAR"; timestamp: Date }
  | { type: "PLUG_IN_CAR"; timestamp: Date }
  | { type: "TRIGGER_OVERRIDE"; timestamp: Date }
  | { type: "CANCEL_OVERRIDE_CHARGE"; timestamp: Date }
  | { type: "CANCEL_SCHEDULED_CHARGE"; timestamp: Date }
  | { type: "SCHEDULE_CHARGE"; carState: CarState; timestamp: Date }
  | { type: "START_SCHEDULED_CHARGE"; timestamp: Date }
  | { type: "RESUME_FROM_SUSPENSION"; timestamp: Date };

const overrideTimerDuration = { minutes: 60 };
const optimalChargePercentage = 85.0;

export function chargingStatesReducer(
  state: ChargingStateWithEvents,
  action: ChargingAction
): ChargingStateWithEvents {
  const createEventId = (timestamp: Date) =>
    `${getTime(timestamp)}-${Math.random().toString(36).substring(2, 11)}`;

  switch (action.type) {
    case "UNPLUG_CAR": {
      const event: ChargingEvent = {
        id: createEventId(action.timestamp),
        timestamp: action.timestamp,
        type: "UNPLUG_CAR",
        description: "Vehicle was unplugged from charger",
      };

      return {
        ...state,
        chargerState: { status: "unplugged" as const },
        eventHistory: [event, ...state.eventHistory],
      };
    }

    case "PLUG_IN_CAR": {
      const event: ChargingEvent = {
        id: createEventId(action.timestamp),
        timestamp: action.timestamp,
        type: "PLUG_IN_CAR",
        description: "Vehicle connected to charger and ready",
      };

      return {
        ...state,
        chargerState: { status: "idle" as const },
        eventHistory: [event, ...state.eventHistory],
      };
    }

    case "TRIGGER_OVERRIDE": {
      const newChargerState = {
        status: "charging-override" as const,
        charge: {
          startTime: action.timestamp,
          endTime: add(action.timestamp, overrideTimerDuration),
        },
      };

      const event: ChargingEvent = {
        id: createEventId(action.timestamp),
        timestamp: action.timestamp,
        type: "TRIGGER_OVERRIDE",
        description: "Override charging session initiated",
        details: { endTime: newChargerState.charge.endTime },
      };

      return {
        ...state,
        chargerState: newChargerState,
        eventHistory: [event, ...state.eventHistory],
      };
    }

    case "CANCEL_OVERRIDE_CHARGE": {
      const event: ChargingEvent = {
        id: createEventId(action.timestamp),
        timestamp: action.timestamp,
        type: "CANCEL_OVERRIDE_CHARGE",
        description: "Manual charging session ended",
      };

      return {
        ...state,
        chargerState: { status: "idle" as const },
        eventHistory: [event, ...state.eventHistory],
      };
    }

    case "CANCEL_SCHEDULED_CHARGE": {
      const tomorrow = setHours(startOfDay(addDays(action.timestamp, 1)), 6);

      const newChargerState = {
        status: "schedule-suspended" as const,
        suspendedUntil: tomorrow,
      };

      const event: ChargingEvent = {
        id: createEventId(action.timestamp),
        timestamp: action.timestamp,
        type: "CANCEL_SCHEDULED_CHARGE",
        description: "Charging schedule suspended until tomorrow 6 AM",
        details: { suspendedUntil: tomorrow },
      };

      return {
        ...state,
        chargerState: newChargerState,
        eventHistory: [event, ...state.eventHistory],
      };
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

      const event: ChargingEvent = {
        id: createEventId(action.timestamp),
        timestamp: action.timestamp,
        type: "SCHEDULE_CHARGE",
        description: `Charging scheduled to reach ${optimalChargePercentage}%`,
        details: {
          startTime,
          endTime,
          targetCharge: optimalChargePercentage,
          currentCharge: action.carState.stateOfCharge,
        },
      };

      return {
        ...state,
        chargerState: newChargerState,
        eventHistory: [event, ...state.eventHistory],
      };
    }

    case "START_SCHEDULED_CHARGE": {
      if (state.chargerState.status === "awaiting-scheduled-charge") {
        const newChargerState = {
          status: "charging-scheduled" as const,
          charge: state.chargerState.charge,
        };

        const event: ChargingEvent = {
          id: createEventId(action.timestamp),
          timestamp: action.timestamp,
          type: "START_SCHEDULED_CHARGE",
          description: "Automatic charging session began as scheduled",
          details: { targetCharge: newChargerState.charge.targetChargePercent },
        };

        return {
          ...state,
          chargerState: newChargerState,
          eventHistory: [event, ...state.eventHistory],
        };
      }
      return state;
    }

    case "RESUME_FROM_SUSPENSION": {
      const event: ChargingEvent = {
        id: createEventId(action.timestamp),
        timestamp: action.timestamp,
        type: "RESUME_FROM_SUSPENSION",
        description: "Charging schedule suspension lifted",
      };

      return {
        ...state,
        chargerState: { status: "idle" as const },
        eventHistory: [event, ...state.eventHistory],
      };
    }

    default:
      return state;
  }
}
