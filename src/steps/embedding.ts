export function step02_embedding(raw_text: string): number[] {
    // Mock 384-dimensional embedding (all-MiniLM-L6-v2 size)
    const embedding = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
    console.log(`[EMBEDDING] input="${raw_text.substring(0, 30)}..." | output="[${embedding.slice(0, 3).map(n => n.toFixed(3)).join(',')}...384d]" | note="[MOCK] MiniLM vector generated"`);
    return embedding;
} 