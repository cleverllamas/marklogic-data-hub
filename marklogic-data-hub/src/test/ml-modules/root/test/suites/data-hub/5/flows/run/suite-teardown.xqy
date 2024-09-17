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
    cts:uri-match("/processed/customer1-xquery.json") ! xdmp:document-delete(.)
  },
    map:entry("database", xdmp:database("data-hub-FINAL"))
  )

)