export function testString(str) {
  const pattern = /^variation-\d+-lang-\w+$/;
  return pattern.test(str);
}
