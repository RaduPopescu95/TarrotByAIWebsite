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
  getCountFromServer,
  orderBy,
  limit,
} from "firebase/firestore";
import { authentication, db } from "../firebase";
import { handleDeleteAccount } from "./authUtils";
import { filterArticlesBeforeCurrentTime } from "./commonUtils";
import { getCurrentDateTime } from "../utils/timeUtils";

const auth = authentication;
export const userLocation = `Users/${
  auth.currentUser ? auth.currentUser.uid : ""
}`; // Calea către document

export const getFirestoreCollectionLength = async (location) => {
  const coll = collection(db, location);
  const snapshot = await getCountFromServer(coll);
  console.log("count: ", snapshot.data().count);

  return snapshot.data().count;
};

export const handleUpdateFirestore = async (location, updatedData) => {
  try {
    //current date
    const dateTime = getCurrentDateTime();

    const ref = doc(db, location);

    const newData = {
      ...updatedData,
      EditDate: dateTime.date,
      Edittime: dateTime.time,
    };

    await updateDoc(ref, newData);
  } catch (err) {
    console.log("Error on...handleUpdateFirestore...", err);
  }
};
export const handleUploadFirestore = async (data, location) => {
  try {
    console.log("test.infor in handle upload firestore...", data);
    console.log(location);
    console.log(data);

    // Crează un nou document în colecție cu un ID generat automat
    const docRef = doc(collection(db, location));

    // preia length of location collection

    const collectionLength = await getFirestoreCollectionLength(location);
    let id = collectionLength + 1;

    //current date
    const dateTime = getCurrentDateTime();
    let date;
    if(data.timpProgramat.length > 0){
      const dateParts = data.dataProgramata.split('-');
      const timeParts = data.timpProgramat.split(':');
      date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
      
    }else{
      const dateParts = dateTime.date.split('-');
      const timeParts = dateTime.time.split(':');
      date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);

    }


    // Adaugă ID-ul generat în obiectul data
    const newData = {
      ...data,
      documentId: docRef.id,
      id,
      firstUploadtime: data.timpProgramat.length > 0 ? data.timpProgramat : dateTime.time,
      firstUploadDate: data.dataProgramata.length > 0 ? data.dataProgramata : dateTime.date,
      firstUploadTimestamp:date

    };

    // Face upload cu noul obiect de date care include ID-ul documentului
    await setDoc(docRef, newData);

    console.log(`Documentul cu ID-ul ${docRef.id} a fost adăugat cu succes.`);
    return newData;
  } catch (err) {
    console.log("Eroare la handleUploadFirestore...", err);
  }
};

//ADD A DOCUMENT IN THE SUBCOLLECTION
export const handleUploadFirestoreSubcollection = async (data, location) => {
  console.log("create subcollection history...", data);
  try {
    const collectionLength = await getFirestoreCollectionLength(location);
    let id = collectionLength + 1;
    // Adăugarea documentului în subcolecție

    const docRef = doc(collection(db, location));

    // Actualizarea datelor cu ID-ul documentului generat
    const newData = { ...data, documentId: docRef.id, id };
    await setDoc(docRef, newData); // Actualizează documentul cu noul set de date, dacă este necesar

    console.log(`Document adăugat în subcolecție cu ID-ul: ${docRef.id}`);
  } catch (err) {
    console.log("Error on...handleUploadFirestoreSubcollection...", err);
  }
};

export const handleDeleteFirestoreAccount = async (
  location,
  currentPassword
) => {
  try {
    const ref = doc(db, location);

    await deleteDoc(ref).then(() => {
      handleDeleteAccount(currentPassword);
    });
  } catch (err) {
    console.log("Error on...handleDeleteFirestore...", err);
  }
};

//get firestore docs from a collection
export const handleGetFirestore = async (location) => {
  console.log("star....")
  let arr = []; // Specificați tipul de obiecte pe care îl conține matricea
  const querySnapshot = await getDocs(collection(db, location));
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
  
    arr.push(doc.data());
  });

  return arr;
};

//DELETE FROM FIRESTORE DATA

