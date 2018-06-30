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

class VCSearch{
  constructor(codeBlock=document, path="vc_components/"){
    this.codeBlock = codeBlock;
    this.components_path = path;
    this.component_cache = {"vc_script":"","vc_style":"","vc_components":[]};
    this.loadCount = 0;
    this.listOfComponents = [];
    this.vc_array = codeBlock.getElementsByTagName('vc');
    for( var i=0; i<this.vc_array.length;i++){
      this.listOfComponents.push(this.vc_array[i]);
    }

  }

  //This is the main function. It will load components' data
  loadComponent (){

    var component = this.listOfComponents.pop();
    var name = component.innerHTML;

    //If the component has been loaded already, get data from cache
    if( name in this.component_cache ){

      //markup is loaded from cache and written to code
      var markup = this.component_cache[name];
      component.insertAdjacentHTML( 'beforebegin', markup );
      var inserted_component = this.get_inserted( component );
      this.cloneAttributes( component, inserted_component );
      this.component_cache["vc_components"].push( [name, inserted_component] );
      this.addComponentsToQueue( inserted_component );
      component.parentNode.removeChild( component );

      //Recursive call untill we're done with all components
      if(this.listOfComponents.length>0) this.loadComponent();

    //If component hasn't been loaded yet, data comes from a request
    } else {

      this.loadCount += 1; //Used to know when we're done, so as to inject style and code

      //Create new request to load data from static file
      var req = new XMLHttpRequest();
      var vc = this;
      req.onreadystatechange = function () {
        var DONE = this.DONE || 4;
        if (this.readyState === DONE ){
          var parser = new DOMParser();
          var htmlDoc = parser.parseFromString(this.responseText, "text/html");

          //Get the three kinds of data: markup, style and script.

          //Markup is written in place (where the vC tag was found).
          var markup = htmlDoc.firstChild.childNodes[1].firstChild.outerHTML;
          vc.component_cache[component.innerHTML] = markup;
          component.insertAdjacentHTML('beforebegin', markup);
          var inserted_component = vc.get_inserted(component);
          vc.cloneAttributes(component,inserted_component);
          vc.component_cache["vc_components"].push([name, inserted_component]);
          vc.addComponentsToQueue(inserted_component, vc.listOfComponents);
          component.parentNode.removeChild( component );

          //Code must be delt with first to avoid breaking event handlers.
          let items = htmlDoc.getElementsByTagName("script");
          if (items.length!=0){
            var script = items[0].innerHTML;
            vc.component_cache['vc_script'] += script;
          }

          //Style is cached.
          items = htmlDoc.getElementsByTagName("style");
          if (items.length!=0){
            var style = items[0].innerHTML;
            vc.component_cache['vc_style'] += style;
          }

          if(vc.listOfComponents.length>0)
            vc.loadComponent();
          vc.loadCount -= 1;
          if(vc.loadCount==0)
            vc.loadComplements();
        }
      }
      var component_path = this.components_path+component.innerHTML+".html";
      req.open("GET", component_path, true);
      req.send(null)
    }
  }

  //Adds the style and script
  loadComplements(){
    this.injectCSS();
    this.injectJS();
    for(var component of this.component_cache["vc_components"]){
      this.constructComponent(component[0],component[1]);
    }
  }

  //As components are loaded, more components may have been included inside their code.
  //These components must be included on the listOfComponents for parsing
  addComponentsToQueue(element){
    var new_components = element.getElementsByTagName("vc");
    for( var i=0; i<new_components.length; i++){
      this.listOfComponents.push(new_components[i]);
    }
  }

