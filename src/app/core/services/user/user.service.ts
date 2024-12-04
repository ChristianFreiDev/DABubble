import { computed, inject, Injectable, OnDestroy, Signal, signal } from '@angular/core';
import { arrayUnion, doc, getDocs, onSnapshot, query, setDoc, Unsubscribe, updateDoc, where } from '@angular/fire/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { ChatUser } from '../../models/user.class';
import { Auth, signOut, User, user, verifyBeforeUpdateEmail } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy {

  introDone: boolean = false;
  firebaseService = inject(FirebaseService);
  private auth = inject(Auth);
  newUser = new ChatUser();
  private allUsersSignal= signal<ChatUser[]>([]);
  readonly allUsers = this.allUsersSignal.asReadonly();
  unsubUserCol!: Unsubscribe;
  user$ = user(this.auth);
  userSubscription!: Subscription;
  currentUserUIDSignal = signal<string>(environment.guestUid);
  readonly currentUserUID = this.currentUserUIDSignal.asReadonly();
  initialChannelNames: string[] = ['Entwicklerteam', 'Angular'];
  readonly allUsersMap = computed(() => new Map(this.allUsers().map(user => [user.userUID, user])));

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
        this.updateUserDoc(currentUser.uid, {isOnline: true});
        this.currentUserUIDSignal.set(currentUser.uid);
      }
    });
  }


  subUserCol() {
    return onSnapshot(this.firebaseService.getCollectionRef('users'), usersCollection => {
      this.allUsersSignal.set([]);
      usersCollection.forEach(user => {
        this.allUsersSignal().push(new ChatUser(user.data()));
      });
    }
  );
  }


  async addUser(userUID: string, data: object) {
    await setDoc(doc(this.firebaseService.getCollectionRef('users'), userUID), data)
    .catch(
      (err) => {console.error('User hinzufügen error:', err)});
    this.addInitialChannels();
  }


  async updateUserEmailandName(userUID: string, data = {name: '', email: ''}) {
    if (this.auth.currentUser) {
      await verifyBeforeUpdateEmail(this.auth.currentUser, data.email)
        .then(() => {
          this.updateUserDoc(userUID, data);
        })
        .catch((error) => {
          console.log('Email Update Error:', error);
        });
    }
  }


  async updateUserDoc(userUID: string, data = {}) {
    await this.firebaseService.updateDocData('users', userUID, data)
      .catch((error) => {
        console.log('Update User Error:', error);
      })
  }


  async signOutUser() {
    await this.updateUserDoc(this.currentOnlineUser().userUID, {isOnline: false});
    await signOut(this.auth)
      .catch((error) => {
        console.log('Error:', error);
      })
  }


  async updateUserIdsInChannel(channelId: string) {
    await updateDoc(
      this.firebaseService.getDocRef(channelId, 'channels'), {
      userUIDs: arrayUnion(this.currentUserUID())
    });
  }


  addInitialChannels() {
    this.initialChannelNames.forEach(async (channelName) => {
      const q = query(this.firebaseService.getCollectionRef('channels'), where('name', '==', channelName));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc => this.updateUserIdsInChannel(doc.id));
    });
  }


  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.unsubUserCol();
  }

  
}