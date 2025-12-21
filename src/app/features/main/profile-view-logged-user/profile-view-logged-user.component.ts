import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../../core/services/chat/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { FirebaseService } from '../../../core/services/firebase/firebase.service';
import { UserService } from '../../../core/services/user/user.service';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-profile-view-logged-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-view-logged-user.component.html',
  styleUrl: './profile-view-logged-user.component.scss',
})
export class ProfileViewLoggedUserComponent {
  isProfileBeingEdited: boolean = false;
  inputFinished: boolean = false;
  uploadInfo: string = '';
  uploadFile: null | 'inProgress' | 'done' = null;
  uploadError: boolean = false;
  newProfileImg: string | undefined;
  @ViewChild('profileImg') profileImg!: ElementRef;
  data = {
    name: this.userService.currentOnlineUser().name,
    email: this.userService.currentOnlineUser().email,
  };
  guestUid: string = environment.guestUid;

  constructor(
    public chatService: ChatService,
    public fireBaseService: FirebaseService,
    public userService: UserService
  ) {}

  onDiv1Click(): void {
    this.chatService.profileViewLoggedUser = false;
    this.isProfileBeingEdited = false;
  }

  onDiv2Click(event: MouseEvent): void {
    event.stopPropagation();
  }

  editProfile(event: MouseEvent) {
    this.isProfileBeingEdited = true;
    this.onDiv2Click(event);
  }

  async saveNewContactInfos(ngForm: NgForm): Promise<void> {
    if (ngForm.submitted && ngForm.form.valid) {
      if (this.data.email == this.userService.currentOnlineUser().email) {
        await this.userService.updateUserDoc(
          this.userService.currentOnlineUser().userUID,
          this.data
        );
        this.checkNewProfileImg();
        this.chatService.profileViewLoggedUser = false;
      } else {
        await this.userService.updateUserEmailandName(
          this.userService.currentOnlineUser().userUID,
          this.data
        );
        this.checkNewProfileImg();
        this.inputFinished = true;
        setTimeout(() => {
          this.inputFinished = false;
          this.isProfileBeingEdited = false;
          this.chatService.profileViewLoggedUser = false;
        }, 1300);
      }
    }
  }

  changeProfileImg(input: HTMLInputElement) {
    this.uploadFile = 'inProgress';
    this.uploadError = false;
    this.uploadInfo = '';
    const file = input.files?.item(0);
    if (file) {
      switch (true) {
        case file.type != 'image/jpeg' &&
          file.type != 'image/png' &&
          file.type != 'image/svg+xml' &&
          file.type != 'image/webp':
          this.handleUploadError('type');
          break;
        case file.size > 500000:
          this.handleUploadError('size');
          break;
        default:
          this.uploadImgToStorage(file);
      }
    }
  }

  handleUploadError(info: string) {
    this.uploadError = true;
    this.uploadFile = 'done';
    if (info == 'size') {
      this.uploadInfo = 'Datei zu groß! Dateigröße < 500KB';
    } else if (info == 'type') {
      this.uploadInfo =
        'Kein gültiger Dateityp! Bitte JPEG, PNG, SVG oder WEBP auswählen';
    } else {
      this.uploadInfo =
        'Es ist ein Fehler aufgetreten! Bitte erneut versuchen.';
    }
  }

  async uploadImgToStorage(file: File) {
    const path =
      'profil-images/' +
      this.userService.currentOnlineUser().email +
      '/' +
      file.name;
    this.uploadInfo = file.name;
    try {
      await this.fireBaseService.uploadFileToStorage(file, path);
      this.newProfileImg = this.fireBaseService.downloadURL;
      this.profileImg.nativeElement.src = this.newProfileImg;
      this.uploadFile = 'done';
    } catch (error) {
      this.handleUploadError('else');
      console.error('Image upload error');
    }
  }

  async checkNewProfileImg() {
    if (this.newProfileImg) {
      await this.userService.updateUserDoc(
        this.userService.currentOnlineUser().userUID,
        { avatar: this.newProfileImg }
      );
    }
  }
}
