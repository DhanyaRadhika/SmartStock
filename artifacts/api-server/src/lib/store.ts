import { randomUUID } from "node:crypto";

export type Role = "customer" | "admin";
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface User {
  id: string;
  googleId?: string;
  name: string;
  email: string;
  profileImage: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  quantity: number;
  minimumStock: number;
  supplierId: string | null;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  category: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: "increase" | "decrease";
  reason: string;
  createdAt: string;
}

export const categories = [
  "Electronics",
  "Accessories",
  "Office Supplies",
  "Home Appliances",
  "Stationery",
];

const now = new Date().toISOString();
const svgImage = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 520"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><rect width="720" height="520" rx="34" fill="url(#g)"/><circle cx="600" cy="90" r="130" fill="white" opacity=".12"/><circle cx="120" cy="460" r="170" fill="white" opacity=".08"/><text x="52" y="276" fill="white" font-family="Arial,sans-serif" font-size="42" font-weight="700">${label}</text></svg>`,
  )}`;

export const suppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Orbit Wholesale",
    contactPerson: "Anika Rao",
    email: "orders@orbitwholesale.example",
    phone: "+91 98765 12001",
    address: "14 Nehru Place, New Delhi",
    createdAt: now,
  },
  {
    id: "sup-2",
    name: "Northstar Office Co.",
    contactPerson: "Rohan Mehta",
    email: "hello@northstaroffice.example",
    phone: "+91 98765 12002",
    address: "22 Commercial Street, Bengaluru",
    createdAt: now,
  },
  {
    id: "sup-3",
    name: "Home & Co. Supply",
    contactPerson: "Ishita Nair",
    email: "sales@homeandco.example",
    phone: "+91 98765 12003",
    address: "8 Linking Road, Mumbai",
    createdAt: now,
  },
  {
    id: "sup-4",
    name: "Vertex Gadgets",
    contactPerson: "Kabir Shah",
    email: "partners@vertexgadgets.example",
    phone: "+91 98765 12004",
    address: "55 Ritchie Road, Chennai",
    createdAt: now,
  },
  {
    id: "sup-5",
    name: "Paper Trail India",
    contactPerson: "Meera Das",
    email: "team@papertrail.example",
    phone: "+91 98765 12005",
    address: "3 Park Street, Kolkata",
    createdAt: now,
  },
];

const productSeed: Array<Omit<Product, "id" | "createdAt" | "updatedAt">> = [
  {
    name: "Wireless Mouse",
    sku: "ELEC-001",
    category: "Electronics",
    description: "Silent-click wireless mouse with an ergonomic shape and two-year battery life.",
    price: 799,
    quantity: 5,
    minimumStock: 8,
    supplierId: "sup-1",
    image: svgImage("Wireless Mouse", "#0ea5e9"),
  },
  {
    name: "Mechanical Keyboard",
    sku: "ELEC-002",
    category: "Electronics",
    description: "Compact mechanical keyboard with tactile switches and a clean white backlight.",
    price: 3499,
    quantity: 18,
    minimumStock: 6,
    supplierId: "sup-4",
    image: svgImage("Mechanical Keyboard", "#6366f1"),
  },
  {
    name: "USB-C Fast Charge Cable",
    sku: "ACC-001",
    category: "Accessories",
    description: "Braided 100W USB-C cable built for fast charging and dependable daily use.",
    price: 499,
    quantity: 42,
    minimumStock: 12,
    supplierId: "sup-1",
    image: svgImage("USB-C Cable", "#14b8a6"),
  },
  {
    name: "Aluminium Laptop Stand",
    sku: "ACC-002",
    category: "Accessories",
    description: "Foldable laptop stand that raises your screen to a comfortable working height.",
    price: 1899,
    quantity: 9,
    minimumStock: 6,
    supplierId: "sup-4",
    image: svgImage("Laptop Stand", "#f97316"),
  },
  {
    name: "Full HD Webcam",
    sku: "ELEC-003",
    category: "Electronics",
    description: "1080p webcam with auto-light correction and a built-in privacy shutter.",
    price: 2299,
    quantity: 3,
    minimumStock: 5,
    supplierId: "sup-4",
    image: svgImage("Full HD Webcam", "#ec4899"),
  },
  {
    name: "Bluetooth Speaker",
    sku: "ELEC-004",
    category: "Electronics",
    description: "Portable speaker with rich sound, 12-hour playback, and IPX5 splash resistance.",
    price: 2599,
    quantity: 14,
    minimumStock: 5,
    supplierId: "sup-1",
    image: svgImage("Bluetooth Speaker", "#8b5cf6"),
  },
  {
    name: "Hardcover Notebook",
    sku: "STAT-001",
    category: "Stationery",
    description: "Premium 160-page dotted notebook with a durable cloth cover.",
    price: 349,
    quantity: 64,
    minimumStock: 20,
    supplierId: "sup-5",
    image: svgImage("Hardcover Notebook", "#eab308"),
  },
  {
    name: "LED Desk Lamp",
    sku: "HOME-001",
    category: "Home Appliances",
    description: "Adjustable desk lamp with three colour temperatures and USB charging.",
    price: 1499,
    quantity: 11,
    minimumStock: 6,
    supplierId: "sup-3",
    image: svgImage("LED Desk Lamp", "#f59e0b"),
  },
  {
    name: "20,000mAh Power Bank",
    sku: "ELEC-005",
    category: "Electronics",
    description: "High-capacity power bank with dual USB output and a digital battery display.",
    price: 1799,
    quantity: 7,
    minimumStock: 8,
    supplierId: "sup-1",
    image: svgImage("Power Bank", "#10b981"),
  },
  {
    name: "Noise Cancelling Headphones",
    sku: "ELEC-006",
    category: "Electronics",
    description: "Over-ear headphones with hybrid noise cancellation and all-day comfort.",
    price: 4999,
    quantity: 22,
    minimumStock: 6,
    supplierId: "sup-4",
    image: svgImage("Headphones", "#0f766e"),
  },
  {
    name: "Ergonomic Gel Pen Set",
    sku: "STAT-002",
    category: "Stationery",
    description: "A set of twelve smooth-writing gel pens in a considered palette of everyday colours.",
    price: 249,
    quantity: 35,
    minimumStock: 12,
    supplierId: "sup-5",
    image: svgImage("Gel Pen Set", "#06b6d4"),
  },
  {
    name: "Cable Management Kit",
    sku: "ACC-003",
    category: "Accessories",
    description: "A tidy desk starter kit with clips, sleeves, and reusable cable ties.",
    price: 599,
    quantity: 2,
    minimumStock: 6,
    supplierId: "sup-2",
    image: svgImage("Cable Kit", "#64748b"),
  },
];

export const products: Product[] = productSeed.map((product, index) => ({
  ...product,
  id: `prod-${index + 1}`,
  createdAt: now,
  updatedAt: now,
}));

export const orders: Order[] = [
  {
    id: "ord-1001",
    customerName: "Priya Menon",
    customerEmail: "priya@example.com",
    customerPhone: "+91 90000 10001",
    address: "12 Residency Road, Bengaluru",
    items: [
      { productId: "prod-2", productName: "Mechanical Keyboard", price: 3499, quantity: 1, subtotal: 3499, category: "Electronics" },
      { productId: "prod-7", productName: "Hardcover Notebook", price: 349, quantity: 2, subtotal: 698, category: "Stationery" },
    ],
    totalAmount: 4197,
    status: "delivered",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "ord-1002",
    customerName: "Arjun Kapoor",
    customerEmail: "arjun@example.com",
    customerPhone: "+91 90000 10002",
    address: "8 Golf Course Road, Gurugram",
    items: [
      { productId: "prod-5", productName: "Full HD Webcam", price: 2299, quantity: 2, subtotal: 4598, category: "Electronics" },
    ],
    totalAmount: 4598,
    status: "processing",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "ord-1003",
    customerName: "Neha Kulkarni",
    customerEmail: "neha@example.com",
    customerPhone: "+91 90000 10003",
    address: "41 FC Road, Pune",
    items: [
      { productId: "prod-1", productName: "Wireless Mouse", price: 799, quantity: 2, subtotal: 1598, category: "Electronics" },
      { productId: "prod-3", productName: "USB-C Fast Charge Cable", price: 499, quantity: 3, subtotal: 1497, category: "Accessories" },
    ],
    totalAmount: 3095,
    status: "confirmed",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export const store = {
  suppliers,
  products,
  orders,
  adjustments: [] as InventoryAdjustment[],
  users: [] as User[],
  getSupplier(id: string) {
    return suppliers.find((supplier) => supplier.id === id) ?? null;
  },
  getProduct(id: string) {
    return products.find((product) => product.id === id) ?? null;
  },
  getOrder(id: string) {
    return orders.find((order) => order.id === id) ?? null;
  },
  productStatus(product: Product): StockStatus {
    if (product.quantity === 0) return "out-of-stock";
    if (product.quantity <= product.minimumStock) return "low-stock";
    return "in-stock";
  },
  publicProduct(product: Product) {
    return {
      ...product,
      supplier: product.supplierId ? this.getSupplier(product.supplierId) : null,
      stockStatus: this.productStatus(product),
    };
  },
  publicOrder(order: Order) {
    return {
      ...order,
      items: order.items.map(({ category: _category, ...item }) => item),
    };
  },
  inventoryItem(product: Product) {
    return {
      product: this.publicProduct(product),
      currentStock: product.quantity,
      minimumStock: product.minimumStock,
      stockStatus: this.productStatus(product),
    };
  },
  createId(prefix: string) {
    return `${prefix}-${randomUUID().slice(0, 8)}`;
  },
};