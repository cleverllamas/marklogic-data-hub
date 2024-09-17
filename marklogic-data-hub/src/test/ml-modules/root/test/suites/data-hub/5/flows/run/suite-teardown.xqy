xquery version "1.0-ml";
(
  xdmp:invoke-function(function() {
    xdmp:document-delete(
      "/test/custom-null-step/main.mjs"
    ),
      xdmp:document-delete(
      "/test/custom-by-value-step/main.mjs"
    ),
      xdmp:document-delete(
      "/test/custom-by-value-step/main.xqy"
    )
  },
    map:entry("database", xdmp:modules-database())
  ),


  xdmp:invoke-function(function() {
    xdmp:document-delete(
      "/processed/customer1-xquery.json"
    )
  },
    map:entry("database", "data-hub-FINAL")
  )

)