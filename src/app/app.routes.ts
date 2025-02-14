import { Routes } from '@angular/router';
import { ChooseAvatarComponent } from './features/choose-avatar/choose-avatar.component';
import { ImprintComponent } from './features/imprint/imprint.component';
import { LogInComponent } from './features/log-in/log-in.component';
import { MainComponent } from './features/main/main.component';
import { NewPasswordComponent } from './features/new-password/new-password.component';
import { PrivacyPolicyComponent } from './features/privacy-policy/privacy-policy.component';
import { RegisterComponent } from './features/register/register.component';
import { ResetPasswordComponent } from './features/reset-password/reset-password.component';

export const routes: Routes = [
    { path: '', component: LogInComponent },
    { path: 'main', component: MainComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'choose-avatar', component: ChooseAvatarComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'new-password', component: NewPasswordComponent },
    { path: 'imprint', component: ImprintComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent }
];