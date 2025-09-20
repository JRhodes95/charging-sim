"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { add, format, startOfHour } from "date-fns";
import { toast } from "sonner";

import { useEffect, useState } from "react";

type PlugState = "unplugged" | "plugged-in";

type CarState = {
  model: string;
  nickname: string;
  stateOfCharge: number;
};

type ScheduledCharge = {
  startTime: Date;
  endTime: Date;
  targetChargePercent: number;
};

type OverrideCharge = {
  startTime: Date;
  endTime: Date;
};

type ChargerIdleState = {
  status: "idle";
};

type ChargerScheduledState = {
  status: "awaiting-scheduled-charge" | "charging-scheduled";
  charge: ScheduledCharge;
};

type ChargerOverrideState = {
  status: "charging-override";
  charge: OverrideCharge;
};

type ChargerSuspendedState = {
  status: "schedule-suspended";
  suspendedUntil: Date;
};

type ChargerState =
  | ChargerIdleState
  | ChargerScheduledState
  | ChargerOverrideState
  | ChargerSuspendedState;

const startingCharge = 21.0;

const overrideTimerDuration = { minutes: 60 };
const dateFormatString = "p";
const optimalChargePercentage = 85.0;
const maximumChargePercentage = 100.0;
const chargeRatePerSecond = 0.1;

const formatChargePercentage = (input: number) => {
  return input.toFixed(1);
};

const estimateChargeDurationSeconds = (
  currentChargePercent: number,
  targetChargePercent: number
) => {
  const chargeDifference = targetChargePercent - currentChargePercent;
  return chargeDifference / chargeRatePerSecond;
};

