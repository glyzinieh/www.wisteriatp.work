// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import sitemap from '@astrojs/sitemap';

// const { IMAGE_DOMAIN } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), "");
const { SITE_URL, BASE_PATH } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), "");

// https://astro.build/config
export default defineConfig({
    site: SITE_URL,
    base: BASE_PATH ? BASE_PATH : '/',

    image: {
        layout: 'constrained',
        //     domains: [IMAGE_DOMAIN],
    },

    integrations: [sitemap()]
});
