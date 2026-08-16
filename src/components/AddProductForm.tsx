"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/Button";
import { Input, Textarea } from "./ui/Input";
import { Select } from "./ui/Select";
import { CATEGORIES } from "@/types/product";
import { useToast } from "./ui/Toast";

// "Add Product" is ungated for v1 (any logged-in user, no role system —
// see README "What's next"). AI description generation is suggest-then-edit:
// clicking "Generate" only fills the textarea, nothing is saved until the
// whole form is submitted.
export function AddProductForm() {
  const router = useRouter();
  const { show } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function generateDescription() {
    if (!title.trim() || !category) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/ai/describe-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          price: price ? Number(price) : undefined,
          keywords: keywords || undefined,
        }),
      });
      if (res.status === 503) {
        setGenError("AI description generation isn't configured on this server.");
        return;
      }
      if (!res.ok) throw new Error("generation failed");
      const data = await res.json();
      setDescription(data.description);
    } catch {
      setGenError("Something went wrong generating a description.");
    } finally {
      setGenerating(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!title.trim() || !description.trim() || !price) {
      setSubmitError("Title, description, and price are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          price: Number(price),
          stock: Number(stock) || 0,
          image_url: imageUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not create product");
      show(`"${title}" added to the catalog`);
      router.push(`/products/${data.product.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-xl">
      <Input label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <div className="grid grid-cols-2 gap-4">
        <Select label="Category" name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </Select>
        <Input
          label="Price (USD)"
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Stock"
          name="stock"
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
        <Input
          label="Image URL (optional)"
          name="image_url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <Input
        label="Keywords / specs (optional, helps AI generate a better description)"
        name="keywords"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="e.g. waterproof, 20L, laptop sleeve"
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-ink-600">Description</span>
          <button
            type="button"
            onClick={generateDescription}
            disabled={generating || !title.trim()}
            className="text-xs inline-flex items-center gap-1 text-brand hover:text-brand-hover disabled:opacity-50"
          >
            <Sparkles size={12} /> {generating ? "Generating…" : "Generate with AI"}
          </button>
        </div>
        <Textarea
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the product, or generate a suggestion with AI above"
          required
        />
        {genError && <p className="mt-1 text-xs text-danger">{genError}</p>}
      </div>

      {submitError && <p className="text-xs text-danger">{submitError}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create product"}
      </Button>
    </form>
  );
}
