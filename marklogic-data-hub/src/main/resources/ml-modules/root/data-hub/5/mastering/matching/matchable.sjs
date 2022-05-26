'use strict';
const httpUtils = require("/data-hub/5/impl/http-utils.sjs");
const hubUtils = require("/data-hub/5/impl/hub-utils.sjs");
const blocks = require("/com.marklogic.smart-mastering/matcher-impl/blocks-impl.xqy");
const cachedInterceptorModules = {};

function retrieveInterceptorFunction(interceptorObj, interceptorType) {
  let interceptorModule = cachedInterceptorModules[interceptorObj.path];
  if (!interceptorModule) {
    try {
      interceptorModule = require(interceptorObj.path);
      cachedInterceptorModules[interceptorObj.path] = interceptorModule;
    } catch (e) {
      httpUtils.throwBadRequest(`Module defined by ${interceptorType} not found: ${interceptorObj.path}`);
    }
  }
  const interceptorFunction = interceptorModule[interceptorObj.function];
  if (!interceptorFunction) {
    httpUtils.throwBadRequest(`Function defined by ${interceptorType} not exported by module: ${interceptorObj.function}#${interceptorObj.path}`);
  }
  return interceptorFunction;
}

function applyInterceptors(interceptorType, accumulated, interceptors, ...additionalArguments) {
  if (!interceptors || interceptors.length === 0) {
    return accumulated;
  } else {
    const interceptorObj = interceptors.shift();
    const interceptorFunction = retrieveInterceptorFunction(interceptorObj, interceptorType);
    return applyInterceptors(interceptorType, interceptorFunction(accumulated, ...additionalArguments), interceptors, ...additionalArguments);
  }
}

/*
 * A class that encapsulates the configurable portions of teh matching process.
 */
class Matchable {
  constructor(matchStep, stepContext) {
    this.matchStep = matchStep;
    this.stepContext = stepContext;
    const targetEntityType = this.matchStep.targetEntityType;
    if (targetEntityType) {
      const entities = require("/data-hub/core/models/entities.sjs");
      this._model = entities.getEntityModel(targetEntityType);
    }
    if (!this._model) {
      this._model = new GenericMatchModel(this.matchStep, {collection: targetEntityType ? targetEntityType.substring(targetEntityType.lastIndexOf("/") + 1):null});
    }
  }

  /*
   * Returns a Model class instance that defines how match queries should be built
   * @return Model class instance
   * @since 5.8.0
   */
  model() {
    return this._model;
  }

  /*
   * Returns a cts.query to represent the entire set of documents that should be matched against
   * @return cts.query
   * @since 5.8.0
   */
  baselineQuery() {
    if (!this._baselineQuery) {
      const firstBaseline = this._model.instanceQuery();
      this._baselineQuery = applyInterceptors("Baseline Query Interceptor", firstBaseline, this.matchStep.baselineQueryInterceptors);
    }
    return this._baselineQuery;
  }
  /*
   * Returns an array of MatchRulesetDefinition class instances that describe the rule sets for matching
   * @return []MatchRulesetDefinition
   * @since 5.8.0
   */
  matchRulesetDefinitions() {
    if (!this._matchRulesetDefinitions) {
      this._matchRulesetDefinitions = (this.matchStep.matchRulesets || [])
        .map((ruleset) => new MatchRulesetDefinition(ruleset, this))
        .sort((a, b) => b.weight() - a.weight());
    }
    return this._matchRulesetDefinitions;
  }

  /*
   * Returns an array of ThresholdDefinition class instances that describe the thresholds matches can be grouped into
   * @return []ThresholdDefinition
   * @since 5.8.0
   */
  thresholdDefinitions() {
    if (!this._thresholdDefinitions) {
      this._thresholdDefinitions = this.matchStep.thresholds.map((thresholdObj) => {
        return new ThresholdDefinition(thresholdObj, this);
      }).sort((a, b) => a.score() - b.score());
    }
    return this._thresholdDefinitions;
  }

