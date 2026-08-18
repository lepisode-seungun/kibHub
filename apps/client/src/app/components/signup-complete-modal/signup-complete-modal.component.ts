import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SignupModalService } from '../../services/signup-modal.service';

@Component({
  selector: 'app-signup-complete-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signup-complete-modal.component.html',
})
export class SignupCompleteModalComponent {
  modalService = inject(SignupModalService);
  private router = inject(Router);

  goToProfile(): void {
    this.modalService.close();
    this.router.navigate(['/profile-edit']);
  }

  goToHome(): void {
    this.modalService.close();
    this.router.navigate(['/']);
  }
}
