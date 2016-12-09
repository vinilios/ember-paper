import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('paper-toast-bounds', 'Integration | Component | paper toast bounds', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{paper-toast-bounds}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#paper-toast-bounds}}
      template block text
    {{/paper-toast-bounds}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
