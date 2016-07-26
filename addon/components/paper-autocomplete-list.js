/**
 * @module ember-paper
 */
import Ember from 'ember';

const { Component } = Ember;
// TODO Move to constants?
const ITEM_HEIGHT = 41;
const MAX_HEIGHT = 5.5 * ITEM_HEIGHT;
const MENU_PADDING = 8;
const INPUT_PADDING = 2;

/**
 * Calculate the positive scroll offset
 * TODO: Check with pinch-zoom in IE/Chrome;
 *       https://code.google.com/p/chromium/issues/detail?id=496285
 */
const scrollTop = function(element) {
  element = $(element || document.body);

  var body = (element[0] == document.body) ? document.body : undefined;
  var scrollTop = body ? body.scrollTop + body.parentElement.scrollTop : 0;

  // Calculate the positive scroll offset
  return scrollTop || Math.abs(element[0].getBoundingClientRect().top);
};

/**
 * @class PaperAutocompleteList
 * @extends Ember.Component
 */
export default Component.extend({
  util: Ember.inject.service(),

  tagName: 'ul',
  classNames: ['md-default-theme', 'md-autocomplete-suggestions', 'md-whiteframe-z1'],
  attributeNameBindings: ['role'],
  role: 'presentation',
  stickToElement: null,

  init() {
    this._super(...arguments);
    this._resizeWindowEvent = Ember.run.bind(this, this.resizeWindowEvent);
  },

  mouseEnter() {
    this.sendAction('mouse-enter');
  },

  mouseLeave() {
    this.sendAction('mouse-leave');
  },

  mouseUp() {
    this.sendAction('mouse-up');
  },

  observeSuggestions: Ember.observer('suggestions.length', function() {
    this.positionDropdown();
  }),

  // TODO reafactor into a computed property that binds directly to dropdown's `style`
  positionDropdown() {
    let floating = this.get('floating');
    let wrap = Ember.$(`#${this.get('wrapToElementId')}`)[0];
    let snap = wrap;
    let _root = document.body;
    let element = this.$();
    let scrollContainer = element.parent().parent();


    //TODO: if !elements schedule positionDropdown for the next render cycle

    var hrect  = wrap.getBoundingClientRect(),
        vrect  = snap.getBoundingClientRect(),
        root   = _root.getBoundingClientRect(),
        top    = vrect.bottom - root.top,
        bot    = root.bottom - vrect.top,
        left   = hrect.left - root.left,
        width  = hrect.width,
        offset = getVerticalOffset(),
        styles;

    // Adjust the width to account for the padding provided by `md-input-container`
    if (floating) {
      left += INPUT_PADDING;
      width -= INPUT_PADDING * 2;
    }
    styles = {
      left:     left + 'px',
      minWidth: width + 'px',
      maxWidth: Math.max(hrect.right - root.left, root.right - hrect.left) - MENU_PADDING + 'px'
    };
    if (top > bot && root.height - hrect.bottom - MENU_PADDING < MAX_HEIGHT) {
      styles.top       = 'auto';
      styles.bottom    = bot + 'px';
      styles.maxHeight = Math.min(MAX_HEIGHT, hrect.top - root.top - MENU_PADDING) + 'px';
    } else {
      styles.top       = (top - offset) + 'px';
      styles.bottom    = 'auto';
      styles.maxHeight = Math.min(MAX_HEIGHT, root.bottom + scrollTop() - hrect.bottom - MENU_PADDING) + 'px';
    }

    scrollContainer.css(styles);
    Ember.run.scheduleOnce('render', this, function() {
      correctHorizontalAlignment();
    });

    /**
     * Calculates the vertical offset for floating label examples to account for messages
     * @returns {number}
     */
    function getVerticalOffset () {
      var offset = 0;
      var inputContainer = $(wrap).find('md-input-container');
      if (inputContainer.length) {
        var input = inputContainer.find('input');
        offset = inputContainer.prop('offsetHeight');
        offset -= input.prop('offsetTop');
        offset -= input.prop('offsetHeight');
        // add in the height left up top for the floating label text
        offset += inputContainer.prop('offsetTop');
      }
      return offset;
    }

    /**
     * Makes sure that the menu doesn't go off of the screen on either side.
     */
    function correctHorizontalAlignment () {
      var dropdown = scrollContainer[0].getBoundingClientRect(),
          styles   = {};
      if (dropdown.right > root.right - MENU_PADDING) {
        styles.left = (hrect.right - dropdown.width) + 'px';
      }
      scrollContainer.css(styles);
    }
  },

  updateScroll() {
    let suggestions = this.get('suggestions');
    if (!suggestions || 
        !suggestions.objectAt(this.get('selectedIndex'))) {
      return;
    }

    let ul = this.$();
    let li  = ul.find(`li:eq(${this.get('selectedIndex')})`).get(0);
    if (li === undefined) {
      Ember.run.scheduleOnce('render', this, 'updateScroll');
    }
    let top = li.offsetTop;
    let bot = top + li.offsetHeight;
    let hgt = ul[0].clientHeight;

    if (top < ul[0].scrollTop) {
      ul[0].scrollTop = top;
    } else if (bot > ul[0].scrollTop + hgt) {
      ul[0].scrollTop = bot - hgt;
    }
  },

  resizeWindowEvent() {
    this.positionDropdown();
  },

  didInsertElement() {
    this._super(...arguments);
    Ember.$(window).on('resize', this._resizeWindowEvent);
    this.get('util').disableScrollAround(this.$());
    this.positionDropdown();
  },

  willDestroyElement() {
    Ember.$(window).off('resize', this._resizeWindowEvent);
    this.get('util').enableScrolling();
  }

});
