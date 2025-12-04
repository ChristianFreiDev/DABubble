import { Component } from '@angular/core';
import { LoginHeaderComponent } from '../../shared/login-header/login-header.component';
import { Location } from '@angular/common';

@Component({
    selector: 'app-imprint',
    imports: [LoginHeaderComponent],
    templateUrl: './imprint.component.html',
    styleUrls: [
        './imprint.component.scss',
        '../../../styles/login.scss'
    ]
})
export class ImprintComponent {

  constructor(private location: Location) { }


  goBack() {
    this.location.back();    
  }

  
}