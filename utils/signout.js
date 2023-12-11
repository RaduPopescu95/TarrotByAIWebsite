import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { auth } from "../firebase";

export const handleSignOut = (route) => {
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      route.push("/signin");
    })
    .catch((error) => {
      console.log("Error at signout...", error);
      // An error happened.
    });
};
