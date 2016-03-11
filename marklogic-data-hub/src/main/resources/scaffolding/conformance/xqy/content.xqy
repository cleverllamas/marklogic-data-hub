xquery version "1.0-ml";

module namespace plugin = "http://marklogic.com/data-hub/plugins/content";

declare namespace envelope = "http://marklogic.com/data-hub/envelope";

declare option xdmp:mapping "false";

(:~
 : Create Content Plugin
 :
 : @param id       - the identifier returned by the collector
 : @param content  - your final content
 : @param headers  - a sequence of header nodes
 : @param triples  - a sequence of triples
 : @param $options - a map containing options. Options are sent from Java
 :
 : @return - your transformed content
 :)
declare function plugin:create-content(
  $id as xs:string,
  $content as node()?,
  $headers as node()*,
  $triples as sem:triple*,
  $options as map:map) as node()?
{
  fn:doc($id)/envelope:envelope/envelope:content/node()
};
