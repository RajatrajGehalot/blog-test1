import { Suspense } from "react";
import { PortableText, defineQuery, type PortableTextComponents } from "next-sanity";
import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/image";
import Link from "next/link";
import Image from "next/image";

const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    body,
    image {
      asset->{
        _id,
        url
      },
      alt
    }
  }
`);

const SLUGS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)]{ "slug": slug.current }
`);

export async function generateStaticParams() {
  const posts = await client
    .withConfig({ useCdn: false })
    .fetch(SLUGS_QUERY);
  return posts;
}

const options = { next: { revalidate: 30 } };

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Custom Portable Text components for rich styling
const ptComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-3xl sm:text-4xl font-extrabold mt-10 mb-4 tracking-tight text-zinc-900 dark:text-zinc-50">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl sm:text-3xl font-bold mt-8 mb-4 tracking-tight text-zinc-900 dark:text-zinc-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl sm:text-2xl font-semibold mt-6 mb-3 text-zinc-900 dark:text-zinc-100">
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="text-base sm:text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 mb-6">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-1 italic my-6 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 rounded-r-lg">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside space-y-2 mb-6 text-zinc-700 dark:text-zinc-300">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside space-y-2 mb-6 text-zinc-700 dark:text-zinc-300">
        {children}
      </ol>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const rel = !value.href?.startsWith("/") ? "noreferrer noopener" : undefined;
      return (
        <a
          href={value.href}
          rel={rel}
          className="text-blue-600 dark:text-blue-400 font-medium underline underline-offset-4 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {children}
        </a>
      );
    },
  },
};

async function PostContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug }, options);

  if (!post) return notFound();

  const hasImage = Boolean(post.image?.asset?.url);
  const imageUrl = hasImage
    ? urlFor(post.image)?.width(1600).height(900).auto("format").fit("crop").url()
    : null;

  return (
    <article className="max-w-4xl mx-auto py-10 px-6">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to all stories
        </Link>
      </div>

      {/* Hero Header Banner */}
      <header className="mb-10">
        <div className="flex items-center gap-3 text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400 mb-4">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
            Article
          </span>
          {post.publishedAt && (
            <span className="text-zinc-500">{formatDate(post.publishedAt)}</span>
          )}
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            {post.excerpt}
          </p>
        )}
      </header>

      {/* Cover Image Banner (if available) */}
      {imageUrl && (
        <div className="mb-12 overflow-hidden rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 relative aspect-[16/9] w-full">
          <Image
            src={imageUrl}
            alt={post.image?.alt || post.title || "Blog cover"}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 896px"
          />
        </div>
      )}

      {/* Article Body */}
      <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
        {Array.isArray(post.body) && post.body.length > 0 ? (
          <PortableText value={post.body} components={ptComponents} />
        ) : (
          <p className="text-zinc-500 italic">No content available for this post yet.</p>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          ← All Stories
        </Link>
        <a
          href="http://localhost:3333"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-blue-600 transition-colors"
        >
          Edit this post in Sanity Studio ↗
        </a>
      </div>
    </article>
  );
}

export default function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-50">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-blue-500/30">
              B
            </span>
            <span>Blog Hub</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            ← Back
          </Link>
        </div>
      </nav>

      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto py-12 px-6 space-y-6 animate-pulse">
            <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="h-16 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            <div className="h-96 w-full bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
          </div>
        }
      >
        <PostContent params={params} />
      </Suspense>
    </div>
  );
}
