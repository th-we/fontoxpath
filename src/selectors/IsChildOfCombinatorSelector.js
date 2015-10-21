define([
	'../adaptNodeSpecToSelector',
	'./Selector'
], function (
	adaptNodeSpecToSelector,
	Selector
) {
	'use strict';

	/**
	 * @param  {Selector}  parentSelector
	 * @param  {Selector}  childSelector
	 */
	function IsChildOfCombinatorSelector (parentSelector, childSelector) {
		Selector.call(this, parentSelector.specificity.add(childSelector.specificity));

		this._parentSelector = parentSelector;
		this._childSelector = childSelector;
	}

	IsChildOfCombinatorSelector.prototype = Object.create(Selector.prototype);
	IsChildOfCombinatorSelector.prototype.constructor = IsChildOfCombinatorSelector;

	/**
	 * @param  {Node}       node
	 * @param  {Blueprint}  blueprint
	 */
	IsChildOfCombinatorSelector.prototype.matches = function (node, blueprint) {
		if (!this._childSelector.matches(node, blueprint)) {
			return false;
		}

		var parentNode = blueprint.getParentNode(node);
		if (!parentNode) {
			return false;
		}

		return this._parentSelector.matches(parentNode, blueprint);
	};

	IsChildOfCombinatorSelector.prototype.equals = function (otherSelector) {
		if (this === otherSelector) {
			return true;
		}

		return otherSelector instanceof IsChildOfCombinatorSelector &&
			this._childSelector.equals(otherSelector._childSelector) &&
			this._parentSelector.equals(otherSelector._parentSelector);
	};

	IsChildOfCombinatorSelector.prototype.getBucket = function () {
		// Always use the bucket for the targeted node
		return this._childSelector.getBucket();
	};

	/**
	 * @param  {Selector|NodeSpec}  parentSelector
	 */
	Selector.prototype.requireParent = function (parentSelector) {
		return new IsChildOfCombinatorSelector(adaptNodeSpecToSelector(parentSelector), this);
	};

	return IsChildOfCombinatorSelector;
});