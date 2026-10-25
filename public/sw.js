"use strict";

const CACHE_NAME = "gugu-ai-visual-studio-v42";
const APP_SHELL = [
  "/", "/index.html", "/styles.css?v=35", "/theme-aurora.css?v=15", "/model-3d-workspace.css?v=1", "/portrait-creation-studio.css?v=3",
  "/theme-tech.css?v=2.9.3",
  "/product-background.js?v=1", "/material-transfer.js?v=1", "/sticker-pack.js?v=2", "/image-generation.js?v=1",
  "/model-3d-utils.js?v=1", "/model-3d-workspace.js?v=4", "/model-preview.js?v=1", "/app.js?v=35",
  "/character-studio/studio.js?v=11", "/character-studio/studio.css?v=9",
  "/manifest.webmanifest", "/assets/icon.svg", "/assets/portrait-style-preview-atlas.svg", "/vendor/hdr/studio_1k.hdr",
  "/vendor/three/build/three.module.js",
  "/vendor/three/jsm/controls/OrbitControls.js", "/vendor/three/jsm/controls/TransformControls.js",
  "/vendor/three/jsm/curves/NURBSCurve.js", "/vendor/three/jsm/curves/NURBSUtils.js",
  "/vendor/three/jsm/environments/RoomEnvironment.js", "/vendor/three/jsm/libs/fflate.module.js",
  "/vendor/three/jsm/loaders/FBXLoader.js", "/vendor/three/jsm/loaders/GLTFLoader.js", "/vendor/three/jsm/loaders/MTLLoader.js",
  "/vendor/three/jsm/loaders/OBJLoader.js", "/vendor/three/jsm/loaders/RGBELoader.js", "/vendor/three/jsm/loaders/STLLoader.js",
  "/vendor/three/jsm/math/SimplexNoise.js",
  "/vendor/three/jsm/postprocessing/EffectComposer.js", "/vendor/three/jsm/postprocessing/GTAOPass.js",
  "/vendor/three/jsm/postprocessing/MaskPass.js", "/vendor/three/jsm/postprocessing/OutputPass.js",
  "/vendor/three/jsm/postprocessing/Pass.js", "/vendor/three/jsm/postprocessing/RenderPass.js", "/vendor/three/jsm/postprocessing/ShaderPass.js",
  "/vendor/three/jsm/shaders/CopyShader.js", "/vendor/three/jsm/shaders/GTAOShader.js",
  "/vendor/three/jsm/shaders/OutputShader.js", "/vendor/three/jsm/shaders/PoissonDenoiseShader.js",
  "/vendor/three/jsm/utils/BufferGeometryUtils.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request)
    .then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    })
    .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html"))));
});
