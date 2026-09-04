import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ApiService } from "./api.service";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth">
      <div class="auth-glow"></div>
      <a routerLink="/" class="logo auth-logo"
        ><span class="logo-mark"></span>smart<span>stock</span></a
      >
      <section class="auth-layout">
        <div class="auth-intro">
          <p class="eyebrow">
            {{ isAdmin ? "OPERATOR ACCESS" : "WELCOME TO SMARTSTOCK" }}
          </p>
          <h1 *ngIf="isAdmin">Keep the operation moving.</h1>
          <h1 *ngIf="!isAdmin">
            Useful things.<br /><em>Thoughtfully stocked.</em>
          </h1>
          <p>
            {{
              isAdmin
                ? "The decisions that keep every shelf, supplier, and order in step."
                : "Sign in to keep your bag, track your orders, and get on with your day."
            }}
          </p>
        </div>
        <div class="auth-card">
          <ng-container *ngIf="!isAdmin; else adminLogin">
            <p class="eyebrow">CUSTOMER SIGN IN</p>
            <h2>Welcome back.</h2>
            <p class="form-note">
              Use your Google account to continue securely.
            </p>
            <button class="google-button" type="button" (click)="startGoogle()">
              <span class="google-g">G</span> Continue with Google
              <span>→</span>
            </button>
            <div class="auth-divider"><span>secure account access</span></div>
            <p class="config-note" *ngIf="!googleConfigured">
              Google Sign-In is waiting for the OAuth settings to be added by
              the application owner.
            </p>
            <a class="text-link centered" routerLink="/customer/products"
              >Continue browsing as a guest <span>↗</span></a
            >
          </ng-container>
          <ng-template #adminLogin>
            <p class="eyebrow">OPERATOR ACCESS</p>
            <h2>Welcome, team.</h2>
            <p class="form-note">
              Use the admin credentials configured for this environment.
            </p>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <label
                >Email<input
                  class="field"
                  type="email"
                  formControlName="email"
                  autocomplete="username" /></label
              ><label
                >Password<input
                  class="field"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
              /></label>
              <p class="notice error" *ngIf="error">{{ error }}</p>
              <button
                class="btn-main btn-large full-button"
                [disabled]="form.invalid || pending"
              >
                {{ pending ? "Opening workspace…" : "Enter workspace →" }}
              </button>
            </form>
          </ng-template>
        </div>
      </section>
    </main>
  `,
})
export class AuthComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  isAdmin = false;
  googleConfigured = false;
  pending = false;
  error = "";
  form = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
  });

  ngOnInit() {
    this.isAdmin = this.router.url.startsWith("/admin");
    this.route.queryParamMap.subscribe((params) => {
      if (params.get("error"))
        this.error = "Google sign-in could not be completed. Please try again.";
    });
    if (!this.isAdmin)
      this.api
        .session()
        .subscribe({
          next: (session) => (this.googleConfigured = session.googleConfigured),
          error: () => (this.googleConfigured = false),
        });
  }
  startGoogle() {
    location.assign("/api/auth/google");
  }
  submit() {
    if (this.form.invalid) return;
    this.pending = true;
    this.api
      .adminLogin(
        this.form.getRawValue() as { email: string; password: string },
      )
      .subscribe({
        next: () => this.router.navigateByUrl("/admin/dashboard"),
        error: (e) => {
          this.pending = false;
          this.error =
            e?.error?.error ??
            "That sign-in did not work. Check your details and try again.";
        },
      });
  }
}
