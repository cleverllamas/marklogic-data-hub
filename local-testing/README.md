
## Gradle

### Setup tasks

#### mlDeploy
Uses `hubPreinstallCheck` to deploy your DHF project.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | |
| ML 11 | 4.3.3 | - | |

#### mlWatch
Extends ml-gradle's WatchTask by ensuring that modules in DHF-specific folders (`plugins` and `entity-config`) are monitored.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | - | |
| ML 11 | 4.3.3 | - | |

#### mlUpdateIndexes
Updates the properties of every database without creating or updating forests. Many properties of a database are related to indexing.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | - | |
| ML 11 | 4.3.3 | - | |

#### hubUpdate
Updates your DHF instance to a newer version. At your project's root folder, run the `hubUpdate -i` Gradle task.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | - | |
| ML 11 | 4.3.3 | - | |

#### hubInfo
Prints out basic info about the DHF configuration.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | |
| ML 11 | 4.3.3 | - | |

#### hubEnableDebugging
Enables extra debugging features in DHF.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | - | |
| ML 11 | 4.3.3 | - | |

#### hubDisableDebugging
Disables extra debugging features in DHF.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | - | |
| ML 11 | 4.3.3 | - | |

#### hubEnableTracing
Enables tracing in DHF.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | - | |
| ML 11 | 4.3.3 | - | |

#### hubDisableTracing
Disables tracing in DHF.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | |
| ML 11 | 4.3.3 | - | |

#### hubDeployUserArtifacts
Installs user artifacts, such as entities and mappings, to the MarkLogic server. (DHF 4.2 or later)
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | |
| ML 11 | 4.3.3 | - | |

### Scaffolding tasks

#### hubInit
Initializes the current directory as a DHF project.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | Initially run by David |
| ML 11 | 4.3.3 | - | |

#### hubCreateEntity
Creates a boilerplate entity.

````
gradlew hubCreateEntity -PentityName=FooBar
````

Then changed to:
````json
{
  "info" : {
    "title" : "FooBar",
    "version" : "0.0.1",
    "baseUri" : "http://example.com/",
    "description" : "An FooBar entity"
  },
  "definitions" : {
    "FooBar" : {
      "description" : "The FooBar entity root.",
      "required" : [ ],
      "rangeIndex" : [ ],
      "elementRangeIndex" : [ ],
      "wordLexicon" : [ ],
      "pii" : [ "name" ],
      "properties" : {
        "id": {
          "datatype": "int"
        },
        "name": {
          "datatype": "string"
        }
      }
    }
  }
}
````

Mapping added:
````json
{
  "language" : "zxx",
  "name" : "FooBarMapping",
  "description" : "Mapping for FooBar",
  "version" : 1,
  "targetEntityType" : "http://example.org/FooBar-0.0.1/FooBar",
  "sourceContext" : "//",
  "sourceURI" : "/foobar/1.json",
  "properties" : {
    "id" : {
      "sourcedFrom" : "id"
    },
    "name" : {
      "sourcedFrom" : "name"
    }
  }
}
````

| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | |
| ML 11 | 4.3.3 | - | |

#### hubCreateInputFlow
Creates an input flow.

````
gradlew hubCreateInputFlow -PentityName=FooBar -PflowName=inputFooBarJsonSjs -PdataFormat=json -PpluginFormat=sjs
gradlew hubCreateInputFlow -PentityName=FooBar -PflowName=inputFooBarJsonXqy -PdataFormat=json -PpluginFormat=xqy
gradlew hubCreateInputFlow -PentityName=FooBar -PflowName=inputFooBarXmlSjs -PdataFormat=xml -PpluginFormat=sjs
gradlew hubCreateInputFlow -PentityName=FooBar -PflowName=inputFooBarXmlXqy -PdataFormat=xml -PpluginFormat=xqy
````

| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | Tested all combination Json/Sjs, Json/Xqy, Xml/Sjs, Xml/Xqy |
| ML 11 | 4.3.3 | - | |

#### hubCreateHarmonizeFlow
Creates a harmonization flow.

````
gradlew hubCreateHarmonizeFlow -PentityName=FooBar -PflowName=harmonizeFooBarJsonSjs -PdataFormat=json -PpluginFormat=sjs -PmappingName=FooBarMapping-1
gradlew hubCreateHarmonizeFlow -PentityName=FooBar -PflowName=harmonizeFooBarJsonXqy -PdataFormat=json -PpluginFormat=xqy -PmappingName=FooBarMapping-1
gradlew hubCreateHarmonizeFlow -PentityName=FooBar -PflowName=harmonizeFooBarXmlSjs -PdataFormat=xml -PpluginFormat=sjs -PmappingName=FooBarMapping-1
gradlew hubCreateHarmonizeFlow -PentityName=FooBar -PflowName=harmonizeFooBarXmlXqy -PdataFormat=xml -PpluginFormat=xqy -PmappingName=FooBarMapping-1
````

| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | Tested all combination Json/Sjs, Json/Xqy, Xml/Sjs, Xml/Xqy |
| ML 11 | 4.3.3 | - | |

#### hubGeneratePii
Generates security configuration files for protecting entity properties designated as Personally Identifiable Information (PII). For details, see Managing
Personally Identifiable Information.

````
gradlew hubGeneratePii
````

| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | |
| ML 11 | 4.3.3 | - | |


### Flow Management tasks

