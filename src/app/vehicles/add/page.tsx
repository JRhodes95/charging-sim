"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, Car } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import z from "zod";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/slugs";

const formSchema = z.object({
  nickname: z
    .string()
    .min(1, "Give your vehicle a name")
    .max(256, "Name too long"),
  model: z
    .string()
    .min(1, "Enter your vehicle model")
    .max(256, "Model name too long"),
  // ! https://github.com/react-hook-form/resolvers/issues/799
  batteryCapacity: z.coerce
    .number<number>("Enter a valid number")
    .min(1, "Must be at least 1 kWh")
    .max(1000, "Must be 1000 kWh or less"),
});

type FormSchema = z.infer<typeof formSchema>;

export default function AddVehiclePage() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: "",
      model: "",
      batteryCapacity: 0,
    },
  });

  const createVehicleMutation = useMutation(api.vehicles.create);
  const router = useRouter();

  const onSubmit = async (values: FormSchema) => {
    try {
      const vehicleId = await createVehicleMutation(values);

      const vehiclePageHref = `/vehicles/${generateSlug(values.nickname, vehicleId)}`;

      toast.success(`Vehicle added to your account`);
      router.push(vehiclePageHref);
    } catch {
      toast.error(`That didn't work!`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 -ml-4">
            <Link href="/vehicles" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to vehicles
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Add vehicle
              </h1>
              <p className="text-muted-foreground">
                Add a new vehicle to your fleet
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle name</FormLabel>
                    <FormControl>
                      <Input className="h-11" {...field} />
                    </FormControl>
                    <FormDescription>
                      A familiar nickname to identify this vehicle
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle model</FormLabel>
                    <FormControl>
                      <Input className="h-11" {...field} />
                    </FormControl>
                    <FormDescription>
                      The make and model of your vehicle
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batteryCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Battery capacity (kWh)</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-11" {...field} />
                    </FormControl>
                    <FormDescription>
                      Total battery capacity in kilowatt-hours
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Add vehicle
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/vehicles">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
