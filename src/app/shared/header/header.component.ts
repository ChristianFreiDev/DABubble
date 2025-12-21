import { Component, inject } from '@angular/core';
import { UserService } from '../../core/services/user/user.service';
import { Router } from '@angular/router';
import { ChatService } from '../../core/services/chat/chat.service';
import { FormsModule } from '@angular/forms';
import { SearchComponentComponent } from '../../features/main/search-component/search-component.component';
import { SideNavService } from '../../core/services/sideNav/side-nav.service';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../core/services/layout/layout.service';

@Component({
  selector: 'app-header',
  imports: [FormsModule, SearchComponentComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  userService = inject(UserService);
  chatService = inject(ChatService);
  sideNavService = inject(SideNavService);
  profilInfo: boolean = false;

  constructor(private router: Router, public layoutService: LayoutService) {}

  toggleProfilInfo() {
    this.profilInfo = !this.profilInfo;
  }

  showProfile() {
    this.toggleProfilInfo();
    this.chatService.openViewProfile(this.userService.currentUserUID());
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  async logout() {
    this.userService.unsub();
    this.chatService.ngOnDestroy();
    this.userService.introDone = false;
    await this.userService.signOutUser();
    this.router.navigateByUrl('');
  }

  onSearch() {
    this.sideNavService.search = true;
  }
}
