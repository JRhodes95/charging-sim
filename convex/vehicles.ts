import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { slugifyNickname } from "../src/lib/utils";

/**
 * Retrieves all vehicles from the database.
 *
 * This query function fetches all vehicle records without any filtering or pagination.
 * Useful for displaying complete vehicle lists in administrative interfaces or
 * when the total number of vehicles is expected to be manageable.
 *
 * @returns {Promise<Vehicle[]>} A promise that resolves to an array of all vehicle objects
 * @example
 * ```typescript
 * const allVehicles = await api.vehicles.get();
 * console.log(`Total vehicles: ${allVehicles.length}`);
 * ```
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vehicles").collect();
  },
});

/**
 * Retrieves a specific vehicle by its unique database ID.
 *
 * This query function performs a direct lookup using the vehicle's Convex-generated ID.
 * This is the most efficient way to fetch a vehicle when you have its exact ID.
 *
 * @param {Object} args - The query arguments
 * @param {Id<"vehicles">} args.id - The unique Convex database ID of the vehicle
 * @returns {Promise<Vehicle | null>} A promise that resolves to the vehicle object if found, or null if not found
 * @example
 * ```typescript
 * const vehicle = await api.vehicles.getById({ id: "k173x8f9g2h1j4k5l6m7n8p9" });
 * if (vehicle) {
 *   console.log(`Found vehicle: ${vehicle.nickname}`);
 * } else {
 *   console.log("Vehicle not found");
 * }
 * ```
 */
export const getById = query({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Retrieves a vehicle by its human-readable slug identifier.
 *
 * This query function implements a sophisticated slug-based lookup system that combines
 * a slugified nickname with a partial vehicle ID. The slug format is:
 * "slugified-nickname-partialId" (e.g., "my-tesla-k173x8")
 *
 * The function performs the following resolution logic:
 * 1. Parses the slug to extract nickname and partial ID components
 * 2. Validates that the partial ID is at least 6 characters long
 * 3. Finds all vehicles whose IDs start with the partial ID
 * 4. If multiple matches exist, prioritizes the vehicle with matching slugified nickname
 * 5. Falls back to the first candidate if no nickname match is found
 *
 * This approach provides user-friendly URLs while maintaining uniqueness through partial IDs.
 *
 * @param {Object} args - The query arguments
 * @param {string} args.slug - The slug identifier in format "nickname-partialId"
 * @returns {Promise<Vehicle | null>} A promise that resolves to the matching vehicle object, or null if not found
 * @throws Will return null for invalid slugs (partial ID < 6 characters)
 * @example
 * ```typescript
 * // Slug: "my-tesla-k173x8" -> nickname: "my-tesla", partialId: "k173x8"
 * const vehicle = await api.vehicles.getBySlug({ slug: "my-tesla-k173x8" });
 * if (vehicle) {
 *   console.log(`Found vehicle: ${vehicle.nickname} (${vehicle.model})`);
 * }
 *
 * // Invalid slug (partial ID too short)
 * const invalid = await api.vehicles.getBySlug({ slug: "car-abc" });
 * console.log(invalid); // null
 * ```
 * @see {@link slugifyNickname} Used to generate consistent nickname slugs
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Extract nickname and partial ID from slug
    const slugParts = args.slug.split("-");
    const partialId = slugParts[slugParts.length - 1];
    const nickname = slugParts.slice(0, -1).join("-");

    if (!partialId || partialId.length < 6) {
      return null;
    }

    // Get all vehicles that match the partial ID
    const vehicles = await ctx.db.query("vehicles").collect();
    const candidateVehicles = vehicles.filter((v) =>
      v._id.startsWith(partialId)
    );

    // If no matches, return null
    if (candidateVehicles.length === 0) {
      return null;
    }

    // If only one match, return it
    if (candidateVehicles.length === 1) {
      return candidateVehicles[0];
    }

    // If multiple matches, find the one with matching nickname
    const matchingVehicle = candidateVehicles.find(
      (v) => slugifyNickname(v.nickname) === nickname
    );

    // Return the nickname match, or first candidate if no nickname match
    return matchingVehicle || candidateVehicles[0];
  },
});

/**
 * Creates a new vehicle record in the database.
 *
 * This mutation function adds a new vehicle with the provided details and sets up
 * initial state values. The vehicle is created with a default state of charge of 50%,
 * which serves as a reasonable starting point for new vehicle registrations.
 *
 * The function handles the complete vehicle creation workflow:
 * 1. Validates input parameters through Convex schema validation
 * 2. Sets up initial vehicle state with mock charge level
 * 3. Inserts the vehicle record into the database
 * 4. Returns the newly created vehicle's unique ID
 *
 * @param {Object} args - The vehicle creation arguments
 * @param {string} args.nickname - A user-friendly name for the vehicle (e.g., "My Tesla", "Work Car")
 * @param {string} args.model - The vehicle model designation (e.g., "Tesla Model 3", "Nissan Leaf")
 * @param {number} args.batteryCapacity - The total battery capacity in kWh (e.g., 75, 60, 40)
 * @returns {Promise<Id<"vehicles">>} A promise that resolves to the unique ID of the newly created vehicle
 * @example
 * ```typescript
 * const vehicleId = await api.vehicles.create({
 *   nickname: "My Tesla",
 *   model: "Tesla Model 3",
 *   batteryCapacity: 75
 * });
 * console.log(`Created vehicle with ID: ${vehicleId}`);
 * ```
 * @since Initial version - creates vehicles with 50% initial charge
 */
export const create = mutation({
  args: {
    nickname: v.string(),
    model: v.string(),
    batteryCapacity: v.number(),
  },
  handler: async (ctx, args) => {
    const { nickname, model, batteryCapacity } = args;
    const mockInitialCharge = 50;
    const newVehicleId = await ctx.db.insert("vehicles", {
      nickname,
      model,
      batteryCapacity,
      stateOfCharge: mockInitialCharge,
    });

    return newVehicleId;
  },
});
