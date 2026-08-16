"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AddProductForm } from "@/components/AddProductForm";

// Ungated for v1 — any logged-in user can add a product (no role system yet,
// see README "What's next"). Only requires being signed in.
export default function AddProductPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="max-w-xl mx-auto px-4 py-8 text-sm text-ink-400">Loading…</div>;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-sm text-ink-600">
          You need to{" "}
          <Link href="/login" className="text-brand hover:text-brand-hover">
            log in
          </Link>{" "}
          to add a product.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-semibold">Add a product</h1>
      <AddProductForm />
    </div>
  );
}
