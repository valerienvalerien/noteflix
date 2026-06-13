// Embeddings via le modèle intégré `gte-small` du runtime Supabase Edge (384 dim).
// Gratuit, aucune clé externe. Pour passer à un fournisseur plus précis
// (OpenAI text-embedding-3-small, Voyage…), remplace cette fonction et la
// dimension `vector(...)` dans la migration.

// Le global `Supabase` est fourni par le runtime Edge (pas typé par défaut).
declare const Supabase: {
  ai: {
    Session: new (model: string) => {
      run(
        input: string,
        opts: { mean_pool: boolean; normalize: boolean },
      ): Promise<number[]>;
    };
  };
};

const session = new Supabase.ai.Session("gte-small");

export async function embed(text: string): Promise<number[]> {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  return await session.run(clean, { mean_pool: true, normalize: true });
}
