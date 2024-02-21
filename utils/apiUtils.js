import { getDatabase, ref, remove } from "firebase/database";
import { getData, getUrlImg, writeData, writeImg } from "./realtimeUtils";
import { getCurrentDateTime } from "./timeUtils";
import { normalizeString, testString } from "./strintText";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { storage } from "../firebase";
import { getUrlImageApi } from "./storageUtils";
// import { writeFirestoreData } from "./firestoreUtils";

let finalArr = [];

export const gTranslateFetch = async (text, target) => {
  const url = "https://translate281.p.rapidapi.com/";
  const options = {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "X-RapidAPI-Key": "fdb30fac7dmshee22c632d48569ap1d9819jsna577a39fffd6",
      "X-RapidAPI-Host": "translate281.p.rapidapi.com",
    },
    body: new URLSearchParams({
      text: text,
      from: "auto",
      to: target,
    }),
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log("result...", result);
    return result.response;
  } catch (error) {
    console.error("error on gTranslateFetch...", error);
  }
};

export const deleteFirebaseVariatiiCarti = async () => {
  const database = getDatabase();
  // 1. Ștergeți elementul din Firebase
  const dataRef = ref(database, "Citire-Personalizata/VarianteCarti");
  remove(dataRef);
};

export const fetchDataReplaceFirebaseOneVideo = async () => {
  console.log("START FETCH DATA.....");
  let dt = await getData("Citire-Personalizata", "VarianteCarti");
  finalArr = [...dt.arr];

  try {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: "Bearer yB5iR69LtOdxenvBDcSw0roJYHCxXmhG",
      },
    };

    const variations = [
      // "variation-392",
      // "variation-393",
      // "variation-394",
      // "variation-395",
      // "variation-396",
      // "variation-397",
      // "variation-398",
      // "variation-399",
      // "variation-400",
      // "variation-401",
      // "variation-402",
      // "variation-403",
      // "variation-404",
      // "variation-405",
      // "variation-406",
      "variation-407",
      "variation-408",
      "variation-409",
      "variation-410",
      "variation-411",
      "variation-412",
      "variation-413",
      // "variation-414",
      // "variation-415",
      // "variation-416",
      // "variation-417",
      // "variation-418",
      // "variation-419",
      // "variation-420",
      // "variation-421",
      // "variation-422",
      // "variation-423",
      // "variation-424",
      // "variation-425",
      // "variation-426",
      // "variation-427",
      // "variation-428",
      // "variation-429",
      // "variation-430",
      // "variation-431",
      // "variation-432",
      // "variation-433",
      // "variation-434",
      // "variation-435",
      // "variation-436",
      // "variation-437",
      // "variation-438",
      // "variation-439",
      // "variation-440",
      // "variation-441",
      // "variation-442",
      // "variation-443",
      // "variation-444",
      // "variation-445",
      // "variation-446",
      // "variation-447",
      // "variation-448",
      // "variation-449",
      // "variation-450",
      // "variation-451",
      // "variation-452",
      // "variation-453",
      // "variation-454",
      // "variation-455",
      // "variation-456",
      // "variation-457",
      // "variation-458",
      // "variation-459",
      // "variation-460",
      // "variation-461",
      // "variation-462",
      // "variation-463",
      // "variation-464",
      // "variation-465",
      // "variation-466",
      // "variation-467",
      // "variation-468",
      // "variation-469",
      // "variation-470",
      // "variation-471",
      // "variation-472",
      // "variation-473",
      // "variation-474",
      // "variation-475",
      // "variation-476",
      // "variation-477",
      // "variation-478",
      // "variation-479",
      // "variation-480",
      // "variation-481",
      // "variation-482",
      // "variation-483",
      // "variation-484",
      // "variation-485",
      // "variation-486",
      // "variation-487",
      // "variation-488",
      // "variation-489",
      // "variation-490",
      // "variation-491",
      // "variation-492",
      // "variation-493",
      // "variation-494",
      // "variation-495",
      // "variation-496",
      // "variation-497",
      // "variation-498",
      // "variation-499",
      // "variation-500",
      // "variation-501",
      // "variation-502",
      // "variation-503",
      // "variation-504",
      // "variation-505",
      // "variation-506",
      // "variation-507",
      // "variation-508",
      // "variation-509",
      // "variation-510",
      // "variation-511",
      // "variation-512",
    ];

    const videoDetailsPromises = [];

    for (const element of finalArr) {
      for (let key in element.info) {
        if (element.info.hasOwnProperty(key)) {
          let subObject = element.info[key];
          for (const variation of variations) {
            if (subObject.video.includes(variation)) {
              console.log("subObject._id....");
              console.log(subObject._id);
              videoDetailsPromises.push(
                fetch(
                  `https://apis.elai.io/api/v1/videos/${subObject._id}`,
                  options
                ).then((response) => response.json())
              );
            }
          }
        }
      }
    }

    const videosDetails = await Promise.all(videoDetailsPromises);

    // Procesarea fiecărui detaliu al videoului
    for (const video of videosDetails) {
      if (video && video.name) {
        // Găsește elementul corespunzător în finalArr
        for (const element of finalArr) {
          for (let key in element.info) {
            if (element.info.hasOwnProperty(key)) {
              let subObject = element.info[key];
              // Verifică dacă id-ul videoului corespunde cu cel din subObject
              if (subObject._id === video._id) {
                // Actualizează obiectul subObject cu noile detalii
                element.info[key] = {
                  video: video.name,
                  descriere: video.slides[0].speech,
                  _id: video._id !== undefined ? video._id : "",
                  url: video.url !== undefined ? video.url : "",
                  isRendering: false,
                };

                // Salvează actualizările în baza de date sau unde este necesar
                await writeData(
                  element,
                  "Citire-Personalizata",
                  "VarianteCarti"
                );
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("error fetchDataReplaceFirebase...ONE VIDEO", err);
  }
};

export const fetchDataReplaceFirebase = async () => {
  console.log("START FETCH DATA.....");
  let dt = await getData("Citire-Personalizata", "VarianteCarti");
  finalArr = [...dt.arr];

  //FETCH FROM REAL TIME AND WRITE TO FIRESTORE -------------->
  // for (let i = 0; i < finalArr.length; i++) {
  //   let carte;
  //   let categorie;
  //   if (
  //     finalArr[i].carte?.info?.ro?.nume &&
  //     finalArr[i].categorie?.info?.ro.nume
  //   ) {
  //     carte = normalizeString(finalArr[i].carte.info.ro.nume);
  //     categorie = normalizeString(finalArr[i].categorie.info.ro.nume);

  //     console.log(carte);
  //     console.log(categorie);
  //   }
  //   writeFirestoreData(finalArr[i], carte, categorie);
  // }
  // <---------- FETCH FROM REAL TIME AND WRITE TO FIRESTORE

  try {
    const page = Math.floor(Math.random() * 10) + 1;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: "Bearer yB5iR69LtOdxenvBDcSw0roJYHCxXmhG",
      },
    };

    const response = await fetch(
      `https://apis.elai.io/api/v1/videos?page=1&limit=100`,
      options
    );
    const jsonResponse = await response.json();

    // Verifică dacă jsonResponse.videos există și este un array
    if (jsonResponse.videos && Array.isArray(jsonResponse.videos)) {
      const videoDetailsPromises = jsonResponse.videos.map((video) =>
        fetch(`https://apis.elai.io/api/v1/videos/${video._id}`, options).then(
          (response) => response.json()
        )
      );

      const videosDetails = await Promise.all(videoDetailsPromises);
      for (const video of videosDetails) {
        // console.log("test video response.....", video);
        // console.log(video);
        const dateTime = getCurrentDateTime();

        if (testString(video.name)) {
          // console.log("yes is....corect video name type");
          if (finalArr.length > 0) {
            for (let i = 0; i < finalArr.length; i++) {
              const parts = video.name.split("-");
              const number = parseInt(parts[1], 10); // Ex: 620
              const languageCode = parts[parts.length - 1]; // Ex: 'ro'

              if (finalArr[i].id === number) {
                console.log(
                  "yes is....id of elai video === to firebase video id",
                  number
                );

                if (languageCode in finalArr[i].info) {
                  console.log("finalArr[i]...");
                  // console.log(languageCode);
                  console.log(number);
                  finalArr[i].info[languageCode] = {
                    video: video.name,
                    descriere: video.slides[0].speech,
                    _id: video._id !== undefined ? video._id : "",
                    url: video.url !== undefined ? video.url : "",
                    isRendering: false,
                  };
                  // console.log(finalArr[i].isRendering);
                  finalArr[i].isRendering = false;
                  // console.log(finalArr[i].isRendering);

                  await writeData(
                    finalArr[i],
                    "Citire-Personalizata",
                    "VarianteCarti"
                  );
                }
              } else {
                console.log(
                  "No is....id of elai video NOT= to firebase video id"
                );

                const info = {
                  ro: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  en: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  es: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  it: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  pl: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  de: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  hu: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  cs: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  sk: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  hr: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  ru: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  bg: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  el: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                  fr: {
                    video: "",
                    descriere: "",
                    _id: "",
                    url: "",
                    isRendering: false,
                  },
                };

                const data = {
                  id: number, // Folosiți numărul ca id
                  info,
                  categorie: {},
                  carte: {},
                  date: dateTime.date,
                  time: dateTime.time,
                  isRendering: false,
                };

                // Verificați dacă un element cu același id există deja în finalArr
                const exists = finalArr.some((item) => item.id === data.id);

                // Dacă nu există, adăugați-l în finalArr
                if (!exists) {
                  finalArr.push(data);
                  await writeData(
                    data,
                    "Citire-Personalizata",
                    "VarianteCarti"
                  );
                }
              }
            }
          } else {
            console.log("No Length in array from firebase....");
            const parts = video.name.split("-");
            const number = parseInt(parts[1], 10);
            const languageCode = parts[parts.length - 1];

            const info = {
              ro: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              en: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              es: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              it: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              pl: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              de: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              hu: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              cs: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              sk: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              hr: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              ru: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              bg: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              el: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
              fr: {
                video: "",
                descriere: "",
                _id: "",
                url: "",
              },
            };

            const data = {
              id: number,
              info,
              categorie: {},
              carte: {},
              date: dateTime.date,
              time: dateTime.time,
              isRendering: false,
            };

            // Verificați dacă un element cu același id există deja în finalArr
            const exists = finalArr.some((item) => item.id === data.id);

            // Dacă nu există, adăugați-l în finalArr
            if (!exists) {
              finalArr.push(data);
              await writeData(data, "Citire-Personalizata", "VarianteCarti");
            }
          }
        }

        // Presupunând că finalArr este un array de matrici, fiecare conținând obiecte cu id
        const flattenedArray = finalArr.flat();

        // Sortarea array-ului în ordine crescătoare a id-urilor
        flattenedArray.sort((a, b) => a.id - b.id);

        // console.log("Array sortat crescător după id:");
        console.log(flattenedArray);
      }
    }
  } catch (err) {
    console.error("error fetchDataReplaceFirebase...", err);
  }
};

export const createImgApiUrl = async () => {
  let urlImage;

  urlImage = await getUrlImageApi();
  console.log(urlImage);

  writeImg(urlImage);
};

export const generateElaiVideoAPI = async (videoName, descriere) => {
  try {
    const urlImage = getUrlImg();
    console.log(urlImage);
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: "Bearer yB5iR69LtOdxenvBDcSw0roJYHCxXmhG",
      },
      body: JSON.stringify({
        name: videoName,
        data: {
          format: "1_1",
          musicShift: 0,
          resolution: "1080p",
        },
        slides: [
          {
            id: 1,
            avatar: {
              id: "cristina",
              name: "Cristina",
              gender: "female",
              canvas:
                "https://d3u63mhbhkevz8.cloudfront.net/custom/christina/christina.png",
            },
            speech: descriere,
            language: "Romanian",
            voice: "j0HrY2I6XN3JAWVoSONi:eleven_multilingual_v2:50:75",
            voiceType: "text",
            voiceProvider: "ElevenLabs",
            animation: "fade_in",
            canvas: {
              version: "5.3.0",
              objects: [
                {
                  id: 1,
                  type: "image",
                  src: "https://firebasestorage.googleapis.com/v0/b/tarrot-590ee.appspot.com/o/images%2FPozaApi%2Fapiimage.jpeg?alt=media&token=8b1a2a21-1471-46e8-85a8-13c5f1671027",
                  top: 0,
                  left: -67,
                  scaleX: 0.5,
                  scaleY: 0.5,
                  // avatarType: "transparent",
                  version: 2,
                },
                {
                  type: "avatar",
                  version: "5.3.0",
                  originX: "left",
                  originY: "top",
                  left: 171.19612152,
                  top: 95.59442362,
                  width: 1215,
                  height: 1080,
                  fill: "#4868FF",
                  stroke: null,
                  strokeWidth: 0,
                  strokeDashArray: null,
                  strokeLineCap: "butt",
                  strokeDashOffset: 0,
                  strokeLineJoin: "miter",
                  strokeUniform: false,
                  strokeMiterLimit: 4,
                  scaleX: 0.24520803,
                  scaleY: 0.24520803,
                  angle: 0,
                  flipX: false,
                  flipY: false,
                  opacity: 1,
                  shadow: null,
                  visible: true,
                  backgroundColor: "",
                  fillRule: "nonzero",
                  paintFirst: "fill",
                  globalCompositeOperation: "source-over",
                  skewX: 0,
                  skewY: 0,
                  cropX: 0,
                  cropY: 0,
                  src: "https://d3u63mhbhkevz8.cloudfront.net/custom/christina/christina.png",
                  crossOrigin: null,
                  filters: [],
                  avatarType: "transparent",
                  animation: {
                    type: null,
                    startTime: 0,
                  },
                },
              ],
              background: "#ffffff",
            },
          },
        ],
      }),
    };

    const response = await fetch("https://apis.elai.io/api/v1/videos", options);
    const res = await response.json();
    return res; // res va fi returnat când promisiunea este rezolvată
  } catch (err) {
    console.error("error...generateElaiVideoAPI..", err);
    return null; // sau orice altă valoare care indică o eroare
  }
};

export const deleteElaiVideoAPI = async (videoId) => {
  console.log("videoId...", videoId);
  const options = {
    method: "DELETE",
    headers: {
      accept: "application/json",
      Authorization: "Bearer yB5iR69LtOdxenvBDcSw0roJYHCxXmhG",
    },
  };

  fetch(`https://apis.elai.io/api/v1/videos/${videoId}`, options)
    .then((response) => response.json())
    .then((response) => console.log(response))
    .catch((err) => console.error(err));
};

export const renderElaiVideoAPI = async (videoId) => {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      Authorization: "Bearer yB5iR69LtOdxenvBDcSw0roJYHCxXmhG",
    },
  };

  fetch(`https://apis.elai.io/api/v1/videos/render/${videoId}`, options)
    .then((response) => response.json())
    .then((response) => console.log("response...to render.........", response))
    .catch((err) => console.error("error at fetch renderelaivideoapi...", err));
};
