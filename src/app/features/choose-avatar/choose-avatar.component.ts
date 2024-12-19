import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { LoginHeaderComponent } from '../../shared/login-header/login-header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user/user.service';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { FirebaseService } from '../../core/services/firebase/firebase.service';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [CommonModule, LoginHeaderComponent, FooterComponent],
  templateUrl: './choose-avatar.component.html',
  styleUrls: [
    './choose-avatar.component.scss',
    '../../../styles/login.scss'
  ]
})
export class ChooseAvatarComponent {

  inputFinished: boolean = false;
  userService = inject(UserService);
  firebaseService = inject(FirebaseService);
  private auth = inject(Auth);
  uploadInfo: string = '';
  uploadFile: null | 'inProgress' | 'done' = null;
  uploadError: boolean = false;
  @ViewChild('profile') profileHTML!: ElementRef;
  private profileImgPathSignal = signal<string>('assets/img/profile.svg');
  readonly profileImgPath = this.profileImgPathSignal.asReadonly();
  profileImages = [
    'assets/img/avatar0.svg',
    'assets/img/avatar1.svg',
    'assets/img/avatar2.svg',
    'assets/img/avatar3.svg',
    'assets/img/avatar4.svg',
    'assets/img/avatar5.svg',
  ];
  file: File | null | undefined = undefined;
  url: string = 'assets/img/profile.svg';

  constructor(private location: Location, private router: Router) { }


  goBack() {
    this.location.back();
  }


  changeProfileImg(index: number) {
    this.profileImgPathSignal.set(this.profileImages[index]);
    this.uploadFile = null;
  }

  saveImg(input: HTMLInputElement) {
    this.file = input.files?.item(0);
    const reader = new FileReader();

    reader.onload = (event: any) => {
      this.url = event.target.result;
    };

    if (this.file instanceof File) {
      reader.readAsDataURL(this.file);
    }
  }

  async uploadImg(file: File | null | undefined) {
    this.uploadFile = 'inProgress';
    this.uploadError = false;
    this.uploadInfo = '';
    if (file) {
      switch (true) {
        case (file.type != 'image/jpeg') && (file.type != 'image/png') && (file.type != 'image/svg+xml') && (file.type != 'image/webp'):
          this.handleUploadError('type');
          break;
        case file.size > 500000:
          this.handleUploadError('size');
          break;
        default:
          await this.uploadImgToStorage(file);
      }
    }
  }


  handleUploadError(info: string) {
    this.uploadError = true;
    this.uploadFile = 'done';
    if (info == 'size') {
      this.uploadInfo = 'Datei zu groß! Dateigröße < 500KB';
    } else if (info == 'type') {
      this.uploadInfo = 'Kein gültiger Dateityp! Bitte JPEG, PNG, SVG oder WEBP auswählen';
    } else {
      this.uploadInfo = 'Es ist ein Fehler aufgetreten! Bitte erneut versuchen.';
    }
  }


  async uploadImgToStorage(file: File) {
    const path = 'profil-images/' + this.userService.newUser.email + '/' + file.name;
    this.uploadInfo = file.name;
    try {
      await this.firebaseService.uploadFileToStorage(file, path);
      this.profileImgPathSignal.set(this.firebaseService.downloadURL);
      this.profileHTML.nativeElement.src = this.profileImgPath();
      this.uploadFile = 'done';
    } catch (error) {
      this.handleUploadError('else');
    }
  }


  registerNewUser() {
    createUserWithEmailAndPassword(this.auth, this.userService.newUser.email, this.userService.newUser.password)
      .then(async (userCredential) => {
        await this.uploadImg(this.file);
        const user = userCredential.user;
        this.userService.newUser.userUID = user.uid;
        this.userService.newUser.avatar = this.profileImgPath();
        this.userService.addUser(user.uid, this.userService.newUser.toJSON());
        this.goToLogin();
      })
      .catch((error) => {
        this.handleUploadError('else');
        console.log('Registrierung fehlgeschlagen, Error-Code:', error.code);
        console.log('Registrierung fehlgeschlagen, Error-Message:', error.message);
      });
  }


  goToLogin() {
    this.inputFinished = true;
    setTimeout(() => {
      this.router.navigateByUrl('' + '?email=' + this.userService.newUser.email);
    }, 1300);
  }


}