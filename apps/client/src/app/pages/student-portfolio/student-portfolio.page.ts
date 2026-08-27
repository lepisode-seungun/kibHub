import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Portfolio } from '@kibhub/shared';

@Component({
  selector: 'app-student-portfolio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-portfolio.page.html',
  styleUrls: ['./student-portfolio.page.css'],
})
export class StudentPortfolioPage implements OnInit {
  private api = inject(ApiService);

  portfolios = signal<Portfolio[]>([]);
  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.api.portfolios.findAll();
      this.portfolios.set(Array.isArray(data) ? data : []);
    } catch {
      this.portfolios.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
