
## Gradle

### Setup tasks

#### mlDeploy
Uses `hubPreinstallCheck` to deploy your DHF project.

#### mlWatch
Extends ml-gradle's WatchTask by ensuring that modules in DHF-specific folders (`plugins` and `entity-config`) are monitored.

#### mlUpdateIndexes
Updates the properties of every database without creating or updating forests. Many properties of a database are related to indexing.

#### hubUpdate
Updates your DHF instance to a newer version. At your project's root folder, run the `hubUpdate -i` Gradle task.

#### hubInfo
Prints out basic info about the DHF configuration.

#### hubEnableDebugging
Enables extra debugging features in DHF.

#### hubDisableDebugging
Disables extra debugging features in DHF.

#### hubEnableTracing
Enables tracing in DHF.

#### hubDisableTracing
Disables tracing in DHF.

#### hubDeployUserArtifacts
Installs user artifacts, such as entities and mappings, to the MarkLogic server. (DHF 4.2 or later)

### Scaffolding tasks

#### hubInit
Initializes the current directory as a DHF project.

#### hubCreateEntity
Creates a boilerplate entity.

#### hubCreateInputFlow
Creates an input flow.

#### hubCreateHarmonizeFlow
Creates a harmonization flow.

#### hubGeneratePii
Generates security configuration files for protecting entity properties designated as Personally Identifiable Information (PII). For details, see Managing
Personally Identifiable Information.


### Flow Management tasks

#### hubRunFlow
Runs a harmonization flow.

#### hubExportJobs
Exports job records and their associated traces. This task does not affect the contents of the staging or final databases.

#### hubDeleteJobs
Deletes job records and their associated traces. This task does not affect the contents of the staging or final databases.

### Uninstall tasks

#### mlUndeploy
Removes all components of your data hub from the MarkLogic server, including databases, application servers, forests, and users.
