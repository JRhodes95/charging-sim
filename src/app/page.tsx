"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

import { useCarState, formatChargePercentage } from "@/hooks/use-car-state";
import { useChargingState } from "@/hooks/use-charging-state";

const dateFormatString = "p";

export default function Home() {
  const { carState, incrementCharge } = useCarState({
    model: "Mini Cooper E",
    nickname: "kEVin",
    stateOfCharge: 21.0,
  });
  const {
    chargingState,
    unplugCar,
    plugInCar,
    triggerOverride,
    cancelOverrideCharge,
    cancelScheduledCharge,
  } = useChargingState({ carState, incrementCharge });

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Charge control panel</h1>
      <div className="space-y-8">
        <div className="space-y-4 bg-secondary p-4 rounded shadow">
          <h2 className="text-l font-bold">Charger state</h2>
          <div className="space-y-2">
            <div className="flex flex-row gap-2">
              <div>Status:</div>
              {chargingState.status === "unplugged" ? (
                <Badge variant={"outline"}>Unplugged</Badge>
              ) : (
                <Badge variant={"default"}>Plugged in</Badge>
              )}
            </div>
            <div className="flex flex-row gap-2">
              <Button
                variant={"outline"}
                onClick={unplugCar}
                disabled={chargingState.status === "unplugged"}
              >
                Unplug
              </Button>
              <Button
                onClick={plugInCar}
                disabled={chargingState.status !== "unplugged"}
              >
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
          {chargingState.status === "unplugged" ? (
            "Charging state not available while car is unplugged"
          ) : (
            <>
              <div className="flex flex-row gap-2">
                <div>Status:</div>
                {
                  {
                    idle: <Badge>Idle</Badge>,
                    "awaiting-scheduled-charge": <Badge>Waiting</Badge>,
                    "charging-scheduled": <Badge>Charging (scheduled)</Badge>,
                    "charging-override": <Badge>Charging (override)</Badge>,
                    "schedule-suspended": (
                      <Badge variant="secondary">Schedule suspended</Badge>
                    ),
                  }[
                    chargingState.status as Exclude<
                      typeof chargingState.status,
                      "unplugged"
                    >
                  ]
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
                      : cancelOverrideCharge
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
          )}
        </div>
      </div>
    </div>
  );
}
