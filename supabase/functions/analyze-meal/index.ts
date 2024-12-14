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

    console.log('Starting image analysis with OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are a precise nutrition expert that analyzes food images. Provide detailed nutritional information in JSON format. Be conservative with estimates and round numbers. Always include all required fields: name (string), calories (number), protein (number), carbs (number), fats (number). Ensure numbers are reasonable and within typical ranges for food portions."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and provide nutritional information. Include name, calories, protein (g), carbs (g), and fats (g). Be conservative with estimates."
            },
            {
              type: "image_url",
              image_url: image,
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.5, // Lower temperature for more consistent results
    });

    console.log('Received OpenAI response:', response.choices[0].message.content);

    let nutritionData;
    try {
      nutritionData = JSON.parse(response.choices[0].message.content);
      
      // Validate the response format
      const requiredFields = ['name', 'calories', 'protein', 'carbs', 'fats'];
      const missingFields = requiredFields.filter(field => !(field in nutritionData));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Ensure all numeric fields are valid numbers and round them
      nutritionData.calories = Math.round(Number(nutritionData.calories));
      nutritionData.protein = Math.round(Number(nutritionData.protein) * 10) / 10;
      nutritionData.carbs = Math.round(Number(nutritionData.carbs) * 10) / 10;
      nutritionData.fats = Math.round(Number(nutritionData.fats) * 10) / 10;

      // Validate ranges
      if (nutritionData.calories < 0 || nutritionData.calories > 2000 ||
          nutritionData.protein < 0 || nutritionData.protein > 100 ||
          nutritionData.carbs < 0 || nutritionData.carbs > 200 ||
          nutritionData.fats < 0 || nutritionData.fats > 100) {
        throw new Error('Nutritional values out of reasonable range');
      }

      console.log('Processed nutrition data:', nutritionData);

    } catch (e) {
      console.error('Error processing OpenAI response:', e);
      throw new Error('Failed to process nutrition data from AI response');
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
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});