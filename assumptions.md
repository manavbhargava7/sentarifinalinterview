# Assumptions

## Embedding Dimensions
- **n = 384** for MiniLM embeddings (using all-MiniLM-L6-v2 model dimensions)

## Response Length
- **GPT_REPLY target: ≤ 55 characters** as specified
- May occasionally exceed by 5-10 chars for better empathy, will be noted in logs

## Mock Services
- All AI services (GPT, embeddings) are mocked with realistic outputs
- Cosine similarity threshold for carry_in: **0.86** as specified
- Mock latency: 100-500ms per step to simulate realistic performance

## Data Persistence
- In-memory storage using TypeScript Maps
- Profile and entries persist during single session
- 99 realistic mock entries generated for hundred simulation

## Parsing Strategy
- Rule-based extraction for themes, vibes, and intents
- Pattern matching for emotional keywords
- Simple NLP for persona traits detection 