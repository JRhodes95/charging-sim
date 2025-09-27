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

    // Location and status
    location: v.optional(v.string()),
    lastUpdated: v.optional(v.string()), // ISO timestamp
  })
    .index("by_nickname", ["nickname"])
    .searchIndex("search_vehicles", {
      searchField: "nickname",
      filterFields: ["model"],
    }),
});
