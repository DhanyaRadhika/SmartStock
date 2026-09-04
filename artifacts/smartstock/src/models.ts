export type Role = 'customer' | 'admin';
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export interface User { id: string; name: string; email: string; profileImage: string | null; role: Role; }
export interface Session { authenticated: boolean; user: User | null; googleConfigured: boolean; }
export interface Supplier { id: string; name: string; contactPerson: string; email: string; phone: string; address: string; createdAt: string; }
export interface Product { id: string; name: string; sku: string; category: string; description: string; price: number; quantity: number; minimumStock: number; supplier: Supplier | null; image: string; stockStatus: StockStatus; createdAt: string; updatedAt: string; }
export interface ProductInput { name: string; sku: string; category: string; description: string; price: number; quantity: number; minimumStock: number; supplierId?: string | null; image: string; }
export interface OrderItem { productId: string; productName: string; price: number; quantity: number; subtotal: number; }
export interface Order { id: string; customerName: string; customerEmail: string; customerPhone: string; address: string; items: OrderItem[]; totalAmount: number; status: OrderStatus; createdAt: string; updatedAt: string; }
export interface OrderInput { customerName: string; customerEmail: string; customerPhone: string; address: string; items: { productId: string; quantity: number }[]; }
export interface InventoryItem { product: Product; currentStock: number; minimumStock: number; stockStatus: StockStatus; }
export interface ReportSummary { totalProducts: number; totalOrders: number; totalSales: number; lowStockItems: number; recentOrders: Order[]; }
export interface BestSeller { productName: string; quantitySold: number; revenue: number; }
export interface CategorySale { category: string; revenue: number; quantitySold: number; }
export interface ReorderRecommendation { product: Product; averageWeeklySales: number; estimatedWeeksRemaining: number | null; recommendedReorderQuantity: number; hasEnoughData: boolean; }