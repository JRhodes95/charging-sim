"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Plug, Zap } from "lucide-react";

import { useCarState, formatChargePercentage } from "@/hooks/use-car-state";
import { useChargingState } from "@/hooks/use-charging-state";
import { ChargingTimeline } from "@/components/charging-timeline";

const dateFormatString = "p";

const getChargingRate = (status: string) => {
  if (status === "charging-override" || status === "charging-scheduled") {
    return 7.4; // kW
  }
  return 0;
};

const estimateTimeRemaining = (
  currentCharge: number,
  targetCharge: number,
  chargingRate: number,
  endTime?: Date
) => {
  if (chargingRate === 0) return null;

  // For override charging, use the actual endTime instead of calculating based on target charge
  if (endTime) {
    const now = new Date();
    const remainingMs = endTime.getTime() - now.getTime();
    return Math.max(0, remainingMs / (1000 * 60)); // minutes
  }

  // Use the actual simulation charge rate (0.1% per second) instead of kW calculation
  const remainingCharge = targetCharge - currentCharge;
  const chargeRatePerSecond = 0.1; // Must match the rate in use-car-state.ts
  const timeSeconds = remainingCharge / chargeRatePerSecond;
  return Math.max(0, timeSeconds / 60); // minutes
};

export default function Home() {
  const { carState, incrementCharge } = useCarState({
    model: "Mini Cooper E",
    nickname: "kEVin",
    stateOfCharge: 21.0,
  });

  const {
    chargingState,
    eventHistory,
    unplugCar,
    plugInCar,
    triggerOverride,
    cancelOverrideCharge,
    cancelScheduledCharge,
  } = useChargingState({ carState, incrementCharge });

  const chargingRate = getChargingRate(chargingState.status);
  const targetCharge =
    chargingState.status === "charging-scheduled" ||
    chargingState.status === "awaiting-scheduled-charge"
      ? chargingState.charge?.targetChargePercent || 85
      : 100;
  const timeRemaining = estimateTimeRemaining(
    carState.stateOfCharge,
    targetCharge,
    chargingRate,
    chargingState.status === "charging-override" ? chargingState.charge.endTime : undefined
  );

  const isCharging =
    chargingState.status === "charging-override" ||
    chargingState.status === "charging-scheduled";
  const isConnected = chargingState.status !== "unplugged";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {carState.nickname}
            </h1>
            <p className="text-muted-foreground text-lg">{carState.model}</p>
          </div>
          <Button
            variant={isConnected ? "outline" : "default"}
            onClick={isConnected ? unplugCar : plugInCar}
            size="lg"
          >
            <Plug className="w-4 h-4 mr-2" />
            {isConnected ? "Unplug" : "Plug in"}
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Battery & Status */}
          <div className="lg:col-span-2 space-y-8">
            {/* Battery Level */}
            <div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-6xl font-bold text-foreground">
                  {formatChargePercentage(carState.stateOfCharge)}
                </span>
                <span className="text-2xl text-muted-foreground mb-2">%</span>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-6">
                <div className="w-full h-2 bg-muted rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isCharging
                        ? "bg-charging"
                        : carState.stateOfCharge > 80
                        ? "bg-success"
                        : carState.stateOfCharge > 50
                        ? "bg-warning"
                        : "bg-destructive"
                    }`}
                    style={{
                      width: `${Math.min(carState.stateOfCharge, 100)}%`,
                    }}
                  />
                </div>
                {targetCharge !== 100 && (
                  <div
                    className="absolute top-0 w-0.5 h-2 bg-muted-foreground"
                    style={{ left: `${targetCharge}%` }}
                  />
                )}
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-3 mb-6">
                <Plug
                  className={`w-5 h-5 ${
                    isConnected ? "text-success" : "text-muted-foreground"
                  }`}
                />
                <span className="text-foreground font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
                {isConnected && (
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                )}
              </div>

              {/* Charging Info */}
              {isCharging && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Charging Rate
                    </div>
                    <div className="text-xl font-semibold text-foreground">
                      {chargingRate} kW
                    </div>
                  </div>
                  {timeRemaining && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Time Remaining
                      </div>
                      <div className="text-xl font-semibold text-foreground">
                        {Math.floor(timeRemaining / 60)}h{" "}
                        {Math.floor(timeRemaining % 60)}m
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Message */}
            {isConnected && (
              <div className="py-6 border-t border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCharging
                        ? "bg-charging animate-pulse"
                        : chargingState.status === "awaiting-scheduled-charge"
                        ? "bg-warning"
                        : chargingState.status === "schedule-suspended"
                        ? "bg-destructive"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <span className="font-medium text-foreground">
                    {
                      {
                        idle: "Ready to charge",
                        "awaiting-scheduled-charge":
                          "Scheduled charging pending",
                        "charging-scheduled": "Charging (Scheduled)",
                        "charging-override": "Charging (Manual)",
                        "schedule-suspended": "Schedule suspended",
                      }[
                        chargingState.status as Exclude<
                          typeof chargingState.status,
                          "unplugged"
                        >
                      ]
                    }
                  </span>
                </div>

                {chargingState.status === "awaiting-scheduled-charge" && (
                  <p className="text-sm text-muted-foreground">
                    Scheduled start:{" "}
                    {format(chargingState.charge.startTime, dateFormatString)} •
                    Target: {chargingState.charge.targetChargePercent}%
                  </p>
                )}

                {(chargingState.status === "charging-scheduled" ||
                  chargingState.status === "charging-override") && (
                  <p className="text-sm text-muted-foreground">
                    Started:{" "}
                    {format(chargingState.charge.startTime, dateFormatString)}
                    {chargingState.status === "charging-scheduled" && (
                      <>
                        {" "}
                        • Target: {chargingState.charge.targetChargePercent}%
                      </>
                    )}
                  </p>
                )}

                {chargingState.status === "schedule-suspended" && (
                  <p className="text-sm text-muted-foreground">
                    Suspended until:{" "}
                    {format(chargingState.suspendedUntil, "MMM d 'at' h:mm a")}
                  </p>
                )}
              </div>
            )}

            {/* Controls */}
            {isConnected && (
              <div className="flex gap-3 pt-6 border-t border-border">
                <Button
                  onClick={triggerOverride}
                  disabled={isCharging}
                  size="lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Charging
                </Button>

                {isCharging && (
                  <Button
                    onClick={
                      chargingState.status === "charging-scheduled"
                        ? cancelScheduledCharge
                        : cancelOverrideCharge
                    }
                    variant="outline"
                    size="lg"
                  >
                    Stop Charging
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Right: Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Recent Activity
              </h2>
            </div>
            <ChargingTimeline events={eventHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
