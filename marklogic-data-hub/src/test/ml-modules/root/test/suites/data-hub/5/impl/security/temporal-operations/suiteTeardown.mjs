import hubTest from "/test/data-hub-test-helper.mjs";
const temporal = require("/MarkLogic/temporal.xqy");

const roles = ["admin"];

hubTest.runWithRolesAndPrivileges(roles, [], function () {
  xdmp.invokeFunction(function () {
    xdmp.documentDelete("doc0.json", {ifNotExists: "allow"});
    xdmp.documentDelete("doc1.json", {ifNotExists: "allow"});
    xdmp.documentDelete("doc2.json", {ifNotExists: "allow"});
    xdmp.documentDelete("cust0.json", {ifNotExists: "allow"});
    xdmp.documentDelete("cust1.json", {ifNotExists: "allow"});
  }, {update: "true"});
});

hubTest.runWithRolesAndPrivileges(roles, [], function () {
  xdmp.invokeFunction(function () {
    temporal.collectionRemove("kool");
    temporal.axisRemove("system");
  }, {update: "true"});
});

hubTest.runWithRolesAndPrivileges(roles, [], function () {
  xdmp.invokeFunction(function () {
    const admin = require("/MarkLogic/admin");
    let config = admin.getConfiguration();
    let elementRangeIndexes = [
      admin.databaseRangeElementIndex("dateTime", "", "systemStart", "", fn.false()),
      admin.databaseRangeElementIndex("dateTime", "", "systemEnd", "", fn.false())]
    elementRangeIndexes.forEach((elementRangeIndex) => {
      config = admin.databaseDeleteRangeElementIndex(config, xdmp.database(), elementRangeIndex);
    });
    admin.saveConfiguration(config);
  });
});
