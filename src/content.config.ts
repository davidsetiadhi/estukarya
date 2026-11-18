import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const artikel = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artikel' }),
  schema: z.object({
    judul: z.string(),
    ringkas: z.string(),
    tanggal: z.coerce.date(),
    produk: z.array(z.string()).default([]),
  }),
});

export const collections = { artikel };
