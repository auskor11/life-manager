const CACHE_NAME = "life-manager-v17";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./login.html",
    "./task-manager.html",
    "./calendar.html",
    "./expense.html",
    "./expense-archive.html",
    "./loan-owe.html",
    "./style.css",
    "./firebase.js",
    "./login.js",
    "./main.js",
    "./taskManager.js",
    "./calendar.js",
    "./expense.js",
    "./expense-archive.js",
    "./loan-owe.js",
    "./manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});