'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { products } from '@/data/products';
import { useCart, MAX_QTY_PER_PRODUCT } from '@/components/cart/CartProvider';

export function CartSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const { quantities, setQuantity, addOne, clearCart, totalItems, totalPrice } = useCart();

  const cartItems = products.filter((product) => (quantities[product.id] ?? 0) > 0);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setConfirmingClear(false);
  };

  const handleClearCart = () => {
    clearCart();
    setConfirmingClear(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open cart" className="relative">
          <ShoppingBag className="size-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton
        aria-describedby={undefined}
        className="flex !w-[85vw] max-w-[380px] flex-col rounded-l-2xl border-l border-border bg-card p-0"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-border">
          <SheetTitle className="font-serif text-xl">Your Cart</SheetTitle>
          {cartItems.length > 0 && !confirmingClear && (
            <button
              type="button"
              onClick={() => setConfirmingClear(true)}
              className="mr-6 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              Clear cart
            </button>
          )}
        </SheetHeader>

        {confirmingClear && (
          <div className="flex items-center justify-between gap-3 border-b border-border bg-destructive/5 px-5 py-3">
            <p className="text-xs font-medium text-destructive">Remove all items from your cart?</p>
            <div className="flex shrink-0 gap-2">
              <Button type="button" size="xs" variant="outline" onClick={() => setConfirmingClear(false)}>
                Cancel
              </Button>
              <Button type="button" size="xs" variant="destructive" onClick={handleClearCart}>
                Clear
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <Button asChild size="sm" variant="outline" onClick={() => setIsOpen(false)}>
                <Link href="/menu">Browse Menu</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cartItems.map((product) => {
                const qty = quantities[product.id] ?? 0;
                const atMax = qty >= MAX_QTY_PER_PRODUCT;
                return (
                  <div key={product.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${product.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-1 py-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="rounded-full"
                          onClick={() => setQuantity(product.id, qty - 1)}
                          aria-label={`Decrease ${product.name} quantity`}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="min-w-5 text-center text-sm font-semibold tabular-nums text-foreground">
                          {qty}
                        </span>
                        <Button
                          type="button"
                          variant="default"
                          size="icon-sm"
                          className="rounded-full"
                          disabled={atMax}
                          onClick={() => addOne(product.id)}
                          aria-label={`Increase ${product.name} quantity`}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setQuantity(product.id, 0)}
                        aria-label={`Remove ${product.name} from cart`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    {atMax && (
                      <p className="text-right text-xs text-muted-foreground">
                        Max {MAX_QTY_PER_PRODUCT} per order
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <SheetFooter className="border-t border-border">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <Button asChild size="lg" className="w-full" onClick={() => setIsOpen(false)}>
              <Link href="/order">Checkout</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
