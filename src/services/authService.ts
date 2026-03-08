import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types/user';

export async function signUp(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName });

  const userProfile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    uid: user.uid,
    email: user.email!,
    displayName,
    photoURL: null,
    stripeConnectAccountId: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    expoPushToken: null,
    createdAt: serverTimestamp(),
    totalEarnings: 0,
    averageRating: 0,
    ratingCount: 0,
    subscriptionTier: 'free',
    subscriptionExpiresAt: null,
    monthlyReservationCount: 0,
    lastReservationResetAt: null,
    onboardingCompleted: false,
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);
  return user;
}

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const user = result.user;

  // Create user profile if it doesn't exist
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Usuario',
      photoURL: user.photoURL,
      stripeConnectAccountId: null,
      stripeCustomerId: null,
      expoPushToken: null,
      createdAt: serverTimestamp(),
      totalEarnings: 0,
      averageRating: 0,
      ratingCount: 0,
      subscriptionTier: 'free',
      subscriptionExpiresAt: null,
      monthlyReservationCount: 0,
      lastReservationResetAt: null,
      onboardingCompleted: false,
    });
  }

  return user;
}

export async function logOut() {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return { ...userDoc.data(), uid: userDoc.id } as UserProfile;
}
