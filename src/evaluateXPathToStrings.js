import evaluateXPath from './evaluateXPath';
import Selector from './selectors/Selector';

/**
 * Evaluates an XPath on the given contextNode. Returns the string result as if the XPath is wrapped in string(...).
 *
 * @param  {!Selector|string}  selector       The selector to execute. Supports XPath 3.1.
 * @param  {!Node}             contextNode    The node from which to run the XPath.
 * @param  {!IDomFacade}       domFacade      The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  {?Object=}          variables      Extra variables (name=>value). Values can be number / string or boolean.
 *
 * @return  {Array<string>}         The string result.
 */
export default function evaluateXPathToStrings (selector, contextNode, domFacade, variables) {
    return /** @type {!Array<string>} */ (evaluateXPath(selector, contextNode, domFacade, variables, evaluateXPath.STRINGS_TYPE));
}
