import DataHubSingleton from "/data-hub/5/datahub-singleton.mjs";

const test = require("/test/test-helper.xqy");

const datahub = DataHubSingleton.instance();

function xqueryTest() {
  const assertions = [];

  const flowName = "CustomerByValueXquery";
  const options = {
    sourceQueryIsScript: true,
    provenanceGranularityLevel: 'off',
    uris: "test-data"
  };

  const content = datahub.flow.findMatchingContent("CustomerByValue", "1", options);

  xdmp.log(["DAE - matchingContent", content])

  assertions.push(
    test.assertEqual(1, content.length),
    test.assertEqual("test-data", content[0].uri,
      "Each value is stored in a separate content item under the 'uri' property so that we can maintain the convention " +
      "that every content item has a 'uri' property.")
  );

  const response = datahub.flow.runFlow(flowName, 'value-test-job-xquery', content, options, 1);

  xdmp.log(["DAE - flowResponse", response])
  return assertions.concat(
    test.assertEqual(0, response.errors.length),
    test.assertEqual(1, response.totalCount),
    test.assertEqual("test-data", response.completedItems[0])
  );
}

[]
  .concat(xqueryTest());
