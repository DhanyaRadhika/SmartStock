import { Injectable } from "@angular/core";
import { Product } from "./models";
export interface CartLine { product: Product; quantity: number; }

@Injectable({ providedIn: "root" })
export class CartService {
  private key = "smartstock-cart";
  lines(): CartLine[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.key) || "[]");
      return Array.isArray(parsed) ? parsed.filter((line) => line?.product?.id && line.quantity > 0) : [];
    } catch {
      return [];
    }
  }
  count() { return this.lines().reduce((total, line) => total + line.quantity, 0); }
  total() { return this.lines().reduce((total, line) => total + line.product.price * line.quantity, 0); }
  add(product: Product) {
    const lines = this.lines();
    const existing = lines.find((line) => line.product.id === product.id);
    if (existing) existing.quantity = Math.min(product.quantity, existing.quantity + 1);
    else if (product.quantity > 0) lines.push({ product, quantity: 1 });
    this.save(lines);
  }
  setQuantity(productId: string, quantity: number) {
    const lines = this.lines();
    const line = lines.find((item) => item.product.id === productId);
    if (!line) return;
    if (quantity <= 0) this.save(lines.filter((item) => item.product.id !== productId));
    else line.quantity = Math.min(line.product.quantity, quantity);
    this.save(lines);
  }
  remove(productId: string) { this.save(this.lines().filter((line) => line.product.id !== productId)); }
  clear() { localStorage.removeItem(this.key); }
  private save(lines: CartLine[]) { localStorage.setItem(this.key, JSON.stringify(lines.filter((line) => line.quantity > 0))); }
}