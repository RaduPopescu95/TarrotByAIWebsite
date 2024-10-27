export function testString(str) {
  const pattern = /^variation-\d+-lang-\w+$/;
  return pattern.test(str);
}

export const normalizeString = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export const emailWithoutSpace = (email) => {
  const newEmail = email.replace(/\s/g, "");

  return newEmail;
};


