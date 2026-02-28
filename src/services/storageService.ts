import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload an image to Firebase Storage and return the download URL.
 */
export async function uploadSpotPhoto(
  uri: string,
  spotId: string
): Promise<string> {
  // Convert URI to blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = `spots/${spotId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  // Upload with metadata
  const metadata = {
    contentType: 'image/jpeg',
  };

  await uploadBytesResumable(storageRef, blob, metadata);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Upload a user profile photo
 */
export async function uploadProfilePhoto(
  uri: string,
  userId: string
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = `profiles/${userId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  await uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });
  return await getDownloadURL(storageRef);
}
