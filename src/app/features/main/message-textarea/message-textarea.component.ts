import { Component, ComponentRef, effect, ElementRef, Input, Renderer2, Signal, ViewChild, ViewContainerRef } from '@angular/core';
import { ChatService } from '../../../core/services/chat/chat.service';
import { FormsModule } from '@angular/forms';
import { AtComponent } from './at/at.component';
import { ChatUser } from '../../../core/models/user.class';
import { MentionComponent } from './mention/mention.component';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { FirebaseService } from '../../../core/services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../core/models/channel.class';
import { ChannelMentionComponent } from './channel-mention/channel-mention.component';
import { DeletableFileComponent } from '../deletable-file/deletable-file.component';
import { LayoutService } from '../../../core/services/layout/layout.service';
import { SideNavService } from '../../../core/services/sideNav/side-nav.service';
import { EventService } from '../../../core/services/event/event.service';
import { DialogService } from '../../../core/services/dialog/dialog.service';

@Component({
    selector: 'app-message-textarea',
    imports: [AtComponent, EmojiPickerComponent, DeletableFileComponent, FormsModule, CommonModule],
    templateUrl: './message-textarea.component.html',
    styleUrl: './message-textarea.component.scss'
})
export class MessageTextareaComponent {
  @Input() placeholder: string = 'Nachricht an #';
  @Input() type: string = 'chat';
  @Input() messagesContainerRef!: HTMLElement;
  @Input() textAreaDisabled = false;
  @Input() isNewMessage = false;
  messageText = '';
  isAtVisible: Signal<boolean> = this.dialogService.opentAt;
  isEmojiPickerVisible: Signal<boolean> = this.dialogService.openEmojiPicker;
  @ViewChild('editableTextarea') editableTextarea!: ElementRef;
  @ViewChild('mentionInsertion', { read: ViewContainerRef }) mentionInsertion!: ViewContainerRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  uploadFile: null | 'inProgress' | 'done' = null;
  uploadError: boolean = false;
  fileUrl: string = '';
  fileName: string = '';
  fileType: string = '';
  users: Signal<ChatUser[]> = this.chatService.usersInCurrentChannelWithoutCurrentUser;
  channels: Signal<Channel[]> = this.chatService.channels;
  usersOrChannels: Signal<ChatUser[]> | Signal<Channel[]> = this.users;

  constructor(private chatService: ChatService, private firebaseService: FirebaseService, private renderer: Renderer2, private eventService: EventService, private layoutService: LayoutService, 
    public sideNavService: SideNavService, private dialogService: DialogService
  ) { 
    effect(() => {
      if (this.eventService.focusEvent()) {
        this.editableTextarea.nativeElement.focus();
        setTimeout(() => {
          this.scrollToBottom('auto');
        }, 0);
      }
    });
  }

  ngOnInit() {
    if (this.type === 'thread') {
      this.isAtVisible = this.dialogService.openAtForThread;
      this.isEmojiPickerVisible = this.dialogService.openEmojiPickerForThread;
    }
  }

  resetAfterAddingMessage() {
    this.messageText = '';
    this.editableTextarea.nativeElement.innerHTML = '';
    this.resetInput();
    setTimeout(() => {
      this.scrollToBottom('smooth');
    }, 1);
  }

  addMessage() {
   if (!this.textAreaDisabled) {
    this.saveMessageText();
    if (this.messageText.length > 0) {
      if (this.type === 'chat') {
        this.chatService.addChatMessage(this.messageText, this.fileUrl, this.fileType, this.fileName);
        if (this.isNewMessage) {
          this.chatService.openChannel(this.chatService.channelID);
          this.layoutService.selectChat()
        }
      } else if (this.type === 'thread') {
        this.chatService.addThreadReply(this.messageText, this.fileUrl, this.fileType, this.fileName);
      } else {
        this.chatService.addDirectMessage(this.messageText, this.fileUrl, this.fileType, this.fileName);
        if (this.isNewMessage) {
          this.chatService.openChat(this.chatService.contactUUID);
        }
      }
      this.resetAfterAddingMessage();
    }
   }
  }

  resetUploadData() {
    this.uploadFile = null;
    this.uploadError = false;
    this.fileUrl = '';
    this.fileName = '';
    this.fileType = '';
  }

  resetInput() {
    this.resetUploadData();
    this.fileInput.nativeElement.value = null;
  }

  deleteFile() {
    this.firebaseService.deleteFile(this.fileUrl);
  }

  handleInputClick(event: Event) {
    if (this.uploadFile === 'done') {
      this.deleteFile();
      this.resetInput();
      event?.preventDefault();
    } else if (this.uploadFile === 'inProgress') {
      event?.preventDefault();
    }
  }

