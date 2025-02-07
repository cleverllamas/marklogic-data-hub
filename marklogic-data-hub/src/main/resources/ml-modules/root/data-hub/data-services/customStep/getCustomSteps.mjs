/**
 Copyright (c) 2021 MarkLogic Corporation
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
'use strict';

xdmp.securityAssert("http://marklogic.com/data-hub/privileges/read-custom", "execute");

import DataHubSingleton from "/data-hub/5/datahub-singleton.mjs";
import Artifacts from "/data-hub/5/artifacts/core.mjs";
const dataHub = DataHubSingleton.instance();

const queries = [];
queries.push(cts.collectionQuery("http://marklogic.com/data-hub/steps/custom"));
queries.push(cts.notQuery(cts.collectionQuery(dataHub.consts.HUB_ARTIFACT_COLLECTION)));
const artifacts = cts.search(cts.andQuery(queries), ["unfiltered", "score-zero", "unfaceted"]).toArray();
let artifactsWithoutEntity = [];
artifacts.forEach(artifact => {
  artifact = artifact.toObject();
  if (! artifact.targetEntityType) {
    artifactsWithoutEntity.push(artifact);
  }
});
const artifactsWithEntity = Artifacts.getArtifacts("custom");
artifactsWithEntity.sort((a, b) => (a.entityType > b.entityType) ? 1 : -1);
const resp = {
  "stepsWithoutEntity": artifactsWithoutEntity,
  "stepsWithEntity": artifactsWithEntity
};
resp;
