import {
  getDatabase,
  ref,
  get,
  child,
  set,
  onValue,
  update,
} from "firebase/database";

export const getAllNewsIds = async () => {
  try {
    const dbRef = ref(getDatabase());

    const snapshot = await get(child(dbRef, "Articles/"));

    const childNodeNames = [];

    snapshot.forEach((childSnapshot) => {
      const childName = childSnapshot.key;
      childNodeNames.push(childName);
    });

    return childNodeNames;
  } catch (error) {
    console.error("Error fetching child node names:", error);
    return [];
  }
};

export const getAllServicesIds = async () => {
  try {
    const dbRef = ref(getDatabase());

    const snapshot = await get(child(dbRef, "Services/"));

    const childNodeNames = [];

    snapshot.forEach((childSnapshot) => {
      const childName = childSnapshot.key;
      childNodeNames.push(childName);
    });

    return childNodeNames;
  } catch (error) {
    console.error("Error fetching child node names:", error);
    return [];
  }
};
