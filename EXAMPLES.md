
# Examples

Let's create a basic component and explore all the functionalities.

## Setting it up

- On the root folder of your project, create a folder called "vc_components".
- Import the "vanilla_components.js" by calling
`<script src="/vanilla_components.js"></script>`
Alternatively you can call the minified "vc_min.js".
- Remember that the _page needs to be served_ to work with VC components. Simply opening the HTML file won't do (it will return a cross origin request error). To create a simple local server for development, check out [SimpleHttpServer](https://docs.python.org/2/library/simplehttpserver.html) or [Puer](https://github.com/leeluolee/puer).

## Creating our first component

Inside the vc_components folder, create an empty file named "hello.html". In it, let's add the following markup code:
```
<button>Hello World</button>
```
In your index.html you must call the component with the vc tag, like this:
```
<vc>hello</vc>
```
The output of this would be a simple button written "Hello World".
## Styling our first component
VC allows you to add a style tag inside the component. So let's rewrite the component so it looks like this:
```
<button>Hello World</button>
<style>
   button{
    font-family: sans-serif;
    font-size: 1.1rem;
    padding: 4px 20px;
  }
</style>
```
This will style the component to a treat. But be warned, the CSS rules you add will affect all the document, not only the component it is written in, so it's a good idea to use specific selectors, such as creating specific class for each component.
## Nesting components
We can add components within components to create more complex structures. Let's make a new component by a file called "text.html" inside the "/vc_components" folder. Give it the following contents:
```
<p>Hello World</p>
```
Now you have a second component and my called it from within the first one! Let's edit "hello.html" to add the new component:
```
<vc>text</vc>
<button>click me</button>
<style>
  button, p{
    font-family: sans-serif;
    padding: 4px 20px;
    font-size: 1.1rem;
  }
</style>
```
This should output "Hello World" followed by a "click me" button.
## Adding functions
Let's make it more interesting by giving the button the ability to change the text.
```
<div>
  <vc>text</vc>
  <button onclick="btn_click()">click me</button>
</div>
<style>
  button, p{
    font-family: sans-serif;
    padding: 4px 20px;
    font-size: 1.1rem;
  }
</style>
<script>
function btn_click(){
  let text = this.parentElement.querySelector("p");
  text.innerHTML = text.innerHTML.replace("Hello","Goodbye");
}
</script>
```
We told the button to run the function "btn_click()" whenever it is pressed, and told the function to replace "Hello" for "Goodbye", and that's exactly what it does now. Like with the styling, all functions and variables you declare for a widget becomes available throughout your website.
## Adding constructor functions
Suppose you don't _want_ to use the "onclick" attribute to hook your function. We can use the "addEventListener()" function instead, but we want that to run just after our component is ready. For this, a constructor function is the best call.
A constructor function will run after the element is injected, and will pass the element itself as a paramenter. Let's set it up:
```
<div>
  <vc>text</vc>
  <button>click me</button>
</div>
<style>
  button, p{
    font-family: sans-serif;
    padding: 4px 20px;
    font-size: 1.1rem;
  }
</style>
<script>
function vc_hello(e){
  e.querySelector("button").addEventListener("click",btn_click);
}
function btn_click(){
  let text = this.parentElement.querySelector("p");
  text.innerHTML = text.innerHTML.replace("Hello","Goodbye");
}
</script>
```
Notice the button has no "onclick" attribute anymore. Instead we created a function named "vc_hello". Any function called "vc+[name of a component]" will run immediately after the component is injected. The "e" parameter is a reference to the component element in the DOM, in this case, the containing `<div>`. So use "e" to navigate to the button and tell him to run "btn_click" whenever it is pressed - which is what it does.
## Using variables
When calling the VC components in your "index.html", you can set variables to customize each instance of the component. To do so, your must declare the variable as an attribute of the component, and then you can capture it from within the component by using the same variable name. **All variable names in VC start with $.**
For example, in the file "text.html", could substitute the word "World" by "\$name".
```
<p>Hello $name</p>
```
Now, if you call it with
```
<vc $name="Susan">hello</vc>
```
you'll get the output "Hello Susan".
But we'll do something a bit trickier: on our index.html we'll set a variable "\$name" and pass it to the "hello" component, and then he is going to pass the variable onto the "text" component. In the index.htm, let's call the component like this:
```
<vc $var="John">hello</vc>
```
In the hello.html file, let's pass the variable on to the next component:
```
<div>
  <vc $name="$var">text</vc>
  <button>click me</button>
</div>
<style>
  button, p{
    font-family: sans-serif;
    padding: 4px 20px;
    font-size: 1.1rem;
  }
</style>
<script>
function vc_hello(e){
  e.querySelector("button").addEventListener("click",btn_click);
}
function btn_click(){
  let text = this.parentElement.querySelector("p");
  text.innerHTML = text.innerHTML.replace("Hello","Goodbye");
}
</script>
```
Notice there's a small catch here, about the quotes. Variables work by substituting any occurrence of the variable by the value (using regular expressions). This means that, without the quotes, you'd have the variable John (which doesn't exist, instead of a string "John". So, remember to double check your quotes when dealing with variables!
The examples above would output "Hello John" followed by the click me button.
Now we could, put in the index.html file many calls, like
```
    <vc $var="John">hello</vc>
    <vc $var="Mary">hello</vc>
    <vc $var="Brian">hello</vc>
```
and it would output the three components, each changed slightly: "Hello John", "Hello Mary" and "Hello Brian".
## One last warning about scripting
When you are scripting your components, try to use the component itself as a reference to navigate the DOM. In the example above, we created three components, each with a button to change a text. If their fun uses the document as a reference, for example
```
let text = document.querySelector("p");
```
it will only affect the first "p" tag in the document! Of course we wanted each button to affect its own text, so we construct the script _centered on the component_, for example:
```
let text = this.parentElement.querySelector("p");
```
This way the component's script can target themselves individually.
