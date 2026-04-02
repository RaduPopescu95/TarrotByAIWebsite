import assert from "node:assert/strict";
import {
  buildInvoiceDecision,
  buildOblioClientFromNormalized,
  buildSyntheticScenarioReport,
  normalizeBillingContext,
} from "../utils/billingAudit.mjs";

function buildValidCnp(firstTwelveDigits) {
  const controlKey = "279146358279";
  let checksum = 0;
  for (let index = 0; index < 12; index += 1) {
    checksum += Number(firstTwelveDigits[index]) * Number(controlKey[index]);
  }
  checksum %= 11;
  if (checksum === 10) checksum = 1;
  return `${firstTwelveDigits}${checksum}`;
}

function buildValidCif(bodyDigits) {
  const controlKey = "753217532".slice(-bodyDigits.length);
  let sum = 0;
  for (let index = 0; index < bodyDigits.length; index += 1) {
    sum += Number(bodyDigits[index]) * Number(controlKey[index]);
  }
  let checksum = (sum * 10) % 11;
  if (checksum === 10) checksum = 0;
  return `${bodyDigits}${checksum}`;
}

function runScenario(label, inputUi) {
  const audit = normalizeBillingContext(inputUi, { defaultCountry: "Romania" });
  const invoiceDecision = buildInvoiceDecision(audit);
  const oblioClient = invoiceDecision.emitInvoice
    ? buildOblioClientFromNormalized(audit.normalizedClient)
    : null;
  const verdict = !invoiceDecision.emitInvoice
    ? "checkout blocat corect"
    : invoiceDecision.sendEInvoice
    ? "valid pentru e-Factura"
    : "factură permisă, SPV blocat";

  return buildSyntheticScenarioReport({
    label,
    audit,
    oblioClient,
    payloadInternal: {
      normalizedBeforeCheckout: audit.normalizedClient,
      invoiceDecision,
    },
    verdict,
  });
}

const scenarios = [
  runScenario("client România, oraș normal", {
    billingType: "individual",
    name: "Ion Popescu",
    cnp: buildValidCnp("198010122114"),
    address: "Str. Lalelelor 10",
    state: "Cluj",
    city: "Cluj-Napoca",
    country: "RO",
    email: "ion@example.com",
    phone: "+40740000000",
  }),
  runScenario("client București cu sector", {
    billingType: "individual",
    name: "Ana Ionescu",
    cnp: buildValidCnp("299010122114"),
    address: "Bd. Unirii 1",
    state: "Bucharest",
    city: "sector 3",
    country: "România",
    email: "ana@example.com",
    phone: "+40741111111",
  }),
  runScenario("client extern cu țară abreviere", {
    billingType: "individual",
    name: "John Doe",
    cnp: buildValidCnp("198010122114"),
    address: "1 Main Street",
    state: "California",
    city: "Los Angeles",
    country: "USA",
    email: "john@example.com",
    phone: "+14085550123",
  }),
  runScenario("persoană fizică", {
    billingType: "individual",
    name: "Maria Georgescu",
    cnp: buildValidCnp("295052942001"),
    address: "Str. Libertății 2",
    state: "Iași",
    city: "Iași",
    country: "Romania",
    email: "maria@example.com",
    phone: "+40742222222",
  }),
  runScenario("persoană juridică", {
    billingType: "corporate",
    companyName: "Acme SRL",
    cif: `RO${buildValidCif("1854729")}`,
    reg: "J40/123/2024",
    address: "Str. Fabricii 99",
    state: "Brașov",
    city: "Brașov",
    country: "Romania",
    contact: "Elena Pop",
    email: "office@acme.ro",
    phone: "+40743333333",
  }),
];

assert.equal(scenarios[0].verdict, "valid pentru e-Factura");
assert.equal(scenarios[1].verdict, "valid pentru e-Factura");
assert.equal(scenarios[2].verdict, "factură permisă, SPV blocat");
assert.equal(scenarios[3].verdict, "valid pentru e-Factura");
assert.equal(scenarios[4].verdict, "valid pentru e-Factura");

const blockedScenario = runScenario("București invalid", {
  billingType: "individual",
  name: "Client Greșit",
  cnp: buildValidCnp("198010122114"),
  address: "Str. Test 1",
  state: "București",
  city: "București",
  country: "Romania",
  email: "blocked@example.com",
  phone: "+40745555555",
});
assert.equal(blockedScenario.verdict, "checkout blocat corect");

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), scenarios, blockedScenario }, null, 2));
