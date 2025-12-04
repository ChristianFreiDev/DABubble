import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FirebaseService } from '../../../core/services/firebase/firebase.service';
import { ChatService } from '../../../core/services/chat/chat.service';

@Component({
    selector: 'app-deletable-file',
    imports: [],
    templateUrl: './deletable-file.component.html',
    styleUrl: './deletable-file.component.scss'
})
export class DeletableFileComponent {

  @Input() fileUrl: string = '';
  @Input() fileType: string = '';
  @Input() fileName: string = '';
  @Input() type: string = 'chat';
  @Input() messageId: string = '';
  @Input() origin: string = 'message';
  @Output() deletionEventFromTextArea = new EventEmitter<string>();
  @Output() deletionEventFromMessage = new EventEmitter<string>();

  constructor(private chatService: ChatService, private firebaseService: FirebaseService) {}

  isPdf() {
    return this.fileType === 'application/pdf';
  }

  deleteFile(messageId: string) {
    if (this.origin === 'textarea') {
      this.firebaseService.deleteFile(this.fileUrl);
      this.deletionEventFromTextArea.emit('deletion event');
      this.chatService.deleteFile(messageId, this.type);
    } else {
      this.deletionEventFromMessage.emit(this.fileUrl);
    }
  }
}
