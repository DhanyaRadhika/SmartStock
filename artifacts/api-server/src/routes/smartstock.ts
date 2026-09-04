// Database-backed handlers intentionally share Express's broad response types.
// @ts-nocheck
import { Router, type IRouter } from "express";
import {
  AdminLoginBody,
  AdjustInventoryBody,
  AdjustInventoryParams,
  CreateOrderBody,
  CreateProductBody,
  CreateSupplierBody,
  DeleteProductParams,
  DeleteSupplierParams,
  GetOrderParams,
  GetProductParams,
  ListProductsQueryParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateProductBody,
  UpdateProductParams,
  UpdateSupplierBody,
  UpdateSupplierParams,
} from "@workspace/api-zod";
import {
  adminCredentials,
  clearSession,
  currentUser,
  exchangeGoogleCode,
  frontendRedirect,
  getGoogleRedirect,
  googleConfigured,
  requireRole,
  setSession,
  userResponse,
  verifyAdminPassword,
} from "../lib/auth";
import { logger } from "../lib/logger";
import {
  InventoryAdjustmentModel,
  OrderModel,
  ProductModel,
  SupplierModel,
  UserModel,
  inventoryItem,
  plain,
  publicOrder,
  publicProduct,
  status,
  withTransaction,
  id,
} from "../lib/mongo";

const router: IRouter = Router();
const q = (value: any) => plain<any>(value);

router.get("/auth/session", async (req, res) => {
  const user = await currentUser(req);
  res.json({
    authenticated: Boolean(user),
    user: userResponse(user),
    googleConfigured,
  });
});

router.get("/auth/google", (_req, res) => {
  if (!googleConfigured)
    return res.status(503).json({
      error:
        "Google Sign-In is not configured yet. Add the Google OAuth settings to continue.",
    });
  return res.redirect(getGoogleRedirect());
});

router.get("/auth/google/callback", async (req, res) => {
  if (!googleConfigured)
    return res.redirect(frontendRedirect("/login?error=google-not-configured"));
  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code)
    return res.redirect(frontendRedirect("/login?error=google-failed"));
  try {
    const profile = await exchangeGoogleCode(code);
    if (!profile.email || !profile.sub)
      throw new Error("Google profile incomplete");
    let user = q(
      await UserModel.findOne({
        $or: [{ googleId: profile.sub }, { email: profile.email }],
      }),
    );
    if (user) {
      await UserModel.updateOne(
        { id: user.id },
        {
          $set: {
            googleId: profile.sub,
            name: profile.name || user.name,
            profileImage: profile.picture || user.profileImage,
          },
        },
      );
      user = q(await UserModel.findOne({ id: user.id }));
    } else {
      user = await UserModel.create({
        id: id("user"),
        googleId: profile.sub,
        name: profile.name || profile.email.split("@")[0],
        email: profile.email,
        profileImage: profile.picture || null,
        role: "customer",
      });
    }
    await setSession(res, user.id);
    return res.redirect(frontendRedirect("/customer/products"));
  } catch (err) {
    logger.error({ err }, "Google callback failed during code exchange");
    return res.redirect(frontendRedirect("/login?error=google-failed"));
  }
});

router.post("/auth/admin/login", async (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  const credentials = adminCredentials();
  const emailMatches =
    parsed.success &&
    Boolean(credentials.email) &&
    parsed.data.email.trim().toLowerCase() === credentials.email.toLowerCase();
  const passwordValid = async () => {
    // If a plain dev password is set, allow it (dev only). Otherwise verify scrypt hash.
    if (credentials.plain && process.env.NODE_ENV !== "production") {
      return parsed.data.password === credentials.plain;
    }
    if (!credentials.hash) return false;
    return await verifyAdminPassword(parsed.data.password, credentials.hash);
  };
  const valid = emailMatches && (await passwordValid());
  if (!valid)
    return res.status(401).json({
      error: parsed.success
        ? "Those admin credentials are not valid."
        : "Enter a valid admin email and password.",
    });
  let user = q(
    await UserModel.findOne({ email: credentials.email, role: "admin" }),
  );
  if (!user)
    user = q(
      await UserModel.create({
        id: "admin-account",
        name: "SmartStock Admin",
        email: credentials.email,
        profileImage: null,
        role: "admin",
      }),
    );
  await setSession(res, user.id);
  return res.json({
    authenticated: true,
    user: userResponse(user),
    googleConfigured,
  });
});

