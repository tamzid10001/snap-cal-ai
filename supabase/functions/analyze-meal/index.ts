import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const { image } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    console.log('Analyzing image with OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",  // Updated to use the correct vision model
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert that analyzes food images and provides detailed nutritional information. Provide conservative estimates and round numbers."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and provide nutritional information in JSON format with these fields only: name (string), calories (number), protein (number), carbs (number), fats (number). Round all numbers. Be conservative with estimates."
            },
            {
              type: "image_url",
              image_url: image,
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    console.log('OpenAI response:', content);

    let nutritionData;
    try {
      nutritionData = JSON.parse(content);
      
      // Validate the response format
      const requiredFields = ['name', 'calories', 'protein', 'carbs', 'fats'];
      for (const field of requiredFields) {
        if (!(field in nutritionData)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Ensure all numeric fields are numbers
      nutritionData.calories = Math.round(Number(nutritionData.calories));
      nutritionData.protein = Math.round(Number(nutritionData.protein));
      nutritionData.carbs = Math.round(Number(nutritionData.carbs));
      nutritionData.fats = Math.round(Number(nutritionData.fats));

    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      throw new Error('Failed to parse nutrition data from AI response');
    }

    return new Response(
      JSON.stringify(nutritionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-meal function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze meal',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});