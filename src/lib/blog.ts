import type { Loader } from "astro/loaders";
import { z } from "astro/zod";
import grayMatter from "gray-matter";

function blogLoader(options: { url: string }): Loader {
    const baseUrl = new URL(options.url);

    return {
        name: "blog-loader",
        load: async ({ store, parseData, logger, renderMarkdown, generateDigest }): Promise<void> => {
            logger.info(`Fetching blog posts from ${baseUrl.href}`);

            try {
                // index.jsonを取得
                const indexUrl = new URL("blog/index.json", baseUrl);
                const indexRes = await fetch(indexUrl.href);
                if (!indexRes.ok) throw new Error(`Failed to fetch blog index: ${indexRes.status} ${indexRes.statusText}`);
                const filenames: string[] = await indexRes.json();

                // ファイル毎に処理
                for (const filename of filenames) {
                    // 各ブログ記事を取得
                    const fileUrl = new URL(`blog/${filename}`, baseUrl);
                    const fileRes = await fetch(fileUrl.href);
                    if (!fileRes.ok) {
                        logger.warn(`Failed to fetch blog post ${filename}: ${fileRes.status} ${fileRes.statusText}`);
                        continue;
                    }
                    let rawContent = await fileRes.text();

                    // ストアをクリア（既存のデータを削除）
                    store.clear();

                    // 画像のURLを絶対パスに変換
                    rawContent = rawContent.replace(
                        /!\[(.*?)\]\((?!\s*https?:\/\/)(.*?)\)/g,
                        `![$1](${baseUrl}/blog/imgs/$2)`
                    );

                    const { data, content } = grayMatter(rawContent);

                    // メタデータを処理
                    const id = data.slug || filename.replace(/\.mdx?$/, "");
                    const publishedAt = new Date(data.publishedAt || Date.now());

                    // 公開日時が未来の場合はスキップ
                    if (publishedAt > new Date()) {
                        logger.info(`Skipping future blog post: ${id}`);
                        continue;
                    }

                    // データをパースしてストアに保存
                    const parsedData = await parseData({
                        id: id,
                        data: {
                            id,
                            publishedAt: publishedAt.toISOString(),
                            isIndexed: data.isIndexed ?? true,
                            title: data.title,
                            description: data.description || undefined,
                            coverImageUrl: data.coverImageUrl || undefined,
                        },
                    });

                    const digest = generateDigest(parsedData);

                    store.set({
                        id,
                        data: parsedData,
                        body: rawContent,
                        digest,
                        rendered: await renderMarkdown(content),
                    });
                }
            }
            catch (error) {
                logger.error(`Error loading blog posts: ${(error as Error).message}`);
            }
        },
        schema: async () => z.object({
            id: z.string(),
            publishedAt: z.string(),
            isIndexed: z.boolean().default(true),
            title: z.string(),
            description: z.string().optional(),
            coverImageUrl: z.string().url().optional(),
        }),
    }
}

export { blogLoader };

