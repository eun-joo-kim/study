// Firestore Security Rules
// Go to Firebase Console > Firestore Database > Rules tab and paste this

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own projects
    match /projects/{document=**} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
