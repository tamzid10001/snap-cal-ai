import { toast } from "@/hooks/use-toast";

interface NutritionAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const analyzeImage = async (imageFile: File): Promise<NutritionAnalysisResult> => {
  try {
    // Convert image to base64
    const base64Image = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageFile);
    });

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image and provide nutritional information. Return ONLY a JSON object with these fields: name (string), calories (number), protein (number in grams), carbs (number in grams), fats (number in grams). No other text."
              },
              {
                type: "image_url",
                image_url: base64Image
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    const nutritionData = JSON.parse(data.choices[0].message.content);

    return nutritionData;
  } catch (error) {
    console.error('Error analyzing image:', error);
    toast({
      title: "Error analyzing image",
      description: "Failed to analyze the meal image. Please try again or enter manually.",
      variant: "destructive",
    });
    throw error;
  }
};