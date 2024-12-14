import React from 'react';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ImageUpload = () => {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File uploaded:', file);
      // TODO: Implement image processing
    }
  };

  return (
    <Card className="p-8 border-2 border-dashed border-primary/50 hover:border-primary transition-colors cursor-pointer">
      <label className="flex flex-col items-center cursor-pointer">
        <Upload className="w-12 h-12 text-primary mb-4" />
        <span className="text-lg font-medium text-text mb-2">Upload Meal Photo</span>
        <span className="text-sm text-gray-500">Click or drag and drop</span>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          capture="environment"
        />
      </label>
    </Card>
  );
};