import {
  deleteElaiVideoAPI,
  generateElaiVideoAPI,
  renderElaiVideoAPI,
  updateElaiVideoAPI,
} from "./apiUtils";

export const toUrlSlug = (string) => {
  return string
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
};

const languages = [
  "ro",
  "en",
  "es",
  "it",
  "pl",
  "de",
  "hu",
  "cs",
  "sk",
  "hr",
  "ru",
  "bg",
  "el",
  "fr",
]; // și alte limbi după nevoie

export const checkDescription = async (data, dialogData) => {
  let isRendering = false;
  try {
    for (const lang of languages) {
      console.log(
        "Start---------------------------------------------------------"
      );
      console.log(lang);
      if (
        data.info[lang].descriere !== dialogData.info[lang].descriere &&
        data.info[lang].url.length > 0 &&
        dialogData.info[lang].descriere.length > 0
      ) {
        console.log("-------------is not same description for--------", lang);
        // console.log(`is not equal for language: ${lang}....`);
        // data.info[lang].url = "";
        await deleteElaiVideoAPI(dialogData.info[lang]._id);
        let response = await generateElaiVideoAPI(
          data.info[lang].video,
          data.info[lang].descriere
        );
        console.log("response:", response._id);
        await renderElaiVideoAPI(response._id);

        // data.info[lang].isRendering = true;
        isRendering = true;
      } else if (
        data.info[lang].descriere.length > 0 &&
        dialogData.info[lang].descriere.length === 0
      ) {
        console.log("------new description for----------", lang);
        let response = await generateElaiVideoAPI(
          data.info[lang].video,
          data.info[lang].descriere
        );
        console.log("response:", response._id);
        await renderElaiVideoAPI(response._id);
        // data.info[lang].isRendering = true;
        isRendering = true;
      } else if (
        data.info[lang].descriere.length === 0 &&
        dialogData.info[lang].descriere.length === 0
      ) {
        console.log("does not have descr and no new description...", lang);
      } else {
        console.log("had description and did not change...", lang);
      }
    }
    console.log("------------check boolean isRendering......................");
    console.log(isRendering);
    return { data, isRendering };
  } catch (err) {
    console.log("Error at edit check description...", err);
  }
};

export function validateEmail(email) {
  const re =
    /^(([^<>()\]\\.,;:\s@"]+(\.[^<>()\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
