# Tutorial for DHF 4.x

## Overview
In this tutorial, you will set up a simple data hub containing harmonized online shopping data.

Imagine you work for a company that sells board games and board game accessories. You have three sets of data that must be harmonized so that an application can
access them easily:

* Products
* Customers
* Orders

Your task is to create a data hub on MarkLogic Server using these datasets.

This tutorial uses QuickStart, an easy-to-use development tool that you can run locally to set up a working data hub quickly.

You will perform the following in QuickStart:

1. Load each raw dataset.
2. Harmonize each dataset in different ways:
    * Product using mappings
    * Order using code
    * Customer with secured personally identifiable information
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

    1. Harmonize the “Product” Data by Mappings

    2. Harmonize the “Order” Data by Custom Code

    3. Secure PII in the “Customer” Data

5. Access the Data from MarkLogic Server

6. Takeaways


## Create the Entities
Entities are the business objects that you work with in the data hub. MarkLogic’s Entity Services allows you to create models of your business entities. Using
these data models, you can then generate code scaffolding, database configurations, index settings, and validations. The Data Hub Framework handles many of
these tasks for you.

In this section, we create entities for the **Product**, **Customer**, and **Order** datasets.

### Product
````bash
./gradlew hubCreateEntity -PentityName=Product
````

### Order
````bash
./gradlew hubCreateEntity -PentityName=Order
````

### Customer
````bash
./gradlew hubCreateEntity -PentityName=Customer
````

## Create and Run the Input Flows
An input flow is a series of plugins that ingest data into the staging data hub. Input flows wrap incoming raw data in envelopes and store them in the staging
database. The envelopes contain metadata, including those related to lineage and provenance; for example, who loaded the data, when it was loaded, and where it
came from.

In this section, we create and run an input flow for each entity: **Product**, **Customer**, and **Order**. Each input flow performs the following:

* Load data from the sample data directory.
* Interpret the input data as delimited text (CSV), where each row is considered a _document_.
* Automatically generate a unique URI to identify the wrapped document as it is added to the staging server. This prevents one document from overwriting another
if multiple rows contain the same value in the first field.

Before we can create the input flows, we need to deploy the entities:

````bash
./gradlew hubDeployUserArtifacts
````

### Product

#### Create the Input Flow
````bash
./gradlew hubCreateInputFlow -PentityName=Product -PflowName=loadProducts -PdataFormat=json -PpluginFormat=sjs
````

#### Run the Input Flow
````bash
mlcp import \
    -transform_module "/data-hub/4/transforms/mlcp-flow-transform.sjs" \
    -transform_param "entity-name=Product,flow-name=loadProducts,jobId=llamas" \
    -input_file_path "/data/products" \
    -input_file_type "json" \
    -output_uri_replace "/data,''" \
    -host "localhost" \
    -port "8010" \
    -username "admin" \
    -password "admin" \
    -mode "local"
````

### Order

#### Create the Input Flow
````bash
./gradlew hubCreateInputFlow -PentityName=Order -PflowName=loadOrders -PdataFormat=json -PpluginFormat=sjs
````

#### Run the Input Flow
````bash
mlcp import \
    -transform_module "/data-hub/4/transforms/mlcp-flow-transform.sjs" \
    -transform_param "entity-name=Order,flow-name=loadOrders,jobId=llamas" \
    -input_file_path "/data/orders" \
    -input_file_type "json" \
    -output_uri_replace "/data,''" \
    -host "localhost" \
    -port "8010" \
    -username "admin" \
    -password "admin" \
    -mode "local"
````

### Customer

#### Create the Input Flow
````bash
./gradlew hubCreateInputFlow -PentityName=Customer -PflowName=loadCustomers -PdataFormat=json -PpluginFormat=sjs
````

#### Run the Input Flow
````bash
mlcp import \
    -transform_module "/data-hub/4/transforms/mlcp-flow-transform.sjs" \
    -transform_param "entity-name=Customer,flow-name=loadCustomers,jobId=llamas" \
    -input_file_path "/data/customer" \
    -input_file_type "json" \
    -output_uri_replace "/data,''" \
    -host "localhost" \
    -port "8010" \
    -username "admin" \
    -password "admin" \
    -mode "local"
````
