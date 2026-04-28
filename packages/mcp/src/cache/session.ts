export class SessionCache {
  private readonly entries = new Map<
    string,
    { result: string; hits: number; cachedAt: number }
  >();

  private readonly ttlMs = 30 * 60 * 1000;

  get(key: string): string | null {
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.entries.delete(key);
      return null;
    }

    entry.hits += 1;
    return entry.result;
  }

  set(key: string, result: string): void {
    this.entries.set(key, {
      result,
      hits: 0,
      cachedAt: Date.now(),
    });
  }

  stats(): { entries: number; totalHits: number } {
    let totalHits = 0;

    for (const entry of this.entries.values()) {
      totalHits += entry.hits;
    }

    return {
      entries: this.entries.size,
      totalHits,
    };
  }
}
