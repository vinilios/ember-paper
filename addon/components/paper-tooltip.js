import Ember from 'ember';

const {
  on,
  get,
  set,
  run,
  observer,
  $,
  inject
} = Ember;


const TOOLTIP_SHOW_DELAY = 0;
const TOOLTIP_WINDOW_EDGE_SPACE = 8;

export default Ember.Component.extend({
  tagName: 'md-tooltip',
  
  util: inject.service(),
  visible: false,
  delay: TOOLTIP_SHOW_DELAY,
  direction: 'bottom',
  autohide: true,

  observeVisible: observer('visible', function() {
    let visible = get(this, 'visible');
    if (visible) {
      this.showTooltip();
    } else {
      this.hideTooltip();
    }
  }),

  showTooltip() {
    let element = this.$();
    this.tooltipParent.append(element);
    if (element.css('display') == 'none') {
      set(this, 'visible', false);
      element.detach();
    }
    this.updatePosition();
    [element, this._content].forEach((el) => {
      el.addClass("md-show");
    });
  },

  hideTooltip() {
    let element = this.$();
    [element, this._content].forEach((el) => {
      el.removeClass('md-show');
    });
    element.detach();
  },
  
  parentDisabled: observer('parentView.disabled', function() {
    if (get(this, 'parentView.disabled')) {
      set(this, 'visible', false);
    }
  }),

  observeDirection: observer('direction', function() {
    this.updatePosition();
  }),

  updatePosition() {
    let util = get(this, 'util');
    let direction = get(this, 'direction');
    let element = this.$();
    let tooltipParent = this.tooltipParent;
    let parent = this._parent;

    let tipRect = util.offsetRect(element, tooltipParent);
    let parentRect = util.offsetRect(parent, tooltipParent);
    let newPosition = getPosition(direction);
    let offsetParent = element.prop('offsetParent');

    // If the user provided a direction, just nudge the tooltip onto the screen
    // Otherwise, recalculate based on 'top' since default is 'bottom'
    if (direction) {
      newPosition = fitInParent(newPosition);
    } else if (offsetParent && newPosition.top > offsetParent.scrollHeight - tipRect.height - TOOLTIP_WINDOW_EDGE_SPACE) {
      newPosition = fitInParent(getPosition('top'));
    }

    console.log(newPosition);
    element.css({
      left: newPosition.left + 'px',
      top: newPosition.top + 'px'
    });

    function fitInParent (pos) {
      var newPosition = { left: pos.left, top: pos.top };
      newPosition.left = Math.min( newPosition.left, tooltipParent.prop('scrollWidth') - tipRect.width - TOOLTIP_WINDOW_EDGE_SPACE );
      newPosition.left = Math.max( newPosition.left, TOOLTIP_WINDOW_EDGE_SPACE );
      newPosition.top  = Math.min( newPosition.top,  tooltipParent.prop('scrollHeight') - tipRect.height - TOOLTIP_WINDOW_EDGE_SPACE );
      newPosition.top  = Math.max( newPosition.top,  TOOLTIP_WINDOW_EDGE_SPACE );
      return newPosition;
    }

    function getPosition (dir) {
      return dir === 'left'
        ? { left: parentRect.left - tipRect.width - TOOLTIP_WINDOW_EDGE_SPACE,
            top: parentRect.top + parentRect.height / 2 - tipRect.height / 2 }
        : dir === 'right'
        ? { left: parentRect.left + parentRect.width + TOOLTIP_WINDOW_EDGE_SPACE,
            top: parentRect.top + parentRect.height / 2 - tipRect.height / 2 }
        : dir === 'top'
        ? { left: parentRect.left + parentRect.width / 2 - tipRect.width / 2,
            top: parentRect.top - tipRect.height - TOOLTIP_WINDOW_EDGE_SPACE }
        : { left: parentRect.left + parentRect.width / 2 - tipRect.width / 2,
            top: parentRect.top + parentRect.height + TOOLTIP_WINDOW_EDGE_SPACE };
    }
  },

  updateContentOrigin() {
    var origin = 'center top';
    switch (get(this, 'direction')) {
      case 'left'  : origin =  'right center';  break;
      case 'right' : origin =  'left center';   break;
      case 'top'   : origin =  'center bottom'; break;
      case 'bottom': origin =  'center top';    break;
    }
    this._content.css({'transform-origin': origin});
  },

  disperse: on('willDestroyElement', function() {
    set(this, 'visible', false);
    this._window.off('blur', $.proxy(this.onWindowBlur, this));
    this._window.off('resize', $.proxy(this.debounceOnResize, this));
    this._document.removeEventListener('scroll', $.proxy(this.onWindowScroll, this));
    this._parent.off('mousedown', $.proxy(this.onParentMouseDown, this));
    this._parent.off('focus mouseenter touchstart', $.proxy(this.onParentEnter, this));
    this._parent.on('blur mouseleave touchend touchcancel', $.proxy(this.onParentLeave, this));
  }),

  onParentEnter(e) {
    if (e.type === 'focus' && this.elementFocusedOnWindowBlur) {
      this.elementFocusedOnWindowBlur = false;
      return;
    }
    set(this, 'visible', true);
  },

  onParentLeave() {
    var autohide = get(this, 'autohide');
    if (autohide || mouseActive || (this._document.activeElement !== this._parent[0]) ) {
      //parent.triggerHandler("blur");
      set(this, 'visible', false);
    }
    this.mouseActive = false;
  },

  onParentMouseDown() {
    this.mouseActive = true;
  },

  onWindowBlur() {
    this.elementFocusedOnWindowBlur = this._document.activeElement === this.element;
  },
  
  onWindowScroll() {
    set(this, 'visible', false);
  },

  prepare: on('didInsertElement', function() {
    let element = this.$();
    this._window = this.$(window);
    this._document = document;
    this._parent = this.parentView.$();
    this._content = this.$(".md-content");
    this.tooltipParent = Ember.$("body");
    this.elementFocusedOnWindowBlur = false;
    this.mouseActive = false;

    this.debounceOnResize = () => {
      console.log("resize");
      run.throttle(this, 'updatePosition', 150);
    }

    element.detach();
    element.attr('role', 'tooltip');

    if (!this._parent.attr('arial-label') && !this._parent.text().trim()) {
      this._parent.attr('aria-label', element.text());
    }

    this._window.on('blur', $.proxy(this.onWindowBlur, this));
    this._window.on('resize', $.proxy(this.debounceOnResize, this));
    this._document.addEventListener('scroll', $.proxy(this.onWindowScroll, this));
    this._parent.on('mousedown', $.proxy(this.onParentMouseDown, this));
    this._parent.on('focus mouseenter touchstart', $.proxy(this.onParentEnter, this));
    this._parent.on('blur mouseleave touchend touchcancel', $.proxy(this.onParentLeave, this));
  })
})
