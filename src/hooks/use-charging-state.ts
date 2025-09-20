import { useState, useEffect } from "react";
import { add, format } from "date-fns";
import { toast } from "sonner";
import { type CarState } from "./use-car-state";

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

const overrideTimerDuration = { minutes: 60 };
const optimalChargePercentage = 85.0;
const maximumChargePercentage = 100.0;
const chargeRatePerSecond = 0.1;

export const estimateChargeDurationSeconds = (
  currentChargePercent: number,
  targetChargePercent: number
) => {
  const chargeDifference = targetChargePercent - currentChargePercent;
  return chargeDifference / chargeRatePerSecond;
};

type UseChargingStateProps = {
  carState: CarState;
  incrementCharge: () => void;
};

export function useChargingState({
  carState,
  incrementCharge,
}: UseChargingStateProps) {
  const [chargingState, setChargingState] = useState<ChargerState>({
    status: "unplugged",
  });

  const unplugCar = () => {
    const wasCharging =
      chargingState.status === "charging-override" ||
      chargingState.status === "charging-scheduled";
    setChargingState({ status: "unplugged" });
    if (wasCharging) {
      toast.info("Car unplugged - charging stopped");
    }
  };

  const plugInCar = () => {
    setChargingState({ status: "idle" });
    toast.success("Car plugged in");
  };

  const triggerOverride = () => {
    const now = new Date();
    setChargingState({
      status: "charging-override",
      charge: {
        startTime: now,
        endTime: add(now, overrideTimerDuration),
      },
    });
    toast.success("Override charging started");
  };

  const cancelOverrideCharge = () => {
    setChargingState({
      status: "idle",
    });
    toast.info("Charging stopped");
  };

  const cancelScheduledCharge = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);

    setChargingState({
      status: "schedule-suspended",
      suspendedUntil: tomorrow,
    });
    toast.warning("Scheduled charging suspended until tomorrow 6 AM");
  };

  const scheduleCharge = (carState: CarState) => {
    const now = new Date();
    const startTime = add(now, { minutes: 0.1 });
    const chargeDurationSeconds = estimateChargeDurationSeconds(
      carState.stateOfCharge,
      optimalChargePercentage
    );
    const endTime = add(startTime, { seconds: chargeDurationSeconds });

    setChargingState({
      status: "awaiting-scheduled-charge",
      charge: {
        startTime,
        endTime,
        targetChargePercent: optimalChargePercentage,
      },
    });
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
          setChargingState({
            status: "charging-scheduled",
            charge: chargingState.charge,
          });
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
          setChargingState({ status: "idle" });
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
