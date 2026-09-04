import mongoose, { Schema, type ClientSession } from "mongoose";
import { randomUUID } from "node:crypto";
import {
  suppliers as supplierSeed,
  products as productSeed,
  orders as orderSeed,
} from "./store";
import type {
  User,
  Supplier,
  Product,
  Order,
  InventoryAdjustment,
  StockStatus,
  OrderStatus,
} from "./store";

const requiredUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is required.");
  return uri;
};

const opts = { timestamps: true, versionKey: false } as const;
const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    googleId: { type: String, index: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    profileImage: String,
    role: { type: String, enum: ["customer", "admin"], required: true },
  },
  opts,
);
const supplierSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    createdAt: String,
  },
  opts,
);
const productSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, min: 0, required: true },
    quantity: { type: Number, min: 0, required: true },
    minimumStock: { type: Number, min: 0, required: true },
    supplierId: { type: String, default: null },
    image: { type: String, required: true },
  },
  opts,
);
const itemSchema = new Schema(
  {
    productId: String,
    productName: String,
    price: Number,
    quantity: { type: Number, min: 1 },
    subtotal: Number,
    category: String,
  },
  { _id: false },
);
const orderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    address: { type: String, required: true },
    items: { type: [itemSchema], required: true },
    totalAmount: { type: Number, min: 0, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      required: true,
    },
  },
  opts,
);
const adjustmentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    productId: String,
    productName: String,
    quantity: Number,
    type: { type: String, enum: ["increase", "decrease"] },
    reason: String,
  },
  opts,
);
const sessionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true, versionKey: false },
);
export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);
export const SupplierModel =
  mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema);
export const ProductModel =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export const OrderModel =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
export const InventoryAdjustmentModel =
  mongoose.models.InventoryAdjustment ||
  mongoose.model("InventoryAdjustment", adjustmentSchema);
export const SessionModel =
  mongoose.models.Session || mongoose.model("Session", sessionSchema);

export async function connectMongo() {
  await mongoose.connect(requiredUri(), { serverSelectionTimeoutMS: 10000 });
  if ((await SupplierModel.countDocuments()) === 0)
    await SupplierModel.insertMany(supplierSeed);
  if ((await ProductModel.countDocuments()) === 0)
    await ProductModel.insertMany(productSeed);
  if ((await OrderModel.countDocuments()) === 0)
    await OrderModel.insertMany(orderSeed);
}
export async function disconnectMongo() {
  await mongoose.disconnect();
}
export const id = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;
const plain = <T>(v: any): T => {
  const value = v?.toObject ? v.toObject() : v;
  if (!value || typeof value !== "object") return value as T;
  const { _id: _ignoredId, __v: _ignoredVersion, ...safe } = value;
  return safe as T;
};
export function status(p: Product): StockStatus {
  return p.quantity === 0
    ? "out-of-stock"
    : p.quantity <= p.minimumStock
      ? "low-stock"
      : "in-stock";
}
export async function publicProduct(p: Product) {
  const supplier = p.supplierId
    ? plain<Supplier>(await SupplierModel.findOne({ id: p.supplierId }))
    : null;
  return { ...p, supplier, stockStatus: status(p) };
}
export function publicOrder(o: Order) {
  return { ...o, items: o.items.map(({ category: _c, ...item }) => item) };
}
export async function inventoryItem(p: Product) {
  return {
    product: await publicProduct(p),
    currentStock: p.quantity,
    minimumStock: p.minimumStock,
    stockStatus: status(p),
  };
}
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
) {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
export { plain };
