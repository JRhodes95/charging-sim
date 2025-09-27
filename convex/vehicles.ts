import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { slugifyNickname } from "../src/lib/utils";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vehicles").collect();
  },
});

export const getById = query({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

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
