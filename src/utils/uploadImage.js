import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Uploads an image File to Firebase Storage under profileImages/<uid>/<timestamp>.<ext>
 * Returns the public download URL.
 */
export async function uploadProfileImage(file, uid) {
  const ext = file.name.split(".").pop();
  const path = `profileImages/${uid}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
