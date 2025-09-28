import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicles",
  description: "View and manage your electric vehicle fleet. Monitor charging status, battery levels, and vehicle locations.",
};

export default function VehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}