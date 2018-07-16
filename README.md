# Vanilla Components
A simple templating tool for loading components dynamically. It allows you to write components that include markup, style and script and load them into your main html.

## HOW DOES IT WORK?
### ● Installing
1. Create a folder called vanilla_components int the root folder. Your components go in there.
2. Include the vanilla component script to yout main HTML (`<script src="/vc_min.js"></script>`).

### ● Basic use

A component is any element (div, span, p...) written in an HTML file. The same file may contain a script and/or style tags, in any order. The html has to placed in a folder called "vc_components" in the root folder.

To call the component, you add a `<vc>` tag and write the name of the component file as its content. For example, if you want to use the component "hello.html", you must only write `<vc>hello</vc>`.

What Vanilla Components does is to load the component file and inject its content in the same place where you called it with the `<vc>` tag.

### ● Advance use

**Nesting.** You can declare components within components using the `<vc>` tag (you don't have to import the vanilla components script inside components to do it). Nesting allows you to create complex features from simple building blocks.

**Variables.** You can pass down variables from the main file by adding attributes starting
with '$'. The variable's value will substitute any occurence of the variable within the component's code. For example, consider the component hello.html, that contains the following code:

`<p>Hello $name</p>`

If you call it as `<vc>hello</vc>`, it will render on-screen as "Hello $name". But we can set the variable as an attribute - for example, we can call it as:

`<vc $name="Mary">hello</vc>`

In this case, `$name` will be replaced by "Mary" and the component will render to "Hello Mary".

**Constructors.** Once the component is loaded, a construction function is called, passing the created component as a parameter. The construction function called is `vc_[component's name]()` , for example, to have a construction function for the "hello.html" component, we'd add this to its code:

```
<script>
	function vc_hello(component){
		[...add code here...]
	}
</script>
```

Constructor functions are optional. Also, keep in mind that while you _can_ have multiple root markup (for example, two or more divs as the root elements in your component), the constructor function will return just the first element.

### ● The fine print

**Overriding.** Functions imported with components will override custom ones you have in your project. In order for your own functions to override the components' (which is probably desirable), you have to tell Vanilla Components to reload your function. This is done by adding a "vc" attribute to your script tag. Bottomline: if you wnat precedence, use
```
<script vc>
	[...your code...]
</script>
```
**Calling dynamically.** When the page loads, the vanilla_components.js script will automatically convert all `<vc>` components it finds, but it will not keep listening to new components you add later. If you're adding components (which includes via constructor functions), you have to tell VC to convert them.

You can use vc dynamically, attaching new `<vc>` elements to your document. For
them to be injected into the DOM, though, you'll need to scan the document again.
This is done by the command `new VCSearch().loadComponent(x)`, `x` being the element 
you want to scan, or leave blank to scan the whole document. You can do it by calling:
```
vc_search.loadComponent();
```
**Table elements.** The tags `<tr>` and `<td>` work slightly differently. You can create components with these tags normally, but when they are injected, they lose the tags: `<td>foobar</td>` becomes `foobar`. That means you have to call the component from within the tag:
```
<table>
	<tr>
		<vc>yourTableRowComponent</vc>
	</tr>
</table>
```

## OK, BUT WHY?

Templating - reusing code via components - is the reality of web dev. It is usually done using frameworks, but those bring in many additional features that you might not want, and may even dictate how you must structure your project.
Also, html is commonly constructed in the backend through adding templates together, which is helpful to say the least. VC allows you to do the same on the frontend: you can create, say, the header, footer, sidebars as components and easily inject them into your html as `<vc>header</vc>`, for example. This makes the creation of serverless frameworkless pages easy and fun.

## REQUIREMENTS

VC is vanilla javascript, HTML5 and CSS3, nothing more.

## CAN I HELP?

Sure, just fire up you IDE and start coding. Contributions would be welcome, as long as they don't bloat the code, but in particular, the project needs components.

## KNOWN ISSUES

The code is not optimized, and it's time for a  revision to make its clearer and faster. 

## KNOWN ISSUES AND FUTURE FEATURES

The code is not yet optimized for performance.

Automatically loading css files within the vc_components folder (you can add dummy components to import CSS for multiple components, still).

A better support for folders that would contain component sets sharing CSS.

## Examples

### Hello World

**index.html**

```html
<html>
<body>
<vc>hello</vc>
<script src="/vanilla_components/vanilla_components.js" ></script>
<body>
</html>
```

**vanilla_components/hello.html**

```html
<h1>Hello World</h1>
```
