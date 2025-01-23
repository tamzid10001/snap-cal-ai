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
    console.log('Starting meal analysis...');
    const { image_base64, userId } = await req.json();
    
    if (!image_base64) {
      console.error('No image provided');
      throw new Error('No image provided');
    }

    console.log('Processing image for user:', userId);
    console.log('Sending request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert analyzing food photos. Respond ONLY with a JSON object containing these fields:
{
  "name": "detailed food description",
  "calories": number (50-2000),
  "protein": number (0-200),
  "carbs": number (0-300),
  "fats": number (0-150)
}`
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
              text: "What food is in this image? Provide nutritional information in JSON format only."
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    console.log('Received response from OpenAI');
    console.log('Raw response:', response.choices[0]?.message?.content);

    if (!response.choices[0]?.message?.content) {
      console.error('No response content from OpenAI');
      throw new Error('No response content from OpenAI');
    }

    const content = response.choices[0].message.content;

    try {
      // First try to parse the entire response as JSON
      let nutritionData = JSON.parse(content);
      console.log('Successfully parsed JSON directly:', nutritionData);

      // If that fails, try to extract JSON from the response
      if (!nutritionData) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in response');
          throw new Error('No JSON found in response');
        }
        nutritionData = JSON.parse(jsonMatch[0]);
        console.log('Extracted and parsed JSON from response:', nutritionData);
      }

      // Validate all required fields are present and are numbers
      const requiredFields = ['name', 'calories', 'protein', 'carbs', 'fats'];
      for (const field of requiredFields) {
        if (!(field in nutritionData)) {
          console.error(`Missing required field: ${field}`);
          throw new Error(`Missing required field: ${field}`);
        }
        if (field !== 'name') {
          const value = parseFloat(nutritionData[field]);
          if (isNaN(value)) {
            console.error(`Invalid number for ${field}: ${nutritionData[field]}`);
            throw new Error(`Invalid number for ${field}`);
          }
          nutritionData[field] = value;
        }
      }

      // Round numbers to 1 decimal place
      ['calories', 'protein', 'carbs', 'fats'].forEach(field => {
        nutritionData[field] = Math.round(nutritionData[field] * 10) / 10;
      });

      console.log('Final processed nutrition data:', nutritionData);
      return new Response(JSON.stringify(nutritionData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (parseError) {
      console.error('Error processing nutrition data:', parseError);
      console.error('Raw content that failed to parse:', content);
      throw new Error(`Failed to process nutrition data: ${parseError.message}`);
    }

  } catch (error) {
    console.error('Error in analyze-meal function:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while analyzing the meal',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});