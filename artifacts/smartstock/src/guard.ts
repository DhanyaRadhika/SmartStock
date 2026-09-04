import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApiService } from './api.service';
export const adminGuard: CanActivateFn = (_, state) => { const api=inject(ApiService), router=inject(Router); return api.session().pipe(map(s => s.authenticated && s.user?.role === 'admin' ? true : router.createUrlTree(['/admin/login'],{queryParams:{returnUrl:state.url}})),catchError(() => of(router.createUrlTree(['/admin/login'])))); };
export const customerGuard: CanActivateFn = (_, state) => { const api=inject(ApiService), router=inject(Router); return api.session().pipe(map(s => s.authenticated && s.user?.role === 'customer' ? true : router.createUrlTree(['/login'],{queryParams:{returnUrl:state.url}})),catchError(() => of(router.createUrlTree(['/login'])))); };