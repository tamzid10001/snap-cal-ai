export interface SetupFormValues {
  age: number;
  weight: number;
  height: number;
  heightUnit: "cm" | "ft";
  heightFeet?: number;
  heightInches?: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "very" | "extra";
  goal: "lose" | "maintain" | "gain";
}