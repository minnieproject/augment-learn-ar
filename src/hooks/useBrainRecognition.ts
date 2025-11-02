import { useState, useCallback } from 'react';
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js for optimal performance
env.allowLocalModels = false;
env.useBrowserCache = true;

export const useBrainRecognition = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [classifier, setClassifier] = useState<any>(null);

  const initializeModel = useCallback(async () => {
    if (classifier) return classifier;
    
    try {
      console.log('🧠 Initializing zero-shot brain detection model...');
      
      // Use CLIP for zero-shot classification - much better for specific concepts
      const zeroShotClassifier = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch32',
        { 
          device: 'webgpu',
          dtype: 'fp16' // Use half precision for speed
        }
      );
      
      console.log('✅ Model loaded successfully!');
      setClassifier(zeroShotClassifier);
      return zeroShotClassifier;
    } catch (error) {
      console.error('❌ Error initializing model:', error);
      throw error;
    }
  }, [classifier]);

  const recognizeImage = useCallback(async (imageData: string): Promise<{ detected: boolean; confidence: number; label: string }> => {
    setIsLoading(true);
    
    try {
      console.log('🔍 Starting brain image recognition...');
      const model = await initializeModel();
      
      // Define specific candidate labels for zero-shot classification
      const candidateLabels = [
        'human brain anatomy',
        'brain MRI scan',
        'brain diagram',
        'anatomical brain illustration',
        'brain cross-section',
        'medical brain image',
        'neuroscience brain',
        'brain structure',
        'cerebral cortex',
        'other object'
      ];
      
      // Perform zero-shot classification
      const results: any = await model(imageData, candidateLabels);
      console.log('📊 Classification results:', results);
      
      // Handle array of results
      const resultsArray = Array.isArray(results) ? results : [results];
      const topResult = resultsArray[0];
      const isBrainDetected = !topResult.label.includes('other') && topResult.score > 0.15;
      
      console.log(`🎯 Detection: ${isBrainDetected ? '✅ BRAIN' : '❌ NOT BRAIN'}`);
      console.log(`   Label: ${topResult.label}`);
      console.log(`   Confidence: ${(topResult.score * 100).toFixed(1)}%`);
      
      return {
        detected: isBrainDetected,
        confidence: topResult.score,
        label: topResult.label
      };
      
    } catch (error) {
      console.error('❌ Error during recognition:', error);
      return { detected: false, confidence: 0, label: 'error' };
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
