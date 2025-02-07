import flowApi from "/data-hub/public/flow/flow-api.mjs";
import hubTest from "/test/data-hub-test-helper.mjs";
const test = require("/test/test-helper.xqy");

let assertions = [];
let results, collections;

const options = {
  sourceDatabase: "data-hub-FINAL",
  targetDatabase: "data-hub-FINAL",
  targetCollectionsAdditivity: false,
  outputFormat: 'json'
};

const content = [{uri:"/customer1.json",
  value:{"hello": "world"},
  context: {originalCollections: ["source"]}
}];

results = flowApi.runFlowOnContent("simpleMappingFlow", content, "1", options);
collections = hubTest.getRecord("/customer1.json").collections;

assertions.push(
  test.assertEqual("finished", results.jobStatus),
  test.assertEqual(1, collections.length,
    "doc should only have collection from mapping step"),
  test.assertTrue(collections.includes("Customer"),
    "doc should have collection from mapping step"),
  test.assertFalse(collections.includes("source"),
    "doc should not have collection from source doc when targetCollectionsAdditivity is false")
);

assertions;
