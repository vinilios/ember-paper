import Ember from 'ember';
import EmberCollection from 'ember-collection/components/ember-collection';
import Grid from 'ember-collection/layouts/grid';

import ColorMixin from 'ember-paper/mixins/color-mixin';
import FlexMixin from 'ember-paper/mixins/flex-mixin';

const decodeEachKey = Ember.__loader.require('ember-htmlbars/utils/decode-each-key')['default'];
const {set, get, observer} = Ember;

class Cell {
  constructor(key, item, index, style) {
    this.key = key;
    this.hidden = false;
    this.item = item;
    this.index = index;
    this.style = style;
  }
}

export default EmberCollection.extend(ColorMixin, FlexMixin, {
  tagName: 'md-virtual-repeat-container',
  classNames: 'md-virtual-repeat-container',

  _topIndexSet: false,
  _elementSizeSet: false,
  _elementSizeRetry: 0,
  
  init() {
    this._super();
    if (!this.getAttr('cell-layout')) {
      // single column layout by default
      this.attrs['cell-layout'] = new Grid(100000000000000000, 48);
      set(this, '_elementSizeSet', false);
    } else {
      set(this, '_elementSizeSet', true);
    }
  },

  // we override update cells to patch 
  // https://github.com/emberjs/ember-collection/pull/98
  nativeUpdateCells() {
    if (!this._items) { return; }
    const numItems = get(this._items, 'length');
    if (this._cellLayout.length !== numItems) {
      this._cellLayout.length = numItems;
    }

    var priorMap = this._cellMap;
    var cellMap = Object.create(null);

    var index = this._cellLayout.indexAt(this._scrollLeft, this._scrollTop, this._clientWidth, this._clientHeight);
    var count = this._cellLayout.count(this._scrollLeft, this._scrollTop, this._clientWidth, this._clientHeight);
    var items = this._items;
    var bufferBefore = Math.min(index, this._buffer);
    index -= bufferBefore;
    count += bufferBefore;
    count = Math.min(count + this._buffer, get(items, 'length') - index);
    var i, style, itemIndex, itemKey, cell;

    var newItems = [];

    for (i=0; i < count; i++) {
      itemIndex = index + i;
      itemKey = decodeEachKey(items.objectAt(itemIndex), '@identity');
      if (priorMap) {
        cell = priorMap[itemKey];
      }
      if (cell) {
        style = this._cellLayout.formatItemStyle(itemIndex, this._clientWidth, this._clientHeight);
        set(cell, 'style', style);
        set(cell, 'hidden', false);
        set(cell, 'key', itemKey);
        cellMap[itemKey] = cell;
      } else {
        newItems.push(itemIndex);
      }
    }

    for (i=0; i<this._cells.length; i++) {
      cell = this._cells[i];
      if (!cellMap[cell.key]) {
        if (newItems.length) {
          itemIndex = newItems.pop();
          let item = items.objectAt(itemIndex);
          itemKey = decodeEachKey(item, '@identity');
          style = this._cellLayout.formatItemStyle(itemIndex, this._clientWidth, this._clientHeight);
          set(cell, 'style', style);
          set(cell, 'key', itemKey);
          set(cell, 'index', itemIndex);
          set(cell, 'item', item);
          set(cell, 'hidden', false);
          cellMap[itemKey] = cell;
        } else {
          set(cell, 'hidden', true);
          set(cell, 'style', 'height: 0; display: none;');
        }
      }
    }

    for (i=0; i<newItems.length; i++) {
      itemIndex = newItems[i];
      let item = items.objectAt(itemIndex);
      itemKey = decodeEachKey(item, '@identity');
      style = this._cellLayout.formatItemStyle(itemIndex, this._clientWidth, this._clientHeight);
      cell = new Cell(itemKey, item, itemIndex, style);
      cellMap[itemKey] = cell;
    }

    // hack to keep things in the correct order
    var cells = [];
    for (i=0; i < count; i++) {
      itemIndex = index + i;
      itemKey = decodeEachKey(items.objectAt(itemIndex), '@identity');
      cells.push(cellMap[itemKey]);
    }
    set(this, '_cells', cells);
    this._cellMap = cellMap;
  },

  updateCells() {
    this.nativeUpdateCells();

    let layout = this.getAttr('cell-layout');
    let topIndex = get(this, 'topIndex');
    if (topIndex >= 0 && topIndex < layout.length && !get(this, '_topIndexSet')) {
      let offset = layout.positionAt(topIndex);
      set(this, '_scrollLeft', offset.x);
      set(this, '_scrollTop', offset.y);
      set(this, '_topIndexSet', true);
      this._needsRevalidate();
    }

    if (!get(this, '_elementSizeSet')) {
      let el = this.$();
      let firstCell = this._cells && this._cells[0];
      if (el && el.length && firstCell) {
        layout.bin._elementWidth = el[0].clientWidth;

        // skip current render cycle
        Ember.run.scheduleOnce('render', this, function() {
          let view = el.find('[auto-size]').first();
          if (view && view.length && document.body.contains(view[0])) {
            layout.bin._elementHeight = view[0].offsetHeight;
            set(this, '_elementSizeSet', true);
            this._needsRevalidate();
          }
        });
      }

      // avoid endless auto-size discovery
      let resizeLimit = 10;
      set(this, '_elementSizeRetry', get(this, '_elementSizeRetry') + 1);
      if (get(this, '_elementSizeRetry') > resizeLimit) {
        set(this, '_elementSizeSet', true);
      }
    }
  },

  observeTopIndex: observer('topIndex', function() {
    set(this, '_topIndexSet', false);
    this.updateCells();
  }),

  observeScrollTop: observer('_scrollTop', '_contentSize.height', function() {
    if (!this.element) { return; }
    this.listElement = this.element.firstElementChild.children[1];
    if (!this.listElement) {
      return;
    }

    let topTranslate;
    let items = get(this, 'items.length');
    let offset = get(this, '_scrollTop');
    let itemSize = get(this, '_cellLayout.bin._elementHeight');
    let numExtra = get(this, '_buffer') || 0;
    let numItems = Math.max(0, Math.floor(offset / itemSize) - numExtra);

    if (numItems > items) {
      numItems = items;
    }
    topTranslate = numItems * itemSize;
    this.listElement.style.position = 'absolute';
    this.listElement.style.top = 0;
    this.listElement.style.bottom = 0;
    this.listElement.style.left = 0;
    this.listElement.style.right = 0;
    this.listElement.style.transform = `translateY(${topTranslate}px)`;
  })
});
