"use client";

import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Car, Battery, Plus, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateSlug } from "@/lib/slugs";
import { formatChargePercentage, getChargeStatusColor, getChargeStatusText } from "@/lib/charging";

export default function Home() {
  const vehicles = useQuery(api.vehicles.get);

  const totalVehicles = vehicles?.length || 0;
  const averageCharge = vehicles?.length
    ? vehicles.reduce((sum, vehicle) => sum + (vehicle.stateOfCharge || 0), 0) / vehicles.length
    : 0;
  const lowChargeVehicles = vehicles?.filter(vehicle => (vehicle.stateOfCharge || 0) < 20).length || 0;
  const totalCapacity = vehicles?.reduce((sum, vehicle) => sum + (vehicle.batteryCapacity || 0), 0) || 0;

  if (!vehicles) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Loading...
          </h1>
          <p className="text-muted-foreground">Loading dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Your electric vehicle fleet overview
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/vehicles">
                <Car className="w-4 h-4 mr-2" />
                View vehicles
              </Link>
            </Button>
            <Button asChild>
              <Link href="/vehicles/add">
                <Plus className="w-4 h-4 mr-2" />
                Add vehicle
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Car className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total vehicles</p>
                <p className="text-2xl font-bold text-foreground">{totalVehicles}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Battery className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Average charge</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatChargePercentage(averageCharge)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Badge className={`w-8 h-8 ${getChargeStatusColor(15)} flex items-center justify-center`}>
                !
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">Low charge</p>
                <p className="text-2xl font-bold text-foreground">{lowChargeVehicles}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Settings className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total capacity</p>
                <p className="text-2xl font-bold text-foreground">{totalCapacity} kWh</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Vehicle Overview */}
        {totalVehicles > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Recent vehicles
              </h2>
              <Button asChild variant="outline">
                <Link href="/vehicles">View all</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.slice(0, 3).map((vehicle) => (
                <Link
                  key={vehicle._id}
                  href={`/vehicles/${generateSlug(vehicle.nickname, vehicle._id)}`}
                  className="group"
                >
                  <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 group-hover:border-ring">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {vehicle.nickname}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.model}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-white ${getChargeStatusColor(vehicle.stateOfCharge || 0)}`}
                      >
                        {formatChargePercentage(vehicle.stateOfCharge || 0)}%
                      </Badge>
                    </div>

                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full transition-all duration-300 ${getChargeStatusColor(vehicle.stateOfCharge || 0)}`}
                        style={{
                          width: `${Math.min(vehicle.stateOfCharge || 0, 100)}%`,
                        }}
                      />
                    </div>

                    <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                      {getChargeStatusText(vehicle.stateOfCharge || 0)} • {vehicle.batteryCapacity || 0} kWh
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No vehicles yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Get started by adding your first electric vehicle to the fleet.
            </p>
            <Button asChild>
              <Link href="/vehicles/add">
                <Plus className="w-4 h-4 mr-2" />
                Add your first vehicle
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
