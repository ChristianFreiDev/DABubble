import { computed, Injectable, signal } from '@angular/core';
import { LayoutStateSignal } from '../../models/layout-state-signal.interface';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  public selectedCollection = signal<string>('newMessages');
  private isThreadSelected = signal<boolean>(false);
  public isSideNavSelected = signal<boolean>(true);

  constructor() {}

  public winWidth = signal<number>(1920);
  public isDesktop = computed(() => this.winWidth() > 1200);
  public isTablet = computed(
    () => this.winWidth() <= 1200 && this.winWidth() > 768
  );
  public isMobile = computed(() => this.winWidth() <= 768);

  selectChat() {
    this.selectedCollection.set('channels');
  }

  selectDirectMessage() {
    this.selectedCollection.set('directMessageChannels');
  }

  selectNewMessage() {
    this.selectedCollection.set('newMessages');
    this.selectThread(false);
  }

  selectThread(bool: boolean) {
    this.isThreadSelected.set(bool);
  }

  selectSideNav(bool: boolean) {
    this.isSideNavSelected.set(bool);
  }

  deselectSideNavOnMobile() {
    if (this.isMobile()) {
      this.selectSideNav(false);
    }
  }

  adaptLayoutToDesktop(signal: LayoutStateSignal) {
    if (this.selectedCollection() === 'channels') {
      signal.isChatOpen = true;
    } else if (this.selectedCollection() === 'directMessageChannels') {
      signal.isDirectMessageOpen = true;
    } else if (this.selectedCollection() === 'newMessages') {
      signal.isNewMessageOpen = true;
    }
    if (this.isSideNavSelected()) {
      signal.isSideNavOpen = true;
    }
    if (this.isThreadSelected()) {
      signal.isThreadOpen = true;
    }
  }

  adaptLayoutToTablet(signal: LayoutStateSignal) {
    if (this.isThreadSelected()) {
      signal.isThreadOpen = true;
    } else {
      if (this.selectedCollection() === 'channels') {
        signal.isChatOpen = true;
      } else if (this.selectedCollection() === 'directMessageChannels') {
        signal.isDirectMessageOpen = true;
      } else if (this.selectedCollection() === 'newMessages') {
        signal.isNewMessageOpen = true;
      }
    }
    if (this.isSideNavSelected()) {
      signal.isSideNavOpen = true;
    }
  }

  adaptLayoutToMobile(signal: LayoutStateSignal) {
    if (this.isSideNavSelected()) {
      signal.isSideNavOpen = true;
    } else if (this.isThreadSelected()) {
      signal.isThreadOpen = true;
    } else if (this.selectedCollection() === 'channels') {
      signal.isChatOpen = true;
    } else if (this.selectedCollection() === 'directMessageChannels') {
      signal.isDirectMessageOpen = true;
    } else if (this.selectedCollection() === 'newMessages') {
      signal.isNewMessageOpen = true;
    }
  }

  readonly layoutState = computed(() => {
    const signal: LayoutStateSignal = {
      isSideNavOpen: false,
      isThreadOpen: false,
      isChatOpen: false,
      isDirectMessageOpen: false,
      isNewMessageOpen: false,
    };
    if (this.isDesktop()) {
      this.adaptLayoutToDesktop(signal);
    } else if (this.isTablet()) {
      this.adaptLayoutToTablet(signal);
    } else if (this.isMobile()) {
      this.adaptLayoutToMobile(signal);
    }
    return signal;
  });

  onResize(width: number) {
    this.winWidth.set(width);
  }

  toggleSideNavVisbility() {
    this.isSideNavSelected.set(!this.isSideNavSelected());
  }

  toggleThreadVisibility() {
    this.isThreadSelected.set(!this.isThreadSelected());
  }
}
