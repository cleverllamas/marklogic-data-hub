import lib from "/test/suites/data-hub/5/mapping/mapping-errors/lib/lib.mjs";

const test = require("/test/test-helper.xqy");

let assertions = [];

const runMappingOutput = lib.runMappingStep("invalidArgumentMapping", 2);
const testMappingOutput = lib.validateAndTestMapping("invalidArgumentMapping");

assertions = assertions.concat([
  test.assertEqual("Invalid argument. Cause: Either the argument to the function in a mapping expression is not the right type, or the function does not expect arguments."
    , testMappingOutput.properties.name.errorMessage),

  test.assertEqual("Invalid argument. Cause: Either the argument to the function in a mapping expression is not the right type, or the function does not expect arguments."
    , runMappingOutput.errors[0].message),
  test.assertEqual("/content/customer.json", runMappingOutput.failedItems[0]),
]);

assertions;
