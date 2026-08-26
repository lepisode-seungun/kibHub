import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  imports: [RouterModule, ToastComponent],
  selector: 'adm-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'KIPhub Admin';
}
