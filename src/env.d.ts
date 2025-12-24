interface ImportMetaEnv {
    readonly SITE_URL: string;
    readonly BASE_PATH?: string;
    // readonly IMAGE_DOMAIN: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
