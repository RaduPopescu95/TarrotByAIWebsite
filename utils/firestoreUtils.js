import {
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  addDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  where,
  query,
  collectionGroup,
  startAt,
} from "firebase/firestore";
import { authentication, db } from "../firebase";
import { handleDeleteAccount } from "./authUtils";

const auth = authentication;
export const userLocation = `Users/${
  auth.currentUser ? auth.currentUser.uid : ""
}`; // Calea către document

export const handleUpdateFirestore = async (location, updatedData) => {
  try {
    const ref = doc(db, location);

    await updateDoc(ref, updatedData);
  } catch (err) {
    console.log("Error on...handleUpdateFirestore...", err);
  }
};
export const handleUploadFirestore = async (data, location) => {
  try {
    console.log("test....");
    console.log(location);
    console.log(data);
    // pentru a face UPLOAD CU UN NUME DE DOCUMENT PREDEFINIT
    // const ref = doc(db, location);
    // await setDoc(ref, data);
    // pentru a face UPLOAD CU UN NUME DE DOCUMENT CREATE ALEATORIU
    await addDoc(collection(db, location), data);
  } catch (err) {
    console.log("Error on...handleUploadFirestore...", err);
  }
};

//ADD A DOCUMENT IN THE SUBCOLLECTION
export const handleUploadFirestoreSubcollection = async (data, location) => {
  console.log("create subcollection history...", data);
  try {
    const createdAt = Date.now();

    const currentDate = new Date();
    const formattedDate =
      currentDate.getDate().toString().padStart(2, "0") +
      "." +
      (currentDate.getMonth() + 1).toString().padStart(2, "0") +
      "." +
      currentDate.getFullYear();
    console.log(formattedDate);
    // Obține ultimele cifre ale timestamp-ului curent
    const timestamp = new Date().getTime().toString().slice(-5);

    // Generează un număr aleator între 0 și 99
    const randomComponent = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");

    // Creează ID-ul combinând o parte din ștampelul de timp și componenta aleatoare
    const uniqueId = `${timestamp}${randomComponent}`.slice(0, 7);

    console.log("ID unic:", uniqueId);
    let dataObj = {
      data,
      id: uniqueId,
      date: formattedDate,
      createdAt,
    };

    await addDoc(collection(db, location), dataObj);
    // console.log(location);
    // console.log(data);
    // await setDoc(ref, data);
  } catch (err) {
    console.log("Error on...handleUploadFirestore...", err);
  }
};

export const handleDeleteFirestore = async (location, currentPassword) => {
  try {
    const ref = doc(db, location);

    await deleteDoc(ref).then(() => {
      handleDeleteAccount(currentPassword);
    });
  } catch (err) {
    console.log("Error on...handleDeleteFirestore...", err);
  }
};

export const handleGetFirestore = async (location) => {
  let arr = []; // Specificați tipul de obiecte pe care îl conține matricea
  const querySnapshot = await getDocs(collection(db, location));
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, ` ${location} => `, doc.data());
    arr.push(doc.data());
  });
  return arr;
};

export const handleGetFirestoreSingleArrayData = async (location) => {
  console.log("Start...take from firestore array single", location);
  try {
    let arr = []; // Specificați tipul de obiecte pe care îl conține matricea
    const querySnapshot = await getDocs(collection(db, location));
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      console.log(doc.id, ` ${location} => `, doc.data());
      arr = doc.data();
    });
    return arr;
  } catch (err) {
    console.log("Error at handleGetFirestoreSingleArrayData...", err);
    return [];
  }
};

export const handleQueryFirestore = async (location, carte, categorie) => {
  console.log("start query firestore carte...", carte);
  console.log("start query firestore categorei...", categorie);
  let arr = []; // Specificați tipul de obiecte pe care îl conține matricea
  const q = query(
    collection(db, location),
    where("carte", "==", carte),
    where("categorie", "==", categorie)
  );

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, " => ", doc.data());
    arr.push(doc.data().data);
  });
  return arr;
};
export const handleQueryRandom = async (location, id) => {
  console.log("start query firestore location...", location);
  console.log("start query firestore id...", id);
  let obj = {}; // Specificați tipul de obiecte pe care îl conține matricea
  const q = query(collection(db, location), where("id", "==", id));

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, " => ", doc.data());
    // arr.push(doc.data().data);
    obj = { ...doc.data() };
  });
  return obj;
};

export const handlePaginateFirestore = (location) => {
  const auth = authentication;
  const citiesRef = collection(db, "Users", auth.currentUser.uid, location);
  const q = query(citiesRef, startAt(1000000));
};
