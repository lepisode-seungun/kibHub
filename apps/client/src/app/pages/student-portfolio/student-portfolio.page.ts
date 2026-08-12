import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-student-portfolio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-portfolio.page.html',
  styleUrls: ['./student-portfolio.page.css'],
})
export class StudentPortfolioPage {}