  /*
   * Returns a cts.query that filters out documents that shouldn't match with an individual document. The default is to
   * return a cts.andNotQuery(cts.query(matchStep.filterQuery), cts.documentQuery([selfDocURI, documentsBlockedByUnmerge]))
   * @param {Node} documentNode
   * @return cts.query
   * @since 5.8.0
   */
  filterQuery(documentNode) {
    let filterQuery, notDocumentQuery, stepFilterQuery;
    let excludeDocuments = Sequence.from([xdmp.nodeUri(documentNode), blocks.getBlocks(fn.baseUri(documentNode)).xpath("text()")]);
    if (fn.exists(excludeDocuments)) {
      notDocumentQuery = cts.documentQuery(excludeDocuments.toArray());
    }
    if (this.matchStep.filterQuery) {
      stepFilterQuery = cts.query(this.matchStep.filterQuery);
    }
    if (stepFilterQuery && notDocumentQuery) {
      filterQuery = cts.andNotQuery(stepFilterQuery, notDocumentQuery);
    } else if (notDocumentQuery) {
      filterQuery = cts.notQuery(notDocumentQuery);
    } else if (stepFilterQuery) {
      filterQuery = stepFilterQuery;
    }
    return applyInterceptors("Filter Query Interceptor", filterQuery, this.matchStep.filterQueryInterceptors, documentNode);
  }

  /*
   * Returns a score in the form of a double of 2 documents
   * @param {ContentObject} contentObjectA
   * @param {ContentObject} contentObjectB
   * @param {[]MatchRulesetDefinition} matchingRulesets
   * @return double
   * @since 5.8.0
   */
  scoreDocument(contentObjectA, contentObjectB) {
    const matchingRulesetDefinitions = this.matchRulesetDefinitions();
    let defaultScore = 0;
    for (const matchRuleset of matchingRulesetDefinitions) {
      defaultScore += matchRuleset.score(contentObjectA, contentObjectB);
    }
    return applyInterceptors("Score Document Interceptor", defaultScore, this.matchStep.scoreDocumentInterceptors, contentObjectA, contentObjectB, matchingRulesetDefinitions);
  }
  /*
   * Returns a JSON Object with details to pass onto the merge step for use in taking action.
   * @param {[]ContentObject} matchingDocumentSet
   * @param {ThresholdDefinition} thresholdBucket
   * @return {}
   * @since 5.8.0
   */
  buildActionDetails(matchingDocumentSet, thresholdBucket) {
    const action = thresholdBucket.action();
    const actionUri = thresholdBucket.generateActionURI(matchingDocumentSet);
    const threshold = thresholdBucket.name();
    const uris = matchingDocumentSet.map((contentObj) => contentObj.uris);
    let actionBody;
    // TODO: when we refactor merging code we can likely clean up the awkward "function", "at" property names and remove the namespace property
    if (action === "custom") {
      actionBody = {
        action: "customActions",
        actions: [
          {
            threshold,
            uris,
            "function": thresholdBucket.actionModuleFunction(),
            "at": thresholdBucket.actionModulePath(),
            "namespace": thresholdBucket.actionModuleNamespace(),
            matchResults: matchingDocumentSet
          }
        ]
      };
    } else {
      actionBody = {
        action,
        threshold,
        uris
      };
    }
    return {
      [actionUri]: actionBody
    };
  }

  /*
   * Returns a query given a property path a set of values based on the model associated with Matchable.
   * This will likely be reused and so can be moved to a common at some point.
   * @param {string} propertyPath
   * @param {item*} values
   * @return {cts.query}
   * @since 5.8.0
   */
  propertyQuery(propertyPath, values) {
    const indexes = this.model().propertyIndexes(propertyPath);
    if (indexes && indexes.length) {
      const scalarType = cts.referenceScalarType(indexes[0]);
      const collation = (scalarType === "string") ? cts.referenceCollation(indexes[0]): null;
      let typedValues = [];
      for (const value of values) {
        if (xdmp.castableAs("http://www.w3.org/2001/XMLSchema", scalarType, value)) {
          typedValues.push(xs[scalarType](value));
        }
      }
      if (collation) {
        typedValues = cts.valueMatch(indexes, typedValues, "case-insensitive");
      }
      return cts.rangeQuery(indexes, typedValues)
    } else {
      const propertyDefinition = this.model().propertyDefinition(propertyPath);
      const localname = propertyDefinition.localname;
      return cts.orQuery([
        cts.jsonPropertyValueQuery(localname, values),
        cts.elementValueQuery(fn.QName(propertyDefinition.namespace, localname), values)
      ]);
    }
  }
}

class MatchRulesetDefinition {
  constructor(matchRuleset, matchable) {
    this.matchRuleset = matchRuleset;
    this.matchable = matchable;
  }

  name() {
    return this.matchRuleset.name;
  }

