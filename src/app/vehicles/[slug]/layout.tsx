import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // Extract vehicle name from slug (everything before the last dash)
  const parts = params.slug.split('-');
  const vehicleName = parts.slice(0, -1).join(' ').replace(/\b\w/g, l => l.toUpperCase());

  return {
    title: vehicleName || 'Vehicle details',
    description: `View detailed information about ${vehicleName || 'this vehicle'}, including charging status, battery level, and recent activity.`,
  };
}

export default function VehicleDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}