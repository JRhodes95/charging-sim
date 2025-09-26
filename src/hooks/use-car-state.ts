import { useState } from "react";

export type CarState = {
  model: string;
  nickname: string;
  stateOfCharge: number;
};

const chargeRatePerSecond = 0.1;

// ! Doesn't belong in this hook
export const formatChargePercentage = (input: number) => {
  return input.toFixed(1);
};

export function useCarState(initialState: CarState) {
  const [carState, setCarState] = useState<CarState>(initialState);

  // ! should take current charge rate as an input
  const incrementCharge = () =>
    setCarState((current) => ({
      ...current,
      stateOfCharge: Math.min(current.stateOfCharge + chargeRatePerSecond, 100),
    }));

  return {
    carState,
    incrementCharge,
  };
}