  _valueFunction(matchRule, model) {
    if (!matchRule._valueFunction) {
      matchRule._valueFunction = (documentNode) => model.propertyValues(matchRule.entityPropertyPath, documentNode);
    }
    return matchRule._valueFunction;
  }

  _matchFunction(matchRule, model) {
    if (!matchRule._matchFunction) {
      let passMatchRule = matchRule;
      let passMatchStep = this.matchable.matchStep;
      let convertToNode = false;
      let matchFunction;
      switch (matchRule.matchType) {
        case "exact":
          matchFunction = (values) => this.matchable.propertyQuery(matchRule.entityPropertyPath, values);
          convertToNode = true;
          break;
        case "doubleMetaphone":
          matchFunction = hubUtils.requireFunction("/com.marklogic.smart-mastering/algorithms/double-metaphone.xqy", "doubleMetaphone");
          convertToNode = true;
          break;
        case "synonym":
          matchFunction = hubUtils.requireFunction("/com.marklogic.smart-mastering/algorithms/thesaurus.xqy", "synonym");
          convertToNode = true;
          break;
        case "custom":
          matchFunction = hubUtils.requireFunction(matchRule.algorithmModulePath, matchRule.algorithmFunction);
          convertToNode = /\.xq[yml]?$/.test(matchRule.algorithmModulePath);
          break;
        default:
          httpUtils.throwBadRequest(`Undefined match type "${matchRule.matchType}" provided.`);
      }
      if (convertToNode) {
        passMatchRule = new NodeBuilder().addNode(passMatchRule).toNode();
        passMatchStep = new NodeBuilder().addNode(passMatchStep).toNode();
      }
      matchRule._matchFunction = (values) => matchFunction(values, passMatchRule, passMatchStep);
    }
    return matchRule._matchFunction;
  }

  score(contentObjectA, contentObjectB) {
    const query = this.buildCtsQuery(contentObjectA.value);
    if (fn.exists(query) && cts.contains(contentObjectB.value, query)) {
      return this.weight();
    }
    return 0;
  }

  buildCtsQuery(documentNode) {
    const queries = [];
    const model = this.matchable.model();
    for (const matchRule of this.matchRuleset.matchRules) {
      const valueFunction = this._valueFunction(matchRule, model);
      const matchFunction = this._matchFunction(matchRule, model);
      const values = valueFunction(documentNode);
      const query = fn.exists(values) ? matchFunction(values): null;
      if (!query) {
        return null;
      }
      queries.push(query);
    }
    return queries.length > 1 ? cts.andQuery(queries): queries[0];
  }

  weight() {
    return fn.number(this.matchRuleset.weight);
  }

  raw() {
    return this.matchRuleset;
  }
}

class ThresholdDefinition {
  constructor(threshold, matchable) {
    this.threshold = threshold;
    this.matchable = matchable;
  }

  /*
   * Returns a string that is the threshold's name.
   * @return {string}
   * @since 5.8.0
   */
  name() {
    return this.threshold.thresholdName;
  }

  /*
   * Returns a number that is the threshold's score.
   * @return {number}
   * @since 5.8.0
   */
  score() {
    return this.threshold.score;
  }

  // this is a helper function to find combinations of rulesets that match a threshold
  _otherCombinations(remainingRulesets = []) {
    let combinations = [];
    for (let i = 0; i < remainingRulesets.length; i++) {
      const ruleset = remainingRulesets[i];
      let combinationsStartingWith = [ruleset];
      let combinedWeight = ruleset.weight();
      const followingRulesets = remainingRulesets.slice(i + 1);
      for (const followingRuleset of followingRulesets) {
        combinedWeight = combinedWeight + followingRuleset.weight();
        combinationsStartingWith.push(followingRuleset);
        if (combinedWeight >= this.score()) {
          // add the combination to the list because the score is matched.
          combinations.push(combinationsStartingWith);
          // undo the last weight to so we can see if later rulesets will also push us to the threshold
          combinationsStartingWith = [...combinationsStartingWith];
          combinationsStartingWith.pop();
          combinedWeight = combinedWeight - followingRuleset.weight();
        }
      }
    }
    return combinations;
  }

