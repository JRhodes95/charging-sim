"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Battery, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

const formatChargePercentage = (input: number) => {
  return input.toFixed(1);
};

const generateSlug = (nickname: string, id: string): string => {
  const cleanNickname = nickname
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const partialId = id.substring(0, 6);
  return `${cleanNickname || 'untitled'}-${partialId}`;
};

const getChargeStatusColor = (charge: number) => {
  if (charge > 80) return "bg-green-500";
  if (charge > 50) return "bg-yellow-500";
  if (charge > 20) return "bg-orange-500";
  return "bg-red-500";
};

const getChargeStatusText = (charge: number) => {
  if (charge > 80) return "Excellent";
  if (charge > 50) return "Good";
  if (charge > 20) return "Low";
  return "Critical";
};

export default function VehiclesPage() {
  const vehicles = useQuery(api.vehicles.get);

  if (!vehicles) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Loading...</h1>
          <p className="text-muted-foreground">Fetching vehicles</p>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">No Vehicles</h1>
            <p className="text-muted-foreground mb-6">
              You haven't added any vehicles yet.
            </p>
            <Button>Add Vehicle</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Your Vehicles
            </h1>
            <p className="text-muted-foreground text-lg">
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in your fleet
            </p>
          </div>
          <Button>Add Vehicle</Button>
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle._id}
              href={`/vehicles/${generateSlug(vehicle.nickname, vehicle._id)}`}
              className="group"
            >
              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 group-hover:border-ring">
                {/* Vehicle Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {vehicle.nickname}
                    </h3>
                    <p className="text-sm text-muted-foreground">{vehicle.model}</p>
                  </div>
                  <Car className="w-6 h-6 text-muted-foreground" />
                </div>

                {/* Battery Status */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Battery Level
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {formatChargePercentage(vehicle.stateOfCharge || 0)}%
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-white ${getChargeStatusColor(vehicle.stateOfCharge || 0)}`}
                      >
                        {getChargeStatusText(vehicle.stateOfCharge || 0)}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getChargeStatusColor(vehicle.stateOfCharge || 0)}`}
                      style={{ width: `${Math.min(vehicle.stateOfCharge || 0, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="space-y-3">
                  {vehicle.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{vehicle.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Battery className="w-4 h-4" />
                    <span>{vehicle.batteryCapacity || 32.6} kWh capacity</span>
                  </div>

                  {vehicle.lastUpdated && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Updated {format(new Date(vehicle.lastUpdated), "MMM d, h:mm a")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Hint */}
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    View details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
