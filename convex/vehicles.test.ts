import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { slugifyNickname } from "../src/lib/slugs";

describe("getById", () => {
  test("returns vehicle by id", async () => {
    const t = convexTest(schema);

    // Insert a vehicle directly into the database
    const vehicleId = await t.run(async (ctx) => {
      return await ctx.db.insert("vehicles", {
        nickname: "Test Car",
        model: "Tesla Model 3",
        batteryCapacity: 75,
        stateOfCharge: 50,
      });
    });

    // Get the vehicle by ID
    const vehicle = await t.query(api.vehicles.getById, { id: vehicleId });

    expect(vehicle).toMatchObject({
      _id: vehicleId,
      nickname: "Test Car",
      model: "Tesla Model 3",
      batteryCapacity: 75,
      stateOfCharge: 50,
    });
  });
});

describe("get", () => {
  test("returns all vehicles", async () => {
    const t = convexTest(schema);

    // Insert multiple vehicles directly into the database
    const vehicleIds = await t.run(async (ctx) => {
      const id1 = await ctx.db.insert("vehicles", {
        nickname: "Tesla Model S",
        model: "Tesla Model S",
        batteryCapacity: 100,
        stateOfCharge: 80,
      });

      const id2 = await ctx.db.insert("vehicles", {
        nickname: "Nissan Leaf",
        model: "Nissan Leaf",
        batteryCapacity: 40,
        stateOfCharge: 30,
      });

      const id3 = await ctx.db.insert("vehicles", {
        nickname: "BMW i3",
        model: "BMW i3",
        batteryCapacity: 42,
        stateOfCharge: 65,
      });

      return [id1, id2, id3];
    });

    // Get all vehicles
    const vehicles = await t.query(api.vehicles.get);

    // Verify all vehicles are returned
    expect(vehicles).toHaveLength(3);
    expect(vehicles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: vehicleIds[0],
          nickname: "Tesla Model S",
          model: "Tesla Model S",
          batteryCapacity: 100,
          stateOfCharge: 80,
        }),
        expect.objectContaining({
          _id: vehicleIds[1],
          nickname: "Nissan Leaf",
          model: "Nissan Leaf",
          batteryCapacity: 40,
          stateOfCharge: 30,
        }),
        expect.objectContaining({
          _id: vehicleIds[2],
          nickname: "BMW i3",
          model: "BMW i3",
          batteryCapacity: 42,
          stateOfCharge: 65,
        }),
      ])
    );
  });
});

describe("getBySlug", () => {
  test("returns vehicle by valid slug", async () => {
    const t = convexTest(schema);

    // Insert a vehicle directly into the database
    const vehicleId = await t.run(async (ctx) => {
      return await ctx.db.insert("vehicles", {
        nickname: "My Tesla Car",
        model: "Tesla Model 3",
        batteryCapacity: 75,
        stateOfCharge: 50,
      });
    });

    // Create a valid slug using the vehicle's nickname and partial ID
    const partialId = vehicleId.substring(0, 6);
    const slugifiedNickname = slugifyNickname("My Tesla Car");
    const slug = `${slugifiedNickname}-${partialId}`;

    // Get the vehicle by slug
    const vehicle = await t.query(api.vehicles.getBySlug, { slug });

    expect(vehicle).toMatchObject({
      _id: vehicleId,
      nickname: "My Tesla Car",
      model: "Tesla Model 3",
      batteryCapacity: 75,
      stateOfCharge: 50,
    });
  });

  test("returns null for invalid slug with short partial ID", async () => {
    const t = convexTest(schema);

    // Insert a vehicle for context
    await t.run(async (ctx) => {
      return await ctx.db.insert("vehicles", {
        nickname: "Test Car",
        model: "Tesla Model 3",
        batteryCapacity: 75,
        stateOfCharge: 50,
      });
    });

    // Try to get vehicle with invalid slug (partial ID too short)
    const vehicle = await t.query(api.vehicles.getBySlug, {
      slug: "test-car-abc"
    });

    expect(vehicle).toBeNull();
  });

  test("returns vehicle when multiple candidates exist but nickname matches", async () => {
    const t = convexTest(schema);

    // Insert multiple vehicles with IDs that could have the same prefix
    const vehicleIds = await t.run(async (ctx) => {
      // Create vehicles with specific nicknames
      const id1 = await ctx.db.insert("vehicles", {
        nickname: "Primary Tesla",
        model: "Tesla Model S",
        batteryCapacity: 100,
        stateOfCharge: 80,
      });

      const id2 = await ctx.db.insert("vehicles", {
        nickname: "Secondary Tesla",
        model: "Tesla Model 3",
        batteryCapacity: 75,
        stateOfCharge: 60,
      });

      return [id1, id2];
    });

    // Use the first 6 characters as partial ID and create a slug for the first vehicle
    const partialId = vehicleIds[0].substring(0, 6);
    const slugifiedNickname = slugifyNickname("Primary Tesla");
    const slug = `${slugifiedNickname}-${partialId}`;

    // Get vehicle by slug
    const vehicle = await t.query(api.vehicles.getBySlug, { slug });

    // Should return the vehicle with matching nickname
    expect(vehicle).toMatchObject({
      _id: vehicleIds[0],
      nickname: "Primary Tesla",
      model: "Tesla Model S",
      batteryCapacity: 100,
      stateOfCharge: 80,
    });
  });
});

describe("create", () => {
  test("creates new vehicle with default state of charge", async () => {
    const t = convexTest(schema);

    // Create a new vehicle
    const vehicleId = await t.mutation(api.vehicles.create, {
      nickname: "New Tesla",
      model: "Tesla Model Y",
      batteryCapacity: 80,
    });

    // Verify the vehicle was created with correct properties
    const vehicle = await t.run(async (ctx) => {
      return await ctx.db.get(vehicleId);
    });

    expect(vehicle).toMatchObject({
      _id: vehicleId,
      nickname: "New Tesla",
      model: "Tesla Model Y",
      batteryCapacity: 80,
      stateOfCharge: 50, // Default value as per JSDoc
    });
  });

  test("returns vehicle ID after successful creation", async () => {
    const t = convexTest(schema);

    // Create a new vehicle
    const vehicleId = await t.mutation(api.vehicles.create, {
      nickname: "Another Car",
      model: "Nissan Leaf",
      batteryCapacity: 40,
    });

    // Verify the returned ID is valid
    expect(vehicleId).toBeDefined();
    expect(typeof vehicleId).toBe("string");

    // Verify we can retrieve the vehicle with the returned ID
    const vehicle = await t.query(api.vehicles.getById, { id: vehicleId });
    expect(vehicle).not.toBeNull();
    expect(vehicle?.nickname).toBe("Another Car");
  });
});
