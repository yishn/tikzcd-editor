# tikzcd-editor

A simple visual editor for creating commutative diagrams.

You can [download the latest release](https://github.com/yishn/tikzcd-editor/releases) to host it on your own or [try it out here](https://tikzcd.yichuanshen.de/).

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

## Contributing

Bug reports and pull requests are always welcome! Please consult the [issues list](https://github.com/yishn/tikzcd-editor/issues) for existing issues beforehand.

You can also support this project by [donating](https://paypal.me/yishn/4).

## Related

* [jsx-tikzcd](https://github.com/yishn/jsx-tikzcd) - Render tikzcd diagrams with JSX.
