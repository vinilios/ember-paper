import Ember from 'ember';
import EmberCollection from 'ember-collection/components/ember-collection';
import Grid from 'ember-collection/layouts/grid';

import ColorMixin from 'ember-paper/mixins/color-mixin';
import FlexMixin from 'ember-paper/mixins/flex-mixin';

const decodeEachKey = Ember.__loader.require('ember-htmlbars/utils/decode-each-key')['default'];
const {set, get, observer, computed} = Ember;

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
    this.cellItems = Ember.A();
    if (!this.getAttr('cell-layout')) {
      // single column layout by default
      this.attrs['cell-layout'] = new Grid(100000000000000000, 48);
      set(this, '_elementSizeSet', false);
    } else {
      set(this, '_elementSizeSet', true);
    }
  },

  _updateItems: function() {
    let items = this.get('items');
    let cells = this.get('_cells');
    this.get('cellItems').setObjects(
      this.get('_cells').filter((i) => !i.hidden).map((i) => items[i.index]));
      console.log("update items");
    this.observeScrollTop();
  },

  updateCells: function() {
    this._super();
    this._updateItems();
  },

  observeScrollTop: function() {
    if (!this.element) { return; }
    this.listElement = this.element.firstElementChild.children[1];
    if (!this.listElement) {
      return;
    }

    let topTranslate;
    let items = this._items;
    let offset = get(this, '_scrollTop');
    let itemSize = get(this, '_cellLayout.bin._elementHeight');
    let index = this._cellLayout.indexAt(this._scrollLeft, this._scrollTop, this._clientWidth, this._clientHeight);
    let count = this._cellLayout.count(this._scrollLeft, this._scrollTop, this._clientWidth, this._clientHeight);
    let bufferBefore = Math.min(index, this._buffer);

    index -= bufferBefore;
    topTranslate = (index * itemSize); // TODO: fixme
    console.log(index, count);
    this.listElement.style.position = 'absolute';
    this.listElement.style.top = 0;
    this.listElement.style.bottom = 0;
    this.listElement.style.left = 0;
    this.listElement.style.right = 0;
    this.listElement.style.transform = `translateY(${topTranslate}px)`;
  }
});
