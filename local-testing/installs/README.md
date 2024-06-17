# Tutorial for DHF 4.x

## Overview
In this tutorial, you will set up a simple data hub containing harmonized farm data.

Imagine you work for a company that sells board games and board game accessories. You have three sets of data that must be harmonized so that an application can
access them easily:

* Farms
* Pastures
* Llamas

Your task is to create a data hub on MarkLogic Server using these datasets.

This tutorial uses QuickStart, an easy-to-use development tool that you can run locally to set up a working data hub quickly.

You will perform the following in QuickStart:

1. Load each raw dataset.
2. Harmonize each dataset in different ways:
    * Farm using mappings
    * Pasture using code
    * Llama with secured personally identifiable information
3. Serve the data to downstream clients.

**Will this tutorial overwrite an existing data hub?**
No, this tutorial creates separate databases and application servers. However, if the default DHF ports (8010, 8011, 8012, 8013) are already in use, you will be
warned about the conflicts and then prompted to change them. Other settings will be preserved.

**Can I delete the data hub created by this tutorial?**
Yes. See the Clean Up section in Takeaways.

## Prerequisites


## Procedure
1. Install the Data Hub Framework

2. Load the Raw Data

    1. Create the Entities

    2. Create and Run the Input Flows

3. View Jobs, Traces, and the Data

    1. View the Jobs Log

    2. View the Traces Log

    3. Browse the Data

4. Harmonize the Data

    1. Harmonize the “Farm” Data by Mappings

    2. Harmonize the “Pasture” Data by Custom Code

    3. Secure PII in the “Llama” Data

5. Access the Data from MarkLogic Server

6. Takeaways


## Create the Entities
Entities are the business objects that you work with in the data hub. MarkLogic’s Entity Services allows you to create models of your business entities. Using
these data models, you can then generate code scaffolding, database configurations, index settings, and validations. The Data Hub Framework handles many of
these tasks for you.

In this section, we create entities for the **Farm**, **Pasture**, and **Llama** datasets.

### Farm
````bash
./gradlew hubCreateEntity -PentityName=Farm
````

### Pasture
````bash
./gradlew hubCreateEntity -PentityName=Pasture
````

### Llama
````bash
./gradlew hubCreateEntity -PentityName=Llama
````

## Create and Run the Input Flows
An input flow is a series of plugins that ingest data into the staging data hub. Input flows wrap incoming raw data in envelopes and store them in the staging
database. The envelopes contain metadata, including those related to lineage and provenance; for example, who loaded the data, when it was loaded, and where it
came from.

In this section, we create and run an input flow for each entity: **Farm**, **Pasture**, and **Llama**. Each input flow performs the following:

* Load data from the sample data directory.
<!-- * Interpret the input data as delimited text (CSV), where each row is considered a _document_. -->
* Automatically generate a unique URI to identify the wrapped document as it is added to the staging server.

Before we can create the input flows, we need to deploy the entities:

````bash
./gradlew hubDeployUserArtifacts
````

### Farm

#### Create the Input Flow
````bash
./gradlew hubCreateInputFlow -PentityName=Farm -PflowName=loadFarms -PdataFormat=json -PpluginFormat=sjs
````

#### Run the Input Flow
````bash
mlcp import \
    -transform_module "/data-hub/4/transforms/mlcp-flow-transform.sjs" \
    -transform_param "entity-name=Farm,flow-name=loadFarms,jobId=cl-farms" \
    -input_file_path "data/farms" \
    -output_uri_replace "data,''" \
    -output_collections "Farm" \
    -input_file_type "json" \
    -host "localhost" \
    -port "8010"
````

### Pasture

#### Create the Input Flow
````bash
./gradlew hubCreateInputFlow -PentityName=Pasture -PflowName=loadPastures -PdataFormat=json -PpluginFormat=sjs
````

