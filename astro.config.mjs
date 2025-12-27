// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkNotes from 'remark-notes-plugin';
import { loadEnv } from 'vite';

const { BLOG_CONTENT_DOMAIN, SITE_URL, BASE_PATH } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), "");

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
