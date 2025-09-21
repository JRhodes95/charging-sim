import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  vehicles: defineTable({
    // Basic vehicle information
    model: v.string(),
    nickname: v.string(),

    // Battery and charging specs
    stateOfCharge: v.number(), // Current battery level (0-100)
    batteryCapacity: v.number(), // kWh capacity
    chargingRate: v.number(), // kW charging rate

    // Location and status
    location: v.optional(v.string()),
    lastUpdated: v.optional(v.string()), // ISO timestamp
  })
    .index("by_nickname", ["nickname"])
    .searchIndex("search_vehicles", {
      searchField: "nickname",
      filterFields: ["model"]
    }),

  charging_events: defineTable({
    // Event metadata
    timestamp: v.string(), // ISO timestamp
    type: v.union(
      v.literal("connection"),
      v.literal("charging"),
      v.literal("schedule"),
      v.literal("override"),
      v.literal("completion")
    ),

    // Link to vehicle
    vehicle_id: v.optional(v.id("vehicles")),

    // Event-specific data
    details: v.optional(v.object({
      // Charging levels
      target_charge: v.optional(v.number()),
      current_charge: v.optional(v.number()),

      // Time bounds
      start_time: v.optional(v.string()), // ISO timestamp
      end_time: v.optional(v.string()), // ISO timestamp
      suspended_until: v.optional(v.string()), // ISO timestamp

      // Energy metrics
      energy_added: v.optional(v.number()), // kWh
      charging_rate: v.optional(v.number()), // kW
      duration: v.optional(v.string()), // Human readable duration

      // Location
      location: v.optional(v.string()),
    })),
  })
    .index("by_vehicle", ["vehicle_id"])
    .index("by_timestamp", ["timestamp"])
    .index("by_vehicle_and_timestamp", ["vehicle_id", "timestamp"])
    .index("by_type", ["type"]),
});