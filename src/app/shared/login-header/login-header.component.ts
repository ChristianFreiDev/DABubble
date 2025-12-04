import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-login-header',
    imports: [RouterLink],
    templateUrl: './login-header.component.html',
    styleUrls: [
        './login-header.component.scss',
        '../../../styles/login.scss'
    ]
})
export class LoginHeaderComponent {

  @Input() loginSite: boolean = true;


}