import Ember from 'ember';

const {
  get, set,
  computed,
  observer
} = Ember;

export default Ember.Controller.extend({
  init() {
    this._super();
    this.updateItems();
  },

  itemsCount: 20000,

  observeItemsCount: observer('itemsCount', function() {
    Ember.run.debounce(this, 'updateItems', 100);
  }),

  updateItems() {
    let arr = Ember.A();
    for (let i = 0; i < get(this, 'itemsCount'); i++) {
      let id = i + 1;
      arr.push({
        id,
        name: `Item ${id}`
      });
    }
    set(this, 'items', arr);
  },

  groupedItemsCount: 15 * 10,

  groupedItemsHeadings: computed('groupedItemsCount', function() {
    let items = get(this, 'groupedItems');
    return items.filter((it, i) => {
      it.index = i;
      return it.class === 'heading';
    });
  }),

  groupLabel: computed(function() {
    let items = get(this, 'groupedItems');
    return function(i) {
      return items[i].name;
    };
  }),

  selectedGroupIndex: 0,
  selectedGroup: computed('selectedGroupIndex', function() {
    return get(this, 'groupedItems')[get(this, 'selectedGroupIndex')].name;
  }),

  groupedItems: computed('groupedItemsCount', function() {
    let arr = Ember.A();
    for (let i = 0; i < get(this, 'groupedItemsCount'); i++) {
      let item = { 'name': `Item ${i}` };
      if (i % 15 === 0) {
        let j = Math.floor(i / 15) + 1;
        item.class = 'heading';
        item.name = `Group ${j}`;
      }
      arr.push(item);
    }
    return arr;
  })
});
