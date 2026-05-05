import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { authentication, db } from "../firebase";

export const handleGetUserInfo = async () => {
  let userData = null;
  let auth = authentication;
  try {
    if (!auth.currentUser) {
      console.log("No current user in handleGetUserInfo");
      return null;
    }

    const directSnap = await getDoc(doc(db, "Users", auth.currentUser.uid));
    if (directSnap.exists()) {
      userData = directSnap.data();
      console.log("handleGetUserInfo result:", "User found");
      return userData;
    }

    const q = query(
      collection(db, "Users"),
      where("owner_uid", "==", auth.currentUser.uid),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      userData = doc.data();
    });
    
    console.log("handleGetUserInfo result:", userData ? "User found" : "No user found");
    return userData;
  } catch (err) {
    console.log("error...handleGetUserInfo...", err);
    return null;
  }
};

export const handleGetUserInfoJobs = async () => {
  let userData = null;
  let auth = authentication;
  try {
    if (!auth.currentUser) {
      console.log("No current user in handleGetUserInfoJobs");
      return null;
    }

    const directSnap = await getDoc(doc(db, "Users", auth.currentUser.uid));
    if (directSnap.exists()) {
      userData = directSnap.data();
      console.log("handleGetUserInfoJobs result:", "User found");
      return userData;
    }

    const q = query(
      collection(db, "Users"),
      where("owner_uid", "==", auth.currentUser.uid),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      userData = doc.data();
    });
    
    console.log("handleGetUserInfoJobs result:", userData ? "User found" : "No user found");
    return userData;
  } catch (err) {
    console.log("error...handleGetUserInfoJobs...", err);
    return null;
  }
};
