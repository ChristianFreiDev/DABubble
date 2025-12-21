import {
  computed,
  EnvironmentInjector,
  inject,
  Injectable,
  OnDestroy,
  runInInjectionContext,
  Signal,
  signal,
} from '@angular/core';
import {
  arrayUnion,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { ChatUser } from '../../models/user.class';
import {
  Auth,
  signOut,
  User,
  user,
  verifyBeforeUpdateEmail,
} from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UserService implements OnDestroy {
  introDone: boolean = false;
  firebaseService = inject(FirebaseService);
  private auth = inject(Auth);
  private environmentInjector = inject(EnvironmentInjector);
  newUser = new ChatUser();
  private allUsersSignal = signal<ChatUser[]>([]);
  readonly allUsers = this.allUsersSignal.asReadonly();
  unsubUserCol!: Unsubscribe;
  user$ = user(this.auth);
  userSubscription!: Subscription;
  currentUserUIDSignal = signal<string>('');
  readonly currentUserUID = this.currentUserUIDSignal.asReadonly();
  initialChannelNames: string[] = ['Entwicklerteam', 'Angular'];
  readonly allUsersMap = computed(
    () => new Map(this.allUsers().map((user) => [user.userUID, user]))
  );

  readonly currentOnlineUser: Signal<ChatUser> = computed(() => {
    const currentUser = this.allUsersMap().get(this.currentUserUID());
    if (currentUser) {
      return currentUser;
    } else {
      return new ChatUser();
    }
  });

  constructor() {}

  initUsers() {
    this.unsubUserCol = this.subUserCol();
    this.userSubscription = this.user$.subscribe((currentUser: User | null) => {
      if (currentUser) {
        this.updateUserDoc(currentUser.uid, { isOnline: true });
        this.currentUserUIDSignal.set(currentUser.uid);
      }
    });
  }

  subUserCol() {
    return runInInjectionContext(this.environmentInjector, () => {
      return onSnapshot(
        this.firebaseService.getCollectionRef('users'),
        (usersCollection) => {
          this.allUsersSignal.set([]);
          usersCollection.forEach((user) => {
            this.allUsersSignal.update((values) => [
              ...values,
              new ChatUser(user.data()),
            ]);
          });
        }
      );
    });
  }

  async addUser(userUID: string, data: object) {
    runInInjectionContext(this.environmentInjector, async () => {
      await setDoc(
        doc(this.firebaseService.getCollectionRef('users'), userUID),
        data
      );
    }).catch((err) => {
      console.error('Error when trying to add a user');
    });
    this.addInitialChannels();
  }

  async updateUserEmailandName(
    userUID: string,
    data = { name: '', email: '' }
  ) {
    if (this.auth.currentUser) {
      await verifyBeforeUpdateEmail(this.auth.currentUser, data.email)
        .then(() => {
          this.updateUserDoc(userUID, data);
        })
        .catch((error) => {
          console.error('Email update error');
        });
    }
  }

  async updateUserDoc(userUID: string, data = {}) {
    await this.firebaseService
      .updateDocData('users', userUID, data)
      .catch((error) => {
        console.error('User update error');
      });
  }

  async signOutUser() {
    this.currentUserUIDSignal.set('');
    return await runInInjectionContext(this.environmentInjector, () => {
      return signOut(this.auth).catch((error) => {
        console.error('Error when signing out');
      });
    });
  }

  async updateUserIdsInChannel(channelId: string) {
    runInInjectionContext(this.environmentInjector, async () => {
      if (this.auth.currentUser) {
        await updateDoc(this.firebaseService.getDocRef(channelId, 'channels'), {
          userUIDs: arrayUnion(this.auth.currentUser.uid),
        });
      }
    });
  }

  addInitialChannels() {
    this.initialChannelNames.forEach(async (channelName) => {
      const q = runInInjectionContext(this.environmentInjector, () =>
        query(
          this.firebaseService.getCollectionRef('channels'),
          where('name', '==', channelName)
        )
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => this.updateUserIdsInChannel(doc.id));
    });
  }

  getUserName(targetUserUID: string) {
    const user = this.allUsersSignal().find(
      (user) => user.userUID === targetUserUID
    );
    if (user) {
      return user.name;
    } else {
      return undefined;
    }
  }

  unsub() {
    this.userSubscription.unsubscribe();
    this.unsubUserCol();
  }

  ngOnDestroy(): void {
    this.unsub();
  }
}