export const handleDeleteFirestoreData = async (
  locationToDelete,
  getNewData,
  locationToGet = null
) => {
  try {
    const ref = doc(db, locationToDelete);
    await deleteDoc(ref);

    // Dacă getNewData este true, procedează la obținerea și actualizarea datelor
    if (getNewData) {
      const data = await handleGetFirestore(locationToGet); // Presupunem că returnează un array de obiecte

      // Sortează datele în ordinea crescătoare a ID-urilor
      data.sort((a, b) => a.id - b.id);

      let updatedData = []; // Inițializează un array gol pentru a stoca datele actualizate

      // Actualizează ID-urile documentelor rămase pentru a fi consecutive
      for (let i = 0; i < data.length; i++) {
        const newId = i + 1; // Calculul noului ID
        const docRef = doc(db, locationToGet, data[i].documentId); // Presupunem că fiecare document are un `docId` unic
        await updateDoc(docRef, {
          id: newId, // Actualizează ID-ul pentru a fi consecutiv
        });

        // Adaugă documentul actualizat în array-ul updatedData cu noul ID
        updatedData.push({
          ...data[i],
          id: newId,
        });
      }

      return updatedData; // Returnează datele actualizate dacă getNewData este true
    }
    // Dacă getNewData este false, nu returna nimic sau returnează o valoare specifică
    return null; // Sau orice altă valoare semnificativă pentru cazul tău
  } catch (err) {
    console.log("Error on...handleDeleteFirestore...", err);
    // Returnează null sau o valoare de eroare specifică în caz de eroare
    return null;
  }
};

//get all subcolletion from a collection
export const handleGetSubcollections = async (subcollection) => {
  try {
    // Creează o interogare pentru grupul de colecții "Localitati"
    const q = query(collectionGroup(db, subcollection));

    // Execută interogarea și preia documentele
    const querySnapshot = await getDocs(q);

    // Crează un array pentru a stoca rezultatele
    const docs = [];

    // Iterează prin rezultatele interogării
    querySnapshot.forEach((doc) => {
      // Adaugă documentul la array
      docs.push({ ...doc.data() });
    });

    // Returnează array-ul de localități
    return docs;
  } catch (err) {
    console.error("Eroare la preluarea subcolectiilor..... ", err);
    throw err; // Repropagă eroarea
  }
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

export const handleQueryFirestore = async (
  location,
  queryParamOne,
  elementOne = null,
  queryParamTwo = null,
  elementTwo = null
) => {
  console.log("start query firestore pentru elementOne...", elementOne);
  console.log("start query firestore pentru elementTwo...", elementTwo);
  let arr = []; // Specificați tipul de obiecte pe care îl conține matricea, de exemplu: let arr = [{}];
  let conditions = [];

  conditions.push(collection(db, location));

  if (elementOne) {
    conditions.push(where(queryParamOne, "==", elementOne));
  }

  if (elementTwo) {
    conditions.push(where(queryParamTwo, "==", elementTwo));
  }

  const q = query(...conditions);

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, " => ", doc.data());
    arr.push(doc.data()); // Dacă dorești să adaugi un anumit câmp, specifică, de exemplu: doc.data().numeCamp
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


export const fetchArticlesPage = async (refresh = false, lastVisible = null) => {
 try{ let PAGE_SIZE = 4;
  let articles = [];
  
  let articlesRef = collection(db, 'BlogArticole');
  let q = query(articlesRef, orderBy('firstUploadDate', 'desc'), orderBy('firstUploadtime', 'desc'), limit(PAGE_SIZE));
  
  if (!refresh && lastVisible) {
    q = query(articlesRef, orderBy('firstUploadDate', 'desc'), orderBy('firstUploadtime', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
  }
  
  const documentSnapshots = await getDocs(q);
  let moreArticles = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  moreArticles = filterArticlesBeforeCurrentTime(moreArticles);
  articles = refresh ? moreArticles : [...articles, ...moreArticles];
  console.log("Start fetch...", articles)
  lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
  return {articles, lastVisible}
} catch(err) {
  console.error("Error fetching articles:", err);
  return { articles: [], lastVisible: null }; // Returnează o valoare implicită pentru a evita erorile
}

};

