import { Component, Signal } from '@angular/core';
import { DialogService } from '../../../core/services/dialog/dialog.service';

@Component({
    selector: 'app-upload-error',
    imports: [],
    templateUrl: './upload-error.component.html',
    styleUrl: './upload-error.component.scss'
})
export class UploadErrorComponent {

  errorType: Signal<string> = this.dialogService.uploadErrorType;

  constructor(private dialogService: DialogService) { }

  closeDialog() {
    this.dialogService.toggleUploadErrorVisibility();
  }
}
