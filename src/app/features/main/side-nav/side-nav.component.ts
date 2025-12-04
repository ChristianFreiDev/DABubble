import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SideNavService } from '../../../core/services/sideNav/side-nav.service';
import { ChatService } from '../../../core/services/chat/chat.service';
import { UserService } from '../../../core/services/user/user.service';
import { LayoutService } from '../../../core/services/layout/layout.service';
import { SearchComponentComponent } from "../search-component/search-component.component";

@Component({
    selector: 'app-side-nav',
    imports: [CommonModule, SearchComponentComponent],
    templateUrl: './side-nav.component.html',
    styleUrl: './side-nav.component.scss'
})
export class SideNavComponent {
  channelsOpened: boolean = true;

  constructor(
    public sideNavService: SideNavService,
    public chatService: ChatService,
    public userService: UserService,
    private layoutService: LayoutService
  ) {}

  openChannels(): void {
    this.channelsOpened = !this.channelsOpened;
  }

  openCreateChannels(): void {
    this.sideNavService.createChannelsDivOpened = true;
  }

  closeContactDiv(): void {
    this.sideNavService.contactsOpened = !this.sideNavService.contactsOpened;
  }

  newMessage(): void {
    this.layoutService.selectNewMessage();
    this.layoutService.deselectSideNavOnMobile();
  }
}
