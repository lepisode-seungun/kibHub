import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.css'],
})
export class UploadPage {
  private router = inject(Router);
  private location = inject(Location);

  close(): void {
    this.location.back();
  }

  selectType(type: string): void {
    this.router.navigate(['/upload', type]);
  }
}
