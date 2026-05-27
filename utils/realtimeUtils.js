import "../firebase";

import {
  getDatabase,
  ref,
  get,
  child,
  set,
  update,
} from "firebase/database";
import {
  getFirestoreDataset,
  setFirestoreDatasetItem,
  updateFirestoreDatasetItem,
} from "./tarotFirestoreRepository";
import {
  DATA_SOURCE_MODES,
  getTarotDataSourceMode,
  isFirestoreEligibleDataset,
} from "./tarotDataSource";
import {
  logDataSourceDecision,
  logRtdbRead,
  logRtdbWrite,
} from "./realtimeMetrics";

const FEATURE_NAME = "tarot_dataset";

async function readFromRtdb(locationName, secondLocationName) {
  const path = `${locationName}/${secondLocationName}`;
  const dbRef = ref(getDatabase());
  const snapshot = await get(child(dbRef, path));
  const arr = [];

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      arr.push(childSnapshot.val());
    });
  } else {
    console.log("No data available");
  }
  logRtdbRead(path, arr);
  return { arr };
}

export const editData = async (data, locationName, secondLocationName, id) => {
  console.log("Start edit...");
  console.log(locationName);
  console.log(secondLocationName);
  console.log(id);
  console.log(data);
  // Get a reference to the database
  const db = getDatabase();

  // Specify the path to the data you want to update
  const path = `${locationName}/${secondLocationName}/${id}`;
  const dataRef = ref(db, path);

  // Use the update method to update the data
  try {
    await update(dataRef, data);
    logRtdbWrite(path, data);

    if (isFirestoreEligibleDataset(locationName, secondLocationName)) {
      const mode = getTarotDataSourceMode();
      if (mode === DATA_SOURCE_MODES.DUAL || mode === DATA_SOURCE_MODES.FIRESTORE_PRIMARY) {
        try {
          await updateFirestoreDatasetItem(locationName, secondLocationName, id, data);
        } catch (firestoreError) {
          console.error("Firestore mirror update failed:", firestoreError);
        }
      }
    }
    console.log("Data updated successfully");
  } catch (error) {
    console.error("Error updating data: ", error);
    throw error;
  }
};

export const getData = async (locationName, secondLocationName) => {
  const eligible = isFirestoreEligibleDataset(locationName, secondLocationName);
  const mode = getTarotDataSourceMode();
  logDataSourceDecision(FEATURE_NAME, mode, {
    locationName,
    secondLocationName,
    eligible,
  });

  if (!eligible || mode === DATA_SOURCE_MODES.RTDB) {
    try {
      return await readFromRtdb(locationName, secondLocationName);
    } catch (error) {
      console.error(error);
      if (locationName === "Citire-Personalizata" || locationName === "Citire-Viitor") {
        console.log("🔥 [REALTIME] Throwing error for card reading data to trigger API fallback");
        throw error;
      }
      return { arr: [] };
    }
  }

  try {
    const firestoreRows = await getFirestoreDataset(locationName, secondLocationName);
    if (mode === DATA_SOURCE_MODES.DUAL) {
      readFromRtdb(locationName, secondLocationName)
        .then((rtdbRows) => {
          if ((rtdbRows?.arr?.length || 0) !== (firestoreRows?.length || 0)) {
            console.warn("[DUAL_READ_MISMATCH]", {
              locationName,
              secondLocationName,
              firestoreCount: firestoreRows?.length || 0,
              rtdbCount: rtdbRows?.arr?.length || 0,
            });
          }
        })
        .catch((compareError) => {
          console.warn("[DUAL_READ_COMPARE_FAILED]", compareError?.message || compareError);
        });
    }
    if (firestoreRows.length > 0 || mode === DATA_SOURCE_MODES.FIRESTORE_PRIMARY) {
      return { arr: firestoreRows };
    }
    // Safe fallback when Firestore mirror isn't populated yet.
    return await readFromRtdb(locationName, secondLocationName);
  } catch (error) {
    console.error("Firestore read failed, using RTDB fallback:", error);
    try {
      return await readFromRtdb(locationName, secondLocationName);
    } catch (fallbackError) {
      console.error(fallbackError);
      if (locationName === "Citire-Personalizata" || locationName === "Citire-Viitor") {
        console.log("🔥 [REALTIME] Throwing error for card reading data to trigger API fallback");
        throw fallbackError;
      }
      return { arr: [] };
    }
  }
};

export const writeData = async (data, locationName, secondLocationName) => {
  console.log("Start write...");
  try {
    const db = getDatabase();
    const path = `${locationName}/${secondLocationName}/${data.id}`;

    await set(ref(db, path), data);
    logRtdbWrite(path, data);

    if (isFirestoreEligibleDataset(locationName, secondLocationName)) {
      const mode = getTarotDataSourceMode();
      if (mode === DATA_SOURCE_MODES.DUAL || mode === DATA_SOURCE_MODES.FIRESTORE_PRIMARY) {
        try {
          await setFirestoreDatasetItem(locationName, secondLocationName, data);
        } catch (firestoreError) {
          console.error("Firestore mirror write failed:", firestoreError);
        }
      }
    }
  } catch (err) {
    console.log("Error on writeServiceData...", err);
    throw err;
  }
};

export const writeImg = (imgUrl) => {
  const db = getDatabase();
  const path = "ApiImage/imgUrl";
  logRtdbWrite(path, imgUrl);
  set(ref(db, path), imgUrl);
};

export const getUrlImg = async () => {
  let url = "";
  try {
    const dbRef = ref(getDatabase());

    const snapshot = await get(child(dbRef, `ApiImage`));
    let arr = []; // Specificați tipul de obiecte pe care îl conține matricea

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        // Get the object inside the snapshot and push it into the array
        const item = childSnapshot.val();
        url = item;
      });
    } else {
      console.log("No data available");
    }
    logRtdbRead("ApiImage", url);

    return url;
  } catch (error) {
    console.error(error);
    return url;
  }
};
