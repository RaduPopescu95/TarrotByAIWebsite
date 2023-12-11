import { auth, storage } from "../firebase";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  updateMetadata, // Import this module
} from "firebase/storage";
import { getBlobFromUri } from "./getBlobFromUri";

export const uploadImage = async (images, initialImages, noNewImage) => {
  const imageUpload = images[0];
  const authInstance = auth;
  const currentUser = authInstance.currentUser;
  let finalUri;
  const fileName = new Date().getTime();
  try {
    if (!noNewImage) {
      // Create a reference to the file to delete
      const deletedRef = ref(
        storage,
        `images/articles/${currentUser?.uid}/${initialImages}`
      );

      // Delete the file
      deleteObject(deletedRef)
        .then(() => {
          // File deleted successfully
          console.log("File deleted successfully");
        })
        .catch((error) => {
          console.log(
            "Uh-oh, an error occurred! AT uploadImage DELETE...",
            error
          );
          // Uh-oh, an error occurred!
        });
    }

    if (!imageUpload) {
      console.log("Please select an image");
      return;
    }

    const imageRef = ref(
      storage,
      `images/articles/${currentUser?.uid}/${fileName}`
    );

    // Set the content type to image/jpeg
    const metadata = {
      contentType: "image/jpeg",
    };

    // Upload the image with metadata
    const snapshot = await uploadBytes(imageRef, imageUpload, metadata);

    // Get the download URL for the uploaded image
    finalUri = await getDownloadURL(snapshot.ref);

    console.log("Image uploaded successfully. Download URL:", finalUri);
  } catch (error) {
    console.log("Error uploading image to storage:", error.message);
  }
  return { finalUri, fileName };
};

export const uploadImageServices = async (
  images,
  initialImages,
  noNewImage
) => {
  const imageUpload = images[0];
  const authInstance = auth;
  const currentUser = authInstance.currentUser;
  let finalUri;
  const fileName = new Date().getTime();
  try {
    if (!noNewImage) {
      // Create a reference to the file to delete
      const deletedRef = ref(
        storage,
        `images/services/${currentUser?.uid}/${initialImages}`
      );

      // Delete the file
      deleteObject(deletedRef)
        .then(() => {
          // File deleted successfully
          console.log("File deleted successfully");
        })
        .catch((error) => {
          console.log(
            "Uh-oh, an error occurred! AT uploadImage DELETE...",
            error
          );
          // Uh-oh, an error occurred!
        });
    }

    if (!imageUpload) {
      console.log("Please select an image");
      return;
    }

    const imageRef = ref(
      storage,
      `images/services/${currentUser?.uid}/${fileName}`
    );

    // Set the content type to image/jpeg
    const metadata = {
      contentType: "image/jpeg",
    };

    // Upload the image with metadata
    const snapshot = await uploadBytes(imageRef, imageUpload, metadata);

    // Get the download URL for the uploaded image
    finalUri = await getDownloadURL(snapshot.ref);

    console.log("Image uploaded successfully. Download URL:", finalUri);
  } catch (error) {
    console.log("Error uploading image to storage:", error.message);
  }
  return { finalUri, fileName };
};
