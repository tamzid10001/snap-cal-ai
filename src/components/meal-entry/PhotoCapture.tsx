import React from 'react';
import { Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  isProcessing: boolean;
}

export const PhotoCapture = ({ onCapture, isProcessing }: PhotoCaptureProps) => {
  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  return (
    <Card className="p-8 border-2 border-dashed border-primary/50 hover:border-primary transition-colors cursor-pointer">
      <label className="flex flex-col items-center cursor-pointer">
        {isProcessing ? (
          <div className="animate-pulse">
            <Camera className="w-12 h-12 text-primary mb-4" />
          </div>
        ) : (
          <Camera className="w-12 h-12 text-primary mb-4" />
        )}
        <span className="text-lg font-medium text-primary mb-2">
          {isProcessing ? 'Analyzing...' : 'Take a Photo'}
        </span>
        <span className="text-sm text-gray-500">
          {isProcessing ? 'Please wait' : 'Point your camera at your meal'}
        </span>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleCapture}
          disabled={isProcessing}
          capture="environment"
        />
      </label>
    </Card>
  );
};