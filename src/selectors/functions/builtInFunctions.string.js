import IntegerValue from '../dataTypes/IntegerValue';
import StringValue from '../dataTypes/StringValue';
import BooleanValue from '../dataTypes/BooleanValue';
import Sequence from '../dataTypes/Sequence';

function contextItemAsFirstArgument (fn, dynamicContext) {
	return fn(dynamicContext, dynamicContext.contextItem);
}

function fnConcat (_dynamicContext) {
	var stringSequences = Array.from(arguments).slice(1);
	stringSequences = stringSequences.map(function (sequence) { return sequence.atomize(); });
	var strings = stringSequences.map(function (sequence) {
			if (sequence.isEmpty()) {
				return '';
			}
			return sequence.value[0].value;
		});
	return Sequence.singleton(new StringValue(strings.join('')));
}
function fnStartsWith (_dynamicContext, arg1, arg2) {
	var startsWith = !arg2.isEmpty() ? arg2.value[0].value : '';
	if (startsWith.length === 0) {
		return Sequence.singleton(BooleanValue.TRUE);
	}
	var stringToTest = !arg1.isEmpty() ? arg1.value[0].value : '';
	if (stringToTest.length === 0) {
		return Sequence.singleton(BooleanValue.FALSE);
	}
	// TODO: choose a collation, this defines whether eszett (ß) should equal 'ss'
	if (stringToTest.startsWith(startsWith)) {
		return Sequence.singleton(BooleanValue.TRUE);
	}
	return Sequence.singleton(BooleanValue.FALSE);
}

function fnEndsWith (_dynamicContext, arg1, arg2) {
	var endsWith = !arg2.isEmpty() ? arg2.value[0].value : '';
	if (endsWith.length === 0) {
		return Sequence.singleton(BooleanValue.TRUE);
	}
	var stringToTest = !arg1.isEmpty() ? arg1.value[0].value : '';
	if (stringToTest.length === 0) {
		return Sequence.singleton(BooleanValue.FALSE);
	}
	// TODO: choose a collation, this defines whether eszett (ß) should equal 'ss'
	if (stringToTest.endsWith(endsWith)) {
		return Sequence.singleton(BooleanValue.TRUE);
	}
	return Sequence.singleton(BooleanValue.FALSE);
}

function fnString (_dynamicContext, sequence) {
	if (sequence.isEmpty()) {
		return Sequence.singleton(new StringValue(''));
	}
	if (sequence.value[0].instanceOfType('node()')) {
		return Sequence.singleton(sequence.value[0].getStringValue());
	}
	return Sequence.singleton(StringValue.cast(sequence.value[0]));
}

function fnStringJoin (_dynamicContext, sequence, separator) {
	var separatorString = separator.value[0].value,
	joinedString = sequence.value.map(function (stringValue) {
		return stringValue.value;
	}).join(separatorString);
	return Sequence.singleton(new StringValue(joinedString));
}

function fnStringLength (_dynamicContext, sequence) {
	if (sequence.isEmpty()) {
		return Sequence.singleton(new IntegerValue(0));
	}
	// In ES6, Array.from(💩).length === 1
	return Sequence.singleton(new IntegerValue(Array.from(sequence.value[0].value).length));
}

function fnTokenize (_dynamicContext, input, pattern) {
	if (input.isEmpty() || input.value[0].value.length === 0) {
		return Sequence.empty();
	}
	var string = input.value[0].value,
		patternString = pattern.value[0].value;
	return new Sequence(
		string.split(new RegExp(patternString))
			.map(function (token) {return new StringValue(token);}));
}

function fnNormalizeSpace (_dynamicContext, arg) {
	if (arg.isEmpty()) {
		return Sequence.singleton(new StringValue(''));
	}
	var string = arg.value[0].value.trim();
	return Sequence.singleton(new StringValue(string.replace(/\s+/g, ' ')));
}

export default {
	declarations: [
		{
			name: 'concat',
			argumentTypes: ['xs:anyAtomicType?', 'xs:anyAtomicType?', '...'],
			returnType: 'xs:string',
			callFunction: fnConcat
		},

		{
			name: 'ends-with',
			argumentTypes: ['xs:string?', 'xs:string?'],
			returnType: 'xs:boolean',
			callFunction: fnEndsWith
		},

		{
			name: 'ends-with',
			argumentTypes: ['xs:string?', 'xs:string?', 'xs:string'],
			returnType: 'xs:boolean',
			callFunction: function () {
				throw new Error('Not implemented: Specifying a collation is not supported');
			}
		},


		{
			name: 'normalize-space',
			argumentTypes: ['xs:string?'],
			returnType: 'xs:string',
			callFunction: fnNormalizeSpace
		},

		{
			name: 'normalize-space',
			argumentTypes: [],
			returnType: 'xs:string',
			callFunction: function (dynamicContext) {
				return fnNormalizeSpace(dynamicContext, fnString(dynamicContext, dynamicContext.contextItem));
			}
		},

		{
			name: 'starts-with',
			argumentTypes: ['xs:string?', 'xs:string?'],
			returnType: 'xs:boolean',
			callFunction: fnStartsWith
		},

		{
			name: 'starts-with',
			argumentTypes: ['xs:string?', 'xs:string?', 'xs:string'],
			returnType: 'xs:boolean',
			callFunction: function () {
				throw new Error('Not implemented: Specifying a collation is not supported');
			}
		},

		{
			name: 'string',
			argumentTypes: ['item()?'],
			returnType: 'xs:string',
			callFunction: fnString
		},

		{
			name: 'string',
			argumentTypes: [],
			returnType: 'xs:string',
			callFunction: contextItemAsFirstArgument.bind(undefined, fnString)
		},

		{
			name: 'string-join',
			argumentTypes: ['xs:string*', 'xs:string'],
			returnType: 'xs:string',
			callFunction: fnStringJoin
		},

		{
			name: 'string-join',
			argumentTypes: ['xs:string*'],
			returnType: 'xs:string',
			callFunction: function (dynamicContext, arg1) {
				return fnStringJoin(dynamicContext, arg1, Sequence.singleton(new StringValue('')));
			}
		},

		{
			name: 'string-length',
			argumentTypes: ['xs:string?'],
			returnType: 'xs:integer',
			callFunction: fnStringLength
		},

		{
			name: 'string-length',
			argumentTypes: [],
			returnType: 'xs:integer',
			callFunction: function (dynamicContext) {
				return fnStringLength(dynamicContext, fnString(dynamicContext, dynamicContext.contextItem));
			}
		},

		{
			name: 'tokenize',
			argumentTypes: ['xs:string?', 'xs:string', 'xs:string'],
			returnType: 'xs:string*',
			callFunction: function (dynamicContext, input, pattern, flags) {
				throw new Error('Not implemented: Using flags in tokenize is not supported');
			}
		},

		{
			name: 'tokenize',
			argumentTypes: ['xs:string?', 'xs:string'],
			returnType: 'xs:string*',
			callFunction: fnTokenize
		},

		{
			name: 'tokenize',
			argumentTypes: ['xs:string?'],
			returnType: 'xs:string*',
			callFunction: function (dynamicContext, input) {
				return fnTokenize(dynamicContext, fnNormalizeSpace(dynamicContext, input), Sequence.singleton(new StringValue(' ')));
			}
		}

	],
	functions: {
		concat: fnConcat,
		endsWith: fnStartsWith,
		normalizeSpace: fnNormalizeSpace,
		startsWith: fnStartsWith,
		string: fnString,
		stringJoin: fnStringJoin,
		stringLength: fnStringLength,
		tokenize: fnTokenize
	}
};
