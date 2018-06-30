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

  /*This is the main method. A recursive function that will go through the DOM
  looking for <vc> tags to inject their markup and cache their code and style.*/

  loadComponent (){
    var component = this.listOfComponents.pop();
    var name = component.innerHTML;
    var new_component;

    //If the component has been loaded already, get data from cache
    if( name in this.component_cache ){
      new_component = this.processNewComponent(component);

    //If component hasn't been loaded yet, data comes from a request
    } else {
      this.loadCount += 1; //We use this to know when we're done, so as to inject style and code
      //Create new request to load data from static file
      var req = new XMLHttpRequest();
      var vc = this;
      req.onreadystatechange = function () {
        var DONE = this.DONE || 4;
        if (this.readyState === DONE ){
          var parser = new DOMParser();
          var htmlDoc = parser.parseFromString(this.responseText, "text/html");
          new_component = vc.processNewComponent(component,htmlDoc);
        }
      }
      var component_path = this.components_path+component.innerHTML+".html";
      req.open("GET", component_path, true);
      req.send(null)
    }

  }

  /*This is the basic function to read the inner data of the <vc> components.
  If it has an htmlDoc, then it is a new component, otherwise we take the
  the basic document from cache.*/

  processNewComponent(component, htmlDoc=false){
    var name = component.innerHTML;
    var inserted_component = null;
    var markup = "";

    if(htmlDoc){
      //Get markup and add to cache
      for( let i of [htmlDoc,htmlDoc.firstChild,htmlDoc.firstChild.childNodes[1],htmlDoc.firstChild.childNodes[1].children[0]]){
        console.log(i);
      }

      if( htmlDoc.firstChild.childNodes[1].tagName == "BODY"){
        markup = htmlDoc.firstChild.childNodes[1].children[0].outerHTML;
        this.component_cache[component.innerHTML] = markup;
      } else {
        markup = htmlDoc.children[0].outerHTML;
        this.component_cache[component.innerHTML] = markup;
      }

    } else {
      //Get markup
      markup = this.component_cache[name];
    }

    //Insert the markup just before the <vc> tag, and clone the attributes
    component.insertAdjacentHTML( 'beforebegin', markup );  //Alas, this func doesn't return inserted
    inserted_component = this.get_inserted( component );    //So this one gets the immediate element before (which we just inserted)

    this.cloneAttributes( component, inserted_component );  //Reproduce the attributes on the inserted
    //console.log('component check',inserted_component);

    //Add the new component to cache and queue it for parsing
    this.component_cache["vc_components"].push( [name, inserted_component] ); //For us to inject style and code later on
    this.addComponentsToQueue( inserted_component );    //For us to inject the html ASAP

    //We add an attribute "vc" so it remembers is was created from a vc tag
    //and a disposable "vc_constructor" to keep track of running the function.
    inserted_component.setAttribute("vc", name);    //Stub for possible future use
    inserted_component.setAttribute("vc_c", name);  //We use it to run constructors
    //inserted_component.setAttribute("testing", "testing");  //We use it to run constructors


    //Now we remove the original <vc> element
    component.parentNode.removeChild( component );

    //If it is a new component, we must also cache its style and script
    if(htmlDoc){
      //Cache script
      if(htmlDoc.getElementsByTagName("script")[0])
        this.component_cache['vc_script'] += htmlDoc.getElementsByTagName("script")[0].innerHTML;

      //Style is cached.
      if(htmlDoc.getElementsByTagName("style")[0])
        this.component_cache['vc_style'] += htmlDoc.getElementsByTagName("style")[0].innerHTML;

      //This will keep track of components left even in asynchronous situations.
      if(this.listOfComponents.length>0)
        //return inserted_component;
        this.loadComponent();
      this.loadCount -= 1;
      if(this.loadCount==0)
        //return null;
        this.loadComplements();
    } else {
      if(this.listOfComponents.length>0) this.loadComponent();
    }
    // console.log("check insert attr",inserted_component);
    console.log("!!", inserted_component);
  }

  //Adds the style and script
  loadComplements(){
    console.log('10');
    this.injectCSS();
    this.injectJS();
    // for(var component of this.component_cache["vc_components"]){
    //   this.constructComponent(component[0],component[1]);
    // }
    console.log('11');
    this.constructComponents();
    console.log(document);
    console.log('12');
  }

  /*As components are loaded, more components may be nested within their code.
  These components must be included on the listOfComponents for parsing.*/
  addComponentsToQueue(element){
    var new_components = element.getElementsByTagName("vc");
    for( var i=0; i<new_components.length; i++){
      this.listOfComponents.push(new_components[i]);
    }
  }


  /*Injects cached style to the top of the document.*/
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

      //Reappend most scripts so injected CSS don't have presedence over them.
      var all_scripts = document.querySelectorAll("body>script");
      for(var i=1;i<all_scripts.length;i++){
        var script = all_scripts[i];
        if(script.getAttribute("src")=="vanilla_components.js")
          continue;
        if(script.getAttribute("src")!="vc")
          continue;
        var substitute = document.createElement('script');
        if(script.getAttribute("src")!=null)
          substitute.setAttribute("src", script.getAttribute("src"));
        document.body.insertBefore(substitute, script);
        substitute.innerHTML = script.innerHTML;

        document.body.removeChild(script);
      }
    }



    // /*Call a function named vc_[component's name](component) as a constructor when
    // the component is loaded.*/
    // constructComponent(component_name, component){
    //   var constructor_function = "vc_"+component.getAttribute("vc");//component_name;
    //   if(typeof window[constructor_function] === "function"){
    //     window[constructor_function](component);
    //   }
    //   if(component_name == component.getAttribute("vc")) console.log("equal function names");
    //   if(component_name != component.getAttribute("vc")) console.log("equal NOT function names");
    // }

    /*Go through the dom searching for injected components, and run their "constructor"
    functions, that is, run a function named vc_[component's name](component).
    TODO: it isn't working properly.*/
    // constructComponents_bkp(){
    //   var component = document.querySelector('[vc_constructor]');
    //   if(component!=null) {
    //     console.log("constructing... ", component.getAttribute("vc_constructor"));
    //     var constructor_function = "vc_"+component.getAttribute("vc");
    //     if(typeof window[constructor_function] === "function"){
    //       window[constructor_function](component);
    //     }
    //
    //     component.removeAttribute("vc_constructor");
    //     this.constructComponents();
    //   }
    //   else {
    //     console.log("Am I null?",component)
    //   }
    // }

    constructComponents(){
      var components = document.querySelectorAll('[vc_c]');
     console.log("!>>>> ",components, components.length );
      var component_list = [];
      var constructor_function;

      for(var i=0; i<components.length;i++){
        if(components[i]!=null)
          component_list.push(components[i]);
      }
      console.log("Length of constructor: "+component_list.length);
      for(var component of component_list){
        constructor_function = "vc_"+component.getAttribute("vc_c");
        if(typeof window[constructor_function] === "function"){
          window[constructor_function](component);
        }
        component.removeAttribute("vc_c");
      }
    }

    /*Clones the characteristics (attributes) from original <vc> element to corresponding
    injected components. This process have some peculiar cases: please refer to doc.txt.*/
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



  /*Auxiliary method. It returns the previous valid sibling of a DOM element,
  so the <vc> element can be substituted by its respective markup.*/
  get_inserted(n) {
      var x = n.previousSibling;
      while (x.nodeType != 1) {
          x = x.previousSibling;
      }
      return x;
  }



}

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

