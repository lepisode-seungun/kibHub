import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.css'],
})
export class UploadPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private location = inject(Location);

  ngOnInit(): void {
    document.body.classList.add('page-upload');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('page-upload');
  }

  close(): void {
    this.location.back();
  }

  selectType(type: string): void {
    this.router.navigate(['/upload', type]);
  }
}
