import {parsePolicy} from './cspPolicyParser.js';
import {HtmlRewritingStream} from 'html-rewriter';
import {httpRequest} from 'http-request';
import {createResponse} from 'create-response';
import {crypto} from 'crypto';
import {btoa} from "encoding";
import {logger} from 'log';

export async function responseProvider(request) {

    //Step 1: Calculate the Nonce
    let array = new Uint32Array(1);
    crypto.getRandomValues(array);
    let stringToEncode = array[0].toString();
    let encodedData = btoa(stringToEncode);
    let headerNonce = 'nonce-' + encodedData;
    logger.log('nonce: %s', headerNonce);

    //Step 2: Replace the origin nonce with our generated nonce in the CSP response header
    const headers = request.getHeaders();
    let options = {};
    let htmlResponse = await httpRequest("/xyz/csp/index.html", options);
    if (!htmlResponse.ok) {
        return createResponse(500, {}, `Failed to fetch doc: ${htmlResponse.status}`);
    }
    let responseHeaders = htmlResponse.getHeaders();
    let originCSPHeader = htmlResponse.getHeader('Content-Security-Policy')[0];
    const parsedPolicy = parsePolicy(originCSPHeader);
    let parsedPolicyElement = parsedPolicy['script-src'][0].toString();
    let newCspHeader = originCSPHeader.replace(parsedPolicyElement, "'" + headerNonce + "'");
    responseHeaders['content-security-policy'] = [newCspHeader];

    //Step 3: Rewrite the HTML with our generated nonce
    let rewriter = new HtmlRewritingStream();
    rewriter.onElement('[nonce=' + parsedPolicyElement + ']', el => {
        el.setAttribute('nonce', encodedData, {quote: "'"})
    });

    return createResponse(200, getSafeResponseHeaders(responseHeaders), htmlResponse.body.pipeThrough(rewriter));
}

// Add/remove unsafe headers from this list as required. This headers will be removed form origin response before sending to client.
const UNSAFE_RESPONSE_HEADERS = ['content-length', 'transfer-encoding', 'connection', 'vary',
    'accept-encoding', 'content-encoding', 'keep-alive',
    'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade', 'host'];

function getSafeResponseHeaders(headers) {
    for (let unsafeResponseHeader of UNSAFE_RESPONSE_HEADERS) {
        if (unsafeResponseHeader in headers) {
            delete headers[unsafeResponseHeader];
        }
    }
    return headers;
}