router.post("/auth/logout", async (req, res) => {
  await clearSession(req, res);
  res.status(204).send();
});

router.get("/products", async (req, res) => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid product filters." });
  const filters: any = {};
  if (parsed.data.category) filters.category = parsed.data.category;
  let products = await ProductModel.find(filters);
  if (parsed.data.search) {
    const term = parsed.data.search.toLowerCase();
    products = products.filter(
      (product: any) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term),
    );
  }
  if (parsed.data.sort === "price-asc")
    products.sort((a: any, b: any) => a.price - b.price);
  if (parsed.data.sort === "price-desc")
    products.sort((a: any, b: any) => b.price - a.price);
  if (parsed.data.sort === "newest")
    products.sort((a: any, b: any) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
  return res.json(
    await Promise.all(products.map((product) => publicProduct(q(product)))),
  );
});

router.get("/products/:id", async (req, res) => {
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid product id." });
  const product = q(await ProductModel.findOne({ id: parsed.data.id }));
  if (!product) return res.status(404).json({ error: "Product not found." });
  return res.json(await publicProduct(product));
});

router.post("/products", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "Check the product fields and try again." });
  if (await ProductModel.exists({ sku: parsed.data.sku }))
    return res.status(409).json({ error: "SKU already exists." });
  if (
    parsed.data.supplierId &&
    !(await SupplierModel.exists({ id: parsed.data.supplierId }))
  )
    return res.status(400).json({ error: "Selected supplier was not found." });
  const product = q(
    await ProductModel.create({
      ...parsed.data,
      supplierId: parsed.data.supplierId ?? null,
      id: id("prod"),
    }),
  );
  return res.status(201).json(await publicProduct(product));
});

router.put("/products/:id", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const params = UpdateProductParams.safeParse(req.params);
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!params.success || !parsed.success)
    return res
      .status(400)
      .json({ error: "Check the product fields and try again." });
  if (
    await ProductModel.exists({
      sku: parsed.data.sku,
      id: { $ne: params.data.id },
    })
  )
    return res.status(409).json({ error: "SKU already exists." });
  if (
    parsed.data.supplierId &&
    !(await SupplierModel.exists({ id: parsed.data.supplierId }))
  )
    return res.status(400).json({ error: "Selected supplier was not found." });
  const product = q(
    await ProductModel.findOneAndUpdate(
      { id: params.data.id },
      { ...parsed.data, supplierId: parsed.data.supplierId ?? null },
      { new: true },
    ),
  );
  if (!product) return res.status(404).json({ error: "Product not found." });
  return res.json(await publicProduct(product));
});

router.delete("/products/:id", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const parsed = DeleteProductParams.safeParse(req.params);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid product id." });
  if (!(await ProductModel.deleteOne({ id: parsed.data.id })).deletedCount)
    return res.status(404).json({ error: "Product not found." });
  return res.status(204).send();
});

router.get("/orders", async (req, res) => {
  const user = await requireRole(req, res);
  if (!user) return;
  const orders = await OrderModel.find(
    user.role === "admin" ? {} : { customerEmail: user.email },
  ).sort({ createdAt: -1 });
  return res.json(orders.map((order) => publicOrder(q(order))));
});

