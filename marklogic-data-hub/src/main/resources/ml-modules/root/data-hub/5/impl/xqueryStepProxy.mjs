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

export default class XqueryStepProxy {

  constructor(config = null) {
    this.proxyMain = (content, options, context) => {
      return this.proxy("main", content, options, context)
    }
  }

  setModuleLibraryURI(moduleLibraryURI){
    this.moduleLibraryURI = moduleLibraryURI
    console.log("set uri to " + moduleLibraryURI)
    return this
  }

  getFunctions(){
    console.log("returning function")
    return {"main" : this.proxyMain} //function(x,y,z){xdmp.log(["DAE2", x, y, z])}}  //require(this.moduleLibraryURI ).main}
  }
 
  proxy(functionName, content, options, context){

    xdmp.log(["DAE3", this.moduleLibraryURI, content, options, context])
    var proxyContent  = xdmp.fromJSON(content)
    var proxyOptions  = xdmp.fromJSON(options)






                  var targetModule = require(this.moduleLibraryURI)
    var modifiedContent = targetModule[functionName](proxyContent, proxyOptions)
    xdmp.log(["DAE - modifiedcontent", modifiedContent])
    return modifiedContent
  }
}


