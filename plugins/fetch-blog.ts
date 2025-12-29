import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';

export function fetchBlogContent() {
    return {
        name: 'fetch-blog-content',
        async buildStart() {
            const { BLOG_CONTENT_URL } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
            if (!BLOG_CONTENT_URL) {
                console.warn('BLOG_CONTENT_URL is not defined in environment variables.');
                return;
            }

            const baseUrl = new URL(BLOG_CONTENT_URL);
            const outputDir = path.resolve('src/data/blog');

            console.log(`[fetch-blog] Fetching blog content from ${baseUrl.href}...`);


            const entries = await fs.readdir(outputDir, { withFileTypes: true });
            await Promise.all(entries
                .filter(entry => entry.name !== '.gitignore')
                .map(entry => fs.rm(path.join(outputDir, entry.name), { recursive: true, force: true }))
            );
            await fs.mkdir(outputDir, { recursive: true });

            try {
                const indexUrl = new URL('index.json', baseUrl);
                const indexRes = await fetch(indexUrl.href);
                if (!indexRes.ok) throw new Error(`Failed to fetch index.json: ${indexRes.statusText}`);
                const filenames = await indexRes.json();

                await Promise.all(filenames.map(async (filename: string) => {
                    const fileUrl = new URL(filename, baseUrl);
                    const res = await fetch(fileUrl.href);
                    if (!res.ok) {
                        console.warn(`[fetch-blog] Failed to fetch ${filename}: ${res.statusText}`);
                        return;
                    }

                    const content = await res.text();

                    const filePath = path.join(outputDir, filename);

                    // Extract images from markdown content
                    const imageRegex = /!\[.*?\]\((?!\s*https?:\/\/)(.*?)\)/g;
                    const matches = [...content.matchAll(imageRegex)];

                    // Extract coverImageUrl from frontmatter
                    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
                    const frontmatterMatch = content.match(frontmatterRegex);

                    const imagePaths: string[] = matches.map(m => m[1]);

                    if (frontmatterMatch) {
                        const frontmatter = frontmatterMatch[1];
                        const coverImageMatch = frontmatter.match(/coverImageUrl:\s*['"]?([^'"\n]+)['"]?/);
                        if (coverImageMatch && !coverImageMatch[1].match(/^\s*https?:\/\//)) {
                            imagePaths.push(coverImageMatch[1].trim());
                        }
                    }

                    await Promise.all(imagePaths.map(async (relativeImagePath) => {
                        const remoteImageUrl = new URL(relativeImagePath, baseUrl);

                        const localImagePath = path.join(outputDir, relativeImagePath);
                        const localImageDir = path.dirname(localImagePath);

                        try {
                            await fs.mkdir(localImageDir, { recursive: true });

                            const imgRes = await fetch(remoteImageUrl.href);
                            if (!imgRes.ok) {
                                console.warn(`[fetch-blog] Failed to fetch image ${relativeImagePath}: ${imgRes.statusText}`);
                                return;
                            }
                            const arrayBuffer = await imgRes.arrayBuffer();
                            await fs.writeFile(localImagePath, Buffer.from(arrayBuffer));
                        }
                        catch (err) {
                            console.warn(`[fetch-blog] Error fetching image ${relativeImagePath}: ${(err as Error).message}`);
                        }
                    }));
                    await fs.writeFile(filePath, content);
                }));
                console.log(`[fetch-blog] Successfully downloaded ${filenames.length} blog files.`);
            }
            catch (err) {
                console.error(`[fetch-blog] Error fetching blog content: ${(err as Error).message}`);
            }
        }
    };
}

