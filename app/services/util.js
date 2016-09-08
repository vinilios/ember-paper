import Ember from 'ember';

let Util = Ember.Service.extend({

  // Disables scroll around the passed element.
  disableScrollAround(element) {
    let util = this;
    let $document = Ember.$(window.document);

    util.disableScrollAround._count = util.disableScrollAround._count || 0;
    ++util.disableScrollAround._count;
    if (util.disableScrollAround._enableScrolling) {
      return util.disableScrollAround._enableScrolling;
    }

    let { body } = $document.get(0);
    let restoreBody = disableBodyScroll();
    let restoreElement = disableElementScroll();

    return util.disableScrollAround._enableScrolling = function() {
      if (!--util.disableScrollAround._count) {
        restoreBody();
        restoreElement();
        delete util.disableScrollAround._enableScrolling;
      }
    };

    // Creates a virtual scrolling mask to absorb touchmove, keyboard, scrollbar clicking, and wheel events
    function disableElementScroll() {
      let zIndex = 50;
      let scrollMask = Ember.$(
        `<div class="md-scroll-mask" style="z-index: ${zIndex}">
          <div class="md-scroll-mask-bar"></div>
        </div>`);
      body.appendChild(scrollMask[0]);

      scrollMask.on('wheel', preventDefault);
      scrollMask.on('touchmove', preventDefault);
      $document.on('keydown', disableKeyNav);

      return function restoreScroll() {
        scrollMask.off('wheel');
        scrollMask.off('touchmove');
        scrollMask[0].parentNode.removeChild(scrollMask[0]);
        $document.off('keydown', disableKeyNav);
        delete util.disableScrollAround._enableScrolling;
      };

      // Prevent keypresses from elements inside the body
      // used to stop the keypresses that could cause the page to scroll
      // (arrow keys, spacebar, tab, etc).
      function disableKeyNav(e) {
        // -- temporarily removed this logic, will possibly re-add at a later date
        return;
        if (!element[0].contains(e.target)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }

      function preventDefault(e) {
        e.preventDefault();
      }
    }

    // Converts the body to a position fixed block and translate it to the proper scroll
    // position
    function disableBodyScroll() {
      let htmlNode = body.parentNode;
      let restoreHtmlStyle = htmlNode.getAttribute('style') || '';
      let restoreBodyStyle = body.getAttribute('style') || '';
      let scrollOffset = body.scrollTop + body.parentElement.scrollTop;
      let { clientWidth } = body;

      if (body.scrollHeight > body.clientHeight) {
        applyStyles(body, {
          position: 'fixed',
          width: '100%',
          top: `${-scrollOffset}px`
        });

        applyStyles(htmlNode, {
          overflowY: 'scroll'
        });
      }

      if (body.clientWidth < clientWidth) {
        applyStyles(body, { overflow: 'hidden' });
      }

      return function restoreScroll() {
        body.setAttribute('style', restoreBodyStyle);
        htmlNode.setAttribute('style', restoreHtmlStyle);
        body.scrollTop = scrollOffset;
      };
    }

    function applyStyles(el, styles) {
      for (let key in styles) {
        el.style[key] = styles[key];
      }
    }
  },
  enableScrolling() {
    let method = this.disableScrollAround._enableScrolling;
    method && method();
  },

  getNode: function(el) {
    return el[0] || el;
  },

  clientRect: function(element, offsetParent, isOffsetRect) {
    var node = this.getNode(element);
    offsetParent = this.getNode(offsetParent || node.offsetParent || document.body);
    var nodeRect = node.getBoundingClientRect();

    // The user can ask for an offsetRect: a rect relative to the offsetParent,
    // or a clientRect: a rect relative to the page
    var offsetRect = isOffsetRect ?
      offsetParent.getBoundingClientRect() :
    {left: 0, top: 0, width: 0, height: 0};
    return {
      left: nodeRect.left - offsetRect.left,
      top: nodeRect.top - offsetRect.top,
      width: nodeRect.width,
      height: nodeRect.height
    };
  },

  offsetRect: function(element, offsetParent) {
    return this.clientRect(element, offsetParent, true);
  },
  /*
   * supplant() method from Crockford's `Remedial Javascript`
   * Equivalent to use of $interpolate; without dependency on
   * interpolation symbols and scope. Note: the '{<token>}' can
   * be property names, property chains, or array indices.
   */
  supplant(template, values, pattern) {
    pattern = pattern || /\{([^\{\}]*)\}/g;
    return template.replace(pattern, function(a, b) {
      let p = b.split('.');
      let r = values;
      try {
        for (let s in p) {
          if (p.hasOwnProperty(s)) {
            r = r[p[s]];
          }
        }
      } catch (e) {
        r = a;
      }
      return (typeof r === 'string' || typeof r === 'number') ? r : a;
    });
  },
  nextTick: (function(window, prefixes, i, p, fnc) {
    while (!fnc && i < prefixes.length) {
      fnc = window[`${prefixes[i++]}equestAnimationFrame`];
    }
    return (fnc && fnc.bind(window)) || window.setImmediate || function(fnc) {
      window.setTimeout(fnc, 0);
    };
  })(window, 'r webkitR mozR msR oR'.split(' '), 0)

});

export default Util;
