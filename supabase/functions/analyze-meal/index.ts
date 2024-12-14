import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
          content: `You are a nutrition expert analyzing food images. Your task is to:
1. Identify the food items in the image
2. Provide nutritional estimates for a single serving
3. Return ONLY a JSON object with these exact fields:
   - name: Brief description of the food
   - calories: Total calories (number between 50-1000)
   - protein: Grams of protein (number between 0-100)
   - carbs: Grams of carbohydrates (number between 0-200)
   - fats: Grams of fat (number between 0-100)
Round all numbers to one decimal place. Be conservative with estimates.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What food is in this image? Provide nutritional information in JSON format." },
            { type: "image_url", url: image }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more consistent results
    });

    console.log('Raw OpenAI response:', response.choices[0].message.content);

    let nutritionData;
    try {
      const content = response.choices[0].message.content.trim();
      // Try to extract JSON if it's wrapped in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      
      nutritionData = JSON.parse(jsonString);
      
      // Validate required fields
      const requiredFields = ['name', 'calories', 'protein', 'carbs', 'fats'];
      const missingFields = requiredFields.filter(field => !(field in nutritionData));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Convert and validate numeric fields
      const numericFields = ['calories', 'protein', 'carbs', 'fats'];
      numericFields.forEach(field => {
        const value = Number(nutritionData[field]);
        if (isNaN(value)) {
          throw new Error(`Invalid numeric value for ${field}`);
        }
        nutritionData[field] = Math.round(value * 10) / 10;
      });

      // Validate ranges
      if (nutritionData.calories < 50 || nutritionData.calories > 1000) {
        throw new Error('Calories out of reasonable range (50-1000)');
      }
      if (nutritionData.protein < 0 || nutritionData.protein > 100) {
        throw new Error('Protein out of reasonable range (0-100g)');
      }
      if (nutritionData.carbs < 0 || nutritionData.carbs > 200) {
        throw new Error('Carbs out of reasonable range (0-200g)');
      }
      if (nutritionData.fats < 0 || nutritionData.fats > 100) {
        throw new Error('Fats out of reasonable range (0-100g)');
      }

      console.log('Processed nutrition data:', nutritionData);

    } catch (e) {
      console.error('Error processing nutrition data:', e);
      throw new Error(`Failed to process nutrition data: ${e.message}`);
    }

    return new Response(
      JSON.stringify(nutritionData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});