import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';

// 型定義
interface BlogPostIndex {
    filename: string;
    hash: string;
}

// ファイルが存在するか確認
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// ローカルファイルのハッシュ(MD5)を計算する関数
async function calculateLocalHash(filePath: string): Promise<string> {
    try {
        const content = await fs.readFile(filePath);
        // サーバー側と同じアルゴリズム(md5)を使用
        return crypto.createHash('md5').update(content).digest('hex');
    } catch {
        return '';
    }
}

export function fetchBlogContent() {
    return {
        name: 'fetch-blog-content',
        async buildStart() {
            const { BLOG_CONTENT_URL } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), "");
            if (!BLOG_CONTENT_URL) throw new Error('Environment variable BLOG_CONTENT_URL is not defined.');

            const baseUrl = new URL(BLOG_CONTENT_URL);
            const outputDir = path.resolve('src/data/blog');

            console.log(`[fetch-blog] Checking updates from ${baseUrl.href}...`);

            await fs.mkdir(outputDir, { recursive: true });

            try {
                // 1. index.json を取得 (型は BlogPostIndex[])
                const indexUrl = new URL("index.json", baseUrl);
                const indexRes = await fetch(indexUrl.href);
                if (!indexRes.ok) throw new Error(`Failed to fetch index: ${indexRes.status}`);

                const remotePosts: BlogPostIndex[] = await indexRes.json();
                const remoteFilenames = remotePosts.map(p => p.filename);

                // 2. 不要なローカルファイルの削除 (Clean up)
                const localFiles = (await fs.readdir(outputDir)).filter(f => f.match(/\.mdx?$/));
                const filesToDelete = localFiles.filter(f => !remoteFilenames.includes(f));

                for (const file of filesToDelete) {
                    await fs.unlink(path.join(outputDir, file));
                    console.log(`[fetch-blog] Deleted removed post: ${file}`);
                }

                // 3. 各記事の処理
                let updatedCount = 0;
                let skippedCount = 0;

                await Promise.all(remotePosts.map(async (post) => {
                    const savePath = path.join(outputDir, post.filename);

                    // --- ハッシュチェック ---
                    if (await fileExists(savePath)) {
                        const localHash = await calculateLocalHash(savePath);
                        if (localHash === post.hash) {
                            // ハッシュが一致するのでダウンロード自体をスキップ
                            // ※ 画像チェックもスキップするかは要件次第ですが、
                            // Markdownが変わっていなければ画像リンクも変わっていないはずなのでスキップして安全です
                            // (ただし、画像の中身だけ差し替わった場合は検知できません)
                            skippedCount++;
                            return;
                        }
                    }

                    // --- ここから下は「新規」または「変更あり」の場合のみ実行される ---

                    const fileUrl = new URL(post.filename, baseUrl);

                    // コンテンツをダウンロード
                    const res = await fetch(fileUrl.href);
                    if (!res.ok) throw new Error(`Failed to fetch post ${post.filename}: ${res.status}`);
                    const remoteContent = await res.text();

                    // ファイル書き込み
                    await fs.writeFile(savePath, remoteContent);
                    updatedCount++;

                    // --- 画像の処理 (変更があったファイルのみチェックする) ---
                    const imageRegex = /!\[.*?\]\((?!\s*https?:\/\/)(.*?)\)/g;
                    const matches = [...remoteContent.matchAll(imageRegex)];

                    // Extract coverImageUrl from frontmatter
                    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
                    const frontmatterMatch = remoteContent.match(frontmatterRegex);

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

                        await fs.mkdir(localImageDir, { recursive: true });

                        // 画像は「存在チェック」のみで十分（UUID管理などを想定）
                        if (await fileExists(localImagePath)) return;

                        try {
                            const imgRes = await fetch(remoteImageUrl.href);
                            if (imgRes.ok) {
                                const arrayBuffer = await imgRes.arrayBuffer();
                                await fs.writeFile(localImagePath, Buffer.from(arrayBuffer));
                            }
                        } catch (e) {
                            console.warn(`[fetch-blog] Error downloading image: ${relativeImagePath}`);
                        }
                    }));
                }));

                console.log(`[fetch-blog] Sync complete. Updated: ${updatedCount}, Skipped (Matched): ${skippedCount}`);
            }
            catch (err) {
                throw new Error(`Error fetching blog content: ${(err as Error).message}`);
            }
        }
    };
}

