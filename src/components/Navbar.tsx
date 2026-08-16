"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, X, Plus, Package, LogOut } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { CartDrawer } from "./CartDrawer";
import { CATEGORIES } from "@/types/product";

export function Navbar() {
  const { count } = useCart();
  const { user, logout, loading } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <button
            className="sm:hidden text-ink-600"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className="font-semibold text-lg text-ink-950 shrink-0">
            Easy<span className="text-brand">Shop</span>
            <span className="ml-1 align-top text-[0.5em] font-bold text-brand-muted">AI</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-sm text-ink-600">
            <Link href="/products" className="hover:text-ink-950">All products</Link>
            {CATEGORIES.map((c) => (
              <Link key={c} href={`/categories/${c}`} className="capitalize hover:text-ink-950">
                {c}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {!loading && (
              user ? (
                <div className="hidden sm:flex items-center gap-3 text-sm">
                  <Link href="/products/add" className="inline-flex items-center gap-1 text-ink-600 hover:text-ink-950">
                    <Plus size={14} /> Add product
                  </Link>
                  <Link href="/orders" className="inline-flex items-center gap-1 text-ink-600 hover:text-ink-950">
                    <Package size={14} /> Orders
                  </Link>
                  <span className="text-ink-400">|</span>
                  <span className="text-ink-950">{user.name}</span>
                  <button onClick={() => logout()} className="text-ink-600 hover:text-ink-950" aria-label="Sign out">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-3 text-sm">
                  <Link href="/login" className="text-ink-600 hover:text-ink-950">Log in</Link>
                  <Link href="/register" className="es-btn-primary !h-8 !px-3">Sign up</Link>
                </div>
              )
            )}

            <button
              className="relative h-9 w-9 inline-flex items-center justify-center rounded hover:bg-ink-50"
              onClick={() => setCartOpen(true)}
              aria-label={`Cart (${count} items)`}
            >
              <ShoppingCart size={18} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-brand text-white text-[10px] flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="sm:hidden border-t border-ink-100 px-4 py-3 flex flex-col gap-2 text-sm">
            <Link href="/products" onClick={() => setMenuOpen(false)}>All products</Link>
            {CATEGORIES.map((c) => (
              <Link key={c} href={`/categories/${c}`} onClick={() => setMenuOpen(false)} className="capitalize">
                {c}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/products/add" onClick={() => setMenuOpen(false)}>Add product</Link>
                <Link href="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}>Sign up</Link>
              </>
            )}
          </nav>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
