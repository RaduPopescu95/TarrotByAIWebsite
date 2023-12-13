import { getDatabase, ref, remove } from "firebase/database";
import { getData, writeData } from "./realtimeUtils";
import { getCurrentDateTime } from "./timeUtils";
import { testString } from "./strintText";

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
      `https://apis.elai.io/api/v1/videos?page=19&limit=100`,
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
                  };
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

export const generateElaiVideoAPI = async (videoName, descriere) => {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: "Bearer yB5iR69LtOdxenvBDcSw0roJYHCxXmhG",
    },
    body: JSON.stringify({
      name: videoName,
      public: true,
      data: {
        musicName: "Crumpled Letters",
        musicUrl:
          "https://elai-media.s3.eu-west-2.amazonaws.com/music/mixkit-crumpled-letters-1170.mp3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAW6FMUIGA6NPIQQ5B%2F20230926%2Feu-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230926T085903Z&X-Amz-Expires=604800&X-Amz-Signature=612e854bc65da2c02655339a00eb73c138e1a2e25db5ba63d0e34a4c6af11417&X-Amz-SignedHeaders=host&response-cache-control=public%2C%20max-age%3D31536000%2C%20immutable",
        musicVolume: 0.04,
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
                type: "image",
                version: "5.3.0",
                originX: "left",
                originY: "top",
                left: 0,
                top: 0,
                width: 2560,
                height: 1440,
                fill: "rgb(0,0,0)",
                stroke: null,
                strokeWidth: 0,
                strokeDashArray: null,
                strokeLineCap: "butt",
                strokeDashOffset: 0,
                strokeLineJoin: "miter",
                strokeUniform: false,
                strokeMiterLimit: 4,
                scaleX: 0.25,
                scaleY: 0.25,
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
                id: 1205361136110,
                animation: {
                  type: null,
                  startTime: 0,
                  exitType: null,
                },
                src: "https://d3u63mhbhkevz8.cloudfront.net/production/uploads/6509c0f1861a7b24c025c825/pexels-felix-mittermeier-956981_wrc25q.jpg?Expires=1696204800&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9kM3U2M21oYmhrZXZ6OC5jbG91ZGZyb250Lm5ldC9wcm9kdWN0aW9uL3VwbG9hZHMvNjUwOWMwZjE4NjFhN2IyNGMwMjVjODI1L3BleGVscy1mZWxpeC1taXR0ZXJtZWllci05NTY5ODFfd3JjMjVxLmpwZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTY5NjIwNDgwMH19fV19&Signature=odKbsc-gisZ-pK%7EMVqEHAUybCyTfjUlog6hBy0HWtMOdHNZ5zzNaqzmI6lZ-lwrAi1Q6l46yl7RHsIHzL3rBH8MOBHtWh9i6FafVuIhNaIGKG3dZxa26MeujQCN0NL64a2TnpmtGl4%7Ew0DmQHtUPOa3WYRtnKvgoxXbY3M4PxR0Rqz81B%7Er8Yfnyt3lOQpMHdq3%7E8CQ9BohY0Ro-lIheujId4UKQQKlxsz3g2QYx69f2HBm30udh6xa7HSeEQZYt0PVcrDjQ2aADPN-mUwkvCpuIiIoNbK3Iym-EjIYrqSz05GqRE%7Ex2%7Eg1wOGBP3ngJ29dHSrzWiW07erMxjSUGOA__&Key-Pair-Id=K1Y7U91AR6T7E5",
                crossOrigin: "anonymous",
                filters: [],
                bg: true,
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

  try {
    const response = await fetch("https://apis.elai.io/api/v1/videos", options);
    const res = await response.json();
    return res; // res va fi returnat când promisiunea este rezolvată
  } catch (err) {
    console.error(err);
    return null; // sau orice altă valoare care indică o eroare
  }
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
    .catch((err) => console.error(err));
};
