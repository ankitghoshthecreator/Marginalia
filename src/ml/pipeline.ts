import { SentenceEmbedder } from './embedder';
import { SentimentClassifier, ClassificationResult } from './classifier';

/**
 * On-Device Offline Sentiment Pipeline Wrapper
 * Converts raw journal entry text into sentiment classification without any network requests.
 */
export class SentimentPipeline {
  static async analyzeEntry(entryText: string): Promise<ClassificationResult> {
    if (!entryText || entryText.trim().length === 0) {
      return {
        label: 'neutral',
        confidence: 1.0,
        scores: { low: 0, flat: 0, neutral: 1.0, lifted: 0, 'high-energy': 0 },
      };
    }

    // 1. Generate 128-dim sentence embedding locally
    const embedding = await SentenceEmbedder.embed(entryText);

    // 2. Pass embedding to on-device TFLite ANN model
    const result = await SentimentClassifier.classify(embedding);

    return result;
  }
}
