import type { SetupFormValues } from "./types";

export const calculateBMR = (values: SetupFormValues) => {
  // Mifflin-St Jeor Equation
  const { age, weight, height, gender } = values;
  let bmr = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age);
  bmr = gender === "male" ? bmr + 5 : bmr - 161;
  
  // Activity level multiplier
  const activityMultipliers = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise 1-3 days/week
    moderate: 1.55, // Moderate exercise 3-5 days/week
    very: 1.725, // Heavy exercise 6-7 days/week
    extra: 1.9, // Very heavy exercise, physical job
  };
  
  const dailyCalories = bmr * activityMultipliers[values.activityLevel];
  
  // Adjust calories based on goal
  const goalAdjustments = {
    lose: -500, // Deficit for weight loss
    maintain: 0,
    gain: 500, // Surplus for weight gain
  };
  
  const adjustedCalories = dailyCalories + goalAdjustments[values.goal];
  
  // Calculate macros (40/30/30 split by default)
  const proteinGrams = (adjustedCalories * 0.3) / 4; // 4 calories per gram
  const carbsGrams = (adjustedCalories * 0.4) / 4;
  const fatsGrams = (adjustedCalories * 0.3) / 9; // 9 calories per gram
  
  return {
    bmr,
    dailyCalories: adjustedCalories,
    proteinGoal: proteinGrams,
    carbsGoal: carbsGrams,
    fatsGoal: fatsGrams,
  };
};