/** Assert the JSON request body contract before parsing it in fetch mocks. */
export function requestBodyText(init?: RequestInit): string {
    if (typeof init?.body !== 'string') {
        throw new TypeError('Expected a string request body');
    }
    return init.body;
}
