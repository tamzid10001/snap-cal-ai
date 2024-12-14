import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting meal analysis...');
    const { image } = await req.json();
    
    if (!image) {
      console.error('No image provided');
      throw new Error('No image provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert analyzing food photos. You must respond with ONLY a valid JSON object containing these fields: name (string), calories (number 50-2000), protein (number 0-200), carbs (number 0-300), fats (number 0-150). No other text or explanation."
          },
          {
            role: "user",
            content: [
              {
                type: "image",
                image_url: image
              },
              {
                type: "text",
                text: "Analyze this meal and provide nutritional information in JSON format only."
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    console.log('Received response from OpenAI');
    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data));

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response from OpenAI:', data);
      throw new Error('Invalid response from OpenAI');
    }

    let nutritionData;
    try {
      const content = data.choices[0].message.content.trim();
      console.log('Raw content:', content);
      
      // Try to parse the content directly first
      try {
        nutritionData = JSON.parse(content);
      } catch {
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        nutritionData = JSON.parse(jsonMatch[0]);
      }

      console.log('Parsed nutrition data:', nutritionData);

      // Validate the data structure
      const requiredFields = ['name', 'calories', 'protein', 'carbs', 'fats'];
      for (const field of requiredFields) {
        if (!(field in nutritionData)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Convert string numbers to actual numbers and validate ranges
      nutritionData.calories = Number(nutritionData.calories);
      nutritionData.protein = Number(nutritionData.protein);
      nutritionData.carbs = Number(nutritionData.carbs);
      nutritionData.fats = Number(nutritionData.fats);

      if (
        isNaN(nutritionData.calories) || nutritionData.calories < 50 || nutritionData.calories > 2000 ||
        isNaN(nutritionData.protein) || nutritionData.protein < 0 || nutritionData.protein > 200 ||
        isNaN(nutritionData.carbs) || nutritionData.carbs < 0 || nutritionData.carbs > 300 ||
        isNaN(nutritionData.fats) || nutritionData.fats < 0 || nutritionData.fats > 150
      ) {
        throw new Error('Nutrition values out of acceptable ranges');
      }

      // Round numbers to 1 decimal place
      nutritionData.calories = Math.round(nutritionData.calories);
      nutritionData.protein = Math.round(nutritionData.protein * 10) / 10;
      nutritionData.carbs = Math.round(nutritionData.carbs * 10) / 10;
      nutritionData.fats = Math.round(nutritionData.fats * 10) / 10;

      console.log('Final processed nutrition data:', nutritionData);
      return new Response(JSON.stringify(nutritionData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (parseError) {
      console.error('Error processing nutrition data:', parseError);
      console.error('Raw content that failed to parse:', data.choices[0].message.content);
      throw new Error(`Failed to process nutrition data: ${parseError.message}`);
    }

  } catch (error) {
    console.error('Error in analyze-meal function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while analyzing the meal',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});