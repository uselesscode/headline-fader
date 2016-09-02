/* Copyright (c) 2016 Peter Johnson, MIT license */
;window.headlineFader = (function () {
  'use strict';
  let cssPrefix = 'hf',
    stylesNode,
    injectCss = function (opt) {
      stylesNode = document.createElement('style');
      let pf = cssPrefix;
      stylesNode.innerHTML = `.${pf}-headline.${pf}-hide{opacity:0;} .${pf}-headline{opacity:1;transition:opacity ${opt.fadeTime};}`;
      document.head.appendChild(stylesNode);
    };

  let defaultOptions = {
      headlines: [],
      wait: 7000,
      fadeTime: '2s',
      pauseOnHover: true,
      onClick: null,
      onUpdate: null,
    },

    headlineFader = function (element, argOpt = {}) {

      var retObj,
        running = false,
        currentIndex = null,
        headlines,
        opt,
        timer,
        originalContent,
        parseHeadlines = function (newHeadlines) {
          if (!Array.isArray(newHeadlines)) {
            throw new Error('headlines requires an array.');
          }

          if (newHeadlines.length < 1) {
            throw new Error('headlines needs to contain at least 1 element.');
          }

          return newHeadlines.map((headline) => {
            if (typeof headline === 'string') {
              return {
                html: headline,
              };
            }
            return headline;
          });
        },
        clickHandler = function (evt) {
          evt.stopPropagation();
          if (currentIndex) {
            let currentHeadline = headlines[currentIndex],
              href = currentHeadline.href;

            if (opt.onClick) {
              opt.onClick(evt, href);
            }
          }
        },
        wasRunning,
        hide = function hide () {
          element.classList.add(`${cssPrefix}-hide`);
        },
        show = function show () {
          element.classList.remove(`${cssPrefix}-hide`);
        },
        nextHeadline = function (step = 1) {
          if (currentIndex === null) {
            currentIndex = 0;
          } else {
            currentIndex += step;
            if (currentIndex === headlines.length) {
              currentIndex = 0;
            } else if (currentIndex === -1) {
              currentIndex = headlines.length - 1;
            }
          }

          let currentHeadline = headlines[currentIndex],
            {text, html, href} = currentHeadline;
          if (href) {
            let a = document.createElement('a');
            a.href = href;
            a.className = `${cssPrefix}-link`;
            if (html) {
              a.innerHTML = html;
            } else {
              a.textContent = text;
            }
            element.innerHTML = '';
            element.appendChild(a);
          } else {
            if (html) {
              element.innerHTML = html;
            } else {
              element.textContent = text;
            }
          }
        },
        prevHeadline = function () {
          nextHeadline(-1);
        },
        next = (step = 1) => {
          clearTimeout(timer);
          element.style.transition = 'none';
          requestAnimationFrame(function () {
            hide();
            requestAnimationFrame(function () {
              nextHeadline(step);
              element.style.transition = '';
              requestAnimationFrame(function () {
                show();
              });
            });
          });
        },
        prev = () => {
          next(-1);
        },

        update = function update () {
          var opacity = window.getComputedStyle(element).opacity;

          // fade out has ended, change message and fade in
          if (opacity === '0') {
            nextHeadline();
            show();
          // fade in has ended, start waiting to trigger update
          } else if (opacity === '1') {
            if (running) {
              timer = setTimeout(hide, opt.wait);
              // needs to be after timer in case onUpdate calls stop()
              if (opt.onUpdate) {
                let currentHeadline = headlines[currentIndex];
                opt.onUpdate(currentHeadline, currentIndex, opt.headlines.length);
              }
            }
          }
        },
        start = function start () {
          running = true;
          // hiding causes an update()
          // update does not trigger if the element
          // is already has an opacity of 0, show() to ensure
          // it has an opacity over 0
          show();
          // we have to wait for a repaint before calling hide
          // if we don't the hide class will be removed and re-added
          // in the same frame too fast for the opacity to change
          // and the update will never fire
          requestAnimationFrame(function () {
            hide();
          });
        },
        stop = function () {
          running = false;
          clearTimeout(timer);
          // remove hide class just to continue to display
          // message and prevent another call to update
          // in case it was mid-fade out
          element.classList.remove(`${cssPrefix}-hide`);
        },
        hoverEvents = (function () {
          let wasRunning = running;

          return {
            enter: function () {
              if (opt.pauseOnHover) {
                wasRunning = running;
                stop();
              }
            },
            leave: function () {
              if (opt.pauseOnHover && wasRunning) {
                start();
              }
            },
          };
        }()),
        changeHeadlines = function (newHeadlines) {
          let wasRunning = running;
          if (wasRunning) {
            stop();
          }
          opt.headlines = headlines = parseHeadlines(newHeadlines);
          currentIndex = null;
          if (wasRunning) {
            start();
          }
        },
        validateOptionName = function (optName) {
          if (!(optName in defaultOptions)) {
            throw new Error(`The option ${optName} does not exist.`);
          }
          return true;
        },
        changeOptions = function (newOpt) {
          for (let o in newOpt) {
            if (newOpt.hasOwnProperty(o)) {
              if (o === 'headlines') {
                changeHeadlines(newOpt[o]);
              } else {
                if (validateOptionName(o)) {
                  opt[o] = newOpt[o];
                }
              }
            }
          }
        },
        visibilityHandler = function () {
          if (document.hidden) {
            wasRunning = running;
            stop();
          } else {
            if (wasRunning) {
              start();
            }
          }
        },
        remove = function () {
          element.removeEventListener('transitionend', update);
          element.removeEventListener('click', clickHandler);
          if (opt.pauseOnHover) {
            element.removeEventListener('mouseenter', hoverEvents.enter);
            element.removeEventListener('mouseleave', hoverEvents.leave);
          }
          document.removeEventListener('visibilitychange', visibilityHandler, false);
          element.classList.remove(`${cssPrefix}-headline`, `${cssPrefix}-hide`);
          element.innerHTML = originalContent;

          // ensure commands can't be called after removal
          for (let k in retObj) {
            if (retObj.hasOwnProperty(k)) {
              delete retObj[k];
            }
          }

          // in case something was bound directly to a
          // reference to this via myHeadlines.start, etc.
          start = null;
          stop = null;
          next = null;
          prev = null;
          remove = null;
          changeOptions = null;
        };

      if (!element || !element.nodeType || element.nodeType !== 1) {
        throw new Error('Invalid element argument.');
      }

      opt = Object.assign({}, defaultOptions);
      changeOptions(argOpt);

      originalContent = element.innerHTML;

      injectCss(opt);
      element.addEventListener('transitionend', update, false);
      element.classList.add(`${cssPrefix}-headline`);

      element.addEventListener('click', clickHandler, false);
      if (opt.pauseOnHover) {
        element.addEventListener('mouseenter', hoverEvents.enter, false);
        element.addEventListener('mouseleave', hoverEvents.leave, false);
      }

      document.addEventListener('visibilitychange', visibilityHandler, false);

      retObj = {
        start,
        stop,
        next: () => next(), // need to wrap next because it expects an optional parameter
                            // and the event object will override the default.
        prev,
        get running () {
          return running;
        },
        remove,
        changeOptions: (newOpt) => {
          changeOptions(newOpt);
          if ('fadeTime' in newOpt) {
            document.head.removeChild(stylesNode);
            injectCss(opt);
          }
        },
      };
      return retObj;
    };

  // global options
  Object.defineProperties(headlineFader, {
    prefix: {
      enumerable: true,
      get: function () {
        return cssPrefix;
      },
      set: function (v) {
        if (v) {
          let oldPrefix = cssPrefix;
          cssPrefix = v;

          document.head.removeChild(stylesNode);
          injectCss(opt);
        }
      },
    },
  });
  return headlineFader;
}());
