import { file } from "astro/loaders";
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

export const collections = { socials };
