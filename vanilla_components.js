/*Vanilla components are invoked by the "vc" tag. We go through the code looking
for them, and use a XMLHttpRequest to load their data. The loaded html is
put in place, the style is prepended to the document's head and the script
appended to the document's body.*/


/*CAVEATS. VC is intended to have as few gotchas as possible, but there's still
a bit of things you should be aware.

1) Components are stored in a "vc_components" on the same folder as your html.
If you want it different, change it below.

2) VC will inject the component's style on the head of your html. Because it
is a internal style, *it will supercede* your external CSS. To avoid this, you
may make your selector more specific. For example, ".myClass" will be superceded,
while "body .myClass" or "div.myClass" will not.

3) VC will inject the component's script just before your first script in the
body of your html (so avoid placing scripts high up your body). To make sure
the component's script won't supercede your own, VC will reattach all scripts
that are direct children of body, and that takes time. If you want to improve
performance by making sure your script is not reattached, you can just put it
inside any other tag (eg. <span><script></script></span>) so it's not a direct
child of body.

4) When a component is loaded, a constructor function is called, whose name is
"vc_"+[the component's name] (eg. "vc_myComponent()"). You can use it to set
data to the component.

5) When a component is loaded, all attributes given to the template call will be
passed on to the injected html. For example, <vc class="foo">bar</vc> will pass
on the class "foo" to the actual "bar" component when loaded. But beware: except
for classes, attributes will overwrite the component's default.

6) The component's code is loaded through XMLHttpRequests, and this won't work
if you just open the html on your computer: it will throw a cross origin request
error for using file protocol through an html protocol. So you have to serve your
page to use VC. Luckily, you can do it easy as pie with python's SimpleHTTPServer.
*/

var components_path = "vc_components/";

//Save component so we don't make unnecessary requests.
var component_cache = {"vc_script":"","vc_style":"","vc_components":[]};
var loadCount = 0;

//Function will load component's data
function loadComponent ( listOfComponents, component_cache ){

  component=listOfComponents.pop();
  var name = component.innerHTML;

  //If the component has been loaded already, get data from cache
  if( name in component_cache ){

    //markup is loaded from cache and written to code
    var markup = component_cache[name];
    component.insertAdjacentHTML('beforebegin', markup);
    var inserted_component = get_inserted(component);
    cloneAttributes(component,inserted_component);
    component_cache["vc_components"].push([name, inserted_component]);
    addComponentsToQueue(inserted_component, listOfComponents);
    component.parentNode.removeChild( component );

    if(listOfComponents.length>0) loadComponent( listOfComponents, component_cache, false );

  //If component hasn't been loaded yet, data comes from a request
  } else {

    loadCount += 1;

    //Create new request to load data from static file
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
      var DONE = this.DONE || 4;
      if (this.readyState === DONE ){
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(this.responseText, "text/html");

        //Get the three kinds of data: markup, style and script.

        //Markup is written in place (where the vC tag was found).
        var markup = htmlDoc.firstChild.childNodes[1].firstChild.outerHTML;
        component_cache[component.innerHTML] = markup;
        component.insertAdjacentHTML('beforebegin', markup);
        var inserted_component = get_inserted(component);
        cloneAttributes(component,inserted_component);
        component_cache["vc_components"].push([name, inserted_component]);
        addComponentsToQueue(inserted_component, listOfComponents);
        component.parentNode.removeChild( component );

        //Code must be delt with first to avoid breaking event handlers.
        var script = htmlDoc.getElementsByTagName("script")[0].innerHTML;
        component_cache['vc_script'] += script;

        //Style is cached.
        var style = htmlDoc.getElementsByTagName("style")[0].innerHTML;
        component_cache['vc_style'] += style;

        if(listOfComponents.length>0)
          loadComponent( listOfComponents, component_cache, false );
        loadCount -= 1;
        if(loadCount==0)
          loadComplements();
      }
    }
    var component_path = components_path+component.innerHTML+".html";
    req.open("GET", component_path, true);
    req.send(null)
  }
}

