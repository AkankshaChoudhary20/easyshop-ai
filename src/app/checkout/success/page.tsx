import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
      <CheckCircle2 size={48} className="mx-auto text-brand" />
      <h1 className="text-2xl font-semibold">Order placed!</h1>
      <p className="text-sm text-ink-600">Thanks for your order — you can track it on your orders page.</p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Link href="/orders" className="es-btn-primary">
          View orders
        </Link>
        <Link href="/products" className="es-btn-secondary">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
