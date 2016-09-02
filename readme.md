# headlineFader
`headlineFader` is a small library that creates a headline ticker widget that
fades headlines in and out. It was inspired by the code I wrote for
[this answer at StackOverflow](http://stackoverflow.com/a/39191526/778975).

`headlineFader` has a number of options but can be used with no more
configuration than an element to use and an array of headlines if you like the
defaults. The ticker is automatically paused on tab change or window hiding
using the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

## Instalation

A built copy of the library can be found in the `dist/` directory or can be
installed with [Bower](https://bower.io/) `bower install headline-fader`.

## Basic Usage

The `headlineFader` function expects two parameters, a DOM element to use as the
ticker and a configuration object containing options to use. The only required
option is `headlines`, which holds an array of headlines to use.

```javascript
var headlineElement = document.getElementById('headlines'),
  headlinesWidget = headlineFader(headlineElement, {
    headlines: [
      'Headline 1',
      'Headline 2',
      'Headline 3',
      'Headline 4',
      {
        text: 'UselessCode.org blog',
        href: 'http://www.uselesscode.org/blog/'
      }
    ],
  });
```

## Options
### headlines
**Required** Each item in `headlines` can be either a string or an object. If it is a string
it is assumed to be HTML to inject into the ticker. The object form supports three
properties: `text`, `html` and `href`.

* `text` will display the text by injecting it with `.textContent`.
* `html` will inject its contents with `.innerHTML`

If both `text` and `html` are present, `html` takes precedence.

`href` is a url to visit when the headline is clicked; a link is wrapped around
the `text` or `html` to make the headline clickable.

```javascript
headlines: [
  'HTML with links to <a href="https://www.mozilla.com/firefox/">Firefox</a> and <a href="http://github.com/">GitHub</a>',
  {
    text: 'uselesscode.org blog',
    href: 'http://www.uselesscode.org/blog/'
  },
  {
    html: 'You <em>can</em> use html with <code>href</code> too!',
    href: 'http://www.example.com/',
  },
  {
    text: 'Just plain text that does not link to anything.'
  },
  {
    text: 'This text contains <html> &nbsp; that is interpreted as text because it is injected with .textContent',
  }
],

```

If you would like to style the headline-wrapping link differently than other
links that appear inside the headline element, you can add a `.hf-link` rule to
your CSS to target it. (This class name is affected by the `headlineFader.prefix`
setting described below.)


```css
.hf-link {
  text-decoration: none;
}
```

### wait
The amount of time, in milliseconds, to display each headline before fading out.
(default: `7000`)

### fadeTime
How long each fade in and fade out last. Accepts any valid CSS [duration unit](https://www.w3.org/TR/css3-values/#time). (default: `'2s'`)

### pauseOnHover
Boolean, if true hovering the mouse over the widget will stop the automatic
rotation of headlines; moving the mouse off will resume. (default: `true`)

### onClick
A callback function to run when a user clicks on a headline. If the headline has
a `href`, the `onclick` will fire before the `href` click is processed. The
callback receives two parameters, the first is the event object from the click,
the second is the `href` or `undefined` if the headline does not have a href.

```javascript
onClick: function (evt, href) {
  if (href && href.match(/example\.com/)) {
    var answer = window.confirm('Are you sure you want to ' + href + '?');
    if (!answer) {
      evt.preventDefault();
    }
  }
}
```

### onUpdate
A callback function that is run every time a new headline is displayed (and
obtains 100% opacity). Because it only fires once the headline has 100% opacity,
it will not fire if `prev` or `next` are called in quick succession before an
item has faded completely in.

The callback receives 3 arguments:

* `headline` The object for this headline. If the headline was passed in as a
  string, the callback will receive an object with a `.html` property containing
  that string.
* `index` The index of this item in the headlines array
* `length` The length of the headlines array

```javascript
// only rotate through the headlines once and then stop
// on the last one
onUpdate: function (headline, index, len) {
  if (index === len - 1) {
    headlinesWidget.stop();
  }
},
```

## Global options

### headlineFader.prefix

By default headlineFader injects CSS classes into the page that are prefixed with
`hf-`. If any of these names conflict with other classes in your page, you can
change the prefix that headlineFader uses by changing the `.prefix` setting.

```javascript
headlineFader.prefix = 'headline-fader';
```

**Important**: `.prefix` must be changed *before* any widgets are created.
Changing it after they have been created will change the injected CSS and they
won't work correctly.

## Controlling the widget

The `headlineFader` function returns an object that can be used to control the widget:

```javascript
var toggle = document.getElementById('toggle'),
  next = document.getElementById('next'),
  prev = document.getElementById('prev');

next.addEventListener('click', headlinesWidget.next, false);
prev.addEventListener('click', headlinesWidget.prev, false);

toggle.addEventListener('click', function () {
  if (headlinesWidget.running) {
    headlinesWidget.stop();
    toggle.textContent = "Resume";
  } else {
    headlinesWidget.start();
    toggle.textContent = "Pause";
  }
}, false);
```

## Properties
### running
Boolean, whether the ticker is currently running.

## Methods
### start()
Starts the ticker, where it left off if previously running and then stopped.
Initially the ticker is stopped. Call this immediately after creating your widget
to have it start automatically.

### stop()
Stops the ticker on the current headline.

### next()
Fades out the current headline immediately and displays the next one.

### prev()
Fades out the current headline immediately and displays the previous one.

### changeOptions()
Accepts an object containing new options to set. If `.headlines` is included,
The new headlines replace the old ones and the ticker starts from the beginning
of the list.

```javascript
// loading new shorter headlines, speed things up a bit
headlinesWidget.changeOptions({
  wait: 500,
  headlines: [
    'one',
    'two',
    'three'
  ],
  fadeTime: '500ms'
});
```
### remove()
Removes all events and css classes that were added to it. Also restores the
original `.innerHTML` if there was any. This also renders the control object
unusable, if you try to call any of its methods you will get an error. You may
have to manually remove any event handlers that use the object. In most cases
remove won't need to be used and should probably be avoided.

## License
The MIT License (MIT)
Copyright (c) 2016 Peter Johnson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