#### hubRunFlow
Runs a harmonization flow.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | Tested on Farm, Pasture, and Llama entities |
| ML 11 | 4.3.3 | - | |

#### hubExportJobs
Exports job records and their associated traces. This task does not affect the contents of the staging or final databases.

````
gradlew hubExportJobs -PjobIds=4cbcccfc-95f9-4c8a-801a-e474f65c072d,b1591700-0d5e-40f6-b537-840f517adf7a,cd953374-082d-45b4-bb24-da4ddc5a29a6 -Pfilename=jobs.zip
````

| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | FAIL | Task runs successful, but zip file is empty. See errors below. |
| ML 11 | 4.3.3 | - | |

````
Exception thrown by an onDocumentReady listener
java.lang.RuntimeException: Unable to write zip entry for URI: /jobs/b1591700-0d5e-40f6-b537-840f517adf7a.json; cause: duplicate entry: /jobs/b1591700-0d5e-40f6-b537-840f517adf7a.json
        at com.marklogic.client.ext.datamovement.consumer.WriteToZipConsumer.accept(WriteToZipConsumer.java:55)
        at com.marklogic.client.ext.datamovement.consumer.WriteToZipConsumer.accept(WriteToZipConsumer.java:22)
        at com.marklogic.client.datamovement.ExportListener.processEvent(ExportListener.java:132)
        at com.marklogic.client.datamovement.impl.QueryBatcherImpl$QueryTask.run(QueryBatcherImpl.java:674)
        at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
        at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
        at java.base/java.lang.Thread.run(Thread.java:834)
Caused by: java.util.zip.ZipException: duplicate entry: /jobs/b1591700-0d5e-40f6-b537-840f517adf7a.json
        at java.base/java.util.zip.ZipOutputStream.putNextEntry(ZipOutputStream.java:233)
        at com.marklogic.client.ext.datamovement.consumer.WriteToZipConsumer.accept(WriteToZipConsumer.java:48)
        ... 6 more
Exception thrown by an onDocumentReady listener
java.lang.RuntimeException: Unable to write zip entry for URI: /jobs/4cbcccfc-95f9-4c8a-801a-e474f65c072d.json; cause: duplicate entry: /jobs/4cbcccfc-95f9-4c8a-801a-e474f65c072d.json      
        at com.marklogic.client.ext.datamovement.consumer.WriteToZipConsumer.accept(WriteToZipConsumer.java:55)
        at com.marklogic.client.ext.datamovement.consumer.WriteToZipConsumer.accept(WriteToZipConsumer.java:22)
        at com.marklogic.client.datamovement.ExportListener.processEvent(ExportListener.java:132)
        at com.marklogic.client.datamovement.impl.QueryBatcherImpl$QueryTask.run(QueryBatcherImpl.java:674)
        at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
        at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
        at java.base/java.lang.Thread.run(Thread.java:834)
Caused by: java.util.zip.ZipException: duplicate entry: /jobs/4cbcccfc-95f9-4c8a-801a-e474f65c072d.json
        at java.base/java.util.zip.ZipOutputStream.putNextEntry(ZipOutputStream.java:233)
        at com.marklogic.client.ext.datamovement.consumer.WriteToZipConsumer.accept(WriteToZipConsumer.java:48)
        ... 6 more
Exception thrown by an onDocumentReady listener
java.lang.RuntimeException: Unable to write zip entry for URI: /jobs/cd953374-082d-45b4-bb24-da4ddc5a29a6.json; cause: duplicate entry: /jobs/cd953374-082d-45b4-bb24-da4ddc5a29a6.json      
        at com.marklogic.client.ext.datamovement.consumer.WriteToZipConsumer.accept(WriteToZipConsumer.java:55)
        at com.marklogic.client.ext.datamovement.consumer.WriteToZipConsumer.accept(WriteToZipConsumer.java:22)
        at com.marklogic.client.datamovement.ExportListener.processEvent(ExportListener.java:132)
        at com.marklogic.client.datamovement.impl.QueryBatcherImpl$QueryTask.run(QueryBatcherImpl.java:674)
        at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
        at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
        at java.base/java.lang.Thread.run(Thread.java:834)
Caused by: java.util.zip.ZipException: duplicate entry: /jobs/cd953374-082d-45b4-bb24-da4ddc5a29a6.json
        at java.base/java.util.zip.ZipOutputStream.putNextEntry(ZipOutputStream.java:233)
        at com.marklogic.client.ext.datamovement.consumer.WriteToZipConsumer.accept(WriteToZipConsumer.java:48)
        ... 6 more
````

#### hubDeleteJobs
Deletes job records and their associated traces. This task does not affect the contents of the staging or final databases.

````
gradlew hubDeleteJobs -PjobIds=4cbcccfc-95f9-4c8a-801a-e474f65c072d,b1591700-0d5e-40f6-b537-840f517adf7a,cd953374-082d-45b4-bb24-da4ddc5a29a6
````

| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | Jobs got deleted at expected |
| ML 11 | 4.3.3 | - | |

### Uninstall tasks

#### mlUndeploy
Removes all components of your data hub from the MarkLogic server, including databases, application servers, forests, and users.
| MarkLogic | DHF | Result | Notes |
| --- | --- | --- | --- |
| ML 9 | 4.3.2 | PASS | |
| ML 11 | 4.3.3 | - | |
