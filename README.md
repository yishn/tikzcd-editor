# tikzcd-editor

A simple editor for creating commutative diagrams.

![Screenshot](./screenshot.png)

## Building

Make sure you have [Node.js](https://nodejs.org/) and npm installed. First, clone this repository:

~~~
$ git clone https://github.com/yishn/tikzcd-editor
$ cd tikzcd-editor
~~~

Install dependencies with npm:

~~~
$ npm install
~~~

You can build by using the `build` command:

~~~
$ npm run build
~~~

This will create a minified bundle `dist/bundle.js` and its source map. To launch, simply open `index.html` in your favorite modern browser.

Use the `watch` command for development:

~~~
$ npm run watch
~~~

## Related

* [jsx-tikzcd](https://github.com/yishn/jsx-tikzcd) - Render tikzcd diagrams with JSX.
