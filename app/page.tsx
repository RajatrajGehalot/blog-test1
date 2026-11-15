import { Suspense } from "react";
import { client } from "@/sanity/client";
import { defineQuery } from "next-sanity";
import Link from "next/link";
import { urlFor } from "@/sanity/image";

const POSTS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(_createdAt desc){
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    image {
      asset->{
        _id,
        url
      },
      alt
    }
  }
`);

const options = { next: { revalidate: 30 } };

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Visual gradient backgrounds for banner cards when an image is not uploaded
const GRADIENTS = [
  "from-violet-600 via-indigo-600 to-blue-600",
  "from-blue-600 via-teal-600 to-emerald-600",
  "from-rose-600 via-pink-600 to-purple-600",
  "from-amber-500 via-orange-600 to-red-600",
];

async function PostsList() {
  const posts = await client.fetch(POSTS_QUERY, {}, options);

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-24 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">No blog posts found</h3>
        <p className="text-zinc-500 max-w-sm mx-auto mb-6">
          Publish your first story in Sanity Studio to see it featured here.
        </p>
        <a
          href="http://localhost:3333"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          Open Sanity Studio →
        </a>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <div className="space-y-14">
      {/* Featured Top Banner */}
      {featured && featured.slug?.current && (
        <section aria-label="Featured Story">
          <div className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Featured Article
          </div>
          <Link
            href={`/${featured.slug.current}`}
            className="group relative block overflow-hidden rounded-3xl bg-zinc-900 text-white shadow-2xl transition-all duration-300 hover:shadow-blue-500/10 hover:-translate-y-1"
          >
            {/* Background Image or Gradient */}
            {featured.image?.asset?.url ? (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-60"
                style={{
                  backgroundImage: `url(${urlFor(featured.image)?.width(1600).height(900).auto("format").fit("crop").url()})`,
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-950 opacity-90 transition-transform duration-700 group-hover:scale-105" />
            )}

            {/* Dark vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col justify-end min-h-[420px] md:min-h-[480px]">
              <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-medium text-zinc-300">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white">
                  Editorial Pick
                </span>
                {featured.publishedAt && (
                  <span>{formatDate(featured.publishedAt)}</span>
                )}
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 group-hover:text-blue-300 transition-colors">
                {featured.title}
              </h2>

              {featured.excerpt && (
                <p className="text-zinc-200 text-base sm:text-lg line-clamp-3 max-w-3xl mb-6">
                  {featured.excerpt}
                </p>
              )}

              <div className="inline-flex items-center gap-2 font-semibold text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
                Read Article
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Grid of All Post Banners */}
      <section aria-label="All Posts">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Recent Stories</h2>
            <p className="text-sm text-zinc-500 mt-1">Click any banner to open the full blog post</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {posts.length} {posts.length === 1 ? "Post" : "Posts"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post, idx) => {
            if (!post.slug?.current) return null;
            const gradient = GRADIENTS[idx % GRADIENTS.length];
            const hasImage = Boolean(post.image?.asset?.url);

            return (
              <Link
                key={post._id}
                href={`/${post.slug.current}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-zinc-900 text-white min-h-[340px] shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Background visual banner */}
                {hasImage ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-50 transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${urlFor(post.image)?.width(1000).height(600).auto("format").fit("crop").url()})`,
                    }}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80 transition-transform duration-500 group-hover:scale-105`}
                  />
                )}

                {/* Dark gradient overlay for readable text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Top info badge */}
                <div className="relative z-10 p-6 flex items-center justify-between">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-zinc-200 border border-white/10">
                    Story #{idx + 1}
                  </span>
                  {post.publishedAt && (
                    <span className="text-xs text-zinc-300 font-medium">
                      {formatDate(post.publishedAt)}
                    </span>
                  )}
                </div>

                {/* Bottom text banner */}
                <div className="relative z-10 p-6 sm:p-8">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 group-hover:text-blue-300 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {post.excerpt && (
                    <p className="text-sm text-zinc-300 line-clamp-2 mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                    Read Story
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      {/* Top Navigation */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-blue-500/30">
              B
            </span>
            <span>Blog Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:3333"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              Sanity Studio ↗
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-12 px-6">
        <Suspense
          fallback={
            <div className="space-y-10 animate-pulse">
              <div className="h-[420px] rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-72 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-72 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          }
        >
          <PostsList />
        </Suspense>
      </main>
    </div>
  );
}
