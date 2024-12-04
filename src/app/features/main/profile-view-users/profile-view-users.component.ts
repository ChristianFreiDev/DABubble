import { Component } from '@angular/core';
import { ChatService } from '../../../core/services/chat/chat.service';
import { UserService } from '../../../core/services/user/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-view-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-view-users.component.html',
  styleUrl: './profile-view-users.component.scss',
})
export class ProfileViewUsersComponent {
  constructor(public chatService: ChatService, public userService: UserService) {}

  onDiv1Click(): void {
    this.chatService.profileViewUsersActive = false;
  }

  onDiv2Click(event: MouseEvent): void {
    event.stopPropagation();
  }

  openChat(userUID: string) {
    this.onDiv1Click();
    this.chatService.openChat(userUID);
  }
}