  /*
   * Returns an array of arrays with each sub-array being a minimum combination of rulesets needed to meet this threshold.
   * @return {[][]MatchRulesetDefinition}
   * @since 5.8.0
   */
  minimumMatchCombinations() {
    if (!this._minimumMatchCombinations) {
      const score = this.score();
      const matchingRulesetDefinitions = this.matchable.matchRulesetDefinitions();
      if (score === 0) {
        this._minimumMatchCombinations = matchingRulesetDefinitions;
      } else {
        const rulesetsGreaterOrEqualToScore = [];
        const rulesetsLessThanScore = [];
        for (const rulesetDef of matchingRulesetDefinitions) {
          // if weight is not specified, we assume the rule is important and custom scoring after retrieval will take place.
          if (rulesetDef.weight() === undefined || rulesetDef.weight() >= score) {
            rulesetsGreaterOrEqualToScore.push(rulesetDef);
          } else {
            rulesetsLessThanScore.push(rulesetDef);
          }
        }
        this._minimumMatchCombinations = rulesetsGreaterOrEqualToScore.map((rulesetDef) => [rulesetDef]);
        const lessCombinations = this._otherCombinations(rulesetsLessThanScore);
        this._minimumMatchCombinations = this._minimumMatchCombinations.concat(lessCombinations);
      }
    }
    return this._minimumMatchCombinations;
  }

  /*
   * Returns a string that indicates the threshold's action.
   * @return {string}
   * @since 5.8.0
   */
  action() {
    return this.threshold.action;
  }

  generateMD5Key(documentSet, salt) {
    const values = documentSet.map((contentObj) => contentObj.uri);
    if (salt) {
      values.unshift(salt);
    }
    return xdmp.md5(values.join("##"));
  }

  generateActionURI(matchingDocumentSet) {
    const action = this.action();
    const firstUri = matchingDocumentSet[0].uri;
    let key;
    switch (action) {
      case "merge":
        key = this.generateMD5Key(matchingDocumentSet);
        const format = firstUri.substr(firstUri.lastIndexOf(".") + 1);
        return `/com.marklogic.smart-mastering/merged/${key}.${format}`;
      case "notify":
        key = this.generateMD5Key(matchingDocumentSet, this.name());
        return `/com.marklogic.smart-mastering/matcher/notifications/${key}.xml`;
      default:
        return firstUri;
    }
  }

  raw() {
    return this.threshold;
  }

  actionModuleFunction() {
    return this.threshold.actionModuleFunction;
  }

  actionModulePath() {
    return this.threshold.actionModulePath;
  }

  actionModuleNamespace() {
    return this.threshold.actionModuleNamespace;
  }
}

class GenericMatchModel {
  constructor(matchStep, options = {}) {
    this.matchStep = matchStep;
    this.matchStep.propertyDefs = this.matchStep.propertyDefs || {properties:[]};
    this._propertyDefinitionMap = {};
    this._indexesByPath = {};
    this._propertyDefinitionMap = {};
    this._namespaces = this.matchStep.propertyDefs.namespaces || {};
    for (const propertyDefinition of this.matchStep.propertyDefs.properties) {
      this._propertyDefinitionMap[propertyDefinition.name] = propertyDefinition;
    }
    const defaultCollection = matchStep.collections && matchStep.collections.content ? matchStep.collections.content : "mdm-content";
    this._instanceQuery = cts.collectionQuery(options.collection || defaultCollection);
  }

  instanceQuery() {
    return this._instanceQuery;
  }

  propertyDefinition(propertyPath) {
    return this._propertyDefinitionMap[propertyPath] || { localname: propertyPath, namespace: "" };
  }

  propertyValues(propertyPath, documentNode) {
    const propertyDefinition = this.propertyDefinition(propertyPath);
    return propertyDefinition.path ? documentNode.xpath(propertyDefinition.path, this._namespaces) : documentNode.xpath(`.//ns:${propertyDefinition.localname}`, {ns: propertyDefinition.namespace});
  }

  propertyIndexes(propertyPath) {
    if (!this._indexesByPath[propertyPath]) {
      const pathIndexes = [];
      const propertyDefinition = this._propertyDefinitionMap[propertyPath];
      if (propertyDefinition.indexReferences && propertyDefinition.indexReferences.length) {
        for (const indexReference of  propertyDefinition.indexReferences) {
          try {
            pathIndexes.push(cts.reference(indexReference));
          } catch (e) {
            xdmp.log(`Couldn't use index for property path '${propertyPath}' Reason: ${xdmp.toJsonString(e)}`);
          }
        }
      }
      this._indexesByPath[propertyPath] = pathIndexes;
    }
    return this._indexesByPath[propertyPath];
  }
}

module.exports = {
  Matchable,
  MatchRulesetDefinition
}