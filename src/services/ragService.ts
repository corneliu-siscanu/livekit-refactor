export type RagSearchHit = {
  score: number;
  text: string;
  metadata: {
    doc_id: string;
    chunk_id: string;
    position: number;
    filename: string;
    strategy: string;
    embedding_provider: 'gemini' | 'local';
    prev_chunk_id?: string | null;
    next_chunk_id?: string | null;
    created_at?: string;
  };
};

export type RagSearchResult = {
  query: string;
  hits: RagSearchHit[];
  count: number;
};

export class RagService {
  constructor(
    private readonly backendUrl: string,
    private readonly embeddingProvider: string,
    private readonly hitsK: number,
  ) {}

  async search(query: string, k = this.hitsK): Promise<RagSearchResult> {
    const body = { query, k, embeddingProvider: this.embeddingProvider };
    console.log(`🔍 Searching backend: query="${query}", k=${k}`);

    const res = await fetch(`${this.backendUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Search error ${res.status}: ${txt}`);
    }

    const json = (await res.json()) as any;
    if (!json?.success) {
      throw new Error(`Search failed: ${JSON.stringify(json)}`);
    }

    const hits = (json.data?.results || []) as RagSearchHit[];
    console.log(`✅ Found ${hits.length} results`);
    return {
      query: json.data?.query ?? query,
      hits,
      count: json.data?.count ?? hits.length,
    };
  }
}