  //Return the previous valid sibling, so the vc tag element can be
  //substituted by the template.
  get_inserted(n) {
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
  injectCSS(){
    var el = document.createElement("style");
    el.innerHTML = this.component_cache["vc_style"];
    document.getElementsByTagName("head")[0].prepend(el);
  }

  /*This function will append the script rules to the document's body,
  // but will take care to add *before* any other script tags, so your custom
  // scripts take precedence over it. That means it would be a good idea to
  // avoid scripts high up in the body.*/
  injectJS(){
    var first_script = document.querySelector("body>script");
    var script = document.createElement('script');
    script.innerHTML = this.component_cache["vc_script"];
    document.body.insertBefore(script, first_script);
    //document.body.appendChild(script);
    //But now, the nasty and the ugly:
    //in order for the default component to give precedence on conflict
    //we need to dynamically load all scripts, because dynamically loaded
    //script get precedence, no matter how high they are in the body.
    //This isn't pretty...
    var all_scripts = document.querySelectorAll("body>script");
    for(var i=1;i<all_scripts.length;i++){
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
  rely on javascript, specifically it tries to invoke a function named
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
  constructComponent(component_name, component){
    var constructor_function = "vc_"+component_name;
    if(typeof window[constructor_function] === "function"){
      window[constructor_function](component);
    }
  }



  /*This function recreates all the from_element's attributes on to_element. This
  allows the dev to set differentiating attributes to two instances of the same
  component. There are three rules you should know for passing on attributes.

  First, any attributes given to the component call, but not referred to within the
  the component html, then it is moved to the first element of the component. So,
  a component named "foo" with the following html:
    <div>
      <div>
      </div>
    </div>
  when called as <vc class="one two three">foo</vc> will inject as
    <div class="one two three">
      <div>
      </div>
    </div>

  Second, any attribute given to the vc declaration is moved to a place, within the
  component, where the attribute is given (without value). So, a component named
  "foo" with the following html:
    <div>
      <div class>
      </div>
    </div>
  when called as <vc class="one two three">foo</vc> will render as
    <div>
      <div class=vc class="one two three">
      </div>
    </div>

  Thirdly and finally, you may pass attributes as variables starting with $. This
  allows you to pass multiple of the same attribute to different elements. So, a
  component named "foo" with the following html:
    <div class=$outeclass>
      <div class=$innerclass>
      </div>
    </div>
  when called as <vc $outerclass="one" $innerclass="two">foo</vc> will render as
    <div class="one">
      <div class="two">
      </div>
    </div>
  */
  //cloneAttributes(component,inserted_component);
  cloneAttributes(from_element,to_element){
    var attrib = null;
    var to_el = [to_element];
    var attributes = [];

    //list of all elements in to_element
    for(var i=0;i<to_element.children.length;i++)
      to_el.push(to_element.children[i]);
    //list of all attributes in from_element
    for(var i=0;i<from_element.attributes.length;i++)
      attributes.push(from_element.attributes[i]);


    for( var attribute of attributes){

      //There are two main rules for dealing with attributes: either they are
      //plain or variables (which starts with $). Let's deal with them sepparately.

      if(attribute.name.charAt(0)=="$"){

        to_element.outerHTML = to_element.outerHTML.replaceAll(attribute.name, attribute.value);

        //If no element was set to receive the attribute, none receives it
        //(because we only know the attribute's value, not the name, so we cannot
        //set it to a default).

      } else {
        //Check if attribute is called from within to_component
        var was_called=false;
        for( var el of to_el ){

          //If an element is found to have the attribute, it becomes the target
          if(el.hasAttribute(attribute.name)){
            if(attribute.name == "class"){
              el.setAttribute(attribute.name,el.getAttribute(attribute.name)+" "+attribute.value);
            } else {
              el.removeAttribute(attribute.name);
              el.setAttribute(attribute.name,attribute.value);
            }
            was_called=true;
          }
        }
        //If no element was set to receive the attribute, default to 1st element
        if(!was_called) to_el[0].setAttribute(attribute.name,attribute.value);


      }
    }
  }

}

//TODO Bring it all within the class



var vc_search = new VCSearch();
vc_search.loadComponent();






// function parseVC(codeBlock){
//
//   var components_path = "vc_components/";
//   var component_cache = {"vc_script":"","vc_style":"","vc_components":[]};
//   var loadCount = 0;
//   var listOfComponents = [];
//
//   var vc_array = codeBlock.getElementsByTagName('vc');
//   for( i=0; i<vc_array.length;i++){
//     listOfComponents.push(vc_array[i]);
//   }
//   loadComponent( listOfComponents, component_cache );
// }
// parseVC(document);



//AUXILIARY FUNCTIONS

//Replace all subtrings in a string
String.prototype.replaceAll = function(search,replace){
  if (this.indexOf(search)===-1) return this;
  if (replace.indexOf(search)!==-1) return this;
  return (this.replace(search,replace)).replaceAll(search,replace);
}
