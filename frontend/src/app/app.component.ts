import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DialogContainerComponent } from './shared/components/dialogs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, DialogContainerComponent],
  template: `
    <div class="app-container">
      <app-navbar></app-navbar>
      <main>
        <router-outlet></router-outlet>
      </main>
      <app-dialog-container></app-dialog-container>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'SkillsManagement';
}
