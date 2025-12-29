// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkNotes from 'remark-notes-plugin';
import { loadEnv } from 'vite';
import { fetchBlogContent } from './plugins/fetch-blog';

import partytown from '@astrojs/partytown';

const { SITE_URL, BASE_PATH } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), "");

export default defineConfig({
    site: SITE_URL,
    base: BASE_PATH ? BASE_PATH : '/',
    image: {
        layout: 'full-width'
    },
    markdown: {
        remarkPlugins: [
            remarkGfm,
            remarkBreaks,
            remarkNotes
        ],
    },
    integrations: [sitemap(), partytown({
        config: {
            forward: ["dataLayer.push"],
        },
    })],
    vite: {
        plugins: [
            fetchBlogContent()
        ],
    },
});
