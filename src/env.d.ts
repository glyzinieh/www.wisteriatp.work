interface ImportMetaEnv {
    readonly SITE_URL: string;
    readonly BASE_PATH?: string;
    readonly BLOG_CONTENT_DOMAIN: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
