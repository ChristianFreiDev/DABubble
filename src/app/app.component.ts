import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { UserService } from './core/services/user/user.service';
import { LayoutService } from './core/services/layout/layout.service';
import { environment } from '../environments/environment.development';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'da-bubble';

  userService = inject(UserService);
  layoutService = inject(LayoutService);

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    if (this.userService.currentOnlineUser().userUID) {
      this.userService.updateUserDoc(this.userService.currentOnlineUser().userUID, {isOnline: false});
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const windowWidth = event.target.innerWidth;
    this.layoutService.onResize(windowWidth);
  }
}
