import { useReducer, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { type CarState } from "./use-car-state";
import { chargingStatesReducer, type ChargingAction } from "./charging-states-reducer";

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

const optimalChargePercentage = 85.0;
const maximumChargePercentage = 100.0;

// Re-export from reducer for backwards compatibility
export { estimateChargeDurationSeconds } from "./charging-states-reducer";

type UseChargingStateProps = {
  carState: CarState;
  incrementCharge: () => void;
};

export function useChargingState({
  carState,
  incrementCharge,
}: UseChargingStateProps) {
  const [chargingState, dispatch] = useReducer(chargingStatesReducer, {
    status: "unplugged",
  });

  const unplugCar = () => {
    const wasCharging =
      chargingState.status === "charging-override" ||
      chargingState.status === "charging-scheduled";

    dispatch({ type: "UNPLUG_CAR" });

    if (wasCharging) {
      toast.info("Car unplugged - charging stopped");
    }
  };

  const plugInCar = () => {
    dispatch({ type: "PLUG_IN_CAR" });
    toast.success("Car plugged in");
  };

  const triggerOverride = () => {
    const now = new Date();
    dispatch({
      type: "TRIGGER_OVERRIDE",
      timestamp: now,
    });
    toast.success("Override charging started");
  };

  const cancelOverrideCharge = () => {
    dispatch({ type: "CANCEL_OVERRIDE_CHARGE" });
    toast.info("Charging stopped");
  };

  const cancelScheduledCharge = () => {
    const now = new Date();
    dispatch({
      type: "CANCEL_SCHEDULED_CHARGE",
      timestamp: now,
    });
    toast.warning("Scheduled charging suspended until tomorrow 6 AM");
  };

  const scheduleCharge = (carState: CarState) => {
    const now = new Date();
    dispatch({
      type: "SCHEDULE_CHARGE",
      carState,
      timestamp: now,
    });

    const startTime = new Date(now.getTime() + 0.1 * 60 * 1000); // 0.1 minutes from now
    toast.info(`Charging scheduled for ${format(startTime, "p")}`);
  };

  // Schedule a charge when idle
  useEffect(() => {
    if (chargingState.status === "unplugged") return;

    const carIsChargedEnough =
      carState.stateOfCharge >= optimalChargePercentage;
    if (carIsChargedEnough) return;

    if (chargingState.status === "idle") {
      const scheduleId = setTimeout(() => {
        scheduleCharge(carState);
      }, 5000);
      return () => clearTimeout(scheduleId);
    }
  }, [carState, chargingState.status]);

  // Check if the scheduled charge is due
  useEffect(() => {
    if (chargingState.status === "awaiting-scheduled-charge") {
      const checkScheduledTime = () => {
        const now = new Date();
        if (now >= chargingState.charge.startTime) {
          dispatch({ type: "START_SCHEDULED_CHARGE" });
          toast.success("Scheduled charging started");
        }
      };

      const intervalId = setInterval(checkScheduledTime, 1000);
      return () => clearInterval(intervalId);
    }
  }, [chargingState]);

  // Check if schedule suspension has expired
  useEffect(() => {
    if (chargingState.status === "schedule-suspended") {
      const checkSuspension = () => {
        const now = new Date();
        if (now >= chargingState.suspendedUntil) {
          dispatch({ type: "RESUME_FROM_SUSPENSION" });
          toast.info(
            "Schedule suspension expired - charging can be scheduled again"
          );
        }
      };

      const intervalId = setInterval(checkSuspension, 60000);
      return () => clearInterval(intervalId);
    }
  }, [chargingState]);

  // Charging when in the correct states
  useEffect(() => {
    if (carState.stateOfCharge === maximumChargePercentage) {
      toast.success("Charging complete - 100% charged!");
      cancelOverrideCharge();
    } else if (
      chargingState.status === "charging-scheduled" &&
      carState.stateOfCharge >= chargingState.charge.targetChargePercent
    ) {
      toast.success(
        `Target charge of ${chargingState.charge.targetChargePercent}% reached!`
      );
      cancelOverrideCharge();
    }

    if (
      chargingState.status !== "unplugged" &&
      (chargingState.status === "charging-override" ||
        chargingState.status === "charging-scheduled")
    ) {
      const chargeId = setInterval(incrementCharge, 1000);
      return () => clearInterval(chargeId);
    }
  }, [carState.stateOfCharge, chargingState, incrementCharge]);

  return {
    chargingState,
    unplugCar,
    plugInCar,
    triggerOverride,
    cancelOverrideCharge,
    cancelScheduledCharge,
  };
}
