import { getDatabase, ref, remove } from "firebase/database";
import { getData, getUrlImg, writeData, writeImg } from "./realtimeUtils";
import { getCurrentDateTime } from "./timeUtils";
import { testString } from "./strintText";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { storage } from "../firebase";
import { getUrlImageApi } from "./storageUtils";

let finalArr = [];

export const deleteFirebaseVariatiiCarti = async () => {
  const database = getDatabase();
  // 1. Ștergeți elementul din Firebase
  const dataRef = ref(database, "Citire-Personalizata/VarianteCarti");
  remove(dataRef);
};

export const fetchDataReplaceFirebase = async () => {
  console.log("START FETCH DATA.....");
  let dt = await getData("Citire-Personalizata", "VarianteCarti");
  finalArr = [...dt.arr];

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
        console.log(video);
        const dateTime = getCurrentDateTime();

        if (testString(video.name)) {
          console.log("yes is....corect video name type");
          if (finalArr.length > 0) {
            for (let i = 0; i < finalArr.length; i++) {
              const parts = video.name.split("-");
              const number = parseInt(parts[1], 10); // Ex: 620
              const languageCode = parts[parts.length - 1]; // Ex: 'ro'

              if (finalArr[i].id === number) {
                console.log(
                  "yes is....id of elai video === to firebase video id"
                );

                if (languageCode in finalArr[i].info) {
                  finalArr[i].info[languageCode] = {
                    video: video.name,
                    descriere: video.slides[0].speech,
                    _id: video._id,
                    url: video.url,
                    isRendering: false,
                  };
                  finalArr[i].isRendering = false;
                  console.log(finalArr[i].info);
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
            const number = parseInt(parts[1], 10); // Ex: 620
            const languageCode = parts[parts.length - 1]; // Ex: 'ro'

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
              id: number, // Folosiți numărul ca id
              info,
              categorie: {},
              carte: {},
              date: dateTime.date,
              time: dateTime.time,
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
            voice: "rehVMocqgFIcwyRvsVgP:eleven_multilingual_v2",
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
