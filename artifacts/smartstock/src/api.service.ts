import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as M from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private options = { withCredentials: true };
  session() { return this.http.get<M.Session>('/api/auth/session', this.options); }
  adminLogin(data: {email:string; password:string}) { return this.http.post<M.Session>('/api/auth/admin/login', data, this.options); }
  logout() { return this.http.post<void>('/api/auth/logout', {}, this.options); }
  products(search?: string, category?: string, sort?: string) {
    let params = new HttpParams(); if (search) params=params.set('search',search); if(category) params=params.set('category',category); if(sort) params=params.set('sort',sort);
    return this.http.get<M.Product[]>('/api/products', {...this.options, params});
  }
  product(id: string) { return this.http.get<M.Product>(`/api/products/${id}`, this.options); }
  createProduct(data: M.ProductInput) { return this.http.post<M.Product>('/api/products',data,this.options); }
  updateProduct(id:string,data:M.ProductInput) { return this.http.put<M.Product>(`/api/products/${id}`,data,this.options); }
  deleteProduct(id:string) { return this.http.delete<void>(`/api/products/${id}`,this.options); }
  orders() { return this.http.get<M.Order[]>('/api/orders',this.options); }
  order(id:string) { return this.http.get<M.Order>(`/api/orders/${id}`,this.options); }
  createOrder(data:M.OrderInput) { return this.http.post<M.Order>('/api/orders',data,this.options); }
  updateOrderStatus(id:string,status:M.OrderStatus) { return this.http.put<M.Order>(`/api/orders/${id}/status`,{status},this.options); }
  suppliers() { return this.http.get<M.Supplier[]>('/api/suppliers',this.options); }
  createSupplier(data:Omit<M.Supplier,'id'|'createdAt'>) { return this.http.post<M.Supplier>('/api/suppliers',data,this.options); }
  updateSupplier(id:string,data:Omit<M.Supplier,'id'|'createdAt'>) { return this.http.put<M.Supplier>(`/api/suppliers/${id}`,data,this.options); }
  deleteSupplier(id:string) { return this.http.delete<void>(`/api/suppliers/${id}`,this.options); }
  inventory() { return this.http.get<M.InventoryItem[]>('/api/inventory',this.options); }
  lowStock() { return this.http.get<M.InventoryItem[]>('/api/inventory/low-stock',this.options); }
  adjustInventory(id:string,data:{quantity:number;reason:string}) { return this.http.put<M.InventoryItem>(`/api/inventory/${id}`,data,this.options); }
  summary() { return this.http.get<M.ReportSummary>('/api/reports/summary',this.options); }
  bestsellers() { return this.http.get<M.BestSeller[]>('/api/reports/bestsellers',this.options); }
  categorySales() { return this.http.get<M.CategorySale[]>('/api/reports/category-sales',this.options); }
  reorder() { return this.http.get<M.ReorderRecommendation[]>('/api/reports/reorder',this.options); }
}