router.post("/orders", async (req, res) => {
  const user = await requireRole(req, res, "customer");
  if (!user) return;
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({
      error: "Complete the delivery details before placing the order.",
    });
  const grouped = new Map<string, number>();
  for (const item of parsed.data.items)
    grouped.set(
      item.productId,
      (grouped.get(item.productId) || 0) + item.quantity,
    );
  try {
    const order = await withTransaction(async (session) => {
      const products: any[] = [];
      for (const [productId, quantity] of grouped) {
        const product = q(
          await ProductModel.findOneAndUpdate(
            { id: productId, quantity: { $gte: quantity } },
            { $inc: { quantity: -quantity } },
            { new: true, session },
          ),
        );
        if (!product) throw new Error("stock");
        products.push({ product, quantity });
      }
      const items = products.map(({ product, quantity }) => ({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
        subtotal: Number((product.price * quantity).toFixed(2)),
        category: product.category,
      }));
      return q(
        (
          await OrderModel.create(
            [
              {
                id: id("ord"),
                customerName: parsed.data.customerName,
                customerEmail: user.email,
                customerPhone: parsed.data.customerPhone,
                address: parsed.data.address,
                items,
                totalAmount: Number(
                  items
                    .reduce((sum, item) => sum + item.subtotal, 0)
                    .toFixed(2),
                ),
                status: "pending",
              },
            ],
            { session },
          )
        )[0],
      );
    });
    return res.status(201).json(publicOrder(order));
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error && error.message === "stock"
          ? "One of the products in your bag is no longer available."
          : "Unable to place the order.",
    });
  }
});

router.get("/orders/:id", async (req, res) => {
  const user = await requireRole(req, res);
  if (!user) return;
  const parsed = GetOrderParams.safeParse(req.params);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid order id." });
  const order = q(await OrderModel.findOne({ id: parsed.data.id }));
  if (
    !order ||
    (user.role === "customer" && order.customerEmail !== user.email)
  )
    return res.status(404).json({ error: "Order not found." });
  return res.json(publicOrder(order));
});

router.put("/orders/:id/status", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const params = UpdateOrderStatusParams.safeParse(req.params);
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success)
    return res.status(400).json({ error: "Choose a valid order status." });
  const order = q(await OrderModel.findOne({ id: params.data.id }));
  if (!order) return res.status(404).json({ error: "Order not found." });
  const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const movingBackwards =
    parsed.data.status !== "cancelled" &&
    steps.indexOf(parsed.data.status) < steps.indexOf(order.status);
  if (
    order.status === "delivered" ||
    order.status === "cancelled" ||
    movingBackwards
  ) {
    return res.status(400).json({
      error:
        order.status === "delivered"
          ? "Delivered orders cannot be changed."
          : order.status === "cancelled"
            ? "Cancelled orders cannot be reopened."
            : "Order statuses cannot move backwards.",
    });
  }
  const updated = q(
    await OrderModel.findOneAndUpdate(
      { id: params.data.id },
      { status: parsed.data.status },
      { new: true },
    ),
  );
  return res.json(publicOrder(updated));
});

router.get("/suppliers", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  return res.json((await SupplierModel.find().sort({ createdAt: -1 })).map(q));
});

router.post("/suppliers", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "Check the supplier fields and try again." });
  return res
    .status(201)
    .json(q(await SupplierModel.create({ ...parsed.data, id: id("sup") })));
});

router.put("/suppliers/:id", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const params = UpdateSupplierParams.safeParse(req.params);
  const parsed = UpdateSupplierBody.safeParse(req.body);
  if (!params.success || !parsed.success)
    return res
      .status(400)
      .json({ error: "Check the supplier fields and try again." });
  const supplier = q(
    await SupplierModel.findOneAndUpdate({ id: params.data.id }, parsed.data, {
      new: true,
    }),
  );
  if (!supplier) return res.status(404).json({ error: "Supplier not found." });
  return res.json(supplier);
});

router.delete("/suppliers/:id", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const parsed = DeleteSupplierParams.safeParse(req.params);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid supplier id." });
  if (!(await SupplierModel.deleteOne({ id: parsed.data.id })).deletedCount)
    return res.status(404).json({ error: "Supplier not found." });
  await ProductModel.updateMany(
    { supplierId: parsed.data.id },
    { supplierId: null },
  );
  return res.status(204).send();
});

router.get("/inventory", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  return res.json(
    await Promise.all(
      (await ProductModel.find()).map((product) => inventoryItem(q(product))),
    ),
  );
});

