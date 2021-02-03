import { NodePointer } from '../domClone/Pointer';
import DomFacade from '../domFacade/DomFacade';
import ArrayValue from './dataTypes/ArrayValue';
import dataTypeValidatorByName, { getValidatorForType } from './dataTypes/builtins/dataTypeValidatorByName';
import createAtomicValue, { falseBoolean, trueBoolean } from './dataTypes/createAtomicValue';
import createPointerValue from './dataTypes/createPointerValue';
import ISequence from './dataTypes/ISequence';
import MapValue from './dataTypes/MapValue';
import sequenceFactory from './dataTypes/sequenceFactory';
import Value, { ValueType } from './dataTypes/Value';
import DateTime from './dataTypes/valueTypes/DateTime';
import createDoublyIterableSequence from './util/createDoublyIterableSequence';

/**
 * Adapt a JavaScript value to the equivalent in XPath. This dynamically assigns the closest type
 *
 * @param  value
 * @return Null if the value is absent and the empty sequence should be
 * output instead
 */
function adaptItemToXPathValue(value: any, domFacade: DomFacade): Value | null {
	if (value === null) {
		return null;
	}

	switch (typeof value) {
		case 'boolean':
			return value ? trueBoolean : falseBoolean;
		case 'number':
			return createAtomicValue(value, 'xs:double');
		case 'string':
			return createAtomicValue(value, 'xs:string');
		case 'object':
			// Test if it is a node
			if (value.nodeType) {
				const pointer: NodePointer = { node: value, graftAncestor: null };
				return createPointerValue(pointer, domFacade);
			}
			if (Array.isArray(value)) {
				return new ArrayValue(
					value.map((arrayItem) => {
						if (arrayItem === undefined) {
							return () => sequenceFactory.empty();
						}
						const adaptedValue = adaptItemToXPathValue(arrayItem, domFacade);
						const adaptedSequence =
							adaptedValue === null
								? sequenceFactory.empty()
								: sequenceFactory.singleton(adaptedValue);

						return createDoublyIterableSequence(adaptedSequence);
					})
				);
			}
			// Make it a map
			return new MapValue(
				Object.keys(value)
					.filter((key) => value[key] !== undefined)
					.map((key) => {
						const adaptedValue = adaptItemToXPathValue(value[key], domFacade);
						const adaptedSequence =
							adaptedValue === null
								? sequenceFactory.empty()
								: sequenceFactory.singleton(adaptedValue);

						return {
							key: createAtomicValue(key, 'xs:string'),
							value: createDoublyIterableSequence(adaptedSequence),
						};
					})
			);
	}
	throw new Error(`Value ${value} of type "${typeof value}" is not adaptable to an XPath value.`);
}

// TODO REWRITE ALL ANY IN THIS FILE TO THE NEW VALID TYPE STUFF

function checkNumericType(value: any, type: ValueType) {
	if (typeof value === 'number') {
		return;
	}
	if (typeof value === 'string') {
		const validator = getValidatorForType(type);
		if (validator(value)) {
			return;
		}
	}
	throw new Error(`Cannot convert JavaScript value '${value}' to  the XPath type ${type} since it is not valid.`);
}

/**
 * Adapt a JavaScript value to the equivalent in XPath. This tries to keep the preferred type
 *
 * @param  value
 * @return Null if the value is absent and the empty sequence should be outputted instead
 */
function adaptJavaScriptValueToXPath(type: ValueType, value: any, domFacade: DomFacade): Value | null {
	if (value === null) {
		return null;
	}
	switch (type) {
		case 'xs:boolean':
			return value ? trueBoolean : falseBoolean;
		case 'xs:string':
			return createAtomicValue(value + '', 'xs:string');
		case 'xs:double':
		case 'xs:numeric':
			checkNumericType(value, type);
			return createAtomicValue(+value, 'xs:double');
		case 'xs:decimal':
			checkNumericType(value, type);
			return createAtomicValue(+value, 'xs:decimal');
		case 'xs:integer':
			checkNumericType(value, type);
			return createAtomicValue(value | 0, 'xs:integer');
		case 'xs:float':
			checkNumericType(value, type);
			return createAtomicValue(+value, 'xs:float');
		case 'xs:date':
		case 'xs:time':
		case 'xs:dateTime':
		case 'xs:gYearMonth':
		case 'xs:gYear':
		case 'xs:gMonthDay':
		case 'xs:gMonth':
		case 'xs:gDay':
			return createAtomicValue(
				DateTime.fromString(value.toISOString()).convertToType(type),
				type
			);
		case 'node()':
		case 'element()':
		case 'text()':
		case 'processing-instruction()':
		case 'comment()':
			const pointer: NodePointer = { node: value, graftAncestor: null };
			return createPointerValue(pointer, domFacade);
		case 'item()':
			return adaptItemToXPathValue(value, domFacade);
		default:
			throw new Error(
				`Values of the type "${type}" can not be adapted to equivalent XPath values.`
			);
	}
}

export default function adaptJavaScriptValueToXPathValue(
	domFacade: DomFacade,
	value: any,
	expectedType?: string | undefined
): ISequence {
	expectedType = expectedType || 'item()?';

	const parts = expectedType.match(/^([^+?*]*)([\+\*\?])?$/);
	const type = parts[1] as ValueType;
	const multiplicity = parts[2];

	switch (multiplicity) {
		case '?': {
			const adaptedValue = adaptJavaScriptValueToXPath(type, value, domFacade);
			if (adaptedValue === null) {
				return sequenceFactory.empty();
			}
			return sequenceFactory.singleton(adaptedValue);
		}
		case '+':
		case '*': {
			const convertedValues = value.map((val) =>
				adaptJavaScriptValueToXPath(type, val, domFacade)
			);
			return sequenceFactory.create(
				convertedValues.filter((convertedValue) => convertedValue !== null)
			);
		}

		default: {
			const adaptedValue = adaptJavaScriptValueToXPath(type, value, domFacade);
			if (adaptedValue === null) {
				return sequenceFactory.empty();
			}
			return sequenceFactory.singleton(adaptedValue);
		}
	}
}
