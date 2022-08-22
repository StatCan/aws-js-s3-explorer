// Install Service Worker
self.addEventListener('install', (e) => {
    console.log('Service Worker: Installed');
})

// Activate Service Worker
self.addEventListener('activate', (e) => {
    console.log('Service Worker: Activated');
})

/**
 * Add fetch event for service worker
 *
 * The AWS client automatically generates an Authorization request
 * header. On the AAW environment, we have an EnvoyFilter that appears
 * to automatically reject requests that have authorization headers
 * other than 'cookie' or 'x-auth-token'. To avoid significantly refactoring
 * the code for aws-js-explorer, this service worker acts as a
 * 'middleware' on the client side to modify outgoing requests from
 * the aws-js-explorer application and remove the erroneous Authorization
 * header.
 */
self.addEventListener('fetch', (e) => {
    // Any requests to s3proxy need to have the erroneous authorization header removed.
    const headers = new Headers(e.request.headers);
    headers.delete('authorization');

    // If the request is not an AJAX call to one of the s3proxy buckets, do not
    // modify the request.
    if (!(e.request.url.includes('/unclassified')) && !(e.request.url.includes('/unclassified-ro')) && !(e.request.url.includes('/protected-b'))) {
        e.respondWith(fetch(e.request));
    }
    // If the request is not a POST or a PUT request, forward the request with the
    // modified headers
    else if (!(e.request.method == 'PUT') && !(e.request.method == 'POST')) {
        const req = new Request(e.request.url, {
            headers,
            method: e.request.method,
            mode: e.request.mode,
            credentials: e.request.credentials,
            redirect: e.request.redirect
        });
        e.respondWith(fetch(req));
    }
    // If there is a PUT request where the url ends with '/', then we need to attach
    // a '.empty' file as the request is attempting to create a directory.
    else if (e.request.url.endsWith('/')) {
        const emptyFile = new File([''], '.empty', { type: 'text/plain' });
        const modifiedUrl = e.request.url + ".empty"
        const req = new Request(modifiedUrl, {
            headers,
            body: emptyFile,
            method: e.request.method,
            mode: e.request.mode,
            credentials: e.request.credentials,
            redirect: e.request.redirect
        });
        e.respondWith(fetch(req));
    }
    else {
        // At this point, the user is trying to upload a file as either a single-part upload or
        // a multi-part upload.
        const promiseChain = e.request.arrayBuffer().then((originalBody) => {
            return fetch(e.request.url, {
                headers,
                body: originalBody,
                method: e.request.method,
                mode: e.request.mode,
                credentials: e.request.credentials,
                redirect: e.request.redirect
            });
        });
        e.respondWith(promiseChain);
    }
});
