import { useState, useCallback } from 'react';
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export const useBrainRecognition = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [classifier, setClassifier] = useState<any>(null);

  const initializeModel = useCallback(async () => {
    if (classifier) return classifier;
    
    try {
      console.log('Initializing image classification model...');
      const imageClassifier = await pipeline(
        'image-classification',
        'Xenova/vit-base-patch16-224',
        { device: 'webgpu' }
      );
      setClassifier(imageClassifier);
      return imageClassifier;
    } catch (error) {
      console.error('Error initializing model:', error);
      throw error;
    }
  }, [classifier]);

  const recognizeImage = useCallback(async (imageData: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Starting brain recognition...');
      const model = await initializeModel();
      
      // Classify the image
      const results = await model(imageData);
      console.log('Classification results:', results);
      
      // Check if any of the top predictions relate to brain/anatomy/medical
      const brainRelatedTerms = [
        'brain', 'head', 'skull', 'anatomy', 'medical', 
        'mri', 'scan', 'tissue', 'organ', 'neural',
        'cerebral', 'cortex', 'gray matter', 'white matter'
      ];
      
      const isBrainDetected = results.some((result: any) => {
        const label = result.label.toLowerCase();
        return brainRelatedTerms.some(term => label.includes(term)) && result.score > 0.1;
      });
      
      console.log('Brain detected:', isBrainDetected);
      return isBrainDetected;
      
    } catch (error) {
      console.error('Error during recognition:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [initializeModel]);

  return {
    recognizeImage,
    isLoading,
    initializeModel
  };
};
