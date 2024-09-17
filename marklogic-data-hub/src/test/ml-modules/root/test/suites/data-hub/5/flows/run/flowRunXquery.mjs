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

  const content = xdmp.invokeFunction(function(){datahub.flow.findMatchingContent("CustomerByValue", "1", options)}, {update:true});

  xdmp.log(["DAE - matchingContent", content])
  xdmp.invokeFunction(function(){
    xdmp.log(["DAE - doc", cts.doc(uri)])
    const uri  = "/processed/customer1-xquery.json"
    assertions.push(
      test.assertEqual(1, content.length),
      test.assertTrue(xdmp.documentGetCollections(uri).toString()  == ["value-collection", "CustomerByValue", "test-data-xqy"].toString(), "same collections"),
      test.assertTrue(JSON.stringify({ ... xdmp.documentGetPermissions(uri),}) == '{"0":{"capability":"update","roleId":"7004461930022123088"},"1":{"capability":"read","roleId":"7004461930022123088"}}', "permissions"),
      test.assertTrue(
        JSON.stringify({ ... xdmp.documentGetMetadata(uri), ... {"datahubCreatedOn" : null, "datahubCreatedBy": null}})
        == 
        JSON.stringify({
        "datahubCreatedBy": null, 
        "datahubCreatedOn": null, 
        "some-key": "some-value", 
        "datahubCreatedInFlow": "CustomerByValueXquery", 
        "key1": "1", 
        "datahubRanBySteps": "", 
        "datahubCreatedByJob": "value-test-job-xquery"
        })  
        , "same collections"
      )
    );
  }, {"database" : xdmp.database("data-hub-FINAL")})

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
