"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Plug,
  Zap,
  Clock,
  StopCircle,
  PlayCircle,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import type { ChargingEvent } from "@/hooks/charging-states-reducer";

interface ChargingTimelineProps {
  events: ChargingEvent[];
  className?: string;
}

const getEventIcon = (type: ChargingEvent["type"], action: string) => {
  switch (type) {
    case "connection":
      return action.includes("Connected") ? (
        <Plug className="w-4 h-4 text-success" />
      ) : (
        <StopCircle className="w-4 h-4 text-muted-foreground" />
      );
    case "charging":
      return action.includes("Started") ? (
        <PlayCircle className="w-4 h-4 text-charging" />
      ) : (
        <StopCircle className="w-4 h-4 text-muted-foreground" />
      );
    case "schedule":
      return action.includes("Cancelled") || action.includes("suspended") ? (
        <AlertTriangle className="w-4 h-4 text-destructive" />
      ) : (
        <Calendar className="w-4 h-4 text-info" />
      );
    case "override":
      return <Zap className="w-4 h-4 text-charging" />;
    case "completion":
      return <CheckCircle className="w-4 h-4 text-success" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

export function ChargingTimeline({
  events,
  className = "",
}: ChargingTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="relative">
            {/* Event item */}
            <div className="flex gap-3 py-2">
              {/* Icon */}
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                {getEventIcon(event.type, event.action)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      {event.action}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(event.timestamp, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {/* Event details */}
                {event.details &&
                  (typeof event.details.targetCharge === "number" ||
                    typeof event.details.currentCharge === "number") && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">
                        {typeof event.details.currentCharge === "number" &&
                          typeof event.details.targetCharge === "number" && (
                            <span>
                              {event.details.currentCharge.toFixed(1)}% →{" "}
                              {event.details.targetCharge}%
                            </span>
                          )}
                        {event.details.endTime &&
                        typeof event.details.endTime === "object" &&
                        event.details.endTime instanceof Date ? (
                          <span className="ml-2">
                            until {format(event.details.endTime, "h:mm a")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
