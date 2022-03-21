export type ObserverQueueItem = {
    tag?: string;
    id?: string;
    className?: string;
    attribute?: {
        name: string;
        value: string;
    };
    parent?: ObserverQueueItem;
    not?: ObserverQueueItem;
    resolver: (foundElem: HTMLElement) => void;
};
/**
 * Query selector
 *
 * @param {string} query
 * @returns {HTMLElement}
 */
export function QS(query: string): HTMLElement;
/**
 * Query selector all
 *
 * @param {string} query
 * @returns {HTMLElement[]}
 */
export function QSA(query: string): HTMLElement[];
/**
 * Get element by ID
 *
 * @param {string} query
 * @returns {HTMLElement}
 */
export function GEBI(query: string): HTMLElement;
/**
 * Remove element
 *
 * @param {HTMLElement} elem
 * @returns {void}
 */
export function GR(elem: HTMLElement): void;
/**
 * @param {() => void} iCallback
 * @param {number} iDelay
 * @returns {number}
 */
export function SetCustomInterval(iCallback: () => void, iDelay: number): number;
/**
 * @param {number} iIntervalID
 */
export function ClearCustomInterval(iIntervalID: number): void;
/**
 * @param {string | ObserverQueueItem} iKey
 * @param {false | Promise} [iWaitAlways=false]
 * @returns {Promise<HTMLElement>}
 */
export function WaitForElement(iKey: string | ObserverQueueItem, iWaitAlways?: false | Promise): Promise<HTMLElement>;
/** @type {{ [customElementName: string]: HTMLElement }} */
export const CUSTOM_ELEMENTS: {
    [customElementName: string]: HTMLElement;
};
/**
 * @param {string} iLink
 * @param {number} iPriority
 * @param {string} [iModuleName]
 */
export function AddStyle(iLink: string, iPriority: number, iModuleName?: string): void;