  keys = {
    shift: false,
    enter: false
  }

  handleTextAreaKeyDown(event: KeyboardEvent) {
    if (event.key === '@') {
      this.usersOrChannels = this.users;
      if (!this.isAtVisible()) {
        this.toggleAtVisibility();
      }
    } else if (event.key === '#') {
      this.usersOrChannels = this.channels;
      if (!this.isAtVisible()) {
        this.toggleAtVisibility();
      }
    } else if (event.key === 'Enter') {
      this.keys.enter = true;
    } else if (event.key === 'Shift') {
      this.keys.shift = true;
    }
    if (this.keys.enter && !this.keys.shift) {
      event.preventDefault();
      this.addMessage();
    }
  }

  handleTextAreaKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.keys.enter = false;
    } else if (event.key === 'Shift') {
      this.keys.shift = false;
    }
  }

  toggleUserVisibility() {
    this.usersOrChannels = this.users;
    this.toggleAtVisibility();
  }

  toggleAtVisibility() {
    if (this.usersOrChannels().length > 0) {
      if (this.type === 'chat' || this.type === 'directMessage') {
        this.dialogService.toggleAtVisibility();
      } else {
        this.dialogService.toggleAtForThreadVisibility();
      }
    }
  }

  toggleEmojiPickerVisibility() {
    if (this.type === 'chat' || this.type === 'directMessage') {
      this.dialogService.toggleEmojiPickerVisibility();
    } else {
      this.dialogService.toggleEmojiPickerForThreadVisibility();
    }
  }

  removeBrTag() {
    if (this.editableTextarea.nativeElement.textContent == '') {
      const child = this.editableTextarea.nativeElement.firstElementChild;
      if (child && child.tagName === 'BR') {
        child.remove();
      }
    }
  }

  addMention(userOrChannel: ChatUser | Channel) {
    let sel = window.getSelection();
    sel?.modify('move', 'backward', 'character');
    sel?.modify('extend', 'forward', 'character');
    const selString = sel?.toString();
    if (selString === '@' || selString === '#') {
      sel?.deleteFromDocument();
    }
    this.removeBrTag();
    let mention!: ComponentRef<MentionComponent> | ComponentRef<ChannelMentionComponent>;
    if (userOrChannel instanceof ChatUser) {
      mention = this.mentionInsertion.createComponent(MentionComponent);
      mention.instance.user = userOrChannel;
    } else {
      mention = this.mentionInsertion.createComponent(ChannelMentionComponent);
      mention.instance.channel = userOrChannel;
    }
    this.renderer.appendChild(this.editableTextarea.nativeElement, mention.location.nativeElement);
    this.setRangeToEnd();
  }

  setRangeToEnd() {
    this.editableTextarea.nativeElement.focus()
    window.getSelection()?.selectAllChildren(this.editableTextarea.nativeElement);
    window.getSelection()?.collapseToEnd();
  }

  saveMessageText() {
    this.messageText = this.editableTextarea.nativeElement.textContent;
  }

  insertEmoji(emoji: string) {
    this.removeBrTag();
    this.editableTextarea.nativeElement.innerHTML += emoji;
  }

  isImage(fileType: string) {
    return fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/svg+xml' || fileType === 'image/webp';
  }

  addFile(input: HTMLInputElement) {
    this.uploadFile = 'inProgress';
    this.uploadError = false;
    const file = input.files?.item(0);
    if (file) {
      this.fileName = file.name;
      switch (true) {
        case (!this.isImage(file.type) && file.type != 'application/pdf'):
          this.handleUploadError('type');
          break;
        case file.size >= 500000:
          this.handleUploadError('size');
          break;
        default:
          this.fileType = file.type;
          this.uploadFileToStorage(file);
      }
    }
  }

  async uploadFileToStorage(file: File) {
    try {
      const path = `channels/${this.chatService.currentChannel().id}/${self.crypto.randomUUID()}/${file.name}`;
      await this.firebaseService.uploadFileToStorage(file, path);
      this.fileUrl = this.firebaseService.downloadURL;
      this.uploadFile = 'done';
    } catch (error) {
      this.handleUploadError('else');
      console.log('Error:', error);
    }
  }

  handleUploadError(info: string) {
    this.resetInput();
    this.dialogService.showUploadError(info);
  }

  scrollToBottom(behavior: 'smooth' | 'auto') {
    if (this.messagesContainerRef) {
      this.messagesContainerRef.scrollTo({
        top: this.messagesContainerRef.scrollHeight,
        behavior: behavior
      })
    }
  }
}
