# Vanilla Components
A simple way to load components dynamically, using markup and vanilla
javascript. It can be understood as a micro framework for reusing component
code.

## HOW DOES IT WORK?

You save components in a folder called vc_components. Each component is an html
file containing three separate root elements: 1) the first is the markup (could
be a div, button, p, a, whatever you like); 2) the second is a style tag for
storing the component's CSS; and 3) the third is a script tag for code related
to the component.

You can call the component using the <vc> tag. For example, <vc>button</vc>
would load the button.html component. It substitutes the <vc> element by the
component's markup, then injects the component's css and script.

You can also declare components within components using the <vc> tag. This
allows for the construction of complex features by reusing simple building
blocks.

You can pass information down to the component by declaring attributes. For
example, <vc class="foo">button</vc> will pass down class="foo". Speciffically,
it will add the class to a component that has the class attribute - or if it
doesn't find any, it will pass the attribute to the first markup element.

You may also pass down variables, by creating an arbitrary attribute starting
with '$'. For example, <vc $var="foo">button</vc> will substitute any
occurrence of '$var' within the markup to 'foo'.

Finally, once the component is loaded, it calls a construct function called
vc_[component's name](), which allows you to refine it. It is proposed that
this function is used to load complex data when needed.

## OK, BUT WHY?

Reusing code via components is the reality of web dev. It is usually done using
frameworks, but those bring in many, many more features that you might not want
- they may even dictate how you must structure your project, which is quite
demanding. Also, html is commonly built in the backend through adding templates
together, which is helpful to say the least. VC allows you to do the same on
the frontend: you can create, say, the header, footer, sidebars as components
and easily inject them into your html as <vc>header</vc>, for example. This
makes the creation of serverless frameworkless pages easy and fun.

## REQUIREMENTS

VC is vanilla javascript, HTML5 and CSS3, nothing more.

## CAN I HELP?

Sure, just fire up you IDE and start coding. Contributions are (would be)
welcome, as long as they don't bloat the code. In particular, the project needs
components.

## KNOWN ISSUES

It seems the constructor function is not been passed the correct element. So
although it runs at the proper time, there are many limits on what you could do
with it.


## FUTURE FEATURES

Automatically loading css files within the vc_components folder.

A better support for collection folders that would automatically import css
only if a component from that collection would be included. This allows
multiple components in a folder to share css, making it easier to develop
collections of components.


## Examples

### Hello World

** index.html **

```html
<html>
<body>
<vc>hello</vc>
<script src="/vanilla_components/vanilla_components.js" ></script>
<body>
</html>
```

** vanilla_components/hello.html

```html
<h1>Hello World</h1>
```
