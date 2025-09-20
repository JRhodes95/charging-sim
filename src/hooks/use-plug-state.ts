import { useState } from "react";
import { toast } from "sonner";

export type PlugState = "unplugged" | "plugged-in";

export function usePlugState() {
  const [plugState, setPlugState] = useState<PlugState>("unplugged");

  const unplugCar = () => {
    setPlugState("unplugged");
  };

  const plugInCar = () => {
    setPlugState("plugged-in");
    toast.success("Car plugged in");
  };

  return {
    plugState,
    unplugCar,
    plugInCar,
  };
}