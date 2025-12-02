import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  public form: FormGroup | null = null;

  private readonly formBuilder = inject(FormBuilder);

  public ngOnInit(): void {
    this.buildForm();
  }

  public get isFormValid(): boolean {
    return this.form?.valid ?? false;
  }

  public get isFormReady(): boolean {
    return this.form !== null;
  }

  public onSubmit(): void {
    if (this.form?.valid) {
      const formData = this.form.value;
      console.warn('Login attempt:', formData);
      // TODO: Implementar lógica de login con AuthService
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    if (this.form) {
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form?.get(key);
        control?.markAsTouched();
      });
    }
  }

  private buildForm(): void {
    this.form = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }
}
