import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add vehicle",
  description: "Add a new electric vehicle to your fleet. Enter vehicle details and battery specifications.",
};

export default function AddVehicleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}