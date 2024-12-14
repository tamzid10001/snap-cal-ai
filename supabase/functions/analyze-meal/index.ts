import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, userId } = await req.json();
    
    if (!image_base64) {
      throw new Error('No image provided');
    }

    console.log('Processing image for user:', userId);
    console.log('Sending request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert analyzing food photos. Your task is to:
1. Identify the exact food items in the image with specific details
2. Provide realistic nutritional estimates for the portion shown
3. Return ONLY a JSON object with these fields:
   - name: Detailed description of the food (string)
   - calories: Total calories (number)
   - protein: Protein in grams (number)
   - carbs: Carbohydrates in grams (number)
   - fats: Fat in grams (number)`
        },
        {
          role: "user",
          content: [
            {
              type: "image",
              image_url: {
                url: `data:image/jpeg;base64,${image_base64}`
              }
            },
            {
              type: "text",
              text: "Analyze this food and provide nutritional information in JSON format."
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    console.log('Received response from OpenAI');

    if (!response.choices[0]?.message?.content) {
      throw new Error('No response content from OpenAI');
    }

    const content = response.choices[0].message.content;
    console.log('Raw OpenAI response:', content);

    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const nutritionData = JSON.parse(jsonMatch[0]);
      console.log('Parsed nutrition data:', nutritionData);

      // Ensure all required fields are present
      const requiredFields = ['name', 'calories', 'protein', 'carbs', 'fats'];
      for (const field of requiredFields) {
        if (!(field in nutritionData)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Round numbers to 1 decimal place
      ['calories', 'protein', 'carbs', 'fats'].forEach(field => {
        const value = parseFloat(nutritionData[field]);
        if (isNaN(value)) {
          throw new Error(`Invalid number for ${field}`);
        }
        nutritionData[field] = Math.round(value * 10) / 10;
      });

      // Validate ranges
      if (nutritionData.calories < 50 || nutritionData.calories > 2000) {
        throw new Error('Calories out of reasonable range (50-2000)');
      }
      if (nutritionData.protein < 0 || nutritionData.protein > 200) {
        throw new Error('Protein out of reasonable range (0-200g)');
      }
      if (nutritionData.carbs < 0 || nutritionData.carbs > 300) {
        throw new Error('Carbs out of reasonable range (0-300g)');
      }
      if (nutritionData.fats < 0 || nutritionData.fats > 150) {
        throw new Error('Fats out of reasonable range (0-150g)');
      }

      console.log('Successfully processed nutrition data:', nutritionData);

      return new Response(JSON.stringify(nutritionData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (e) {
      console.error('Error processing nutrition data:', e);
      throw new Error(`Failed to process nutrition data: ${e.message}`);
    }

  } catch (error) {
    console.error('Error in analyze-meal function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while analyzing the meal'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});