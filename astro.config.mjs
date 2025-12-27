// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkNotes from 'remark-notes-plugin';



const { SITE_URL, BASE_PATH, BLOG_CONTENT_DOMAIN } = import.meta.env;

// https://astro.build/config
export default defineConfig({
    site: SITE_URL,
    base: BASE_PATH ? BASE_PATH : '/',

    image: {
        layout: 'full-width',
        domains: [BLOG_CONTENT_DOMAIN],
    },

    markdown: {
        remarkPlugins: [
            remarkGfm,
            remarkBreaks,
            remarkNotes
        ],
    },

    integrations: [sitemap()]
});
