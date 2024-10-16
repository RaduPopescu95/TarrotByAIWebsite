import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateEmail,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";

import { authentication } from "../firebase";
import { FirebaseError } from "firebase/app";

import { deleteUserData } from "./deleteFirebaseData";

const auth = authentication;

export const handleChangeEmail = async (currentPassword, newEmail) => {
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    console.log("user...", user);
    // Încercăm reautentificarea
    await reauthenticateWithCredential(user, credential);
    console.log("Reautentificare reușită.");

    // Dacă reautentificarea a reușit, încercăm să actualizăm emailul
    try {
      await verifyBeforeUpdateEmail(user, newEmail);
      console.log("Actualizarea emailului reușită.");
      return ""; // Returnăm un șir gol pentru a indica succesul
    } catch (error) {
      // Prindem orice eroare care apare la actualizarea emailului
      console.error("Eroare la actualizarea emailului:", error);
      return handleFirebaseAuthError(error); // Returnăm mesajul de eroare
    }
  } catch (error) {
    // Prindem orice eroare care apare la reautentificare
    console.error("Eroare la reautentificare:", error);
    return handleFirebaseAuthError(error); // Returnăm mesajul de eroare
  }
};

export const handleChangePassword = async (currentPassword, newPassword) => {
  console.log("change passowrd...");
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential)
      .then(async () => {
        await updatePassword(user, newPassword)
          .then(() => {
            console.log("password succesfuly changed");
          })
          .catch((error) => {
            console.log("password error changed", error);
          });
      })
      .catch((err) => {
        if (err.code == "auth/wrong-password") {
        } else if (err.code == "auth/too-many-requests") {
        }
      });
  } catch (err) {
    console.log("error on handlechange pass", err);
  }
};

export const handleLogout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Failed to log out.");
  }
};

export const handleDeleteAccount = async (currentPassword) => {
  try {
    const auth = authentication;
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    console.log("-------test----");
    const result = await reauthenticateWithCredential(
      auth.currentUser,
      credential
    );

    await deleteUser(result.user).then(() => {
      console.log("deleted successfuly...auth account");
    });
  } catch (error) {
    console.error("error delete user auth or firestore...", error);
  }
};

export const handleResetPassword = async (email) => {
  const user = auth.currentUser;
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error(error);
  }
};

// firebaseErrors.js

// handleFirebaseAuthError.js
export const handleFirebaseAuthError = (error) => {
  let message = "";
  console.log("test...", error.code);
  switch (error.code) {
    case "auth/invalid-email":
      message = "firebaseErrorInvalidEmail";
      break;
    case "auth/email-already-in-use":
      message = "firebaseErrorEmailAlreadyInUse";
      break;
    case "auth/weak-password":
      message = "firebaseErrorWeakPassword";
      break;
    case "auth/user-not-found":
      message = "firebaseErrorUserNotFound";
      break;
    case "auth/user-disabled":
      message = "firebaseErrorUserDisabled";
      break;
    case "auth/wrong-password":
      message = "firebaseErrorWrongPassword";
      break;
    case "auth/too-many-requests":
      message = "firebaseErrorTooManyRequests";
      break;
    case "auth/operation-not-allowed":
      message = "firebaseErrorOperationNotAllowed";
      break;
    case "auth/network-request-failed":
      message = "firebaseErrorNetworkRequestFailed";
      break;
    case "auth/invalid-credential":
      message = "firebaseErrorInvalidCredentials";
      break;
    default:
      message = "firebaseErrorUnknown";
  }
  return message;
};
