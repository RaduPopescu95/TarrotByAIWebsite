import {
  deleteElaiVideoAPI,
  generateElaiVideoAPI,
  renderElaiVideoAPI,
  updateElaiVideoAPI,
} from "./apiUtils";
import moment from "moment";

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

export function filterArticlesBeforeCurrentTime(articlesData) {
  return articlesData.filter((article) => {
    // Parsează data articolului în UTC folosind formatul dat și asigură-te că ora este tratată în UTC
    const articleDateTime = moment.utc(
      `${article.firstUploadDate} ${article.firstUploadtime}`,
      "DD-MM-YYYY HH:mm"
    );

    // Obține data și ora curentă în UTC
    // const currentDateTime = moment.utc();
    const currentDateTime = moment.utc().add(2, "hours");

    console.log("articleDateTime...", articleDateTime.format());
    console.log("currentDateTime...", currentDateTime.format());

    return (
      currentDateTime.isAfter(articleDateTime) ||
      currentDateTime.isSame(articleDateTime, "minute")
    );
  });
}

// Funcție de validare a numărului de telefon în format E.164
export const validatePhoneNumber = (number) => {
  // Elimină toate caracterele care nu sunt cifre sau semnul +
  let cleanedNumber = number.replace(/[^0-9+]/g, "");

  // Dacă numărul începe cu "00", înlocuiește "00" cu "+"
  if (cleanedNumber.startsWith("00")) {
    cleanedNumber = "+" + cleanedNumber.slice(2);
  }

  // Dacă numărul începe cu "0" și nu este urmat de "40", elimină "0" și adaugă "+40"
  if (cleanedNumber.startsWith("0") && !cleanedNumber.startsWith("40", 1)) {
    cleanedNumber = "+40" + cleanedNumber.slice(1);
  }

  // Dacă numărul începe cu "+40", îl păstrăm așa cum este
  let formattedNumber;
  if (cleanedNumber.startsWith("+40")) {
    formattedNumber = cleanedNumber;
  } else if (cleanedNumber.startsWith("40")) {
    // Dacă numărul începe cu "40" (fără "+"), adaugă "+40" la început
    formattedNumber = "+" + cleanedNumber;
  } else {
    // Dacă nu are prefix sau are altceva în față, adaugă "+40" la început
    formattedNumber = "+40" + cleanedNumber;
  }

  // Asigură-te că numărul final are exact 12 cifre (inclusiv "+40" = 3 cifre)
  if (formattedNumber.length > 12) {
    formattedNumber = formattedNumber.slice(0, 12);
  }

  // Verifică dacă numărul are între 11 și 12 cifre (incluzând prefixul +40)
  const isValid = /^\+40\d{9}$/.test(formattedNumber);

  return { isValid, formattedNumber };
};

export const formatSelectedSlot = (selectedSlotDay) => {
  console.log("selectedSlotDay....", selectedSlotDay);
  const [monthIndex, day] = selectedSlotDay.split("-").map(Number); // Obține luna și ziua sub formă de numere
  const currentYear = moment().year(); // Obține anul curent folosind moment
  const correctMonth = monthIndex + 1; // Corectează indexarea pentru lună (0-indexed)

  // Creează un moment object folosind anul curent, luna și ziua
  const formattedDate = moment(
    `${currentYear}-${correctMonth}-${day}`,
    "YYYY-MM-DD"
  ).format("DD-MM-YYYY");

  return formattedDate;
};