router.put("/inventory/:id", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const params = AdjustInventoryParams.safeParse(req.params);
  const parsed = AdjustInventoryBody.safeParse(req.body);
  if (
    !params.success ||
    !parsed.success ||
    !Number.isInteger(parsed.data.quantity) ||
    parsed.data.quantity === 0
  )
    return res
      .status(400)
      .json({ error: "Enter a non-zero whole number for the adjustment." });
  const decrease = parsed.data.reason === "damaged" || parsed.data.quantity < 0;
  const quantity = Math.abs(parsed.data.quantity);
  const product = q(
    await ProductModel.findOneAndUpdate(
      {
        id: params.data.id,
        ...(decrease ? { quantity: { $gte: quantity } } : {}),
      },
      { $inc: { quantity: decrease ? -quantity : quantity } },
      { new: true },
    ),
  );
  if (!product)
    return res.status(400).json({
      error:
        "That adjustment would make stock negative or the product was not found.",
    });
  await InventoryAdjustmentModel.create({
    id: id("adj"),
    productId: product.id,
    productName: product.name,
    quantity,
    type: decrease ? "decrease" : "increase",
    reason: parsed.data.reason,
  });
  return res.json(await inventoryItem(product));
});

router.get("/inventory/low-stock", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  return res.json(
    await Promise.all(
      (await ProductModel.find())
        .filter((product) => status(q(product)) !== "in-stock")
        .map((product) => inventoryItem(q(product))),
    ),
  );
});

router.get("/reports/summary", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const [products, orders] = await Promise.all([
    ProductModel.find(),
    OrderModel.find().sort({ createdAt: -1 }),
  ]);
  return res.json({
    totalProducts: products.length,
    totalOrders: orders.length,
    totalSales: Number(
      orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + order.totalAmount, 0)
        .toFixed(2),
    ),
    lowStockItems: products.filter(
      (product) => status(q(product)) !== "in-stock",
    ).length,
    recentOrders: orders.slice(0, 5).map((order) => publicOrder(q(order))),
  });
});

router.get("/reports/bestsellers", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const totals = new Map<string, { quantitySold: number; revenue: number }>();
  for (const order of await OrderModel.find({ status: { $ne: "cancelled" } }))
    for (const item of order.items) {
      const value = totals.get(item.productName) || {
        quantitySold: 0,
        revenue: 0,
      };
      value.quantitySold += item.quantity;
      value.revenue += item.subtotal;
      totals.set(item.productName, value);
    }
  return res.json(
    [...totals]
      .map(([productName, value]) => ({ productName, ...value }))
      .sort((a, b) => b.quantitySold - a.quantitySold),
  );
});

router.get("/reports/category-sales", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const totals = new Map<string, { revenue: number; quantitySold: number }>();
  for (const order of await OrderModel.find({ status: { $ne: "cancelled" } }))
    for (const item of order.items) {
      const value = totals.get(item.category) || {
        revenue: 0,
        quantitySold: 0,
      };
      value.quantitySold += item.quantity;
      value.revenue += item.subtotal;
      totals.set(item.category, value);
    }
  return res.json(
    [...totals]
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => b.revenue - a.revenue),
  );
});

router.get("/reports/reorder", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const sold = new Map<string, number>();
  for (const order of await OrderModel.find({ status: { $ne: "cancelled" } }))
    for (const item of order.items)
      sold.set(item.productId, (sold.get(item.productId) || 0) + item.quantity);
  return res.json(
    await Promise.all(
      (await ProductModel.find()).map(async (product) => {
        const value = q(product);
        const totalSold = sold.get(value.id) || 0;
        const averageWeeklySales = Number((totalSold / 4).toFixed(1));
        return {
          product: await publicProduct(value),
          averageWeeklySales,
          estimatedWeeksRemaining:
            averageWeeklySales > 0
              ? Number((value.quantity / averageWeeklySales).toFixed(1))
              : null,
          recommendedReorderQuantity: totalSold
            ? Math.max(0, Math.ceil(averageWeeklySales * 4 - value.quantity))
            : 0,
          hasEnoughData: totalSold > 0,
        };
      }),
    ),
  );
});

export default router;
