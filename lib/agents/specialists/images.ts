export interface ImagesInput {
  query: string;
  count?: number;
}

export interface ImagesResult {
  query: string;
  images: Array<{ url: string; thumb: string; credit: string; link: string }>;
  source: string;
}

function mock(input: ImagesInput): ImagesResult {
  const n = input.count ?? 3;
  const images = Array.from({ length: n }, (_, i) => ({
    url: `https://placehold.co/800x600?text=${encodeURIComponent(input.query)}+${i + 1}`,
    thumb: `https://placehold.co/200x150?text=${encodeURIComponent(input.query)}+${i + 1}`,
    credit: "placeholder",
    link: "https://placehold.co",
  }));
  return { query: input.query, images, source: "mock://images" };
}

export async function images(input: ImagesInput): Promise<ImagesResult> {
  if (!process.env.UNSPLASH_ACCESS_KEY) return mock(input);
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(input.query)}&per_page=${input.count ?? 3}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`;
    const data = await fetch(url).then(r => r.json());
    const results = data?.results ?? [];
    if (!results.length) return mock(input);
    return {
      query: input.query,
      images: results.map((r: { urls: { regular: string; thumb: string }; user: { name: string }; links: { html: string } }) => ({
        url: r.urls.regular,
        thumb: r.urls.thumb,
        credit: r.user.name,
        link: r.links.html,
      })),
      source: "unsplash.com",
    };
  } catch {
    return mock(input);
  }
}
