import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect } from "react";
import type { SetupFormValues } from "./types";

const setupFormSchema = z.object({
  age: z.coerce.number().min(1).max(120),
  weight: z.coerce.number().min(20).max(300),
  height: z.coerce.number().min(100).max(250),
  heightUnit: z.enum(["cm", "ft"]),
  heightFeet: z.coerce.number().min(4).max(8).optional(),
  heightInches: z.coerce.number().min(0).max(11).optional(),
  gender: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "very", "extra"]),
  goal: z.enum(["lose", "maintain", "gain"]),
});

interface SetupFormProps {
  onSubmit: (values: SetupFormValues) => void;
}

const convertFeetInchesToCm = (feet: number, inches: number): number => {
  return Math.round((feet * 30.48) + (inches * 2.54));
};

const convertCmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

export const SetupForm = ({ onSubmit }: SetupFormProps) => {
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      age: 25,
      weight: 70,
      height: 170,
      heightUnit: "cm",
      gender: "male",
      activityLevel: "moderate",
      goal: "maintain",
    },
  });

  // Watch for changes in height unit and feet/inches
  const heightUnit = form.watch("heightUnit");
  const heightFeet = form.watch("heightFeet");
  const heightInches = form.watch("heightInches");
  const heightCm = form.watch("height");

  // Update height when feet/inches change
  useEffect(() => {
    if (heightUnit === "ft" && heightFeet && heightInches !== undefined) {
      const cm = convertFeetInchesToCm(heightFeet, heightInches);
      form.setValue("height", cm, { shouldValidate: true });
    }
  }, [heightUnit, heightFeet, heightInches]);

  // Update feet/inches when cm changes and unit is ft
  useEffect(() => {
    if (heightUnit === "ft" && heightCm) {
      const { feet, inches } = convertCmToFeetInches(heightCm);
      form.setValue("heightFeet", feet, { shouldValidate: true });
      form.setValue("heightInches", inches, { shouldValidate: true });
    }
  }, [heightUnit, heightCm]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter your age" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter your weight" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="heightUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height Unit</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="cm" />
                    </FormControl>
                    <FormLabel className="font-normal">Centimeters</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="ft" />
                    </FormControl>
                    <FormLabel className="font-normal">Feet & Inches</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {heightUnit === "cm" ? (
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (cm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter your height" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="heightFeet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feet</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Feet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heightInches"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inches</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Inches" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="activityLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                  <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="very">Very Active (exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="extra">Extra Active (very active & physical job)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lose">Lose Weight</SelectItem>
                  <SelectItem value="maintain">Maintain Weight</SelectItem>
                  <SelectItem value="gain">Gain Weight</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Complete Setup
        </Button>
      </form>
    </Form>
  );
};