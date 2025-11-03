import { useState, useEffect } from 'react';

// Using @huggingface/transformers for zero-shot image classification
let classifier: any = null;

export const useBrainRecognition = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      try {
        // Dynamically import the transformers library
        const { pipeline, env } = await import('@huggingface/transformers');
        
        // Configure transformers
        env.allowLocalModels = false;
        env.useBrowserCache = true;

        console.log('Loading brain recognition model...');
        
        // Use zero-shot classification with CLIP for better conceptual understanding
        classifier = await pipeline(
          'zero-shot-image-classification',
          'Xenova/clip-vit-base-patch32',
          { 
            device: 'webgpu',
            dtype: 'fp16'
          }
        );
        
        setIsModelLoaded(true);
        console.log('Brain recognition model loaded successfully');
      } catch (error) {
        console.error('Failed to load brain recognition model:', error);
        setIsModelLoaded(false);
      }
    };

    loadModel();
  }, []);

  const recognizeImage = async (imageDataUrl: string): Promise<{
    detected: boolean;
    confidence: number;
    label: string;
  }> => {
    if (!classifier) {
      console.error('Model not loaded');
      return { detected: false, confidence: 0, label: 'Model not loaded' };
    }

    try {
      // Create an image element from the data URL
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      // Define candidate labels for brain detection
      const candidateLabels = [
        'human brain anatomy',
        'brain MRI scan',
        'brain diagram',
        'brain model',
        'neural structure',
        'cerebral cortex',
        'medical brain image',
        'not a brain'
      ];

      console.log('Running brain image classification...');
      
      const result = await classifier(img, candidateLabels);
      
      console.log('Classification results:', result);

      // Find the highest scoring brain-related label
      const brainLabels = result.filter((r: any) => !r.label.includes('not a brain'));
      const topResult = brainLabels[0];
      
      // Detection threshold
      const threshold = 0.15;
      const detected = topResult && topResult.score > threshold;

      return {
        detected,
        confidence: topResult?.score || 0,
        label: topResult?.label || 'Unknown'
      };
    } catch (error) {
      console.error('Brain recognition error:', error);
      return { detected: false, confidence: 0, label: 'Error occurred' };
    }
  };

  return {
    isModelLoaded,
    recognizeImage
  };
};
