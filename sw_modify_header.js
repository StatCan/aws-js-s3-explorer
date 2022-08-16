// Install Service Worker
self.addEventListener('install', (e) => {
    console.log("Service Worker: Installed");
})

// Activate Service Worker
self.addEventListener('activate', (e) => {
    console.log("Service Worker: Activated");
})

/**
 * Add fetch event for service worker
 * 
 * The AWS client automatically generates an Authorization request
 * header. On the AAW environment, we have an EnvoyFilter that appears
 * to automatically reject requests that have authorization headers
 * other than 'cookie' or 'x-auth-token'. To avoid significantly refactoring
 * the code for aws-js-explorer, this service worker acts as a 
 * "middleware" on the client side to modify outgoing requests from
 * the aws-js-explorer application and remove the erroneous Authorization
 * header.
 */
self.addEventListener('fetch', (e) => {
    if (e.request.url.includes("/standard") || e.request.url.includes("/premium")) {
        console.log("Service Worker: s3proxy API call, modify request headers.")
        const headers = new Headers(e.request.headers);
        // remove erroneous authorization header
        headers.delete("authorization");
        if (e.request.headers.get("content-type").includes("image/") || e.request.headers.get("content-type").includes('application/octet-stream')) {
            const promiseChain = e.request.arrayBuffer().then((originalBody) => {
                return fetch(e.request.url, {
                        method: e.request.method,
                        headers,
                        body: originalBody,
                    });
            });
            e.respondWith(promiseChain);
            return;
        }
        else if (e.request.headers.get("content-type").includes("text/") || e.request.headers.get("content-type").includes('application/octet-stream')) {
            const promiseChain = e.request.text().then((originalBody) => {
                return fetch(e.request.url, {
                    method: e.request.method,
                    headers,
                    body: originalBody,
                });
            });
            e.respondWith(promiseChain);
            return;
        }
        else {
            // Define new request without the Authorization header
            var req = new Request(e.request.url, {
                method: e.request.method,
                headers: {
                    ...e.request.headers
                },
                mode: e.request.mode,
                credentials: e.request.credentials,
                redirect: e.request.redirect
            });
            e.respondWith(fetch(req))
        }
    }
    else {
        console.log("Service Worker: non-s3proxy call, do not modify request headers.")
        e.respondWith(fetch(e.request))
    }
});
