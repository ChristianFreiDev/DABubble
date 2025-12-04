import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-intro',
    imports: [CommonModule],
    templateUrl: './intro.component.html',
    styleUrl: './intro.component.scss'
})
export class IntroComponent implements OnInit {

  @Output() hideIntroScreen = new EventEmitter<boolean>();
  changeStyle: boolean = false;


  ngOnInit(): void {
    setTimeout(() => {
      this.changeStyle = true;
    }, 1300);
    
    setTimeout(() => {
      this.exitIntroScreen();
    }, 2500);
  }


  exitIntroScreen() {
    this.hideIntroScreen.emit(true);
  }


}