import {
  EnvironmentInjector,
  Injectable,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { collection, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  Storage,
  uploadBytesResumable,
} from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  firestore: Firestore = inject(Firestore);
  private readonly storage: Storage = inject(Storage);
  private environmentInjector = inject(EnvironmentInjector);
  private uploadProgressSignal = signal<number>(0);
  readonly uploadProgress = this.uploadProgressSignal.asReadonly();
  downloadURL: string = '';

  getDocRef(docId: string, collectionName: string) {
    return runInInjectionContext(this.environmentInjector, () => {
      return doc(this.getCollectionRef(collectionName), docId);
    });
  }

  getDocRefInSubcollection(
    docId1: string,
    collectionName: string,
    subcollectionName: string,
    docId2: string
  ) {
    return runInInjectionContext(this.environmentInjector, () => {
      return doc(
        this.firestore,
        collectionName,
        docId1,
        subcollectionName,
        docId2
      );
    });
  }

  getCollectionRef(collectionName: string) {
    return runInInjectionContext(this.environmentInjector, () => {
      return collection(this.firestore, collectionName);
    });
  }

  getSubcollectionRef(
    docId: string,
    collectionName: string,
    subcollectionName: string
  ) {
    return runInInjectionContext(this.environmentInjector, () => {
      return collection(
        this.getDocRef(docId, collectionName),
        subcollectionName
      );
    });
  }

  async uploadFileToStorage(file: File, path: string) {
    const storageRef = runInInjectionContext(this.environmentInjector, () =>
      ref(this.storage, path)
    );
    const uploadTask = runInInjectionContext(this.environmentInjector, () =>
      uploadBytesResumable(storageRef, file)
    );

    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          this.uploadProgressSignal.set(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
        },
        (error) => {
          reject(error.code);
        },
        async () => {
          resolve(
            (this.downloadURL = await runInInjectionContext(
              this.environmentInjector,
              () => getDownloadURL(uploadTask.snapshot.ref)
            ))
          );
        }
      );
    });
  }

  async deleteFile(path: string) {
    const storageRef = runInInjectionContext(this.environmentInjector, () =>
      ref(this.storage, path)
    );
    try {
      await runInInjectionContext(this.environmentInjector, () =>
        deleteObject(storageRef)
      );
    } catch (error) {
      console.error('Error when trying to delete a file');
    }
  }

  getSubSubcollectionRef(
    collectionName: string,
    docId1: string,
    subcollectionName: string,
    docId2: string,
    subSubCollectionName: string
  ) {
    return runInInjectionContext(this.environmentInjector, () => {
      return collection(
        this.firestore,
        collectionName,
        docId1,
        subcollectionName,
        docId2,
        subSubCollectionName
      );
    });
  }

  getDocRefInSubSubcollection(
    collectionName: string,
    docId1: string,
    subcollectionName: string,
    docId2: string,
    subSubCollectionName: string,
    docId3: string
  ) {
    return runInInjectionContext(this.environmentInjector, () => {
      return doc(
        this.firestore,
        collectionName,
        docId1,
        subcollectionName,
        docId2,
        subSubCollectionName,
        docId3
      );
    });
  }

  async updateDocData(collectionName: string, docId: string, data: any) {
    let docRef = this.getDocRef(docId, collectionName);
    await runInInjectionContext(this.environmentInjector, () => {
      return updateDoc(docRef, data);
    });
  }
}
