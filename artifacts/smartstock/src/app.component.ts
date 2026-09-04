import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { filter, Subscription } from "rxjs";
import { ApiService } from "./api.service";
import { CartLine, CartService } from "./cart.service";
import {
  BestSeller,
  CategorySale,
  InventoryItem,
  Order,
  OrderStatus,
  Product,
  ProductInput,
  ReorderRecommendation,
  ReportSummary,
  Session,
  Supplier,
} from "./models";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: "<router-outlet />",
})
export class AppComponent {}

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="landing">
      <div class="landing-top">
        <a class="logo" routerLink="/"
          ><span class="logo-mark"></span>smart<span>stock</span></a
        >
        <a class="text-link" routerLink="/admin/login"
          >Operator access <span aria-hidden="true">↗</span></a
        >
      </div>
      <section class="landing-hero">
        <div class="hero-copy">
          <p class="eyebrow">INVENTORY, WITHOUT THE GUESSWORK</p>
          <h1>Know what’s in stock.<br /><em>Know what’s next.</em></h1>
          <p class="hero-lede">
            SmartStock gives growing retail teams one calm place to sell,
            replenish, and make better decisions with the stock they already
            have.
          </p>
          <div class="hero-actions">
            <a class="btn-main btn-large" routerLink="/customer/products"
              >Browse the store <span>→</span></a
            >
            <a class="btn-quiet btn-large" routerLink="/login"
              >Customer sign in</a
            >
          </div>
          <div class="hero-proof">
            <span class="proof-dot"></span>
            <span>Live stock visibility</span>
            <span class="proof-separator"></span>
            <span>Cash on delivery</span>
          </div>
        </div>
        <div
          class="hero-art"
          aria-label="SmartStock inventory overview illustration"
        >
          <div class="hero-orbit orbit-one"></div>
          <div class="hero-orbit orbit-two"></div>
          <div class="hero-dashboard">
            <div class="mini-top">
              <span class="mini-brand">smart<span>stock</span></span
              ><span class="mini-signal"></span>
            </div>
            <div class="mini-title">Today’s operations <span>↗</span></div>
            <div class="mini-number">₹1,24,680 <small>sales</small></div>
            <div class="mini-bars">
              <span style="height:35%"></span><span style="height:55%"></span
              ><span style="height:45%"></span><span style="height:72%"></span
              ><span style="height:58%"></span><span style="height:88%"></span
              ><span style="height:78%"></span>
            </div>
            <div class="mini-foot">
              <span>12 orders today</span><b>↑ 18.4%</b>
            </div>
          </div>
          <div class="float-card stock-card">
            <span class="float-icon lime">◌</span>
            <div><b>Stock health</b><small>89% in a good place</small></div>
            <strong>89%</strong>
          </div>
          <div class="float-card alert-card">
            <span class="float-icon orange">!</span>
            <div>
              <b>5 low-stock alerts</b><small>Review recommendations</small>
            </div>
          </div>
        </div>
      </section>
      <section class="landing-strip">
        <div>
          <b>One source of truth</b
          ><span
            >Products, suppliers, orders, and inventory stay connected.</span
          >
        </div>
        <div>
          <b>Built for momentum</b
          ><span
            >Clear signals for the next decision, not another spreadsheet.</span
          >
        </div>
        <div>
          <b>Ready for real work</b
          ><span
            >Role-based access and database-backed workflows from day one.</span
          >
        </div>
      </section>
    </main>
  `,
})
export class LandingComponent {}

@Component({
  selector: "app-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell" [class.admin-shell]="admin">
      <aside class="sidebar" *ngIf="admin">
        <a routerLink="/" class="logo sidebar-logo"
          ><span class="logo-mark"></span>smart<span>stock</span></a
        >
        <p class="side-caption">OPERATIONS WORKSPACE</p>
        <nav class="side-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active"
            ><span class="nav-glyph">◈</span>Overview</a
          >
          <a routerLink="/admin/products" routerLinkActive="active"
            ><span class="nav-glyph">▦</span>Products</a
          >
          <a routerLink="/admin/inventory" routerLinkActive="active"
            ><span class="nav-glyph">◫</span>Inventory</a
          >
          <a routerLink="/admin/orders" routerLinkActive="active"
            ><span class="nav-glyph">↗</span>Orders</a
          >
          <a routerLink="/admin/suppliers" routerLinkActive="active"
            ><span class="nav-glyph">◎</span>Suppliers</a
          >
          <a routerLink="/admin/reports" routerLinkActive="active"
            ><span class="nav-glyph">⌁</span>Reports</a
          >
        </nav>
        <div class="sidebar-bottom">
          <div class="operator">
            <span class="avatar">SS</span>
            <div><b>SmartStock Admin</b><small>Operations</small></div>
          </div>
          <button class="nav-item sign-out" type="button" (click)="signOut()">
            Sign out <span>↗</span>
          </button>
        </div>
      </aside>

      <main class="main-area">
        <header class="topbar">
          <a routerLink="/" class="logo mobile-logo"
            ><span class="logo-mark"></span>smart<span>stock</span></a
          >
          <div class="topbar-context">
            {{ admin ? "Operations workspace" : "Good things, in stock." }}
          </div>
          <div class="topbar-actions" *ngIf="!admin">
            <a routerLink="/customer/orders" class="top-link">My orders</a>

            <a
              routerLink="/customer/cart"
              class="top-link cart-link"
              style="position:relative;display:inline-flex;flex-direction:column;align-items:center;padding:2px 4px;text-decoration:none;color:inherit;gap:0"
            >
              <div style="position:relative;display:inline-block;line-height:0">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M6 2h12l-1.5 6h-9L6 2z"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                  />
                  <path
                    d="M3 8h18l-1.2 10.2a2 2 0 0 1-2 1.8H6.2a2 2 0 0 1-2-1.8L3 8z"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                  />
                </svg>
                <span
                  class="cart-badge"
                  style="position:absolute;right:-4px;top:-4px;background:#fff;color:#000;border:1px solid #000;border-radius:999px;padding:2px 5px;font-size:11px;font-weight:700"
                  >{{ cart.count() }}</span
                >
              </div>
              <span
                style="margin-top:0;display:block;color:inherit;background:transparent;min-width:auto;height:auto;border-radius:0;padding:0"
                >Bag</span
              >
            </a>
            <div
              class="profile"
              *ngIf="session?.authenticated; else notSignedIn"
              style="position:relative"
            >
              <button
                class="profile-toggle"
                type="button"
                (click)="toggleProfile()"
                style="display:inline-flex;align-items:center;gap:8px;background:none;border:0;padding:4px;cursor:pointer"
              >
                <img
                  *ngIf="session!.user?.profileImage"
                  [src]="session!.user?.profileImage"
                  class="avatar"
                  alt="Profile"
                  style="width:34px;height:34px;border-radius:999px;object-fit:cover"
                />
                <span
                  *ngIf="!session!.user?.profileImage"
                  class="avatar initials"
                  style="width:34px;height:34px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:#111;color:#fff;font-weight:700"
                  >{{ initials(session!.user?.name || "") }}</span
                >
              </button>
              <div
                *ngIf="showProfile"
                class="profile-menu"
                style="position:absolute;right:0;top:44px;min-width:220px;background:#fff;border:1px solid #e6e6e6;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.08);padding:12px;z-index:50"
              >
                <div
                  style="display:flex;align-items:center;gap:12px;margin-bottom:8px"
                >
                  <div style="flex-shrink:0">
                    <img
                      *ngIf="session!.user?.profileImage"
                      [src]="session!.user?.profileImage"
                      alt="avatar"
                      style="width:48px;height:48px;border-radius:999px;object-fit:cover"
                    />
                    <div
                      *ngIf="!session!.user?.profileImage"
                      style="width:48px;height:48px;border-radius:999px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700"
                    >
                      {{ initials(session!.user?.name || "") }}
                    </div>
                  </div>
                  <div>
                    <div style="font-weight:700">{{ session!.user?.name }}</div>
                    <div style="font-size:13px;color:#666">
                      {{ session!.user?.email }}
                    </div>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  <a
                    routerLink="/customer/orders"
                    (click)="toggleProfile()"
                    style="text-decoration:none;color:#111;padding:8px;border-radius:6px"
                    >My orders</a
                  >
                  <a
                    routerLink="/customer/cart"
                    (click)="toggleProfile()"
                    style="text-decoration:none;color:#111;padding:8px;border-radius:6px"
                    >My bag
                    <span style="float:right">{{ cart.count() }}</span></a
                  >
                  <button
                    class="btn-quiet"
                    (click)="signOut(); toggleProfile()"
                    style="margin-top:6px;text-align:left;padding:8px;border-radius:6px;background:#fff;border:1px solid #eee"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
            <ng-template #notSignedIn>
              <a routerLink="/login" class="btn-quiet">Sign in</a>
            </ng-template>
          </div>
          <div class="topbar-actions" *ngIf="admin">
            <span class="live-chip"><i></i> Data synced</span>
          </div>
        </header>

        <section class="page">
          <div class="page-heading">
            <div>
              <p class="eyebrow">
                {{ admin ? "SMARTSTOCK / ADMIN" : "THE SMARTSTOCK STORE" }}
              </p>
              <h1>{{ title }}</h1>
              <p class="heading-note" *ngIf="view === 'dashboard'">
                A clear view of what needs attention today.
              </p>
              <p class="heading-note" *ngIf="view === 'products' && !admin">
                Thoughtful tools and everyday essentials, ready to ship.
              </p>
            </div>
            <a
              *ngIf="admin && view === 'products'"
              class="btn-main"
              routerLink="/admin/products/new"
              >+ New product</a
            >
            <a
              *ngIf="admin && view === 'suppliers'"
              class="btn-main"
              routerLink="/admin/suppliers/new"
              >+ Add supplier</a
            >
          </div>

          <div class="notice error" *ngIf="error">{{ error }}</div>
          <div class="loading-state" *ngIf="loading">
            <span class="loader"></span>Loading your workspace…
          </div>

          <ng-container *ngIf="!loading">
            <section
              *ngIf="view === 'products' && !productId"
              class="content-stack"
            >
              <div class="toolbar product-toolbar">
                <label class="search-box"
                  ><span>⌕</span
                  ><input
                    [value]="search"
                    (input)="onSearch($any($event.target).value)"
                    placeholder="Search by product or SKU"
                /></label>
                <select
                  class="select-field"
                  [value]="sort"
                  (change)="onSort($any($event.target).value)"
                  aria-label="Sort products"
                >
                  <option value="">Sort by</option>
                  <option value="newest">Newest first</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
                <select
                  class="select-field"
                  [value]="category"
                  (change)="onCategory($any($event.target).value)"
                  aria-label="Filter category"
                >
                  <option value="">All categories</option>
                  <option *ngFor="let c of categories" [value]="c">
                    {{ c }}
                  </option>
                </select>
              </div>
              <div
                class="product-grid"
                *ngIf="products.length; else noProducts"
              >
                <article class="product-card" *ngFor="let p of products">
                  <a
                    [routerLink]="
                      admin
                        ? ['/admin/products/edit', p.id]
                        : ['/customer/products', p.id]
                    "
                    class="product-image"
                    ><img [src]="p.image" [alt]="p.name" /><span
                      class="stock-pill"
                      [class]="'stock-' + p.stockStatus"
                      >{{ stockLabel(p.stockStatus) }}</span
                    ></a
                  >
                  <div class="product-info">
                    <p class="product-category">{{ p.category }}</p>
                    <a
                      [routerLink]="
                        admin
                          ? ['/admin/products/edit', p.id]
                          : ['/customer/products', p.id]
                      "
                      class="product-name"
                      >{{ p.name }}</a
                    >
                    <p class="product-meta">
                      {{ p.sku }} <span>·</span> {{ p.quantity }} available
                    </p>
                    <div class="product-bottom">
                      <strong>{{ money(p.price) }}</strong
                      ><button
                        *ngIf="!admin"
                        class="add-button"
                        type="button"
                        (click)="addToCart(p)"
                        [disabled]="!p.quantity"
                      >
                        {{ addedId === p.id ? "Added" : "Add to bag" }}</button
                      ><a
                        *ngIf="admin"
                        class="row-action"
                        [routerLink]="['/admin/products/edit', p.id]"
                        >Edit ↗</a
                      >
                    </div>
                  </div>
                </article>
              </div>
              <ng-template #noProducts
                ><div class="empty-state">
                  <span class="empty-icon">⌕</span>
                  <h2>No products found</h2>
                  <p>Try a different search or clear your filters.</p>
                </div></ng-template
              >
            </section>

            <section
              *ngIf="view === 'product-detail' && selectedProduct"
              class="detail-layout"
            >
              <a class="back-link" routerLink="/customer/products"
                >← Back to products</a
              >
              <div class="product-detail">
                <div class="detail-image">
                  <img
                    [src]="selectedProduct.image"
                    [alt]="selectedProduct.name"
                  />
                </div>
                <div class="detail-copy">
                  <p class="product-category">{{ selectedProduct.category }}</p>
                  <h2>{{ selectedProduct.name }}</h2>
                  <p class="detail-sku">{{ selectedProduct.sku }}</p>
                  <p class="detail-description">
                    {{ selectedProduct.description }}
                  </p>
                  <div class="detail-price">
                    {{ money(selectedProduct.price) }}
                  </div>
                  <div class="detail-stock">
                    <span
                      class="stock-dot"
                      [class]="'dot-' + selectedProduct.stockStatus"
                    ></span
                    >{{
                      selectedProduct.quantity
                        ? selectedProduct.quantity + " available now"
                        : "Currently out of stock"
                    }}
                  </div>
                  <button
                    class="btn-main btn-large"
                    type="button"
                    (click)="addToCart(selectedProduct)"
                    [disabled]="!selectedProduct.quantity"
                  >
                    {{
                      addedId === selectedProduct.id
                        ? "Added to bag"
                        : "Add to bag"
                    }}
                  </button>
                </div>
              </div>
            </section>

            <section *ngIf="view === 'cart'" class="cart-layout">
              <div
                class="cart-lines"
                *ngIf="cart.lines().length; else emptyCart"
              >
                <div class="cart-line" *ngFor="let line of cart.lines()">
                  <img [src]="line.product.image" [alt]="line.product.name" />
                  <div class="cart-line-copy">
                    <p class="product-category">{{ line.product.category }}</p>
                    <b>{{ line.product.name }}</b
                    ><small>{{ money(line.product.price) }} each</small>
                  </div>
                  <div class="quantity-control">
                    <button
                      type="button"
                      (click)="changeQuantity(line, -1)"
                      aria-label="Decrease quantity"
                    >
                      −</button
                    ><span>{{ line.quantity }}</span
                    ><button
                      type="button"
                      (click)="changeQuantity(line, 1)"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <strong>{{
                    money(line.product.price * line.quantity)
                  }}</strong
                  ><button
                    class="remove-button"
                    type="button"
                    (click)="removeLine(line)"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
              </div>
              <ng-template #emptyCart
                ><div class="empty-state">
                  <span class="empty-icon">＋</span>
                  <h2>Your bag is waiting</h2>
                  <p>Browse the store and add something useful.</p>
                  <a class="btn-main" routerLink="/customer/products"
                    >Browse products</a
                  >
                </div></ng-template
              >
              <aside class="summary-card" *ngIf="cart.lines().length">
                <p class="eyebrow">ORDER SUMMARY</p>
                <h2>Ready when you are.</h2>
                <div class="summary-row">
                  <span>Subtotal</span><b>{{ money(cart.total()) }}</b>
                </div>
                <div class="summary-row">
                  <span>Delivery</span><b class="free">Free</b>
                </div>
                <div class="summary-total">
                  <span>Total</span><b>{{ money(cart.total()) }}</b>
                </div>
                <a class="btn-main btn-large" routerLink="/customer/checkout"
                  >Continue to checkout <span>→</span></a
                ><small>Cash on delivery available</small>
              </aside>
            </section>

            <section *ngIf="view === 'checkout'" class="checkout-layout">
              <form
                class="form-card checkout-form"
                [formGroup]="checkoutForm"
                (ngSubmit)="checkout()"
              >
                <a class="back-link" routerLink="/customer/cart"
                  >← Back to bag</a
                >
                <p class="eyebrow">DELIVERY DETAILS</p>
                <h2>Where should we send it?</h2>
                <p class="form-note">
                  Your order will be confirmed by our team and collected on
                  delivery.
                </p>
                <div class="form-grid">
                  <label
                    >Name<input
                      class="field"
                      formControlName="name"
                      autocomplete="name" /></label
                  ><label
                    >Email<input
                      class="field"
                      type="email"
                      formControlName="email"
                      readonly /></label
                  ><label
                    >Phone<input
                      class="field"
                      formControlName="phone"
                      autocomplete="tel" /></label
                  ><label class="full-field"
                    >Delivery address<textarea
                      class="field"
                      rows="4"
                      formControlName="address"
                      autocomplete="street-address"
                    ></textarea>
                  </label>
                </div>
                <button
                  class="btn-main btn-large"
                  [disabled]="checkoutForm.invalid || placingOrder"
                >
                  {{
                    placingOrder
                      ? "Placing order…"
                      : "Place cash-on-delivery order →"
                  }}
                </button>
              </form>
              <aside class="summary-card checkout-summary">
                <p class="eyebrow">YOUR ORDER</p>
                <div class="summary-product" *ngFor="let line of cart.lines()">
                  <span>{{ line.quantity }} × {{ line.product.name }}</span
                  ><b>{{ money(line.product.price * line.quantity) }}</b>
                </div>
                <div class="summary-total">
                  <span>Total</span><b>{{ money(cart.total()) }}</b>
                </div>
              </aside>
            </section>

            <section
              *ngIf="view === 'orders' && !orderId"
              class="content-stack"
            >
              <div class="section-intro">
                <p>
                  {{
                    admin
                      ? "Every order, from first click to final delivery."
                      : "A quiet record of everything you have ordered."
                  }}
                </p>
              </div>
              <div class="table-card" *ngIf="orders.length; else noOrders">
                <div class="table-head">
                  <span>Order</span
                  ><span>{{ admin ? "Customer" : "Items" }}</span
                  ><span>Date</span><span>Status</span><span>Total</span>
                </div>
                <a
                  class="table-row"
                  *ngFor="let o of orders"
                  [routerLink]="[
                    admin ? '/admin/orders' : '/customer/orders',
                    o.id,
                  ]"
                  ><b>#{{ o.id.slice(-6).toUpperCase() }}</b
                  ><span>{{
                    admin
                      ? o.customerName
                      : o.items.length +
                        " item" +
                        (o.items.length === 1 ? "" : "s")
                  }}</span
                  ><span>{{ date(o.createdAt) }}</span
                  ><span class="status-badge" [class]="'status-' + o.status">{{
                    prettyStatus(o.status)
                  }}</span
                  ><strong>{{ money(o.totalAmount) }}</strong
                  ><span class="row-arrow">→</span></a
                >
              </div>
              <ng-template #noOrders
                ><div class="empty-state">
                  <span class="empty-icon">↗</span>
                  <h2>No orders yet</h2>
                  <p>Your order history will appear here after checkout.</p>
                  <a
                    *ngIf="!admin"
                    class="btn-main"
                    routerLink="/customer/products"
                    >Start shopping</a
                  >
                </div></ng-template
              >
            </section>

            <section
              *ngIf="view === 'order-detail' && selectedOrder"
              class="detail-layout"
            >
              <a
                class="back-link"
                [routerLink]="admin ? '/admin/orders' : '/customer/orders'"
                >← Back to orders</a
              >
              <div class="order-detail-grid">
                <div class="form-card">
                  <div class="detail-header">
                    <div>
                      <p class="eyebrow">
                        ORDER #{{ selectedOrder.id.slice(-6).toUpperCase() }}
                      </p>
                      <h2>{{ date(selectedOrder.createdAt) }}</h2>
                    </div>
                    <span
                      class="status-badge large"
                      [class]="'status-' + selectedOrder.status"
                      >{{ prettyStatus(selectedOrder.status) }}</span
                    >
                  </div>
                  <div class="timeline">
                    <div
                      *ngFor="let step of orderSteps; let i = index"
                      class="timeline-step"
                      [class.done]="stepDone(step)"
                      [class.current]="step === selectedOrder.status"
                    >
                      <span>{{ stepDone(step) ? "✓" : i + 1 }}</span>
                      <div>
                        <b>{{ prettyStatus(step) }}</b
                        ><small *ngIf="step === selectedOrder.status"
                          >Current order status</small
                        >
                      </div>
                    </div>
                  </div>
                  <div class="order-items">
                    <div
                      class="order-item"
                      *ngFor="let item of selectedOrder.items"
                    >
                      <span>{{ item.quantity }} × {{ item.productName }}</span
                      ><b>{{ money(item.subtotal) }}</b>
                    </div>
                  </div>
                  <div class="summary-total">
                    <span>Total</span
                    ><b>{{ money(selectedOrder.totalAmount) }}</b>
                  </div>
                </div>
                <aside class="form-card address-card">
                  <p class="eyebrow">
                    {{ admin ? "CUSTOMER" : "DELIVERING TO" }}
                  </p>
                  <h3>{{ selectedOrder.customerName }}</h3>
                  <p>{{ selectedOrder.customerEmail }}</p>
                  <p>{{ selectedOrder.customerPhone }}</p>
                  <p>{{ selectedOrder.address }}</p>
                  <div
                    *ngIf="admin && selectedOrder.status !== 'delivered'"
                    class="status-editor"
                  >
                    <label
                      >Update status<select
                        class="select-field"
                        [value]="selectedOrder.status"
                        (change)="updateOrderStatus($any($event.target).value)"
                      >
                        <option
                          *ngFor="let step of orderStatuses"
                          [value]="step"
                        >
                          {{ prettyStatus(step) }}
                        </option>
                        <option value="cancelled">Cancelled</option>
                      </select></label
                    >
                  </div>
                </aside>
              </div>
            </section>

            <section *ngIf="view === 'dashboard'" class="content-stack">
              <div class="metrics">
                <div class="metric-card">
                  <span class="metric-icon purple">▦</span><small>Catalog</small
                  ><strong>{{ summary?.totalProducts || 0 }}</strong>
                  <p>Products in system</p>
                </div>
                <div class="metric-card">
                  <span class="metric-icon blue">↗</span
                  ><small>All orders</small
                  ><strong>{{ summary?.totalOrders || 0 }}</strong>
                  <p>Across every status</p>
                </div>
                <div class="metric-card">
                  <span class="metric-icon lime">₹</span><small>Net sales</small
                  ><strong>{{ money(summary?.totalSales || 0) }}</strong>
                  <p>Excluding cancelled</p>
                </div>
                <div class="metric-card warning">
                  <span class="metric-icon orange">!</span
                  ><small>Needs attention</small
                  ><strong>{{ summary?.lowStockItems || 0 }}</strong>
                  <p>Low or out of stock</p>
                </div>
              </div>
              <div class="dashboard-grid">
                <div class="table-card">
                  <div class="card-heading">
                    <div>
                      <p class="eyebrow">RECENT ACTIVITY</p>
                      <h2>Latest orders</h2>
                    </div>
                    <a routerLink="/admin/orders">View all →</a>
                  </div>
                  <a
                    class="compact-row"
                    *ngFor="let o of summary?.recentOrders"
                    [routerLink]="['/admin/orders', o.id]"
                    ><span class="compact-avatar">{{
                      initials(o.customerName)
                    }}</span
                    ><span
                      ><b>{{ o.customerName }}</b
                      ><small
                        >#{{ o.id.slice(-6).toUpperCase() }} ·
                        {{ date(o.createdAt) }}</small
                      ></span
                    ><strong>{{ money(o.totalAmount) }}</strong
                    ><span
                      class="status-badge"
                      [class]="'status-' + o.status"
                      >{{ prettyStatus(o.status) }}</span
                    ></a
                  >
                  <div
                    class="empty-inline"
                    *ngIf="!summary?.recentOrders?.length"
                  >
                    No recent orders yet.
                  </div>
                </div>
                <div class="table-card alert-panel">
                  <div class="card-heading">
                    <div>
                      <p class="eyebrow">STOCK SIGNALS</p>
                      <h2>Needs attention</h2>
                    </div>
                    <a routerLink="/admin/inventory">Open inventory →</a>
                  </div>
                  <div class="compact-row" *ngFor="let i of lowStock">
                    <span class="alert-mark">!</span
                    ><span
                      ><b>{{ i.product.name }}</b
                      ><small
                        >{{ i.currentStock }} left · minimum
                        {{ i.minimumStock }}</small
                      ></span
                    ><span
                      class="status-badge"
                      [class]="'status-' + i.stockStatus"
                      >{{ stockLabel(i.stockStatus) }}</span
                    >
                  </div>
                  <div class="empty-inline" *ngIf="!lowStock.length">
                    Everything is comfortably stocked.
                  </div>
                </div>
              </div>
            </section>

            <section *ngIf="view === 'inventory'" class="content-stack">
              <div class="inventory-banner">
                <div>
                  <p class="eyebrow">INVENTORY HEALTH</p>
                  <h2>{{ lowStock.length }} items need a closer look</h2>
                  <p>
                    Adjustments are recorded with a reason so the team always
                    knows what changed.
                  </p>
                </div>
                <a routerLink="/admin/reports">See reorder guidance →</a>
              </div>
              <div class="table-card">
                <div class="table-head inventory-head">
                  <span>Product</span><span>SKU</span><span>Current</span
                  ><span>Minimum</span><span>Status</span><span>Adjust</span>
                </div>
                <div
                  class="table-row inventory-row"
                  *ngFor="let i of inventory"
                >
                  <span
                    ><b>{{ i.product.name }}</b
                    ><small>{{ i.product.category }}</small></span
                  ><span>{{ i.product.sku }}</span
                  ><strong>{{ i.currentStock }}</strong
                  ><span>{{ i.minimumStock }}</span
                  ><span
                    class="status-badge"
                    [class]="'status-' + i.stockStatus"
                    >{{ stockLabel(i.stockStatus) }}</span
                  ><button
                    class="row-action"
                    type="button"
                    (click)="adjustStock(i)"
                  >
                    + Adjust
                  </button>
                </div>
              </div>
            </section>

            <section *ngIf="view === 'reports'" class="content-stack">
              <div class="report-grid">
                <div class="table-card report-card">
                  <div class="card-heading">
                    <div>
                      <p class="eyebrow">TOP PRODUCTS</p>
                      <h2>Best sellers</h2>
                    </div>
                  </div>
                  <div
                    class="report-row"
                    *ngFor="let item of bestsellers; let i = index"
                  >
                    <span class="rank">{{ i + 1 }}</span
                    ><span
                      ><b>{{ item.productName }}</b
                      ><small>{{ item.quantitySold }} units sold</small></span
                    ><strong>{{ money(item.revenue) }}</strong>
                  </div>
                  <div class="empty-inline" *ngIf="!bestsellers.length">
                    Sales insights appear after orders are placed.
                  </div>
                </div>
                <div class="table-card report-card">
                  <div class="card-heading">
                    <div>
                      <p class="eyebrow">REPLENISHMENT</p>
                      <h2>Reorder guidance</h2>
                    </div>
                  </div>
                  <div class="report-row" *ngFor="let r of reorder">
                    <span
                      class="report-dot"
                      [class]="'dot-' + r.product.stockStatus"
                    ></span
                    ><span
                      ><b>{{ r.product.name }}</b
                      ><small>{{
                        r.hasEnoughData
                          ? r.averageWeeklySales + " units / week"
                          : "Waiting for sales history"
                      }}</small></span
                    ><strong>{{
                      r.recommendedReorderQuantity
                        ? "+" + r.recommendedReorderQuantity
                        : "—"
                    }}</strong>
                  </div>
                  <div class="empty-inline" *ngIf="!reorder.length">
                    No recommendations yet.
                  </div>
                </div>
              </div>
              <div class="table-card category-report">
                <div class="card-heading">
                  <div>
                    <p class="eyebrow">SALES MIX</p>
                    <h2>Category performance</h2>
                  </div>
                </div>
                <div class="category-bar-row" *ngFor="let c of categorySales">
                  <span>{{ c.category }}</span>
                  <div class="category-bar">
                    <i [style.width.%]="categoryPercent(c.revenue)"></i>
                  </div>
                  <b>{{ money(c.revenue) }}</b>
                </div>
              </div>
            </section>

            <section
              *ngIf="view === 'suppliers' && !supplierId"
              class="content-stack"
            >
              <div class="table-card">
                <div class="table-head supplier-head">
                  <span>Supplier</span><span>Contact</span><span>Email</span
                  ><span>Phone</span><span></span>
                </div>
                <a
                  class="table-row supplier-row"
                  *ngFor="let s of suppliers"
                  [routerLink]="['/admin/suppliers/edit', s.id]"
                  ><span
                    ><b>{{ s.name }}</b
                    ><small>{{ s.address }}</small></span
                  ><span>{{ s.contactPerson }}</span
                  ><span>{{ s.email }}</span
                  ><span>{{ s.phone }}</span
                  ><span class="row-arrow">→</span></a
                >
              </div>
            </section>

            <section *ngIf="view === 'product-form'" class="form-layout">
              <form
                class="form-card large-form"
                [formGroup]="productForm"
                (ngSubmit)="saveProduct()"
              >
                <a class="back-link" routerLink="/admin/products"
                  >← Back to products</a
                >
                <div class="form-card-heading">
                  <div>
                    <p class="eyebrow">
                      {{ productId ? "EDIT CATALOG ITEM" : "NEW CATALOG ITEM" }}
                    </p>
                    <h2>
                      {{
                        productId
                          ? "Update product details"
                          : "Add something to the catalog"
                      }}
                    </h2>
                  </div>
                  <button
                    *ngIf="productId"
                    class="danger-link"
                    type="button"
                    (click)="deleteProduct()"
                  >
                    Delete product
                  </button>
                </div>
                <div class="form-grid">
                  <label
                    >Product name<input
                      class="field"
                      formControlName="name" /></label
                  ><label
                    >SKU<input class="field" formControlName="sku" /></label
                  ><label
                    >Category<select class="field" formControlName="category">
                      <option *ngFor="let c of categories" [value]="c">
                        {{ c }}
                      </option>
                    </select></label
                  ><label
                    >Price (₹)<input
                      class="field"
                      type="number"
                      formControlName="price"
                      min="0" /></label
                  ><label
                    >Opening quantity<input
                      class="field"
                      type="number"
                      formControlName="quantity"
                      min="0" /></label
                  ><label
                    >Minimum stock<input
                      class="field"
                      type="number"
                      formControlName="minimumStock"
                      min="0" /></label
                  ><label class="full-field"
                    >Description<textarea
                      class="field"
                      rows="4"
                      formControlName="description"
                    ></textarea></label
                  ><label class="full-field"
                    >Image URL<input
                      class="field"
                      formControlName="image" /></label
                  ><label
                    >Supplier<select class="field" formControlName="supplierId">
                      <option [ngValue]="null">No supplier</option>
                      <option *ngFor="let s of suppliers" [value]="s.id">
                        {{ s.name }}
                      </option>
                    </select></label
                  >
                </div>
                <div class="form-actions">
                  <a class="btn-quiet" routerLink="/admin/products">Cancel</a
                  ><button
                    class="btn-main"
                    [disabled]="productForm.invalid || saving"
                  >
                    {{ saving ? "Saving…" : "Save product" }}
                  </button>
                </div>
              </form>
              <aside class="preview-card" *ngIf="productForm.value.image">
                <p class="eyebrow">PREVIEW</p>
                <img
                  [src]="productForm.value.image"
                  [alt]="productForm.value.name || 'Product preview'"
                />
                <h3>{{ productForm.value.name || "Product name" }}</h3>
                <strong>{{ money(productForm.value.price || 0) }}</strong>
              </aside>
            </section>

            <section *ngIf="view === 'supplier-form'" class="form-layout">
              <form
                class="form-card large-form"
                [formGroup]="supplierForm"
                (ngSubmit)="saveSupplier()"
              >
                <a class="back-link" routerLink="/admin/suppliers"
                  >← Back to suppliers</a
                >
                <div class="form-card-heading">
                  <div>
                    <p class="eyebrow">
                      {{ supplierId ? "EDIT SUPPLIER" : "NEW SUPPLIER" }}
                    </p>
                    <h2>
                      {{
                        supplierId
                          ? "Update supplier details"
                          : "Add a supply partner"
                      }}
                    </h2>
                  </div>
                  <button
                    *ngIf="supplierId"
                    class="danger-link"
                    type="button"
                    (click)="deleteSupplier()"
                  >
                    Delete supplier
                  </button>
                </div>
                <div class="form-grid">
                  <label
                    >Company name<input
                      class="field"
                      formControlName="name" /></label
                  ><label
                    >Contact person<input
                      class="field"
                      formControlName="contactPerson" /></label
                  ><label
                    >Email<input
                      class="field"
                      type="email"
                      formControlName="email" /></label
                  ><label
                    >Phone<input class="field" formControlName="phone" /></label
                  ><label class="full-field"
                    >Address<textarea
                      class="field"
                      rows="3"
                      formControlName="address"
                    ></textarea>
                  </label>
                </div>
                <div class="form-actions">
                  <a class="btn-quiet" routerLink="/admin/suppliers">Cancel</a
                  ><button
                    class="btn-main"
                    [disabled]="supplierForm.invalid || saving"
                  >
                    {{ saving ? "Saving…" : "Save supplier" }}
                  </button>
                </div>
              </form>
            </section>
          </ng-container>
        </section>
      </main>
    </div>
  `,
})
export class PageComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  cart = inject(CartService);
  private subscriptions = new Subscription();
  private lastPath = "";

  admin = false;
  view = "";
  title = "SmartStock";
  loading = true;
  saving = false;
  placingOrder = false;
  error = "";
  search = "";
  category = "";
  sort = "";
  productId = "";
  supplierId = "";
  orderId = "";
  addedId = "";
  categories = [
    "Electronics",
    "Accessories",
    "Office Supplies",
    "Home Appliances",
    "Stationery",
  ];
  products: Product[] = [];
  selectedProduct?: Product;
  orders: Order[] = [];
  selectedOrder?: Order;
  inventory: InventoryItem[] = [];
  lowStock: InventoryItem[] = [];
  suppliers: Supplier[] = [];
  summary?: ReportSummary;
  bestsellers: BestSeller[] = [];
  categorySales: CategorySale[] = [];
  reorder: ReorderRecommendation[] = [];
  session?: Session;
  showProfile = false;
  orderSteps: OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];
  orderStatuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  productForm = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    sku: ["", [Validators.required, Validators.minLength(2)]],
    category: ["Electronics", Validators.required],
    description: ["", [Validators.required, Validators.minLength(5)]],
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
    supplierId: [null as string | null],
    image: ["", Validators.required],
  });
  supplierForm = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    contactPerson: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", [Validators.required, Validators.email]],
    phone: ["", [Validators.required, Validators.minLength(5)]],
    address: ["", [Validators.required, Validators.minLength(3)]],
  });
  checkoutForm = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", [Validators.required, Validators.email]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit() {
    this.subscriptions.add(
      this.router.events
        .pipe(
          filter(
            (event): event is NavigationEnd => event instanceof NavigationEnd,
          ),
        )
        .subscribe(() => this.syncRoute()),
    );
    this.subscriptions.add(this.route.params.subscribe(() => this.syncRoute()));
    // fetch session once to show profile / sign out in UI
    this.subscriptions.add(
      this.api.session().subscribe({
        next: (s) => (this.session = s),
        error: () => (this.session = undefined),
      }),
    );
    this.syncRoute();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private syncRoute() {
    const path = this.router.url.split("?")[0];
    if (path === this.lastPath) return;
    this.lastPath = path;
    this.admin = path.startsWith("/admin");
    this.productId = this.route.snapshot.paramMap.get("id") ?? "";
    this.supplierId = this.route.snapshot.paramMap.get("id") ?? "";
    this.orderId = this.route.snapshot.paramMap.get("id") ?? "";
    this.view = this.resolveView(path);
    this.title = this.resolveTitle();
    this.error = "";
    this.loading = this.view !== "cart";
    this.load();
  }

  private resolveView(path: string) {
    if (path.includes("/products/edit") || path.endsWith("/products/new"))
      return "product-form";
    if (path.includes("/suppliers/edit") || path.endsWith("/suppliers/new"))
      return "supplier-form";
    if (path.includes("/products/") && !this.admin) return "product-detail";
    if (path.includes("/orders/")) return "order-detail";
    if (path.includes("/products")) return "products";
    if (path.includes("/orders")) return "orders";
    if (path.includes("/inventory")) return "inventory";
    if (path.includes("/reports")) return "reports";
    if (path.includes("/suppliers")) return "suppliers";
    if (path.includes("/dashboard")) return "dashboard";
    if (path.endsWith("/cart")) return "cart";
    if (path.endsWith("/checkout")) return "checkout";
    return "dashboard";
  }

  private resolveTitle() {
    const titles: Record<string, string> = {
      products: this.admin ? "Products" : "Find your next useful thing",
      "product-detail": "Product details",
      cart: "Your bag",
      checkout: "Checkout",
      orders: this.admin ? "Orders" : "Your orders",
      "order-detail": "Order details",
      dashboard: "Good morning, operator.",
      inventory: "Inventory",
      reports: "Reports & insights",
      suppliers: "Suppliers",
      "product-form": this.productId ? "Edit product" : "New product",
      "supplier-form": this.supplierId ? "Edit supplier" : "New supplier",
    };
    return titles[this.view] ?? "SmartStock";
  }

  private load() {
    if (this.view === "products") return this.loadProducts();
    if (this.view === "product-detail") return this.loadProduct();
    if (this.view === "orders") return this.loadOrders();
    if (this.view === "order-detail") return this.loadOrder();
    if (this.view === "dashboard") return this.loadDashboard();
    if (this.view === "inventory") return this.loadInventory();
    if (this.view === "reports") return this.loadReports();
    if (this.view === "suppliers") return this.loadSuppliers();
    if (this.view === "product-form") return this.loadProductForm();
    if (this.view === "supplier-form") return this.loadSupplierForm();
    if (this.view === "checkout") return this.loadCheckout();
    this.loading = false;
  }

  private loadProducts() {
    this.api.products(this.search, this.category, this.sort).subscribe({
      next: (items) => {
        this.products = items;
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }
  private loadProduct() {
    this.api.product(this.productId).subscribe({
      next: (product) => {
        this.selectedProduct = product;
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }
  private loadOrders() {
    this.api.orders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }
  private loadOrder() {
    this.api.order(this.orderId).subscribe({
      next: (order) => {
        this.selectedOrder = order;
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }
  private loadDashboard() {
    this.api.summary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
    this.api.lowStock().subscribe({
      next: (items) => (this.lowStock = items),
      error: () => (this.lowStock = []),
    });
  }
  private loadInventory() {
    this.api.inventory().subscribe({
      next: (items) => {
        this.inventory = items;
        this.lowStock = items.filter((item) => item.stockStatus !== "in-stock");
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }
  private loadReports() {
    this.api.reorder().subscribe({
      next: (items) => {
        this.reorder = items;
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
    this.api.bestsellers().subscribe({
      next: (items) => (this.bestsellers = items),
      error: () => (this.bestsellers = []),
    });
    this.api.categorySales().subscribe({
      next: (items) => (this.categorySales = items),
      error: () => (this.categorySales = []),
    });
  }
  private loadSuppliers() {
    this.api.suppliers().subscribe({
      next: (items) => {
        this.suppliers = items;
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }
  private loadProductForm() {
    this.api.suppliers().subscribe({
      next: (items) => (this.suppliers = items),
      error: () => (this.suppliers = []),
    });
    if (!this.productId) {
      this.loading = false;
      return;
    }
    this.api.product(this.productId).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          ...product,
          supplierId: product.supplier?.id ?? null,
        });
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }
  private loadSupplierForm() {
    if (!this.supplierId) {
      this.loading = false;
      return;
    }
    this.api.suppliers().subscribe({
      next: (items) => {
        this.suppliers = items;
        const supplier = items.find((item) => item.id === this.supplierId);
        if (!supplier) return this.fail({ error: "Supplier not found." });
        this.supplierForm.patchValue(supplier);
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }
  private loadCheckout() {
    this.api.session().subscribe({
      next: (session) => {
        this.session = session;
        if (session.user)
          this.checkoutForm.patchValue({
            name: session.user.name,
            email: session.user.email,
          });
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }

  onSearch(value: string) {
    this.search = value;
    this.loadProducts();
  }
  onSort(value: string) {
    this.sort = value;
    this.loadProducts();
  }
  onCategory(value: string) {
    this.category = value;
    this.loadProducts();
  }
  addToCart(product: Product) {
    this.cart.add(product);
    this.addedId = product.id;
    setTimeout(() => (this.addedId = ""), 1200);
  }
  changeQuantity(line: CartLine, delta: number) {
    this.cart.setQuantity(line.product.id, line.quantity + delta);
  }
  removeLine(line: CartLine) {
    this.cart.remove(line.product.id);
  }

  saveProduct() {
    if (this.productForm.invalid) return;
    this.saving = true;
    const data = this.productForm.getRawValue() as ProductInput;
    const request = this.productId
      ? this.api.updateProduct(this.productId, data)
      : this.api.createProduct(data);
    request.subscribe({
      next: (product) => {
        this.saving = false;
        this.router.navigateByUrl(`/admin/products/edit/${product.id}`);
      },
      error: (e) => {
        this.saving = false;
        this.fail(e);
      },
    });
  }
  deleteProduct() {
    if (!this.productId || !confirm("Delete this product from the catalog?"))
      return;
    this.api.deleteProduct(this.productId).subscribe({
      next: () => this.router.navigateByUrl("/admin/products"),
      error: (e) => this.fail(e),
    });
  }
  saveSupplier() {
    if (this.supplierForm.invalid) return;
    this.saving = true;
    const data = this.supplierForm.getRawValue() as Omit<
      Supplier,
      "id" | "createdAt"
    >;
    const request = this.supplierId
      ? this.api.updateSupplier(this.supplierId, data)
      : this.api.createSupplier(data);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigateByUrl("/admin/suppliers");
      },
      error: (e) => {
        this.saving = false;
        this.fail(e);
      },
    });
  }
  deleteSupplier() {
    if (
      !this.supplierId ||
      !confirm(
        "Delete this supplier? Products will remain in the catalog without a supplier.",
      )
    )
      return;
    this.api.deleteSupplier(this.supplierId).subscribe({
      next: () => this.router.navigateByUrl("/admin/suppliers"),
      error: (e) => this.fail(e),
    });
  }
  adjustStock(item: InventoryItem) {
    const raw = prompt(
      `Adjustment for ${item.product.name}. Use a positive number to add stock or a negative number to remove it.`,
      "1",
    );
    if (raw === null) return;
    const quantity = Number(raw);
    if (!Number.isInteger(quantity) || quantity === 0) {
      this.error = "Enter a non-zero whole number.";
      return;
    }
    this.api
      .adjustInventory(item.product.id, {
        quantity,
        reason: quantity < 0 ? "manual-adjustment" : "restock",
      })
      .subscribe({
        next: () => this.loadInventory(),
        error: (e) => this.fail(e),
      });
  }
  updateOrderStatus(status: OrderStatus) {
    if (!this.orderId) return;
    this.api.updateOrderStatus(this.orderId, status).subscribe({
      next: (order) => (this.selectedOrder = order),
      error: (e) => this.fail(e),
    });
  }
  checkout() {
    if (this.checkoutForm.invalid || !this.cart.lines().length) return;
    this.placingOrder = true;
    const values = this.checkoutForm.getRawValue();
    this.api
      .createOrder({
        customerName: values.name ?? "",
        customerEmail: values.email ?? "",
        customerPhone: values.phone ?? "",
        address: values.address ?? "",
        items: this.cart.lines().map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          this.placingOrder = false;
          this.router.navigateByUrl(`/customer/orders/${order.id}`);
        },
        error: (e) => {
          this.placingOrder = false;
          this.fail(e);
        },
      });
  }
  signOut() {
    this.api.logout().subscribe({
      next: () => this.router.navigateByUrl("/"),
      error: () => this.router.navigateByUrl("/"),
    });
  }

  toggleProfile() {
    this.showProfile = !this.showProfile;
  }

  fail(error: any) {
    this.loading = false;
    this.error =
      error?.error?.error ??
      error?.error?.message ??
      error?.message ??
      "We could not load this view. Please try again.";
  }
  money(value: number) {
    return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  date(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }
  initials(name: string) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  stockLabel(status: string) {
    return status === "in-stock"
      ? "In stock"
      : status === "low-stock"
        ? "Low stock"
        : "Out of stock";
  }
  prettyStatus(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  stepDone(step: OrderStatus) {
    return this.selectedOrder
      ? this.orderSteps.indexOf(step) <=
          this.orderSteps.indexOf(this.selectedOrder.status as OrderStatus) &&
          this.selectedOrder.status !== "cancelled"
      : false;
  }
  categoryPercent(value: number) {
    const total = this.categorySales.reduce(
      (sum, item) => sum + item.revenue,
      0,
    );
    return total ? Math.max(4, Math.round((value / total) * 100)) : 0;
  }
}
