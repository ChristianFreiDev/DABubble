import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LoginHeaderComponent } from '../../shared/login-header/login-header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { applyActionCode, Auth, confirmPasswordReset, verifyPasswordResetCode } from "@angular/fire/auth";

@Component({
    selector: 'app-new-password',
    imports: [CommonModule, FormsModule, LoginHeaderComponent, FooterComponent],
    templateUrl: './new-password.component.html',
    styleUrls: [
        './new-password.component.scss',
        '../../../styles/login.scss'
    ]
})
export class NewPasswordComponent implements OnInit {

  newPassword: string = '';
  newPasswordRepeat: string = '';
  inputFinished: boolean = false;
  private auth = inject(Auth);
  mode: string = '';
  private actionCode: string = '';
  userEmail = '';
  resetPasswordError: boolean = false;
  errorMsg: string = 'Ihre Kennwörter stimmen nicht überein!';


  constructor(private router: Router, private activeRoute: ActivatedRoute) { }


  ngOnInit(): void {
    this.actionCode = this.activeRoute.snapshot.queryParamMap.get('oobCode')!;
    this.mode = this.activeRoute.snapshot.queryParamMap.get('mode')!;
  }


  async onSubmit(ngForm: NgForm) {
    if (ngForm.submitted && ngForm.form.valid) {
      this.resetPasswordError = false;
      await this.handleResetPassword(this.auth, this.actionCode);
      ngForm.resetForm();
    }
  }


  async handleResetPassword(auth: Auth, actionCode: string) {
    try {
      this.userEmail = await verifyPasswordResetCode(auth, actionCode);
      try {
        await confirmPasswordReset(auth, actionCode, this.newPassword);
        this.goToLogin();
      } catch (error) {
        this.resetPasswordError = true;
        this.errorMsg = 'Es ist ein Fehler aufgetreten! Bitte erneut versuchen.';
        // console.log('New password rejected!', error);
      }
    } catch (error) {
      this.resetPasswordError = true;
      this.errorMsg = 'Aktionscode ist ungültig oder abgelaufen! Bitte erneut versuchen.';
      // console.log('Action code invalid or expired!', error);
    }
  }


  async sendActionCode() {
    await applyActionCode(this.auth, this.actionCode)
      .then(() => {
        this.goToLogin();
      })
      .catch((error) => console.log('sendActionCode-Error:', error))
  }


  goToLogin() {
    this.inputFinished = true;
    setTimeout(() => {
      this.router.navigateByUrl('' + '?email=' + this.userEmail);
    }, 1300);
  }


}