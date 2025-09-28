"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Home } from "lucide-react";
import { generateSlug } from "@/lib/slugs";

export function AppBreadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  // For vehicle detail pages, fetch the vehicle data
  const isVehicleDetail = pathSegments[0] === 'vehicles' && pathSegments[1];
  const vehicle = useQuery(
    api.vehicles.getBySlug,
    isVehicleDetail ? { slug: pathSegments[1] } : "skip"
  );

  // Don't show breadcrumb on home page
  if (pathname === '/') {
    return null;
  }

  const breadcrumbItems = [];

  // Always start with Home
  breadcrumbItems.push({
    label: "Home",
    href: "/",
    icon: <Home className="h-4 w-4" />,
  });

  // Build breadcrumb based on path
  if (pathSegments[0] === 'vehicles') {
    breadcrumbItems.push({
      label: "Vehicles",
      href: "/vehicles",
    });

    // If we're on a vehicle detail page and have vehicle data
    if (pathSegments[1] && vehicle) {
      breadcrumbItems.push({
        label: vehicle.nickname,
        href: `/vehicles/${generateSlug(vehicle.nickname, vehicle._id)}`,
        current: true,
      });
    }
  }

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <div key={item.href} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator className="mr-2" />}
                <BreadcrumbItem>
                  {item.current ? (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={item.href}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      {item.icon}
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}