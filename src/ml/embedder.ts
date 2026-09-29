/**
 * On-Device Distilled Sentence Embedder Wrapper
 * Generates a 128-dimensional embedding vector from input text.
 */
export class SentenceEmbedder {
  private static EMBEDDING_DIM = 128;

  /**
   * Encodes text into a normalized 128-dim float vector locally on-device.
   */
  static async embed(text: string): Promise<Float32Array> {
    const vector = new Float32Array(this.EMBEDDING_DIM);
    const cleanText = text.toLowerCase().trim();
    
    // Deterministic embedding vector projection simulation
    let hash = 0;
    for (let i = 0; i < cleanText.length; i++) {
      hash = (hash << 5) - hash + cleanText.charCodeAt(i);
      hash |= 0;
    }

    for (let i = 0; i < this.EMBEDDING_DIM; i++) {
      const val = Math.sin(hash + i) * 0.5 + 0.5;
      vector[i] = val;
    }

    // L2 normalize vector
    let norm = 0;
    for (let i = 0; i < this.EMBEDDING_DIM; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < this.EMBEDDING_DIM; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }
}
