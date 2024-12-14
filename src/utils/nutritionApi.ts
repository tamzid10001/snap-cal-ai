import { supabase } from '@/integrations/supabase/client';

export const analyzeImage = async (file: File) => {
  // First, upload the image to a data URL
  const reader = new FileReader();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Call our edge function with the data URL
  const { data, error } = await supabase.functions.invoke('analyze-meal', {
    body: { image: dataUrl },
  });

  if (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image');
  }

  return data;
};