//Adds the style and script
function loadComplements(){
  injectCSS();
  injectJS();
  for(component of component_cache["vc_components"]){
    constructComponent(component[0],component[1]);
  }
  //console.log(document);
}

var listOfComponents = [];
var vc_array = document.getElementsByTagName('vc');
for( i=0; i<vc_array.length;i++){
  listOfComponents.push(vc_array[i]);
}
loadComponent( listOfComponents, component_cache );

//As components are loaded, more components may have been included inside their code.
//These components must be included on the listOfComponents for parsing
function addComponentsToQueue(element, listOfComponents){
  var new_components = element.getElementsByTagName("vc");
  for( i=0; i<new_components.length; i++){
    listOfComponents.push(new_components[i]);
  }
}

//Return the previous valid sibling, so the vc tag element can be
//substituted by the template.
function get_inserted(n) {
    var x = n.previousSibling;
    while (x.nodeType != 1) {
        x = x.previousSibling;
    }
    return x;
}

/*This function will prepend the style rules to the document's head,
so it's easily overwritten by custom internal css. Unofrtunately, it
still have precedence over external stylesheets. To go around this
limitation, you can set a more specific rule, which can be done just
by adding "body " in front of the selector (eg. "body .component"
will overwrite ".component").*/
function injectCSS(){
  var el = document.createElement("style");
  el.innerHTML = component_cache["vc_style"];
  document.getElementsByTagName("head")[0].prepend(el);
}

/*This function will append the script rules to the document's body,
// but will take care to add *before* any other script tags, so your custom
// scripts take precedence over it. That means it would be a good idea to
// avoid scripts high up in the body.*/
function injectJS(){
  var first_script = document.querySelector("body>script");
  var script = document.createElement('script');
  script.innerHTML = component_cache["vc_script"];
  document.body.insertBefore(script, first_script);

  //document.body.appendChild(script);
  //But now, the nasty and the ugly:
  //in order for the default component to give precedence on conflict
  //we need to dynamically load all scripts, because dynamically loaded
  //script get precedence, no matter how high they are in the body.
  //This isn't pretty...

  var all_scripts = document.querySelectorAll("body>script");
  for(i=1;i<all_scripts.length;i++){
    var script = all_scripts[i];
    if(script.getAttribute("src")=="vanilla_components.js")
      continue;
    var substitute = document.createElement('script');
    if(script.getAttribute("src")!=null)
      substitute.setAttribute("src", script.getAttribute("src"));
    document.body.insertBefore(substitute, script);
    substitute.innerHTML = script.innerHTML;

    document.body.removeChild(script);
  }
}

/*Call constructor function.
Instead of configuring the component through markup, vanilla Components
rely on javascript, specificaaly it tries to invoke a function named
"vc_[name of component]" for each component it parses. For example, a
component declared as <vc>dropDownList</vc> would run automatically run a
function vc_dropDownList(c){}, where c is the instance of the component just
created.
This allows you to set data to the individual component. For example, you could
write this constructor function to set the list items of a dropDownList, or
the images on a carousel, etc. In any case, this is just a hook - the constructor
function must be written by the creator of the component.
Construct functions run after all compoenents are loaded (because the JS in only
injected after all markup is injected).*/
function constructComponent(component_name, component){
  var constructor_function = "vc_"+component_name;
  if(typeof window[constructor_function] === "function"){
    window[constructor_function](component);
  }
}

/*This function recreates all the from_element's attributes on to_element. This
allows the dev to set differentiating attributes to two instances of the same
component.*/
function cloneAttributes(from_element,to_element){
  var attrib = null;
  for(i=0;i<from_element.attributes.length;i++){
    var attrib = from_element.attributes[i];
    if(attrib.name=="class"){
      to_element.setAttribute(attrib.name, attrib.value+" "+to_element.className);
    } else {
      to_element.setAttribute(attrib.name, attrib.value);
    }
  }
}
