// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkNotes from 'remark-notes-plugin';
import { loadEnv } from 'vite';



const { IMAGE_DOMAIN } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), "");
const { SITE_URL, BASE_PATH } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), "");

// https://astro.build/config
export default defineConfig({
    site: SITE_URL,
    base: BASE_PATH ? BASE_PATH : '/',

    image: {
        layout: 'full-width',
        domains: [IMAGE_DOMAIN],
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
