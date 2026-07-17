import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_BUCKETS = new Set(["product-images", "review-images", "avatars"]);

function contentTypeForPath(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function isSafeStoragePath(path: string) {
  return !!path && path.length <= 700 && !path.startsWith("/") && !path.includes("..") && !/[\u0000-\u001f]/.test(path);
}

export const Route = createFileRoute("/api/public/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const bucket = url.searchParams.get("bucket") ?? "";
        const path = url.searchParams.get("path") ?? "";

        if (!ALLOWED_BUCKETS.has(bucket) || !isSafeStoragePath(path)) {
          return new Response("Invalid image", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);

        if (error || !data) {
          return new Response("Image not found", { status: 404 });
        }

        return new Response(data, {
          headers: {
            "Content-Type": data.type || contentTypeForPath(path),
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});