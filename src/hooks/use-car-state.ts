import { useState } from "react";

export type CarState = {
  model: string;
  nickname: string;
  stateOfCharge: number;
};

const startingCharge = 21.0;
const chargeRatePerSecond = 0.1;

export const formatChargePercentage = (input: number) => {
  return input.toFixed(1);
};

export function useCarState() {
  const [carState, setCarState] = useState<CarState>({
    model: "Mini Cooper E",
    nickname: "kEVin",
    stateOfCharge: startingCharge,
  });

  const incrementCharge = () =>
    setCarState((current) => ({
      ...current,
      stateOfCharge: current.stateOfCharge + chargeRatePerSecond,
    }));

  return {
    carState,
    incrementCharge,
  };
}