export default function Home() {
  const [plugState, setPlugState] = useState<PlugState>("unplugged");

  const unplugCar = () => {
    setPlugState("unplugged");
    // Cancel any active charging when unplugging
    if (chargingState.status === "charging-override" || chargingState.status === "charging-scheduled") {
      setChargingState({ status: "idle" });
      toast.info("Car unplugged - charging stopped");
    } else {
      toast.info("Car unplugged");
    }
  };
  const plugInCar = () => {
    setPlugState("plugged-in");
    toast.success("Car plugged in");
  };

  const [carState, setCarState] = useState<CarState>({
    model: "Mini Cooper E",
    nickname: "kEVin",
    stateOfCharge: startingCharge,
  });

  const incrementCharge = () =>
    setCarState((current) => ({
      ...current,
      stateOfCharge: current.stateOfCharge + chargeRatePerSecond,
    }));

  const [chargingState, setChargingState] = useState<ChargerState>({
    status: "idle",
  });

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

  const cancelCharge = () => {
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

  const scheduleCharge = () => {
    const now = new Date();

    // Charge at the start of the next hour
    // const startTime = startOfHour(add(now, { hours: 1 }));
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
    if (plugState === "unplugged") return;

    const carIsChargedEnough =
      carState.stateOfCharge >= optimalChargePercentage;
    if (carIsChargedEnough) return;

    if (chargingState.status === "idle") {
      const scheduleId = setTimeout(() => {
        scheduleCharge();
      }, 5000);
      return () => clearTimeout(scheduleId);
    }
  }, [
    plugState,
    scheduleCharge,
    carState.stateOfCharge,
    optimalChargePercentage,
    chargingState.status,
  ]);

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

      // Check every second
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
          toast.info("Schedule suspension expired - charging can be scheduled again");
        }
      };

      const intervalId = setInterval(checkSuspension, 60000);
      return () => clearInterval(intervalId);
    }
  }, [chargingState]);

  // Charging when in the correct states
  useEffect(() => {
    // Stop charging if car is unplugged
    if (plugState === "unplugged" && (chargingState.status === "charging-override" || chargingState.status === "charging-scheduled")) {
      cancelCharge();
      return;
    }

    if (carState.stateOfCharge === maximumChargePercentage) {
      toast.success("Charging complete - 100% charged!");
      cancelCharge();
    } else if (
      chargingState.status === "charging-scheduled" &&
      carState.stateOfCharge >= chargingState.charge.targetChargePercent
    ) {
      toast.success(`Target charge of ${chargingState.charge.targetChargePercent}% reached!`);
      cancelCharge();
    }

    if (
      plugState === "plugged-in" &&
      (chargingState.status === "charging-override" ||
      chargingState.status === "charging-scheduled")
    ) {
      const chargeId = setInterval(incrementCharge, 1000);
      return () => clearInterval(chargeId);
    }
  }, [carState.stateOfCharge, chargingState, plugState]);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Charge control panel</h1>
      <div className="space-y-8">
        <div className="space-y-4 bg-secondary p-4 rounded shadow">
          <h2 className="text-l font-bold">Charger state</h2>
          <div className="space-y-2">
            <div className="flex flex-row gap-2">
              <div>Status:</div>
              {
                {
                  "plugged-in": <Badge variant={"default"}>Plugged in</Badge>,
                  unplugged: <Badge variant={"outline"}>Unplugged</Badge>,
                }[plugState]
              }
            </div>
            <div className="flex flex-row gap-2">
              <Button
                variant={"outline"}
                onClick={unplugCar}
                disabled={plugState === "unplugged"}
              >
                Unplug
              </Button>
              <Button onClick={plugInCar} disabled={plugState === "plugged-in"}>
                Plug in
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-l font-bold">Car state</h2>
          <div>{carState.nickname}</div>
          <div>{carState.model}</div>
          <div>
            SoC: {formatChargePercentage(carState.stateOfCharge)}% charged
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-l font-bold">Charging state</h2>
          {
            {
              "plugged-in": (
                <>
                  <div className="flex flex-row gap-2">
                    <div>Status:</div>
                    {
                      {
                        idle: <Badge>Idle</Badge>,
                        "awaiting-scheduled-charge": <Badge>Waiting</Badge>,
                        "charging-scheduled": (
                          <Badge>Charging (scheduled)</Badge>
                        ),
                        "charging-override": <Badge>Charging (override)</Badge>,
                        "schedule-suspended": (
                          <Badge variant="secondary">Schedule suspended</Badge>
                        ),
                      }[chargingState.status]
                    }
                  </div>
                  <div>
                    {chargingState.status === "idle" && (
                      <div>Not much to see here!</div>
                    )}

                    {chargingState.status === "awaiting-scheduled-charge" && (
                      <div>
                        <p>
                          {`Charge scheduled for ${format(
                            chargingState.charge.startTime,
                            dateFormatString
                          )}.`}
                        </p>
                        <p>
                          {`Aiming for ${
                            chargingState.charge.targetChargePercent
                          }% by ${format(
                            chargingState.charge.endTime,
                            dateFormatString
                          )}`}
                        </p>
                      </div>
                    )}

                    {chargingState.status === "charging-scheduled" && (
                      <div>
                        <p>
                          {`Charging since ${format(
                            chargingState.charge.startTime,
                            dateFormatString
                          )}.`}
                        </p>
                        <p>
                          {`Aiming for ${
                            chargingState.charge.targetChargePercent
                          } by ${format(
                            chargingState.charge.endTime,
                            dateFormatString
                          )}`}
                        </p>
                      </div>
                    )}

                    {chargingState.status === "charging-override" && (
                      <div>
                        <p>
                          {`Charging since ${format(
                            chargingState.charge.startTime,
                            dateFormatString
                          )}.`}
                        </p>
                        <p>
                          {`Charging override active until ${format(
                            chargingState.charge.endTime,
                            dateFormatString
                          )}`}
                        </p>
                      </div>
                    )}

                    {chargingState.status === "schedule-suspended" && (
                      <div>
                        <p>
                          {`Scheduled charging suspended until ${format(
                            chargingState.suspendedUntil,
                            "MMM d 'at' h:mm a"
                          )}`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row gap-2">
                    <Button
                      onClick={triggerOverride}
                      disabled={
                        chargingState.status === "charging-override" ||
                        chargingState.status === "charging-scheduled"
                      }
                    >
                      Override
                    </Button>
                    <Button
                      onClick={
                        chargingState.status === "charging-scheduled"
                          ? cancelScheduledCharge
                          : cancelCharge
                      }
                      disabled={
                        !(
                          chargingState.status === "charging-override" ||
                          chargingState.status === "charging-scheduled"
                        )
                      }
                    >
                      Stop charge
                    </Button>
                  </div>
                </>
              ),
              unplugged: "Charging state not available while car is unplugged",
            }[plugState]
          }
        </div>
      </div>
    </div>
  );
}
