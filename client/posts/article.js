/*
 * Non-OP posts
 */
'use strict';

var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone'),
	main = require('../main'),
	options = require('../options'),
	postCommon = require('./common'),
	state = require('../state');

var Article = module.exports = Backbone.View.extend({
	tagName: 'article',
	initialize: function() {
		/*
		 * XXX: A bit ineficient, because first an empty element is renderred
		 * and then a proper one.
		 *
		 * An element is not empty only on postForms and extraction
		 */
		if (!this.el.innerHTML)
			this.render().insertIntoDOM();
		this.listenTo(this.model, {
			'change:editing': this.renderEditing
		});
		this.initCommon();
	},
	render: function() {
		// Pass this model's links to oneeSama for renderring
		main.oneeSama.links = this.model.get('links');
		this.setElement(main.oneeSama.mono(this.model.attributes));
		return this;
	},
	insertIntoDOM: function() {
		main.$threads.children('#' + this.model.get('op'))
			.children('blockquote, .omit, form, article[id]:last')
			.last()
			.after(this.$el);
		this.autoExpandImage();
	},
	renderEditing: function(model, editing) {
		this.$el.toggleClass('editing', !!editing);
		if (!editing)
			this.$el.children('blockquote')[0].normalize();
	}
});

// Extend with common mixins
_.extend(Article.prototype, postCommon);
