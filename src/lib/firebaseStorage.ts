import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Deletes a file from Firebase Storage given its download URL.
 * @param downloadURL The download URL of the file to delete.
 */
export const deleteVideoFromFirebase = async (downloadURL: string): Promise<void> => {
    try {
        // Extract the path from the download URL
        // Example URL: https://firebasestorage.googleapis.com/v0/b/[bucket]/o/reels%2Fvideos%2F[filename]?alt=media
        const decodedUrl = decodeURIComponent(downloadURL);
        const pathStart = decodedUrl.indexOf("/o/") + 3;
        const pathEnd = decodedUrl.indexOf("?alt=");
        const filePath = decodedUrl.substring(pathStart, pathEnd);

        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        console.log("File deleted successfully from Firebase Storage");
    } catch (error) {
        console.error("Error deleting file from Firebase Storage:", error);
        // We don't necessarily want to throw here if the file is already gone
    }
};

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 * @param onProgress Callback function to track upload progress (0-100).
 * @returns A promise that resolves to the download URL.
 */
export const uploadVideoToFirebase = (
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Create a unique filename and ensure it is placed in the 'reels/videos' path.
        // In Firebase Storage, prefixes like 'reels/' automatically act as directories.
        const filename = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `reels/videos/${filename}`);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) {
                    onProgress(progress);
                }
            },
            (error) => {
                console.error("Firebase upload error:", error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error) {
                    console.error("Error getting download URL:", error);
                    reject(error);
                }
            }
        );
    });
};
