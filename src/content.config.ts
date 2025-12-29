import { file, glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";


const socials = defineCollection({
    loader: file("src/data/socials.json"),
    schema: z.object({
        title: z.string(),
        username: z.string().optional(),
        description: z.string().optional(),
        href: z.string().url(),
        linkText: z.string(),
        imageFileName: z.string(),
        imageAlt: z.string(),
        tags: z.array(z.enum(["Develop", "Photo", "Music", "Other"])),
    })
});

const blog = defineCollection({
    loader: glob({pattern: "**/*.{md,mdx}", base: "src/data/blog"}),
    schema: z.object({
        publishedAt: z.date(),
        isIndexed: z.boolean().default(true),
        title: z.string(),
        description: z.string().optional(),
        coverImageUrl: z.string().url().optional(),
    })
});

export const collections = { socials, blog };
