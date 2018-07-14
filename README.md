# Vanilla Components
A simple way to load components dynamically, using markup and vanilla
javascript. It can be understood as a micro framework for reusing component
code.

## HOW DOES IT WORK?

### Basic use

You save components in a folder called vc_components. Each component is an html
file containing the following root elements in any order:

* a markup tag, which could be a `<div>`, `<button>`, `<p>`, `<a>` or whatever you like; 
* a `<style>` tag for storing the component's CSS; and
* a `<script>` tag for code related to the component.

You can call the component using the `<vc>` tag. For example, `<vc>button</vc>`
would load the button.html component. It substitutes the `<vc>` element by the
component's markup, then injects the component's css and script.

### "Advanced" use

You can declare components within components using the `<vc>` tag. This allows 
for the construction of complex features by reusing simple building blocks.

You can pass down variables by creating an arbitrary attribute starting
with '$'. For example, `<vc $name="Mary">button</vc>` will substitute any
occurrence of '$name' within the markup for 'Mary'.

Once the component is loaded, it calls a construct function called
`vc_[component's name]()` allowing for more complex components.

Functions imported with components may override custom ones you have in your
project. That especially important if you plan the overwrite a component's
function. In order for your custom function to work, you must add the attribute
'vc'to its `<script>` tag (like `<script vc>`). This will reattach your script,
giving it precedence.

You can use vc dynamically, attaching new `<vc>` elements to your document. For
them to be injected into the DOM, though, you'll need to scan the document again.
This is done by the command `new VCSearch().loadComponent(x)`, `x` being the element 
you want to scan, or leave blank to scan the whole document.

## OK, BUT WHY?

Reusing code via components is the reality of web dev. It is usually done using
frameworks, but those bring in many, many more features that you might not want - 
they may even dictate how you must structure your project, which is quite
demanding. Also, html is commonly built in the backend through adding templates
together, which is helpful to say the least. VC allows you to do the same on
the frontend: you can create, say, the header, footer, sidebars as components
and easily inject them into your html as `<vc>header</vc>`, for example. This
makes the creation of serverless frameworkless pages easy and fun.

## REQUIREMENTS

VC is vanilla javascript, HTML5 and CSS3, nothing more.

## CAN I HELP?

Sure, just fire up you IDE and start coding. Contributions would be welcome, as 
long as they don't bloat the code. In particular, the project needs components.

## KNOWN ISSUES

The code is not optimized, and it's time for a  revision to make its clearer 
and faster. 

## FUTURE FEATURES

Automatically loading css files within the vc_components folder.

A better support for collection folders that would automatically import css
only if a component from that collection would be included. This allows
multiple components in a folder to share css, making it easier to develop
collections of components.

## INSTALATION

1. Download vanilla_components and unzip it into the root folder of your site.
1. Create a folder named vc_components in the root of your website
1. Include the following to your document `<script src="/vanilla_components/vanilla_components.js" ></script>`

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
