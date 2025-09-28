"use client";

import { format } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";

// const getChargingRate = (status: string) => {
//   if (status === "charging-override" || status === "charging-scheduled") {
//     return 7.4; // kW
//   }
//   return 0;
// };

// const estimateTimeRemaining = (
//   currentCharge: number,
//   targetCharge: number,
//   chargingRate: number,
//   batteryCapacity: number
// ) => {
//   if (chargingRate === 0) return null;
//   const remainingCharge = targetCharge - currentCharge;
//   const timeHours = ((remainingCharge / 100) * batteryCapacity) / chargingRate;
//   return Math.max(0, timeHours * 60); // minutes
// };

// const formatChargePercentage = (input: number) => {
//   return input.toFixed(1);
// };

export default function VehicleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const vehicle = useQuery(api.vehicles.getBySlug, { slug });
  // const chargingEvents = useQuery(api.vehicles.getChargingEvents, {
  //   vehicleId: vehicle?._id,
  // });

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Loading...
          </h1>
          <p className="text-muted-foreground">Fetching vehicle data</p>
        </div>
      </div>
    );
  }

  // Mock charging state based on latest events - in a real app this would be more sophisticated
  // const latestEvent = chargingEvents?.[0];
  // const isConnected = latestEvent?.type === "connection"; // Simplified logic
  // const isCharging =
  //   latestEvent?.type === "charging" || latestEvent?.type === "override";

  // const chargingRate = getChargingRate(
  //   isCharging ? "charging-override" : "idle"
  // );
  // const targetCharge = latestEvent?.details?.target_charge || 85;
  // const timeRemaining = estimateTimeRemaining(
  //   vehicle.stateOfCharge || 0,
  //   targetCharge,
  //   chargingRate,
  //   vehicle.batteryCapacity || 32.6
  // );

  // const currentStatus = isCharging
  //   ? "charging-override"
  //   : isConnected
  //     ? "idle"
  //     : "unplugged";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {vehicle.nickname}
            </h1>
            <p className="text-muted-foreground text-lg">{vehicle.model}</p>
          </div>
          {/* <Button
            variant={isConnected ? "outline" : "default"}
            size="lg"
            disabled // Disabled since we're just viewing data
          >
            <Plug className="w-4 h-4 mr-2" />
            {isConnected ? "Connected" : "Disconnected"}
          </Button> */}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Vehicle Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vehicle Info */}
            <div className="grid grid-cols-2 gap-6 py-6 border-t border-border">
              {vehicle.location && (
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground mb-1">
                    Last known location
                  </div>
                  <div className="text-xl font-semibold text-foreground">
                    {vehicle.location}
                  </div>
                </div>
              )}
            </div>

            {/* Last updated */}
            {vehicle.lastUpdated && (
              <div className="text-sm text-muted-foreground pt-6 border-t border-border">
                Last updated:{" "}
                {format(
                  new Date(vehicle.lastUpdated),
                  "MMM d, yyyy 'at' h:mm a"
                )}
              </div>
            )}
          </div>

          {/* Right: Timeline */}
          {/* <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Recent activity
              </h2>
            </div>
            <ChargingTimeline events={chargingEvents || []} />
          </div> */}
        </div>
      </div>
    </div>
  );
}