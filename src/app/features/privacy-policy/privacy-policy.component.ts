import { Component } from "@angular/core";
import { LoginHeaderComponent } from "../../shared/login-header/login-header.component";
import { Location, ViewportScroller } from "@angular/common";

@Component({
    selector: 'app-privacy-policy',
    imports: [LoginHeaderComponent],
    templateUrl: './privacy-policy.component.html',
    styleUrls: [
        './privacy-policy.component.scss',
        '../../../styles/login.scss'
    ]
})
export class PrivacyPolicyComponent {

  constructor(private location: Location, private scroller: ViewportScroller) { }


  goBack() {
    this.location.back();    
  }


  scrollToTop() {
    this.scroller.scrollToAnchor('top');
  }


}