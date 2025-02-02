import React from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  isProcessing?: boolean;
}

export const ImageUpload = ({ onUpload, isProcessing = false }: ImageUploadProps) => {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <Card className="p-8 border-2 border-dashed border-primary/50 hover:border-primary transition-colors cursor-pointer">
      <label className="flex flex-col items-center cursor-pointer">
        {isProcessing ? (
          <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
        ) : (
          <Upload className="w-12 h-12 text-primary mb-4" />
        )}
        <span className="text-lg font-medium text-primary mb-2">
          {isProcessing ? 'Analyzing...' : 'Upload Meal Photo'}
        </span>
        <span className="text-sm text-gray-500">
          {isProcessing ? 'Please wait' : 'Click or drag and drop'}
        </span>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          disabled={isProcessing}
          capture="environment"
        />
      </label>
    </Card>
  );
};