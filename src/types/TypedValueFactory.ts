import { IDomFacade } from "src";
import ISequence from "src/expressions/dataTypes/ISequence";
import DomFacade from "../domFacade/DomFacade";
import ExternalDomFacade from "../domFacade/ExternalDomFacade";
import {adaptJavaScriptValueToArrayOfXPathValues} from "../expressions/adaptJavaScriptValueToXPathValue";
import Value, { ValueType } from "../expressions/dataTypes/Value";

/**
 *  Basically, everything is fine to be converted to XPath, EXCEPT
* - Functions
* - Symbols
* - undefined
* - null
*
* @public
*/
export type ValidValue = string|number|boolean|object|Date;

/**
 *  Basically, everything is fine to be converted to XPath, EXCEPT
* - Functions
* - Symbols
* - undefined
*
* TODO: what the hell are we going to do with ARRAYS
* @public
*/
export type ValidValueSequence = ValidValue | ValidValue[] | null;

export const IS_XPATH_VALUE_SYMBOL = Symbol('IS_XPATH_VALUE_SYMBOL');

/**
 * TODO: write docs
 */
export type TypedExternalValue = {
	[IS_XPATH_VALUE_SYMBOL]: true,
	convertedValue: Value[]
};

/**
 * TODO: write docs
 */
export default function (typeName: string) {
	return (value: ValidValueSequence, domFacade: IDomFacade): TypedExternalValue => {
		const wrappedDomFacade: DomFacade = new DomFacade(
			domFacade === null ? new ExternalDomFacade() : domFacade
		);

		const convertedValue = adaptJavaScriptValueToArrayOfXPathValues(wrappedDomFacade, value, typeName);

		return {
			[IS_XPATH_VALUE_SYMBOL]: true,
			convertedValue
		};
	};
}