#### Run the Input Flow
````bash
mlcp import \
    -transform_module "/data-hub/4/transforms/mlcp-flow-transform.sjs" \
    -transform_param "entity-name=Pasture,flow-name=loadPastures,jobId=cl-pastures" \
    -input_file_path "data/pastures" \
    -output_uri_replace "data,''" \
    -output_collections "Pasture" \
    -input_file_type "json" \
    -host "localhost" \
    -port "8010"
````

### Llama

#### Create the Input Flow
````bash
./gradlew hubCreateInputFlow -PentityName=Llama -PflowName=loadLlamas -PdataFormat=json -PpluginFormat=sjs
````

#### Run the Input Flow
````bash
mlcp import \
    -transform_module "/data-hub/4/transforms/mlcp-flow-transform.sjs" \
    -transform_param "entity-name=Llama,flow-name=loadLlamas,jobId=cl-llamas" \
    -input_file_path "data/llamas" \
    -output_uri_replace "data,''" \
    -output_collections "Llama" \
    -input_file_type "json" \
    -host "localhost" \
    -port "8010"
````

## Harmonize the Farm Data by Mapping
A harmonize flow is another series of plugins that harmonizes the data in the staging database and stores the results in the final database. Harmonization
includes standardizing formats, enriching data, resolving duplicates, indexing, and other tasks.

We can specify the source of an entity property value using one of two methods:

* By customizing the default harmonization code.
* By defining mappings that specify which fields in the raw datasets correspond with which properties in the entity model.

Model-to-model mapping (between the source data model and the canonical entity model) was introduced in DHF v4.0.0 to enable users to easily create a
harmonization flow without coding. Mappings are ideal when the source data can be easily converted for use as the value of the entity property; a simple
conversion can be a difference in the label case or a difference in simple data types.

We have already loaded the **Farm** raw data by:

* creating the **Farm** entity and
* creating and running the associated input flow.

In this section, we will:

* Define the entity model by adding properties to the entity model.
* Define the mappings to specify which field in the dataset corresponds to the properties in the entity model.
* Create and Run the Harmonize Flow.

### Define the Entity Model
We first define the entity model, which specifies the standard labels for the fields we want to harmonize. For the **Farm** dataset, we will harmonize two
fields: `id` and `name`. Therefore, we must add those fields as properties to our **Farm** entity model.

| Name | Type | Other settings | Notes |
| --- | --- | --- | --- |
| id | int | key | Used as the primary key because it is unique for each farm. |
| name | string | | |

