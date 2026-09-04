import { provideHttpClient } from "@angular/common/http";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, Routes } from "@angular/router";
import { AppComponent, LandingComponent, PageComponent } from "./app.component";
import { AuthComponent } from "./auth.component";
import { adminGuard, customerGuard } from "./guard";
import "./index.css";

const routes: Routes = [
  { path: "", component: LandingComponent },
  { path: "login", component: AuthComponent },
  { path: "admin/login", component: AuthComponent },
  { path: "customer/products", component: PageComponent },
  { path: "customer/products/:id", component: PageComponent },
  { path: "customer/cart", component: PageComponent },
  { path: "customer/checkout", component: PageComponent, canActivate: [customerGuard] },
  { path: "customer/orders", component: PageComponent, canActivate: [customerGuard] },
  { path: "customer/orders/:id", component: PageComponent, canActivate: [customerGuard] },
  { path: "admin/dashboard", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/products", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/products/new", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/products/edit/:id", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/inventory", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/orders", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/orders/:id", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/suppliers", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/suppliers/new", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/suppliers/edit/:id", component: PageComponent, canActivate: [adminGuard] },
  { path: "admin/reports", component: PageComponent, canActivate: [adminGuard] },
  { path: "**", redirectTo: "" },
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient()],
});