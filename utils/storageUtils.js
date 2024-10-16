import { authentication, storage } from "../firebase";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  updateMetadata, // Import this module
} from "firebase/storage";
import { getBlobFromUri } from "./getBlobFromUri";
import { writeImg } from "./realtimeUtils";

export const uploadImage = async (
  images,
  initialImages,
  newImage,
  firstLocation,
  secondLocation,
  oldFileName
) => {
  const imageUpload = images[0];
  const authInstance = authentication;
  const currentUser = authInstance.currentUser;
  let finalUri;
  const fileName = new Date().getTime();
  try {
    if (newImage) {
      console.log("is new image...started delete");
      // Create a reference to the file to delete
      const deletedRef = ref(
        storage,
        `images/${firstLocation}/${currentUser?.uid}/${oldFileName}`
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
      `images/${firstLocation}/${currentUser?.uid}/${fileName}`
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
  const authInstance = authentication;
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

export async function getUrlImageApi() {
  const imageRef = ref(storage, `images/PozaApi/apiimage.jpeg`);
  try {
    const url = await getDownloadURL(imageRef);
    writeImg(url);
    return url;
  } catch (error) {
    console.error(error);
    return null; // sau gestionează eroarea după cum consideri necesar
  }
}
