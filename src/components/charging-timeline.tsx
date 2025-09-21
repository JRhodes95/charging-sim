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

// Type for Convex charging events
interface ConvexChargingEvent {
  _id: string;
  _creationTime: number;
  timestamp: string;
  type: "connection" | "charging" | "schedule" | "override" | "completion";
  details?: {
    target_charge?: number;
    current_charge?: number;
    start_time?: string;
    end_time?: string;
    suspended_until?: string;
  };
}

// Legacy type for backwards compatibility
interface LegacyChargingEvent {
  id: string;
  timestamp: Date;
  type: "connection" | "charging" | "schedule" | "override" | "completion";
  action: string;
  description: string;
  details?: Record<string, unknown>;
}

interface ChargingTimelineProps {
  events: ConvexChargingEvent[] | LegacyChargingEvent[];
  className?: string;
}

const getEventAction = (type: string, details?: any): string => {
  switch (type) {
    case "connection":
      return "Vehicle Connected";
    case "charging":
      return details?.target_charge ? "Scheduled Charging Started" : "Charging Stopped";
    case "schedule":
      return details?.suspended_until ? "Scheduled Charging Cancelled" : "Charging Scheduled";
    case "override":
      return "Manual Charging Started";
    case "completion":
      return details?.current_charge === 100 ? "Charging Complete" : "Target Charge Reached";
    default:
      return "Unknown Event";
  }
};

const getEventIcon = (type: string, action: string) => {
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
        {events.map((event, index) => {
          // Handle both Convex and legacy event formats
          const eventId = "_id" in event ? event._id : event.id;
          const eventTimestamp = "_id" in event ? new Date(event.timestamp) : event.timestamp;
          const eventAction = "_id" in event ? getEventAction(event.type, event.details) : event.action;

          return (
            <div key={eventId} className="relative">
              {/* Timeline line */}
              {index < events.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-4 bg-border" />
              )}

              {/* Event item */}
              <div className="flex gap-3 py-2">
                {/* Icon */}
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                  {getEventIcon(event.type, eventAction)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        {eventAction}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(eventTimestamp, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Event details */}
                  {event.details && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">
                        {/* Handle Convex format */}
                        {"_id" in event && event.details.current_charge && event.details.target_charge && (
                          <span>
                            {event.details.current_charge.toFixed(1)}% →{" "}
                            {event.details.target_charge}%
                          </span>
                        )}

                        {/* Handle legacy format */}
                        {"id" in event && typeof event.details.currentCharge === 'number' &&
                          typeof event.details.targetCharge === 'number' && (
                            <span>
                              {event.details.currentCharge.toFixed(1)}% →{" "}
                              {event.details.targetCharge}%
                            </span>
                          )}

                        {/* End time display */}
                        {"_id" in event && event.details.end_time && (
                          <span className="ml-2">
                            until{" "}
                            {format(new Date(event.details.end_time), "h:mm a")}
                          </span>
                        )}

                        {"id" in event && event.details.endTime && typeof event.details.endTime === 'object' && event.details.endTime instanceof Date && (
                          <span className="ml-2">
                            until{" "}
                            {format(event.details.endTime, "h:mm a")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
