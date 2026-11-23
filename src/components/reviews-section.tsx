"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flag, Loader2, Star, Trash2 } from "lucide-react";
import type { Review } from "@/lib/types";
import { formatDate, initials } from "@/lib/format";

type Props = {
  appId: string;
  reviews: Review[];
  average: number;
  count: number;
  currentUserId?: string;
};

export function ReviewsSection({ appId, reviews, average, count, currentUserId }: Props) {
  const router = useRouter();
  const own = reviews.find((review) => review.user_id === currentUserId);
  const [rating, setRating] = useState(own?.rating ?? 5);
  const [body, setBody] = useState(own?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function saveReview() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/apps/${appId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, body }),
    });
    if (response.ok) router.refresh();
    else setError("Could not save your review.");
    setBusy(false);
  }

  async function deleteReview() {
    if (!window.confirm("Delete your review?")) return;
    await fetch(`/api/apps/${appId}/reviews`, { method: "DELETE" });
    router.refresh();
  }

  async function report(reviewId: string) {
    const reason = window.prompt("Why are you reporting this review?");
    if (!reason) return;
    await fetch(`/api/reviews/${reviewId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    window.alert("Thanks — the admin will review it.");
  }

  return (
    <section className="rise-in rounded-2xl border border-slate-200/80 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Ratings & reviews</h2>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={17}
                className={star <= Math.round(average) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-slate-800">{average.toFixed(1)}</span>
          <span className="text-xs text-slate-400">({count})</span>
        </div>
      </div>

      {currentUserId ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-sm font-medium text-slate-700">
            {own ? "Edit your review" : "Leave a review"}
          </p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                className="rounded p-0.5 transition hover:scale-110"
              >
                <Star
                  size={24}
                  className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                />
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={1000}
            aria-label="Your review"
            className="field mt-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm"
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveReview}
              disabled={busy}
              className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            >
              {busy && <Loader2 size={14} className="spin-slow" />}
              {own ? "Update review" : "Post review"}
            </button>
            {own && (
              <button
                type="button"
                onClick={deleteReview}
                className="btn-soft inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>{" "}
          to rate and review this app.
        </p>
      )}

      <div className="mt-6 divide-y divide-slate-100">
        {reviews.length ? (
          reviews.map((review) => (
            <div key={review.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                {review.author_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.author_avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                    {initials(review.author_name ?? " Student")}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {review.author_username ? (
                      <Link
                        href={`/developers/${review.author_username}`}
                        className="text-sm font-medium text-slate-800 hover:text-indigo-700"
                      >
                        {review.author_name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-slate-800">{review.author_name}</span>
                    )}
                    <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>
                  </div>
                  <div className="mt-1 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={13}
                        className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                      />
                    ))}
                  </div>
                  {review.body && <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.body}</p>}
                </div>
                {currentUserId && review.user_id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => report(review.id)}
                    title="Report review"
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Flag size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-sm text-slate-400">No reviews yet. Be the first!</p>
        )}
      </div>
    </section>
  );
}
