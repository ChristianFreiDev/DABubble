import { Component, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../core/services/chat/chat.service';
import { LayoutService } from '../../core/services/layout/layout.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { ChatComponent } from './chat/chat.component';
import { SideNavComponent } from './side-nav/side-nav.component';
import { ThreadComponent } from './thread/thread.component';
import { SideNavService } from '../../core/services/sideNav/side-nav.service';
import { CreateChannelComponent } from "./side-nav/create-channel/create-channel.component";
import { EditChannelComponent } from './chat/edit-channel/edit-channel.component';
import { NewMessageComponent } from './side-nav/new-message/new-message.component';
import { DirectMessageComponent } from './side-nav/direct-message/direct-message.component';
import { ProfileViewUsersComponent } from "./profile-view-users/profile-view-users.component";
import { ProfileViewLoggedUserComponent } from './profile-view-logged-user/profile-view-logged-user.component';
import { FirebaseService } from '../../core/services/firebase/firebase.service';
import { UploadErrorComponent } from "./upload-error/upload-error.component";
import { DialogService } from '../../core/services/dialog/dialog.service';
import { UserService } from '../../core/services/user/user.service';

@Component({
    selector: 'app-main',
    imports: [
    HeaderComponent,
    SideNavComponent,
    ChatComponent,
    CommonModule,
    ThreadComponent,
    CreateChannelComponent,
    EditChannelComponent,
    NewMessageComponent,
    DirectMessageComponent,
    ProfileViewUsersComponent,
    ProfileViewLoggedUserComponent,
    UploadErrorComponent
],
    templateUrl: './main.component.html',
    styleUrl: './main.component.scss'
})
export class MainComponent implements OnInit {
  layoutState: Signal<any> = this.layoutService.layoutState;
  isEditChannelVisible: Signal<boolean> = this.dialogService.openEditChannel;
  constructor(public chatService: ChatService, public sideNavService: SideNavService, public firebaseService: FirebaseService, private layoutService: LayoutService, public dialogService: DialogService, private userService: UserService) {}
  sectionIsVisible: boolean = true;

  closeSection() {
    let section: HTMLElement | null = document.getElementById('section');
    if (section) {
      if (this.sectionIsVisible) {
        this.addSectionHiddenClass(section);
        this.changeImage(
          'menuButton',
          '../../../../assets/img/main/displayMenu.png'
        );

      } else {
        this.addSectionDisplayedClass(section);
        this.changeImage(
          'menuButton',
          '../../../../assets/img/main/blackMenu.png'
        );
      }
    }
    this.layoutService.toggleSideNavVisbility();
  }

  addSectionHiddenClass(div: any) {
    div.classList.remove('sectionDisplayed');
    div.classList.add('sectionHidden');
    this.sectionIsVisible = false;
  }

  addSectionDisplayedClass(div: any) {
    div.classList.remove('sectionHidden');
    div.classList.add('sectionDisplayed');
    this.sectionIsVisible = true;
  }

  changeImage(imgId: any, newImgSrc: any) {
    const currentImg: any = document.getElementById(`${imgId}`);
    currentImg.src = `${newImgSrc}`;
  }

  ngOnInit(): void {
    this.userService.initUsers();
    this.layoutService.onResize(window.innerWidth);
  }

  isDesktop() {
    return this.layoutService.isDesktop();
  }
  
  shouldAnimateThread() {
    const result = (this.layoutService.layoutState().isChatOpen || this.layoutService.layoutState().isDirectMessageOpen || this.layoutService.layoutState().isNewMessageOpen) && this.layoutService.isDesktop();
    return result
  }

  shouldAnimateSideNav() {
    const result = (this.layoutService.layoutState().isChatOpen || this.layoutService.layoutState().isDirectMessageOpen || this.layoutService.layoutState().isNewMessageOpen || this.layoutService.layoutState().isThreadOpen) && !this.layoutService.isMobile();
    return result;
  }
}

