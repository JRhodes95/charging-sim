"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Home() {
  const vehicles = useQuery(api.vehicles.get);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {vehicles?.map(({ _id, nickname }) => (
        <div key={_id}>{nickname}</div>
      ))}
    </main>
  );
}
