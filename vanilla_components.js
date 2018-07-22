class VCSearch{
  constructor(codeBlock=document, path="/vc_components/"){

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
    if (component==undefined){
      console.log("Component not found");
      return;
    }
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
      let vc = this;
      req.onreadystatechange = function () {
        var DONE = this.DONE || 4;
        if (this.readyState === DONE )
          vc.processNewComponent( component, vc.parseHTML(this.response) );
      }
      var component_path = this.components_path+component.innerHTML+".html";
      req.open("GET", component_path, true);
      req.send(null)
    }
  }

  /*This function will take the raw component file, and extract the markup part,
  leaving behind script and style. This is importat to deal with table components.*/
  parseHTML(raw_data){

    let markup_regex = new RegExp('(<script>.*<\/script>|<style>.*<\/style>)',"gmi");
    let parsed_data = {"markup": raw_data.replace(markup_regex,"").trim()};

    let style_regex = new RegExp("<style>(.*)<\/style>","gmi");
    let style_match = style_regex.exec(raw_data);
    if(style_match) parsed_data["style"] = style_match[1];

    let script_regex = new RegExp("<script>(.*)<\/script>","gmi");
    let script_match = script_regex.exec(raw_data);
    if(script_match) parsed_data["script"] = script_match[1];

    return parsed_data;
  }

  /*This is the basic function to read the inner data of the <vc> components.
  If it has an htmlDoc, then it is a new component, otherwise we take the
  the basic document from cache.*/

  processNewComponent(component, htmlDoc=false){

    var name = component.innerHTML;
    var inserted_component = null;
    var markup = "";

    if(htmlDoc){ //If it's not a new component
      markup = htmlDoc["markup"];
      this.component_cache[component.innerHTML] = markup;
    } else {    //If it's not a new component
      markup = this.component_cache[name];
    }

    //Insert the markup just before the <vc> tag, and clone the attributes
    inserted_component = this.switchContents(component,markup);
    this.component_cache["vc_components"].push( [name, inserted_component] );//For us to inject style and code later on

    this.addComponentsToQueue( inserted_component );//For us to inject the html ASAP

    inserted_component.setAttribute("vc", name);    //Stub for possible future use
    inserted_component.setAttribute("vc_c", name);  //We use it to run constructors

    if(htmlDoc){

      //Caching style and script
      if(htmlDoc["style"]) this.component_cache['vc_style'] += htmlDoc["style"];
      if(htmlDoc["script"]) this.component_cache['vc_script'] += htmlDoc["script"];

    }

    this.areAllLoaded();
  }

  /*Checks if all components are loaded. If so, run loadComplements.*/
  areAllLoaded(){
    if(this.listOfComponents.length>0){
      this.loadComponent();
      this.loadCount -= 1;
    } else {
      this.loadComplements();
    }
  }

  //Adds the style and script
  loadComplements(){
    this.injectCSS();
    this.injectJS();
    this.constructComponents();
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
        if(!script.hasAttribute("vc"))
          continue;
        var substitute = document.createElement('script');
        if(script.getAttribute("src")!=null)
          substitute.setAttribute("src", script.getAttribute("src"));
        document.body.insertBefore(substitute, script);
        substitute.innerHTML = script.innerHTML;

        document.body.removeChild(script);
      }
    }

    constructComponents(){
      var components = document.querySelectorAll('[vc_c]');
      var component_list = [];
      var constructor_function;

      for(var i=0; i<components.length;i++){
        if(components[i]!=null)
          component_list.push(components[i]);
      }

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
      let attribute;
      for(let i=0;i<from_element.attributes.length;i++){
        attribute = from_element.attributes[i];
        if(attribute.name.charAt(0)=="$"){
          let regex_rule = new RegExp("\\"+attribute.name, 'g');
          //to_element.outerHTML = to_element.outerHTML.replace(regex_rule, attribute.value);
        }
      }
    }

    /*Will take a string format element and place it instead the <vc> to_element
    that otiginated it.*/
    switchContents(element, markup){

      //We take note of the variables to reinsert
      let variables=[];
      for(let i=0;i< element.attributes.length;i++ ){
        variables.push( [element.attributes[i].name,element.attributes[i].value] )
      }

      //Create an anchor to catch the new reference to the object
      let vc_first_anchor = document.createElement("span");
      vc_first_anchor.id = "vc_first_anchor";
      element.parentElement.insertBefore(vc_first_anchor,element);

      //Change the outerHTML
      element.outerHTML = markup;

      //Catch the reference back to the changed element
      let new_element = document.getElementById("vc_first_anchor").nextSibling;

      //Create second anchor
      let vc_second_anchor = document.createElement("span");
      vc_second_anchor.id = "vc_second_anchor";
      new_element.parentElement.insertBefore(vc_second_anchor,new_element);

      //Replace variables
      let regex_rule;
      let new_element_markup = new_element.outerHTML;
      for(let attrib of variables){
        if(attrib[0].charAt(0)=="$"){
          regex_rule = new RegExp("\\"+attrib[0], 'g');
          new_element_markup = new_element_markup.replace(regex_rule, attrib[1]);
        }
      }
      new_element.outerHTML = new_element_markup;

      //Catch the new revised element
      let new_revised_element = document.getElementById("vc_second_anchor").nextSibling;

      //Remove anchors
      vc_first_anchor.parentElement.removeChild(vc_first_anchor);
      vc_second_anchor.parentElement.removeChild(vc_second_anchor);

      //If markup is of td or tr, then return parentNode
      if(markup.substring(0,3)=="<tr"||markup.substring(0,3)=="<td")
        new_revised_element = new_revised_element.parentElement;
      return new_revised_element;
    }

} //close VCSearch class

//RUN

var vc_search = new VCSearch();
vc_search.loadComponent();
