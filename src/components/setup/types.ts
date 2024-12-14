export interface SetupFormValues {
  age: string;
  weight: string;
  height: string;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "very" | "extra";
  goal: "lose" | "maintain" | "gain";
}