To define the **Farm** entity model:
````json
{
  "info" : {
    "title" : "Farm",
    "version" : "0.0.1",
    "baseUri" : "http://example.com/",
    "description" : "An Farm entity"
  },
  "definitions" : {
    "Farm" : {
      "description" : "The Farm entity root.",
      "required" : [ ],
      "rangeIndex" : [ ],
      "elementRangeIndex" : [ ],
      "wordLexicon" : [ ],
      "pii" : [ ],
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

### Define the Mappings
For the **Farm** entity, we define the following simple mappings:

| field in raw dataset (type) | property in entity model (type) | Notes |
| --- | --- | --- |
| id (string) | id (int) | Difference in types |
| farmName (string) | name (string) | Difference between field names |

To create a mapping named `FarmMapping` at `plugins/mappings/FarmMapping/FarmMapping-1.mapping.json`:

````json
{
  "language" : "zxx",
  "name" : "FarmMapping",
  "description" : "Mapping for Farm",
  "version" : 1,
  "targetEntityType" : "http://example.org/Farm-0.0.1/Farm",
  "sourceContext" : "//",
  "sourceURI" : "/farms/1.json",
  "properties" : {
    "id" : {
      "sourcedFrom" : "id"
    },
    "name" : {
      "sourcedFrom" : "farmName"
    }
  }
}
````

Before we can create the harmonization flow, we need to deploy the mapping::
````bash
./gradlew hubDeployUserArtifacts
````

### Create and Run the Harmonize Flow
Harmonization uses the data in your **STAGING** database to generate canonical entity instances in the **FINAL** database.

To create a harmonization flow for the **Farm** entity:
````bash
./gradlew hubCreateHarmonizeFlow -PentityName=Farm -PflowName=harmonizeFarms -PdataFormat=json -PpluginFormat=sjs -PmappingName=FarmMapping-1
````

When you create a flow with mapping, gradle automatically generates harmonization code based on the entity model and the mapping, we then need to deploy the
code to MarkLogic Server:
````bash
./gradlew mlRedeploy
````

Now we can run the harmonization flow:
````bash
./gradlew hubRunFlow -PentityName=Farm -PflowName=harmonizeFarms
````

## Harmonize the Pasture Data by Custom Code
<!-- Harmonization of the **Pasture** entity is more complex.

* Calculate size based on the area.

Therefore, we must use DHF code scaffolding to generate the harmonization code and then customize it.

We have already loaded the **Pasture** raw data by:

* creating the **Pasture** entity and
* creating and running the associated input flow.

In this section, we will:

* Define the entity model by adding properties to the entity model.
* Create the Harmonize flow.
* Customize the Harmonize flow, specifically the Collector code and the Content code.
* Run the Harmonize Flow.
* View the results.

### Define the Entity Model
dWe assume the following about the **Pasture** data:

* Each llama is identified by its id.
* Each pasture can have more than one llama.
* Each pasture includes a size, which must be calculated.

Based on these assumptions, we will add the following properties to the **Pasture** entity model for harmonization:

| Name | Type | Other settings | Notes |
| --- | --- | --- | --- |
| id | int | key | Used as the primary key because order ID is unique for each order. Needs an element range index. |
| name | string |  | |
| size | decimal | | The calculated size of the pasture. |
| llamas | **Llama** entity | Cardinality: 1..∞ | An array of pointers to the **Llama** entities in our FINAL database. |

To define the Order entity model:
````json
{
  "info" : {
    "title" : "Pasture",
    "version" : "0.0.1",
    "baseUri" : "http://example.com/",
    "description" : "An Pasture entity"
  },
  "definitions" : {
    "Farm" : {
      "description" : "The Pasture entity root.",
      "required" : [ ],
      "rangeIndex" : [ ],
      "elementRangeIndex" : [ ],
      "wordLexicon" : [ ],
      "pii" : [ ],
      "properties" : {
        "id": {
          "datatype": "int"
        },
        "name": {
          "datatype": "string"
        },
        "type": {
          "datatype": "string"
        },
        "farm": {
          "datatype": "int"
        }
      }
    }
  }
}
````

### Create the Harmonize Flow
Harmonization uses the data in your **STAGING** database to generate canonical entity instances in the **FINAL** database.

To create a harmonization flow for the **Pasture** entity:
````bash
./gradlew hubCreateHarmonizeFlow -PentityName=Pasture -PflowName=harmonizePastures -PdataFormat=json -PpluginFormat=sjs
````
Because we did not specify a mapping, DHF creates boilerplate code based on the entity model. This code includes default initialization for the entity
properties, which we will customize.

### Customize the Harmonize Flow

#### Customizing the Collector Plugin
The **Collector** plugin generates a list of IDs for the flow to operate on. The IDs can be whatever your application needs (e.g., URIs, relational row IDs,
twitter handles). The default **Collector** plugin produces a list of source document URIs.

An options parameter is passed to the **Collector** plugin, and it contains the following properties:

* entity: the name of the entity this plugin belongs to (e.g., “Pasture”)
* flow: the name of the flow this plugin belongs to (e.g., “harmonizePastures”)
* flowType: the type of flow being run (“input” or “harmonize”; e.g., “harmonize”)

The `loadPastures` input flow automatically groups the source documents into a collection named **Pasture**. The default **Collector** plugin uses that
collection to derive a list of URIs.

 -->
