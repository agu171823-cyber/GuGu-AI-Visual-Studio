"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/embedded.ts
var embedded_exports = {};
__export(embedded_exports, {
  createCharacterService: () => createCharacterService
});
module.exports = __toCommonJS(embedded_exports);

// node_modules/@hono/node-server/dist/constants-BLSFu_RU.mjs
var X_ALREADY_SENT = "x-hono-already-sent";

// node_modules/@hono/node-server/dist/index.mjs
var import_node_http = require("node:http");
var import_node_http2 = require("node:http2");
var import_node_stream = require("node:stream");

// node_modules/hono/dist/helper/websocket/index.js
var defineWebSocketHelper = (handler) => {
  return ((...args) => {
    if (typeof args[0] === "function") {
      const [createEvents, options] = args;
      return async function upgradeWebSocket2(c, next) {
        const result = await handler(c, await createEvents(c), options);
        if (result) return result;
        await next();
      };
    } else {
      const [c, events, options] = args;
      return (async () => {
        const upgraded = await handler(c, events, options);
        if (!upgraded) throw new Error("Failed to upgrade WebSocket");
        return upgraded;
      })();
    }
  });
};

// node_modules/@hono/node-server/dist/index.mjs
var RequestError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "RequestError";
  }
};
var nonJoinedHeaders = /* @__PURE__ */ new Set([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "server",
  "user-agent"
]);
var validHeaderName = /^[!#$%&'*+\-.^_`|~\dA-Za-z]+$/;
var isHttpWhitespace = (code) => code === 9 || code === 10 || code === 13 || code === 32;
var normalizeHeaderValue = (value) => {
  if (!isHttpWhitespace(value.charCodeAt(0)) && !isHttpWhitespace(value.charCodeAt(value.length - 1))) return value;
  let start = 0;
  let end = value.length;
  while (start < end && isHttpWhitespace(value.charCodeAt(start))) start++;
  while (end > start && isHttpWhitespace(value.charCodeAt(end - 1))) end--;
  return value.slice(start, end);
};
var forbiddenHeaderValue = /[\0\r\n]/;
var GlobalHeaders = globalThis.Headers;
var materializeHeaders = (rawHeaders, HeadersCtor = GlobalHeaders) => {
  const headers = new HeadersCtor();
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const name = rawHeaders[i];
    if (!name.startsWith(":")) headers.append(name, rawHeaders[i + 1]);
  }
  return headers;
};
var RequestHeaders = class {
  #incoming;
  #rawHeaders;
  #headers;
  #invalidValue;
  constructor(incoming) {
    this.#incoming = incoming;
    if (incoming instanceof import_node_http2.Http2ServerRequest) this.#rawHeaders = incoming.rawHeaders.slice();
  }
  get #lazyRawHeaders() {
    return this.#rawHeaders ??= this.#incoming.rawHeaders.slice();
  }
  get #native() {
    if (!this.#headers) {
      this.#headers = materializeHeaders(this.#lazyRawHeaders);
      this.#rawHeaders = void 0;
    }
    return this.#headers;
  }
  #normalizedName(name) {
    if (typeof name !== "string") return;
    if (!validHeaderName.test(name)) throw new TypeError(`Invalid header name: ${name}`);
    return name.toLowerCase();
  }
  #lookupHttp1(lowerName) {
    const headers = this.#incoming instanceof import_node_http2.Http2ServerRequest ? void 0 : this.#incoming.headers;
    if (!headers || nonJoinedHeaders.has(lowerName) || lowerName === "set-cookie" || lowerName === "__proto__") return;
    if (!Object.hasOwn(headers, lowerName)) return null;
    const rawValue = headers[lowerName];
    if (typeof rawValue === "string") {
      const value = normalizeHeaderValue(rawValue);
      return forbiddenHeaderValue.test(value) ? void 0 : value;
    }
  }
  #lookup(rawHeaders, lowerName) {
    const separator = lowerName === "cookie" ? "; " : ", ";
    let value = null;
    for (let i = 0; i < rawHeaders.length; i += 2) {
      const rawName = rawHeaders[i];
      if (rawName.length === lowerName.length && rawName.toLowerCase() === lowerName) {
        const rawValue = normalizeHeaderValue(rawHeaders[i + 1]);
        if (forbiddenHeaderValue.test(rawValue)) {
          this.#invalidValue = true;
          return;
        }
        value = value === null ? rawValue : value + separator + rawValue;
      }
    }
    return value;
  }
  append(name, value) {
    this.#native.append(name, value);
  }
  delete(name) {
    this.#native.delete(name);
  }
  get(name) {
    const lowerName = this.#normalizedName(name);
    if (lowerName && !this.#headers && !this.#invalidValue) {
      const http1Value = this.#lookupHttp1(lowerName);
      if (http1Value !== void 0) return http1Value;
      const value = this.#lookup(this.#lazyRawHeaders, lowerName);
      if (value !== void 0) return value;
    }
    return this.#native.get(name);
  }
  has(name) {
    const lowerName = this.#normalizedName(name);
    if (lowerName && !this.#headers && !this.#invalidValue) {
      const http1Value = this.#lookupHttp1(lowerName);
      if (http1Value !== void 0) return http1Value !== null;
      const value = this.#lookup(this.#lazyRawHeaders, lowerName);
      if (value !== void 0) return value !== null;
    }
    return this.#native.has(name);
  }
  set(name, value) {
    this.#native.set(name, value);
  }
  getSetCookie() {
    return this.#native.getSetCookie();
  }
  keys() {
    return this.#native.keys();
  }
  values() {
    return this.#native.values();
  }
  entries() {
    return this.#native.entries();
  }
  forEach(callback, thisArg) {
    this.#native.forEach((value, key) => {
      callback.call(thisArg, value, key, this);
    });
  }
  [Symbol.iterator]() {
    return this.entries();
  }
};
Object.defineProperty(RequestHeaders.prototype, Symbol.for("nodejs.util.inspect.custom"), { value: function(depth, options, inspectFn) {
  return `Headers (lightweight) ${inspectFn(Object.fromEntries(this), {
    ...options,
    depth: depth == null ? null : depth - 1
  })}`;
} });
Object.setPrototypeOf(RequestHeaders.prototype, GlobalHeaders.prototype);
var newHeadersFromIncoming = (incoming) => globalThis.Headers === GlobalHeaders ? new RequestHeaders(incoming) : materializeHeaders(incoming.rawHeaders, globalThis.Headers);
var reValidRequestUrl = /^\/[!#$&-;=?-\[\]_a-z~]*$/;
var reDotSegment = /\/\.\.?(?:[/?#]|$)/;
var reValidHost = /^[a-z0-9._-]+(?::(?:[1-5]\d{3,4}|[6-9]\d{3}))?$/;
var buildUrl = (scheme, host, incomingUrl) => {
  const url = `${scheme}://${host}${incomingUrl}`;
  if (!reValidHost.test(host)) {
    const urlObj = new URL(url);
    if (urlObj.hostname.length !== host.length && urlObj.hostname !== (host.includes(":") ? host.replace(/:\d+$/, "") : host).toLowerCase()) throw new RequestError("Invalid host header");
    return urlObj.href;
  } else if (incomingUrl.length === 0) return url + "/";
  else {
    if (incomingUrl.charCodeAt(0) !== 47) throw new RequestError("Invalid URL");
    if (!reValidRequestUrl.test(incomingUrl) || reDotSegment.test(incomingUrl)) return new URL(url).href;
    return url;
  }
};
var toRequestError = (e) => {
  if (e instanceof RequestError) return e;
  return new RequestError(e.message, { cause: e });
};
var GlobalRequest = global.Request;
var Request$1 = class extends GlobalRequest {
  constructor(input, options) {
    if (typeof input === "object" && getRequestCache in input) {
      const hasReplacementBody = options !== void 0 && "body" in options && options.body != null;
      if (input[bodyConsumedDirectlyKey] && !hasReplacementBody) throw new TypeError("Cannot construct a Request with a Request object that has already been used.");
      input = input[getRequestCache]();
    }
    if (typeof options?.body?.getReader !== "undefined") options.duplex ??= "half";
    super(input, options);
  }
};
var wrapBodyStream = Symbol("wrapBodyStream");
var byteExactEncodings = /* @__PURE__ */ new Set([
  "latin1",
  "binary",
  "hex",
  "base64",
  "base64url"
]);
var isByteExactEncoding = (encoding) => encoding === null || byteExactEncodings.has(encoding);
var bodyBufferedBeforeDisconnectKey = Symbol("bodyBufferedBeforeDisconnect");
var bodyBufferedLengthBeforeDisconnectKey = Symbol("bodyBufferedLengthBeforeDisconnect");
var toBufferChunk = (chunk, encoding) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding ?? "utf8");
var isRecoverableDisconnectedIncoming = (incoming) => !(incoming instanceof import_node_http2.Http2ServerRequest) && !!incoming.complete && !!incoming.readableAborted && typeof incoming.read === "function" && isByteExactEncoding(incoming.readableEncoding);
var recordBodyBufferedBeforeDisconnect = (incoming) => {
  if (incoming.readableDidRead || !isRecoverableDisconnectedIncoming(incoming)) return;
  const incomingWithRecovery = incoming;
  incomingWithRecovery[bodyBufferedLengthBeforeDisconnectKey] ??= incoming.readableLength;
};
var readBodyBufferedBeforeDisconnect = (incoming, chunks) => {
  if (incoming.readableDidRead && !chunks || !isRecoverableDisconnectedIncoming(incoming)) return;
  const incomingWithRecovery = incoming;
  if (incomingWithRecovery[bodyBufferedBeforeDisconnectKey] !== void 0) return incomingWithRecovery[bodyBufferedBeforeDisconnectKey];
  let result;
  const errored = incoming.errored;
  if (errored && errored.code !== "ECONNRESET") result = errored;
  else if (incomingWithRecovery[bodyBufferedLengthBeforeDisconnectKey] !== void 0 && incoming.readableLength !== incomingWithRecovery[bodyBufferedLengthBeforeDisconnectKey]) result = newBodyUnusableError();
  else {
    const bodyChunks = chunks ?? [];
    const chunk = incoming.read();
    if (chunk !== null) bodyChunks.push(toBufferChunk(chunk, incoming.readableEncoding));
    const buffer = bodyChunks.length === 1 ? bodyChunks[0] : Buffer.concat(bodyChunks);
    result = buffer;
    const contentLength = incoming.headers["content-length"];
    if (typeof contentLength === "string" && /^\d+$/.test(contentLength)) {
      const expectedLength = Number(contentLength);
      if (Number.isSafeInteger(expectedLength) && buffer.length !== expectedLength) result = newBodyUnusableError();
    }
  }
  incomingWithRecovery[bodyBufferedBeforeDisconnectKey] = result;
  return result;
};
var enqueueBufferedBody = (controller, buffered) => {
  if (buffered instanceof Error) {
    controller.error(buffered);
    return;
  }
  if (buffered.length > 0) controller.enqueue(buffered);
  controller.close();
};
var newRequestFromIncoming = (method, url, headers, incoming, abortController) => {
  const init = {
    method,
    headers,
    signal: abortController.signal
  };
  if (method === "TRACE") {
    init.method = "GET";
    const req = new Request$1(url, init);
    Object.defineProperty(req, "method", { get() {
      return "TRACE";
    } });
    return req;
  }
  if (!(method === "GET" || method === "HEAD")) if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) init.body = new ReadableStream({ start(controller) {
    controller.enqueue(incoming.rawBody);
    controller.close();
  } });
  else if (incoming[wrapBodyStream]) {
    let reader;
    init.body = new ReadableStream({ async pull(controller) {
      try {
        if (!reader) {
          const buffered = readBodyBufferedBeforeDisconnect(incoming);
          if (buffered !== void 0) {
            enqueueBufferedBody(controller, buffered);
            return;
          }
        }
        reader ||= import_node_stream.Readable.toWeb(incoming).getReader();
        const { done, value } = await reader.read();
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    } });
  } else {
    const buffered = readBodyBufferedBeforeDisconnect(incoming);
    if (buffered !== void 0) init.body = new ReadableStream({ start(controller) {
      enqueueBufferedBody(controller, buffered);
    } });
    else init.body = import_node_stream.Readable.toWeb(incoming);
  }
  return new Request$1(url, init);
};
var getRequestCache = Symbol("getRequestCache");
var requestCache = Symbol("requestCache");
var incomingKey = Symbol("incomingKey");
var urlKey = Symbol("urlKey");
var methodKey = Symbol("methodKey");
var headersKey = Symbol("headersKey");
var abortControllerKey = Symbol("abortControllerKey");
var getAbortController = Symbol("getAbortController");
var abortRequest = Symbol("abortRequest");
var bodyBufferKey = Symbol("bodyBuffer");
var bodyReadPromiseKey = Symbol("bodyReadPromise");
var bodyConsumedDirectlyKey = Symbol("bodyConsumedDirectly");
var bodyLockReaderKey = Symbol("bodyLockReader");
var abortReasonKey = Symbol("abortReason");
var newBodyUnusableError = () => {
  return /* @__PURE__ */ new TypeError("Body is unusable");
};
var rejectBodyUnusable = () => {
  return Promise.reject(newBodyUnusableError());
};
var textDecoder = new TextDecoder();
var consumeBodyDirectOnce = (request) => {
  if (request[bodyConsumedDirectlyKey]) return rejectBodyUnusable();
  request[bodyConsumedDirectlyKey] = true;
};
var toArrayBuffer = (buf) => {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
};
var contentType = (request) => {
  return (request[headersKey] ||= newHeadersFromIncoming(request[incomingKey])).get("content-type") || "";
};
var methodTokenRegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var normalizeIncomingMethod = (method) => {
  if (typeof method !== "string" || method.length === 0) return "GET";
  switch (method) {
    case "DELETE":
    case "GET":
    case "HEAD":
    case "OPTIONS":
    case "PATCH":
    case "POST":
    case "PUT":
    case "QUERY":
      return method;
  }
  const upper = method.toUpperCase();
  switch (upper) {
    case "DELETE":
    case "GET":
    case "HEAD":
    case "OPTIONS":
    case "POST":
    case "PUT":
      return upper;
    default:
      return method;
  }
};
var validateDirectReadMethod = (method) => {
  if (!methodTokenRegExp.test(method)) return /* @__PURE__ */ new TypeError(`'${method}' is not a valid HTTP method.`);
  const normalized = method.toUpperCase();
  if (normalized === "CONNECT" || normalized === "TRACK" || normalized === "TRACE" && method !== "TRACE") return /* @__PURE__ */ new TypeError(`'${method}' HTTP method is unsupported.`);
};
var readBodyWithFastPath = (request, method, fromBuffer) => {
  if (request[bodyConsumedDirectlyKey]) return rejectBodyUnusable();
  const methodName = request.method;
  if (methodName === "GET" || methodName === "HEAD") return request[getRequestCache]()[method]();
  const methodValidationError = validateDirectReadMethod(methodName);
  if (methodValidationError) return Promise.reject(methodValidationError);
  if (request[requestCache]) {
    if (methodName !== "TRACE") return request[requestCache][method]();
  }
  const alreadyUsedError = consumeBodyDirectOnce(request);
  if (alreadyUsedError) return alreadyUsedError;
  const raw2 = readRawBodyIfAvailable(request);
  if (raw2) {
    const result = Promise.resolve(fromBuffer(raw2, request));
    request[bodyBufferKey] = void 0;
    return result;
  }
  return readBodyDirect(request).then((buf) => {
    const result = fromBuffer(buf, request);
    request[bodyBufferKey] = void 0;
    return result;
  });
};
var readRawBodyIfAvailable = (request) => {
  const incoming = request[incomingKey];
  if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) return incoming.rawBody;
};
var normalizeAbortError = (request, incoming) => {
  if (incoming.errored) return incoming.errored;
  const reason = request[abortReasonKey];
  if (reason !== void 0) return reason instanceof Error ? reason : new Error(String(reason));
  return /* @__PURE__ */ new Error("Client connection prematurely closed.");
};
var readBodyDirect = (request) => {
  if (request[bodyBufferKey]) return Promise.resolve(request[bodyBufferKey]);
  if (request[bodyReadPromiseKey]) return request[bodyReadPromiseKey];
  const incoming = request[incomingKey];
  if (incoming.readableDidRead) return rejectBodyUnusable();
  const buffered = readBodyBufferedBeforeDisconnect(incoming);
  if (buffered !== void 0) {
    if (buffered instanceof Error) return Promise.reject(buffered);
    request[bodyBufferKey] = buffered;
    return Promise.resolve(buffered);
  }
  const promise = new Promise((resolve4, reject) => {
    const chunks = [];
    let settled = false;
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const recoverCompleteBodyAfterDisconnect = (error) => {
      const streamError = incoming.errored ?? error;
      if (!isRecoverableDisconnectedIncoming(incoming) || streamError && streamError.code !== "ECONNRESET") return false;
      finish(() => {
        const recovered = readBodyBufferedBeforeDisconnect(incoming, chunks);
        if (recovered instanceof Error) reject(recovered);
        else if (recovered === void 0) reject(error ?? normalizeAbortError(request, incoming));
        else {
          request[bodyBufferKey] = recovered;
          resolve4(recovered);
        }
      });
      return true;
    };
    const onData = (chunk) => {
      chunks.push(toBufferChunk(chunk, incoming.readableEncoding));
    };
    const onEnd = () => {
      finish(() => {
        const buffer = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks);
        request[bodyBufferKey] = buffer;
        resolve4(buffer);
      });
    };
    const onError = (error) => {
      if (recoverCompleteBodyAfterDisconnect(error)) return;
      finish(() => {
        reject(error);
      });
    };
    const onClose = () => {
      if (incoming.readableEnded) {
        onEnd();
        return;
      }
      if (recoverCompleteBodyAfterDisconnect()) return;
      finish(() => {
        reject(normalizeAbortError(request, incoming));
      });
    };
    const cleanup = () => {
      incoming.off("data", onData);
      incoming.off("end", onEnd);
      incoming.off("error", onError);
      incoming.off("close", onClose);
      request[bodyReadPromiseKey] = void 0;
    };
    incoming.on("data", onData);
    incoming.on("end", onEnd);
    incoming.on("error", onError);
    incoming.on("close", onClose);
    queueMicrotask(() => {
      if (settled) return;
      if (incoming.readableEnded) onEnd();
      else if (incoming.errored) onError(incoming.errored);
      else if (incoming.destroyed) onClose();
    });
  });
  request[bodyReadPromiseKey] = promise;
  return promise;
};
var requestPrototype = {
  get method() {
    return this[methodKey];
  },
  get url() {
    return this[urlKey];
  },
  get headers() {
    return this[headersKey] ||= newHeadersFromIncoming(this[incomingKey]);
  },
  [abortRequest](reason) {
    if (this[abortReasonKey] === void 0) this[abortReasonKey] = reason;
    const abortController = this[abortControllerKey];
    if (abortController && !abortController.signal.aborted) abortController.abort(reason);
  },
  [getAbortController]() {
    this[abortControllerKey] ||= new AbortController();
    if (this[abortReasonKey] !== void 0 && !this[abortControllerKey].signal.aborted) this[abortControllerKey].abort(this[abortReasonKey]);
    return this[abortControllerKey];
  },
  [getRequestCache]() {
    const abortController = this[getAbortController]();
    if (this[requestCache]) return this[requestCache];
    const method = this.method;
    if (this[bodyConsumedDirectlyKey] && !(method === "GET" || method === "HEAD")) {
      this[bodyBufferKey] = void 0;
      const init = {
        method: method === "TRACE" ? "GET" : method,
        headers: this.headers,
        signal: abortController.signal
      };
      if (method !== "TRACE") {
        init.body = new ReadableStream({ start(c) {
          c.close();
        } });
        init.duplex = "half";
      }
      const req = new Request$1(this[urlKey], init);
      if (method === "TRACE") Object.defineProperty(req, "method", { get() {
        return "TRACE";
      } });
      return this[requestCache] = req;
    }
    return this[requestCache] = newRequestFromIncoming(this.method, this[urlKey], this.headers, this[incomingKey], abortController);
  },
  get body() {
    if (!this[bodyConsumedDirectlyKey]) return this[getRequestCache]().body;
    const request = this[getRequestCache]();
    if (!this[bodyLockReaderKey] && request.body) this[bodyLockReaderKey] = request.body.getReader();
    return request.body;
  },
  get bodyUsed() {
    if (this[bodyConsumedDirectlyKey]) return true;
    if (this[requestCache]) return this[requestCache].bodyUsed;
    return false;
  }
};
Object.defineProperty(requestPrototype, "signal", { get() {
  return this[getAbortController]().signal;
} });
[
  "cache",
  "credentials",
  "destination",
  "integrity",
  "mode",
  "redirect",
  "referrer",
  "referrerPolicy",
  "keepalive"
].forEach((k) => {
  Object.defineProperty(requestPrototype, k, { get() {
    return this[getRequestCache]()[k];
  } });
});
["clone", "formData"].forEach((k) => {
  Object.defineProperty(requestPrototype, k, { value: function() {
    if (this[bodyConsumedDirectlyKey]) {
      if (k === "clone") throw newBodyUnusableError();
      return rejectBodyUnusable();
    }
    return this[getRequestCache]()[k]();
  } });
});
Object.defineProperty(requestPrototype, "text", { value: function() {
  return readBodyWithFastPath(this, "text", (buf) => textDecoder.decode(buf));
} });
Object.defineProperty(requestPrototype, "arrayBuffer", { value: function() {
  return readBodyWithFastPath(this, "arrayBuffer", (buf) => toArrayBuffer(buf));
} });
Object.defineProperty(requestPrototype, "blob", { value: function() {
  return readBodyWithFastPath(this, "blob", (buf, request) => {
    const type = contentType(request);
    const init = type ? { headers: { "content-type": type } } : void 0;
    return new Response(buf, init).blob();
  });
} });
Object.defineProperty(requestPrototype, "json", { value: function() {
  if (this[bodyConsumedDirectlyKey]) return rejectBodyUnusable();
  return this.text().then(JSON.parse);
} });
Object.defineProperty(requestPrototype, Symbol.for("nodejs.util.inspect.custom"), { value: function(depth, options, inspectFn) {
  return `Request (lightweight) ${inspectFn({
    method: this.method,
    url: this.url,
    headers: this.headers,
    nativeRequest: this[requestCache]
  }, {
    ...options,
    depth: depth == null ? null : depth - 1
  })}`;
} });
Object.setPrototypeOf(requestPrototype, Request$1.prototype);
var newRequest = (incoming, defaultHostname) => {
  const req = Object.create(requestPrototype);
  req[incomingKey] = incoming;
  req[methodKey] = normalizeIncomingMethod(incoming.method);
  const incomingUrl = incoming.url || "";
  if (incomingUrl[0] !== "/" && (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
    if (incoming instanceof import_node_http2.Http2ServerRequest) throw new RequestError("Absolute URL for :path is not allowed in HTTP/2");
    try {
      req[urlKey] = new URL(incomingUrl).href;
    } catch (e) {
      throw new RequestError("Invalid absolute URL", { cause: e });
    }
    return req;
  }
  const host = (incoming instanceof import_node_http2.Http2ServerRequest ? incoming.authority : incoming.headers.host) || defaultHostname;
  if (!host) throw new RequestError("Missing host header");
  let scheme;
  if (incoming instanceof import_node_http2.Http2ServerRequest) {
    scheme = incoming.scheme;
    if (!(scheme === "http" || scheme === "https")) throw new RequestError("Unsupported scheme");
  } else scheme = incoming.socket && incoming.socket.encrypted ? "https" : "http";
  try {
    req[urlKey] = buildUrl(scheme, host, incomingUrl);
  } catch (e) {
    if (e instanceof RequestError) throw e;
    else throw new RequestError("Invalid URL", { cause: e });
  }
  return req;
};
var defaultContentType = "text/plain; charset=UTF-8";
var responseCache = Symbol("responseCache");
var getResponseCache = Symbol("getResponseCache");
var cacheKey = Symbol("cache");
var GlobalResponse = global.Response;
var Response$1 = class Response$12 {
  #body;
  #init;
  [getResponseCache]() {
    const cache = this[cacheKey];
    const liveHeaders = cache && cache[2] instanceof Headers ? cache[2] : void 0;
    delete this[cacheKey];
    return this[responseCache] ||= new GlobalResponse(this.#body, liveHeaders ? {
      status: this.#init?.status,
      statusText: this.#init?.statusText,
      headers: liveHeaders
    } : this.#init);
  }
  constructor(body, init) {
    let headers;
    this.#body = body;
    if (init instanceof GlobalResponse) {
      const cachedGlobalResponse = init[responseCache];
      if (cachedGlobalResponse) {
        this.#init = cachedGlobalResponse;
        this[getResponseCache]();
        return;
      }
      this.#init = init instanceof Response$12 ? init.#init : init;
      headers = new Headers(init.headers);
    } else this.#init = init;
    if (body == null || typeof body === "string" || typeof body?.getReader !== "undefined" || body instanceof Blob || body instanceof Uint8Array) this[cacheKey] = [
      init?.status || 200,
      body ?? null,
      headers || init?.headers
    ];
  }
  get headers() {
    const cache = this[cacheKey];
    if (cache) {
      if (!(cache[2] instanceof Headers)) cache[2] = new Headers(cache[2] || (cache[1] === null ? void 0 : { "content-type": defaultContentType }));
      return cache[2];
    }
    return this[getResponseCache]().headers;
  }
  get status() {
    return this[cacheKey]?.[0] ?? this[getResponseCache]().status;
  }
  get ok() {
    const status = this.status;
    return status >= 200 && status < 300;
  }
};
[
  "body",
  "bodyUsed",
  "redirected",
  "statusText",
  "trailers",
  "type",
  "url"
].forEach((k) => {
  Object.defineProperty(Response$1.prototype, k, { get() {
    return this[getResponseCache]()[k];
  } });
});
[
  "arrayBuffer",
  "blob",
  "clone",
  "formData",
  "json",
  "text"
].forEach((k) => {
  Object.defineProperty(Response$1.prototype, k, { value: function() {
    return this[getResponseCache]()[k]();
  } });
});
Object.defineProperty(Response$1.prototype, Symbol.for("nodejs.util.inspect.custom"), { value: function(depth, options, inspectFn) {
  return `Response (lightweight) ${inspectFn({
    status: this.status,
    headers: this.headers,
    ok: this.ok,
    nativeResponse: this[responseCache]
  }, {
    ...options,
    depth: depth == null ? null : depth - 1
  })}`;
} });
Object.setPrototypeOf(Response$1, GlobalResponse);
Object.setPrototypeOf(Response$1.prototype, GlobalResponse.prototype);
var validRedirectUrl = /^https?:\/\/[!#-;=?-[\]_a-z~A-Z]+$/;
var parseRedirectUrl = (url) => {
  if (url instanceof URL) return url.href;
  if (validRedirectUrl.test(url)) return url;
  return new URL(url).href;
};
var validRedirectStatuses = /* @__PURE__ */ new Set([
  301,
  302,
  303,
  307,
  308
]);
Object.defineProperty(Response$1, "redirect", {
  value: function redirect(url, status = 302) {
    if (!validRedirectStatuses.has(status)) throw new RangeError("Invalid status code");
    return new Response$1(null, {
      status,
      headers: { location: parseRedirectUrl(url) }
    });
  },
  writable: true,
  configurable: true
});
Object.defineProperty(Response$1, "json", {
  value: function json(data, init) {
    const body = JSON.stringify(data);
    if (body === void 0) throw new TypeError("The data is not JSON serializable");
    const initHeaders = init?.headers;
    let headers;
    if (initHeaders) {
      headers = new Headers(initHeaders);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    } else headers = { "content-type": "application/json" };
    return new Response$1(body, {
      status: init?.status ?? 200,
      statusText: init?.statusText,
      headers
    });
  },
  writable: true,
  configurable: true
});
async function readWithoutBlocking(readPromise) {
  return Promise.race([readPromise, Promise.resolve().then(() => Promise.resolve(void 0))]);
}
function writeFromReadableStreamDefaultReader(reader, writable, currentReadPromise) {
  const cancel = (error) => {
    reader.cancel(error).catch(() => {
    });
  };
  writable.on("close", cancel);
  writable.on("error", cancel);
  (currentReadPromise ?? reader.read()).then(flow, handleStreamError);
  return reader.closed.finally(() => {
    writable.off("close", cancel);
    writable.off("error", cancel);
  });
  function handleStreamError(error) {
    if (error) writable.destroy(error);
  }
  function onDrain() {
    reader.read().then(flow, handleStreamError);
  }
  function flow({ done, value }) {
    try {
      if (done) writable.end();
      else if (!writable.write(value)) writable.once("drain", onDrain);
      else return reader.read().then(flow, handleStreamError);
    } catch (e) {
      handleStreamError(e);
    }
  }
}
function writeFromReadableStream(stream, writable) {
  if (stream.locked) throw new TypeError("ReadableStream is locked.");
  else if (writable.destroyed) return;
  return writeFromReadableStreamDefaultReader(stream.getReader(), writable);
}
var buildOutgoingHttpHeaders = (headers, defaultContentType2) => {
  const res = {};
  if (!(headers instanceof Headers)) headers = new Headers(headers ?? void 0);
  if (headers.has("set-cookie")) {
    const cookies = [];
    for (const [k, v] of headers) if (k === "set-cookie") cookies.push(v);
    else res[k] = v;
    if (cookies.length > 0) res["set-cookie"] = cookies;
  } else for (const [k, v] of headers) res[k] = v;
  if (defaultContentType2) res["content-type"] ??= defaultContentType2;
  return res;
};
var outgoingEnded = Symbol("outgoingEnded");
var incomingDraining = Symbol("incomingDraining");
var DRAIN_TIMEOUT_MS = 500;
var MAX_DRAIN_BYTES = 64 * 1024 * 1024;
var drainIncoming = (incoming) => {
  const incomingWithDrainState = incoming;
  if (incoming.destroyed || incomingWithDrainState[incomingDraining]) return;
  incomingWithDrainState[incomingDraining] = true;
  if (incoming instanceof import_node_http2.Http2ServerRequest) {
    try {
      incoming.stream?.close?.(import_node_http2.constants.NGHTTP2_NO_ERROR);
    } catch {
    }
    return;
  }
  let bytesRead = 0;
  const cleanup = () => {
    clearTimeout(timer);
    incoming.off("data", onData);
    incoming.off("end", cleanup);
    incoming.off("error", cleanup);
  };
  const forceClose = () => {
    cleanup();
    const socket = incoming.socket;
    if (socket && !socket.destroyed) {
      if (typeof socket.destroySoon === "function") socket.destroySoon();
      else if (typeof socket.destroy === "function") socket.destroy();
    }
  };
  const timer = setTimeout(forceClose, DRAIN_TIMEOUT_MS);
  timer.unref?.();
  const onData = (chunk) => {
    bytesRead += chunk.length;
    if (bytesRead > MAX_DRAIN_BYTES) forceClose();
  };
  incoming.on("data", onData);
  incoming.on("end", cleanup);
  incoming.on("error", cleanup);
  incoming.resume();
};
var makeCloseHandler = (req, incoming, outgoing, needsBodyCleanup) => () => {
  if (incoming.errored) {
    recordBodyBufferedBeforeDisconnect(incoming);
    req[abortRequest](incoming.errored.toString());
  } else if (!outgoing.writableFinished) {
    recordBodyBufferedBeforeDisconnect(incoming);
    req[abortRequest]("Client connection prematurely closed.");
  }
  if (needsBodyCleanup && !incoming.readableEnded) setTimeout(() => {
    if (!incoming.readableEnded) setTimeout(() => {
      drainIncoming(incoming);
    });
  });
};
var isImmediateCacheableResponse = (res) => {
  if (!(cacheKey in res)) return false;
  const body = res[cacheKey][1];
  return body === null || typeof body === "string" || body instanceof Uint8Array;
};
var handleRequestError = () => new Response(null, { status: 400 });
var handleFetchError = (e) => new Response(null, { status: e instanceof Error && (e.name === "TimeoutError" || e.constructor.name === "TimeoutError") ? 504 : 500 });
var handleResponseError = (e, outgoing) => {
  const err2 = e instanceof Error ? e : new Error("unknown error", { cause: e });
  if (err2.code === "ERR_STREAM_PREMATURE_CLOSE") console.info("The user aborted a request.");
  else {
    console.error(e);
    if (!outgoing.headersSent) {
      if (outgoing instanceof import_node_http.ServerResponse) outgoing._contentLength = null;
      outgoing.writeHead(500, { "Content-Type": "text/plain" });
    }
    outgoing.end(`Error: ${err2.message}`);
    outgoing.destroy(err2);
  }
};
var flushHeaders = (outgoing) => {
  if ("flushHeaders" in outgoing && outgoing.writable) outgoing.flushHeaders();
};
var trySetContentLength = (outgoing, status, length) => {
  const http1 = outgoing;
  if (http1._contentLength === null && http1._hasBody && http1.useChunkedEncodingByDefault && !http1._removedContLen && status >= 200 && status !== 204 && status !== 304 && !outgoing.hasHeader("content-length") && !outgoing.hasHeader("transfer-encoding") && !outgoing.hasHeader("trailer")) {
    http1._contentLength = length;
    return true;
  }
  return false;
};
var writeDefaultHeaders = (outgoing, status, length) => {
  if (trySetContentLength(outgoing, status, length)) outgoing.writeHead(status, { "Content-Type": defaultContentType });
  else outgoing.writeHead(status, {
    "Content-Type": defaultContentType,
    "Content-Length": length
  });
};
var responseViaCache = async (res, outgoing) => {
  let [status, body, header] = res[cacheKey];
  if (!header) {
    if (body === null) {
      outgoing.writeHead(status);
      outgoing.end();
    } else if (typeof body === "string") {
      writeDefaultHeaders(outgoing, status, Buffer.byteLength(body));
      outgoing.end(body);
    } else if (body instanceof Uint8Array) {
      writeDefaultHeaders(outgoing, status, body.byteLength);
      outgoing.end(body);
    } else if (body instanceof Blob) {
      writeDefaultHeaders(outgoing, status, body.size);
      outgoing.end(new Uint8Array(await body.arrayBuffer()));
    } else {
      outgoing.writeHead(status, { "Content-Type": defaultContentType });
      flushHeaders(outgoing);
      await writeFromReadableStream(body, outgoing)?.catch((e) => handleResponseError(e, outgoing));
    }
    outgoing[outgoingEnded]?.();
    return;
  }
  let hasContentLength = false;
  let plainHeaders = false;
  let canAutoLength = true;
  if (header instanceof Headers) {
    hasContentLength = header.has("content-length");
    header = buildOutgoingHttpHeaders(header, body === null ? void 0 : defaultContentType);
  } else if (Array.isArray(header)) {
    const headerObj = new Headers(header);
    hasContentLength = headerObj.has("content-length");
    header = buildOutgoingHttpHeaders(headerObj, body === null ? void 0 : defaultContentType);
  } else {
    plainHeaders = true;
    for (const key in header) {
      if (key.length === 14 && key.toLowerCase() === "content-length") {
        hasContentLength = true;
        break;
      }
      if (key.length === 17 && key.toLowerCase() === "transfer-encoding" || key.length === 7 && key.toLowerCase() === "trailer") canAutoLength = false;
    }
  }
  if (!hasContentLength) {
    let length;
    if (typeof body === "string") length = Buffer.byteLength(body);
    else if (body instanceof Uint8Array) length = body.byteLength;
    else if (body instanceof Blob) length = body.size;
    if (length !== void 0 && (!plainHeaders || !canAutoLength || !trySetContentLength(outgoing, status, length))) {
      if (plainHeaders) header = { ...header };
      header["Content-Length"] = length;
    }
  }
  outgoing.writeHead(status, header);
  if (body == null) outgoing.end();
  else if (typeof body === "string" || body instanceof Uint8Array) outgoing.end(body);
  else if (body instanceof Blob) outgoing.end(new Uint8Array(await body.arrayBuffer()));
  else {
    flushHeaders(outgoing);
    await writeFromReadableStream(body, outgoing)?.catch((e) => handleResponseError(e, outgoing));
  }
  outgoing[outgoingEnded]?.();
};
var isPromise = (res) => typeof res.then === "function";
var responseViaResponseObject = async (res, outgoing, options = {}) => {
  if (isPromise(res)) if (options.errorHandler) try {
    res = await res;
  } catch (err2) {
    const errRes = await options.errorHandler(err2);
    if (!errRes) return;
    res = errRes;
  }
  else res = await res.catch(handleFetchError);
  if (cacheKey in res) return responseViaCache(res, outgoing);
  const resHeaderRecord = buildOutgoingHttpHeaders(res.headers, res.body === null ? void 0 : defaultContentType);
  if (res.body) {
    const reader = res.body.getReader();
    const values = [];
    let done = false;
    let currentReadPromise = void 0;
    if (resHeaderRecord["transfer-encoding"] !== "chunked") {
      let maxReadCount = 2;
      for (let i = 0; i < maxReadCount; i++) {
        currentReadPromise ||= reader.read();
        const chunk = await readWithoutBlocking(currentReadPromise).catch((e) => {
          console.error(e);
          done = true;
        });
        if (!chunk) {
          if (i === 1) {
            await new Promise((resolve4) => setTimeout(resolve4));
            maxReadCount = 3;
            continue;
          }
          break;
        }
        currentReadPromise = void 0;
        if (chunk.value) values.push(chunk.value);
        if (chunk.done) {
          done = true;
          break;
        }
      }
      if (done && !("content-length" in resHeaderRecord)) resHeaderRecord["content-length"] = values.reduce((acc, value) => acc + value.length, 0);
    }
    outgoing.writeHead(res.status, resHeaderRecord);
    values.forEach((value) => {
      outgoing.write(value);
    });
    if (done) outgoing.end();
    else {
      if (values.length === 0) flushHeaders(outgoing);
      await writeFromReadableStreamDefaultReader(reader, outgoing, currentReadPromise);
    }
  } else if (resHeaderRecord[X_ALREADY_SENT]) {
  } else {
    outgoing.writeHead(res.status, resHeaderRecord);
    outgoing.end();
  }
  outgoing[outgoingEnded]?.();
};
var getRequestListener = (fetchCallback, options = {}) => {
  const autoCleanupIncoming = options.autoCleanupIncoming ?? true;
  if (options.overrideGlobalObjects !== false && global.Request !== Request$1) {
    Object.defineProperty(global, "Request", { value: Request$1 });
    Object.defineProperty(global, "Response", { value: Response$1 });
  }
  return async (incoming, outgoing) => {
    let res, req;
    let needsBodyCleanup = false;
    let closeHandlerAttached = false;
    const ensureCloseHandler = () => {
      if (!req || closeHandlerAttached) return;
      closeHandlerAttached = true;
      outgoing.on("close", makeCloseHandler(req, incoming, outgoing, needsBodyCleanup));
    };
    try {
      req = newRequest(incoming, options.hostname);
      needsBodyCleanup = autoCleanupIncoming && !(incoming.method === "GET" || incoming.method === "HEAD");
      if (needsBodyCleanup) {
        incoming[wrapBodyStream] = true;
        if (incoming instanceof import_node_http2.Http2ServerRequest) outgoing[outgoingEnded] = () => {
          if (!incoming.readableEnded) setTimeout(() => {
            if (!incoming.readableEnded) setTimeout(() => {
              incoming.destroy();
              outgoing.destroy();
            });
          });
        };
      }
      res = fetchCallback(req, {
        incoming,
        outgoing
      });
      if (!isPromise(res) && isImmediateCacheableResponse(res)) {
        if (needsBodyCleanup && !incoming.readableEnded) outgoing.once("finish", () => {
          if (!incoming.readableEnded) drainIncoming(incoming);
        });
        return responseViaCache(res, outgoing);
      }
      ensureCloseHandler();
    } catch (e) {
      if (!res) if (options.errorHandler) {
        ensureCloseHandler();
        res = await options.errorHandler(req ? e : toRequestError(e));
        if (!res) return;
      } else if (!req) res = handleRequestError();
      else res = handleFetchError(e);
      else return handleResponseError(e, outgoing);
    }
    try {
      return await responseViaResponseObject(res, outgoing, options);
    } catch (e) {
      return handleResponseError(e, outgoing);
    }
  };
};
var CloseEvent = globalThis.CloseEvent ?? class extends Event {
  #eventInitDict;
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.#eventInitDict = eventInitDict;
  }
  get wasClean() {
    return this.#eventInitDict.wasClean ?? false;
  }
  get code() {
    return this.#eventInitDict.code ?? 0;
  }
  get reason() {
    return this.#eventInitDict.reason ?? "";
  }
};
var ErrorEvent = globalThis.ErrorEvent ?? class extends Event {
  #eventInitDict;
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.#eventInitDict = eventInitDict;
  }
  get message() {
    return this.#eventInitDict.message ?? "";
  }
  get filename() {
    return this.#eventInitDict.filename ?? "";
  }
  get lineno() {
    return this.#eventInitDict.lineno ?? 0;
  }
  get colno() {
    return this.#eventInitDict.colno ?? 0;
  }
  get error() {
    return this.#eventInitDict.error ?? null;
  }
};
var generateConnectionSymbol = () => Symbol("connection");
var CONNECTION_SYMBOL_KEY = Symbol("CONNECTION_SYMBOL_KEY");
var WAIT_FOR_WEBSOCKET_SYMBOL = Symbol("WAIT_FOR_WEBSOCKET_SYMBOL");
var upgradeWebSocket = defineWebSocketHelper(async (c, events, options) => {
  if (c.req.header("upgrade")?.toLowerCase() !== "websocket") return;
  const env = c.env;
  const waitForWebSocket = env[WAIT_FOR_WEBSOCKET_SYMBOL];
  if (!waitForWebSocket || !env.incoming) return new Response(null, { status: 500 });
  const connectionSymbol = generateConnectionSymbol();
  env[CONNECTION_SYMBOL_KEY] = connectionSymbol;
  (async () => {
    let ws;
    try {
      ws = await waitForWebSocket(env.incoming, connectionSymbol);
    } catch {
      return;
    }
    const messagesReceivedInStarting = [];
    const bufferMessage = (data, isBinary) => {
      messagesReceivedInStarting.push([data, isBinary]);
    };
    ws.on("message", bufferMessage);
    const ctx = {
      binaryType: "arraybuffer",
      close(code, reason) {
        ws.close(code, reason);
      },
      protocol: ws.protocol,
      raw: ws,
      get readyState() {
        return ws.readyState;
      },
      send(source, opts) {
        ws.send(source, { compress: opts?.compress });
      },
      url: new URL(c.req.url)
    };
    try {
      events?.onOpen?.(new Event("open"), ctx);
    } catch (e) {
      (options?.onError ?? console.error)(e);
    }
    const handleMessage = (data, isBinary) => {
      const datas = Array.isArray(data) ? data : [data];
      for (const data2 of datas) try {
        events?.onMessage?.(new MessageEvent("message", { data: isBinary ? data2 instanceof ArrayBuffer ? data2 : data2.buffer.slice(data2.byteOffset, data2.byteOffset + data2.byteLength) : typeof data2 === "string" ? data2 : Buffer.from(data2).toString("utf-8") }), ctx);
      } catch (e) {
        (options?.onError ?? console.error)(e);
      }
    };
    ws.off("message", bufferMessage);
    for (const message of messagesReceivedInStarting) handleMessage(...message);
    ws.on("message", (data, isBinary) => {
      handleMessage(data, isBinary);
    });
    ws.on("close", (code, reason) => {
      try {
        events?.onClose?.(new CloseEvent("close", {
          code,
          reason: reason.toString()
        }), ctx);
      } catch (e) {
        (options?.onError ?? console.error)(e);
      }
    });
    ws.on("error", (error) => {
      try {
        events?.onError?.(new ErrorEvent("error", { error }), ctx);
      } catch (e) {
        (options?.onError ?? console.error)(e);
      }
    });
  })();
  return new Response();
});

// server/embedded.ts
var import_node_crypto2 = require("node:crypto");
var import_promises3 = require("node:fs/promises");
var import_node_path6 = require("node:path");

// node_modules/fflate/esm/index.mjs
var import_module = require("module");
var require2 = (0, import_module.createRequire)("/");
var _a;
var Worker;
var isMarkedAsUntransferable;
try {
  _a = require2("worker_threads"), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ (function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
var fltn = function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (ArrayBuffer.isView(val))
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}

// server/app.ts
var import_node_path5 = require("node:path");

// node_modules/@hono/node-server/dist/utils/stream.mjs
var import_node_stream2 = require("node:stream");
var import_node_process = require("node:process");
var pr54206Applied = () => {
  const [major, minor] = import_node_process.versions.node.split(".").map((component) => parseInt(component));
  return major >= 23 || major === 22 && minor >= 7 || major === 20 && minor >= 18;
};
var useReadableToWeb = pr54206Applied();
var createStreamBody = (stream, useNativeReadableToWeb = useReadableToWeb) => {
  if (useNativeReadableToWeb) return import_node_stream2.Readable.toWeb(stream);
  let controller;
  let settled = false;
  const cleanup = () => {
    stream.off("data", onData);
    stream.off("error", onError);
    stream.off("end", onTerminate);
    stream.off("close", onTerminate);
  };
  const settle = (callback) => {
    if (settled) return;
    settled = true;
    cleanup();
    callback?.();
  };
  const onData = (chunk) => {
    if (settled || !controller) return;
    controller.enqueue(chunk);
    if ((controller.desiredSize ?? 0) <= 0) stream.pause();
  };
  const onError = (error) => {
    settle(() => {
      controller?.error(error);
    });
  };
  const onTerminate = () => {
    settle(() => {
      controller?.close();
    });
  };
  return new ReadableStream({
    start(streamController) {
      controller = streamController;
      stream.on("data", onData);
      stream.on("error", onError);
      stream.on("end", onTerminate);
      stream.on("close", onTerminate);
      stream.pause();
    },
    pull() {
      if (!settled) stream.resume();
    },
    cancel() {
      settle();
      const ignoreError = () => {
      };
      stream.on("error", ignoreError);
      stream.once("close", () => stream.off("error", ignoreError));
      stream.destroy();
    }
  });
};

// node_modules/hono/dist/utils/mime.js
var getMimeType = (filename, mimes = baseMimes) => {
  const match2 = filename.match(/\.([a-zA-Z0-9]+?)$/);
  if (!match2) return;
  return mimes[match2[1].toLowerCase()];
};
var baseMimes = {
  aac: "audio/aac",
  avi: "video/x-msvideo",
  avif: "image/avif",
  av1: "video/av1",
  bin: "application/octet-stream",
  bmp: "image/bmp",
  css: "text/css; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  eot: "application/vnd.ms-fontobject",
  epub: "application/epub+zip",
  gif: "image/gif",
  gz: "application/gzip",
  htm: "text/html; charset=utf-8",
  html: "text/html; charset=utf-8",
  ico: "image/x-icon",
  ics: "text/calendar; charset=utf-8",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript; charset=utf-8",
  json: "application/json",
  jsonld: "application/ld+json",
  map: "application/json",
  mid: "audio/x-midi",
  midi: "audio/x-midi",
  mjs: "text/javascript; charset=utf-8",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  oga: "audio/ogg",
  ogv: "video/ogg",
  ogx: "application/ogg",
  opus: "audio/opus",
  otf: "font/otf",
  pdf: "application/pdf",
  png: "image/png",
  rtf: "application/rtf",
  svg: "image/svg+xml; charset=utf-8",
  tif: "image/tiff",
  tiff: "image/tiff",
  ts: "video/mp2t",
  ttf: "font/ttf",
  txt: "text/plain; charset=utf-8",
  wasm: "application/wasm",
  webm: "video/webm",
  weba: "audio/webm",
  webmanifest: "application/manifest+json",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xhtml: "application/xhtml+xml; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  zip: "application/zip",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  gltf: "model/gltf+json",
  glb: "model/gltf-binary"
};

// node_modules/@hono/node-server/dist/serve-static.mjs
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
var COMPRESSIBLE_CONTENT_TYPE_REGEX = /^\s*(?:text\/[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i;
var ENCODINGS = {
  br: ".br",
  zstd: ".zst",
  gzip: ".gz"
};
var ENCODINGS_ORDERED_KEYS = Object.keys(ENCODINGS);
var getStats = (path) => {
  let stats;
  try {
    stats = (0, import_node_fs.statSync)(path);
  } catch {
  }
  return stats;
};
var BYTE_RANGE_PATTERN = /^(?:bytes=)?(?!-$)(\d*)-(\d*)$/;
var parseByteRange = (range) => {
  const match2 = range.match(BYTE_RANGE_PATTERN);
  if (!match2) return;
  const [, start, end] = match2;
  if (start === "") return {
    type: "suffix",
    length: Number(end)
  };
  if (end === "") return {
    type: "open-ended",
    start: Number(start)
  };
  return {
    type: "bounded",
    start: Number(start),
    end: Number(end)
  };
};
var resolveByteRange = (spec, size) => {
  if (size === 0) return;
  if (spec.type === "suffix") {
    if (spec.length === 0) return;
    return {
      start: Math.max(size - spec.length, 0),
      end: size - 1
    };
  }
  const end = spec.type === "bounded" ? Math.min(spec.end, size - 1) : size - 1;
  if (spec.start >= size || spec.start > end) return;
  return {
    start: spec.start,
    end
  };
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var serveStatic = (options = { root: "" }) => {
  const root = options.root || "";
  const optionPath = options.path;
  if (root !== "" && !(0, import_node_fs.existsSync)(root)) console.error(`serveStatic: root path '${root}' is not found, are you sure it's correct?`);
  return async (c, next) => {
    if (c.finalized) return next();
    let filename;
    if (optionPath) filename = optionPath;
    else try {
      if (!options.allowPercentInPath && c.req.path.includes("%")) throw new Error();
      filename = tryDecodeURI(c.req.path);
      if (/(?:^|[\/\\])\.{1,2}(?:$|[\/\\])|[\/\\]{2,}|\\/.test(filename)) throw new Error();
    } catch {
      await options.onNotFound?.(c.req.path, c);
      return next();
    }
    let path = (0, import_node_path.join)(root, !optionPath && options.rewriteRequestPath ? options.rewriteRequestPath(filename, c) : filename);
    let stats = getStats(path);
    if (stats && stats.isDirectory()) {
      const indexFile = options.index ?? "index.html";
      path = (0, import_node_path.join)(path, indexFile);
      stats = getStats(path);
    }
    if (!stats) {
      await options.onNotFound?.(path, c);
      return next();
    }
    const mimeType = getMimeType(path);
    c.header("Content-Type", mimeType || "application/octet-stream");
    if (options.precompressed && (!mimeType || mimeType === "application/octet-stream" || COMPRESSIBLE_CONTENT_TYPE_REGEX.test(mimeType))) {
      const acceptEncodingSet = new Set(c.req.header("Accept-Encoding")?.split(",").map((encoding) => encoding.trim()));
      for (const encoding of ENCODINGS_ORDERED_KEYS) {
        if (!acceptEncodingSet.has(encoding)) continue;
        const precompressedStats = getStats(path + ENCODINGS[encoding]);
        if (precompressedStats) {
          c.header("Content-Encoding", encoding);
          c.header("Vary", "Accept-Encoding", { append: true });
          stats = precompressedStats;
          path = path + ENCODINGS[encoding];
          break;
        }
      }
    }
    let result;
    const size = stats.size;
    const range = c.req.header("range") || "";
    c.header("Last-Modified", stats.mtime.toUTCString());
    if (c.req.method == "HEAD" || c.req.method == "OPTIONS") {
      c.header("Content-Length", size.toString());
      c.status(200);
      result = c.body(null);
    } else if (!range) {
      c.header("Content-Length", size.toString());
      result = c.body(createStreamBody((0, import_node_fs.createReadStream)(path)), 200);
    } else {
      c.header("Accept-Ranges", "bytes");
      const resolvedRange = resolveByteRange(parseByteRange(range) ?? {
        type: "open-ended",
        start: 0
      }, size);
      if (!resolvedRange) {
        c.header("Content-Range", `bytes */${size}`);
        result = c.body(null, 416);
      } else {
        const { start, end } = resolvedRange;
        const chunkSize = end - start + 1;
        const stream = (0, import_node_fs.createReadStream)(path, {
          start,
          end
        });
        c.header("Content-Length", chunkSize.toString());
        c.header("Content-Range", `bytes ${start}-${end}/${size}`);
        result = c.body(createStreamBody(stream), 206);
      }
    }
    await options.onFound?.(path, c);
    return result;
  };
};

// node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  res;
  status;
  /**
  * Creates an instance of `HTTPException`.
  * @param status - HTTP status code for the exception. Defaults to 500.
  * @param options - Additional options for the exception.
  */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
  * Returns the response object associated with the exception.
  * If a response object is not provided, a new response is created with the error message and status code.
  * @returns The response object.
  */
  getResponse() {
    if (this.res) return new Response(this.res.body, {
      status: this.status,
      headers: this.res.headers
    });
    return new Response(this.message, { status: this.status });
  }
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType2) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType2.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
};

// node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
    all,
    dot
  });
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData) return convertFormDataToBodyData(formData, options);
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]"))) form[key] = value;
    else handleParsingAllValues(form, key, value);
  });
  if (options.dot) Object.entries(form).forEach(([key, value]) => {
    if (key.includes(".")) {
      handleParsingNestedValues(form, key, value, nestingState);
      delete form[key];
    }
  });
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) form[key].push(value);
    else form[key] = [form[key], value];
  } else if (!key.endsWith("[]")) form[key] = value;
  else form[key] = [value];
};
var handleParsingNestedValues = (form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33) throwNestingLimitExceeded();
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") paths.shift();
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path
  };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) if (paths[j].includes(mark)) {
      paths[j] = paths[j].replace(mark, groups[i][1]);
      break;
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey2 = `${label}#${next}`;
    if (!patternCache[cacheKey2]) {
      if (match2[2]) patternCache[cacheKey2] = next && next[0] !== ":" && next[0] !== "*" ? [
        cacheKey2,
        match2[1],
        new RegExp(`^${match2[2]}(?=/${next})`)
      ] : [
        label,
        match2[1],
        new RegExp(`^${match2[2]}$`)
      ];
      else patternCache[cacheKey2] = [
        label,
        match2[1],
        true
      ];
    }
    return patternCache[cacheKey2];
  }
  return null;
};
var tryDecode2 = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI2 = (str) => tryDecode2(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI2(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) break;
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") results.push("/");
        else results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode2(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) return;
    if (!url.startsWith(key, keyIndex2 + 1)) keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) return "";
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded) name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "") continue;
    let value;
    if (valueIndex === -1) value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) results[name] = [];
      results[name].push(value);
    } else results[name] ??= value;
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) return cachedBody;
    for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body) => {
      if (anyCachedKey === "json") body = JSON.stringify(body);
      const contentType2 = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
      return new Response(body, { headers: contentType2 ? { "Content-Type": contentType2 } : void 0 })[key]();
    });
    return bodyCache[key] = raw2[key]();
  };
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) str = str.toString();
    if (str instanceof Promise) str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) return Promise.resolve(str);
  if (buffer) buffer[0] += str;
  else buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) return raw(await resStr, callbacks);
  else return resStr;
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType2, headers) => {
  return {
    "Content-Type": contentType2,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
        } else _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = (layout) => this.#layout = layout;
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = () => this.#layout;
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = (name, value, options) => {
    if (this.finalized) this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) headers.delete(name);
    else if (options?.append) headers.append(name, value);
    else headers.set(name, value);
  };
  status = (status) => {
    this.#status = status;
  };
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var) return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
      else responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) if (++count > 1 || typeof headers[k] !== "string") {
          responseHeaders = new Headers();
          break;
        }
      }
      if (responseHeaders) for (const k in headers) {
        const v = headers[k];
        if (typeof v === "string") responseHeaders.set(k, v);
        else {
          responseHeaders.delete(k);
          for (const v2 of v) responseHeaders.append(k, v2);
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else handler = i === middleware.length && next || void 0;
      if (handler) try {
        res = await handler(context, () => dispatch(i + 1));
      } catch (err2) {
        if (err2 instanceof Error && onError) {
          context.error = err2;
          res = await onError(err2, context);
          isError = true;
        } else throw err2;
      }
      else if (context.finalized === false && onNotFound) res = await onNotFound(context);
      if (res && (context.finalized === false || isError)) context.res = res;
      return context;
    }
  };
};

// node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err2, c) => {
  if ("getResponse" in err2) {
    const res = err2.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err2);
  return c.text("Internal Server Error", 500);
};
var Hono = class Hono2 {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") this.#path = args1;
        else this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) this.#addRoute(methodName, this.#path, handler);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute("ALL", this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone2 = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone2.errorHandler = this.errorHandler;
    clone2.#notFoundHandler = this.#notFoundHandler;
    clone2.routes = this.routes;
    return clone2;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app) {
    const subApp = this.basePath(path);
    app.routes.map((r) => {
      let handler;
      if (app.errorHandler === errorHandler) handler = r.handler;
      else {
        handler = async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) replaceRequest = (request) => request;
        else replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) return res;
      await next();
    };
    this.#addRoute("ALL", mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err2, c) {
    if (err2 instanceof Error) return this.errorHandler(err2, c);
    throw err2;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err2) {
        return this.#handleError(err2, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err2) => this.#handleError(err2, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err2) {
        return this.#handleError(err2, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch) return staticMatch;
    const match3 = path2.match(matcher[0]);
    if (!match3) return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1) return 1;
  if (a === ".*" || a === "(?:|/.*)") return b === "(?:|/.*)" ? -1 : 1;
  else if (b === ".*" || b === "(?:|/.*)") return -1;
  if (a === "[^/]+") return 1;
  else if (b === "[^/]+") return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class Node2 {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ".*"
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (regexpStr === ".*") throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ".*" && regexpStr !== "(?:|/.*)") {
            for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) if (k.length > 1 && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) throw PATH_ERROR;
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
    if (strList.length === 0) return "";
    if (strList.length === 1) return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
        tokens[j] = tokens[j].replace(mark, groups[i][1]);
        break;
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") return [
      /^$/,
      [],
      []
    ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(`^${path.replace(/\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g, (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ".*" : `/:${LABEL_REG_EXP_STR}`)}$`);
}
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) if (buildWildcardRegExp(k).test(path)) return [...middleware[k]];
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { ["ALL"]: createNullObject() };
    this.#routes = { ["ALL"]: createNullObject() };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap["ALL"]) {
          handlerMap[method][p] = [...handlerMap["ALL"][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") path = "*";
    const methods = method === "ALL" ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) if (!middleware[m][path]) {
        this.#insertPath(m, path);
        middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware["ALL"], path) || [];
      }
      for (const handlerMap of [middleware, routes]) for (const m of methods) for (const p in handlerMap[m]) re.test(p) && handlerMap[m][p].push([handler, path]);
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) for (const m of methods) {
      if (!routes[m][path2]) {
        this.#insertPath(m, path2);
        routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware["ALL"], path2) || [];
      }
      routes[m][path2].push([handler, path2]);
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) matchers[method] = this.#buildMatcher(method);
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) for (const path in r) {
      const handlers = r[path];
      const pathData = trie.paths[path];
      if (!pathData) {
        staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
        continue;
      }
      handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [h, trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
        map[key] = paramReplacementMap[pathData[1][i][1]];
        return map;
      }, createNullObject())]);
    }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler
    ]);
  }
  match(method, path) {
    if (!this.#routes) throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) router.add(...routes[i2]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) this.#node.insert(method, result, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// node_modules/hono/dist/middleware/body-limit/index.js
var ERROR_MESSAGE = "Payload Too Large";
var bodyLimit = (options) => {
  const onError = options.onError || (() => {
    const res = new Response(ERROR_MESSAGE, { status: 413 });
    throw new HTTPException(413, { res });
  });
  const maxSize = options.maxSize;
  return async function bodyLimit2(c, next) {
    if (!c.req.raw.body) return next();
    const hasTransferEncoding = c.req.raw.headers.has("transfer-encoding");
    if (c.req.raw.headers.has("content-length") && !hasTransferEncoding) return parseInt(c.req.raw.headers.get("content-length") || "0", 10) > maxSize ? onError(c) : next();
    let size = 0;
    const chunks = [];
    const rawReader = c.req.raw.body.getReader();
    for (; ; ) {
      const { done, value } = await rawReader.read();
      if (done) break;
      size += value.length;
      if (size > maxSize) return onError(c);
      chunks.push(value);
    }
    const requestInit = {
      body: new ReadableStream({ start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      } }),
      duplex: "half"
    };
    c.req.raw = new Request(c.req.raw, requestInit);
    return next();
  };
};

// server/providers/provider.ts
var ProviderError = class extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
};

// server/providers/147.ts
var ALLOWED_147_HOST = /(^|\.)147ai\.(com|cn)$/i;
function normalizeApiKey(value) {
  let key = value.trim();
  if (key.length >= 2 && (key.startsWith('"') && key.endsWith('"') || key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  key = key.replace(/^Bearer\s+/i, "").trim();
  if (/^sk-sk-/i.test(key)) throw new Error("API Key \u91CD\u590D\u586B\u5199\u4E86 sk- \u524D\u7F00");
  if (!key || /\s/.test(key)) throw new Error("API Key \u4E3A\u7A7A\u6216\u5305\u542B\u7A7A\u683C");
  return key;
}
function normalizeBaseUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Base URL \u683C\u5F0F\u4E0D\u6B63\u786E");
  }
  if (url.protocol !== "https:") throw new Error("Base URL \u5FC5\u987B\u4F7F\u7528 HTTPS");
  if (url.username || url.password) throw new Error("Base URL \u4E0D\u80FD\u5305\u542B\u8D26\u53F7\u6216\u5BC6\u7801");
  if (!ALLOWED_147_HOST.test(url.hostname)) throw new Error("Base URL \u5FC5\u987B\u662F 147ai.com \u6216 147ai.cn \u57DF\u540D");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}
function safeRequestId(value) {
  const candidate = value?.trim();
  return candidate && /^[A-Za-z0-9._:-]{4,80}$/.test(candidate) ? candidate : void 0;
}
function includeRequestId(message, requestId) {
  return requestId ? `${message} \u8BF7\u6C42 ID\uFF1A${requestId}` : message;
}
function describeUpstreamError(status, rawMessage, rawRequestId) {
  const message = rawMessage.toLowerCase();
  const requestId = safeRequestId(rawRequestId ?? null);
  if (status === 401 || /invalid.?token|unauthor/.test(message)) {
    return includeRequestId("\u5F53\u524D API Key \u672A\u88AB 147 \u63A5\u53D7\uFF0C\u8BF7\u91CD\u65B0\u521B\u5EFA Key \u5E76\u68C0\u67E5\u6A21\u578B\u5206\u7EC4\u3002", requestId);
  }
  if (/moderation|content.?policy|content_policy|safety/.test(message)) {
    return includeRequestId(
      "\u8BF7\u6C42\u88AB\u4E0A\u6E38\u5185\u5BB9\u5BA1\u6838\u62D2\u7EDD\uFF1B\u4E0A\u6E38\u672A\u8BF4\u660E\u5177\u4F53\u62E6\u622A\u5C42\uFF08\u6587\u5B57\u63D0\u793A\u3001\u53C2\u8003\u56FE\u6216\u8F93\u51FA\u56FE\uFF09\u3002\u8BF7\u8C03\u6574\u8865\u5145\u8981\u6C42\u6216\u66F4\u6362\u53C2\u8003\u56FE\u540E\u624B\u52A8\u91CD\u8BD5\u3002",
      requestId
    );
  }
  if (status === 404 || /model.*(not found|invalid)/.test(message)) {
    return includeRequestId("\u63A5\u53E3\u5730\u5740\u6216\u6A21\u578B\u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5 Base URL\u3001\u6A21\u578B\u540D\u548C 147 \u4EE4\u724C\u5206\u7EC4\u3002", requestId);
  }
  if (/size|dimension|resolution/.test(message)) {
    return includeRequestId("\u5F53\u524D\u6A21\u578B\u4E0D\u652F\u6301\u6240\u9009\u56FE\u7247\u5C3A\u5BF8\uFF0C\u8BF7\u6539\u7528\u5176\u4ED6\u753B\u5E45\u3002", requestId);
  }
  if (status === 429 || /quota|billing|insufficient|余额/.test(message)) {
    return includeRequestId("147 \u8D26\u6237\u989D\u5EA6\u4E0D\u8DB3\u6216\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u68C0\u67E5\u4F59\u989D\u540E\u7A0D\u540E\u91CD\u8BD5\u3002", requestId);
  }
  if (status >= 500) return includeRequestId("147 \u56FE\u7247\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002", requestId);
  return includeRequestId(`\u56FE\u7247\u751F\u6210\u5931\u8D25\uFF08HTTP ${status}\uFF09\uFF0C\u8BF7\u68C0\u67E5\u53C2\u6570\u540E\u91CD\u8BD5\u3002`, requestId);
}
async function responsePayload(response) {
  const raw2 = await response.text();
  try {
    return { data: raw2 ? JSON.parse(raw2) : null, raw: raw2 };
  } catch {
    return { data: null, raw: raw2 };
  }
}
function upstreamMessage(data, raw2) {
  const error = data?.error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return raw2;
}
function upstreamSignal(data, raw2) {
  const values = [upstreamMessage(data, raw2)];
  const error = data?.error;
  if (error && typeof error === "object") {
    const errorRecord = error;
    for (const key of ["code", "type", "reason"]) {
      if (typeof errorRecord[key] === "string") values.push(errorRecord[key]);
    }
  }
  for (const key of ["code", "type"]) {
    if (typeof data?.[key] === "string") values.push(data[key]);
  }
  return values.join(" ");
}
async function checkedPayload(response) {
  const { data, raw: raw2 } = await responsePayload(response);
  if (!response.ok) {
    const publicStatus = response.status >= 500 ? 502 : response.status;
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("request-id") ?? void 0;
    throw new ProviderError(
      publicStatus,
      describeUpstreamError(response.status, upstreamSignal(data, raw2), requestId)
    );
  }
  return data;
}
function create147Provider(fetchImpl = fetch) {
  return {
    async validateKey(input) {
      const apiKey = normalizeApiKey(input.apiKey);
      const baseUrl = normalizeBaseUrl(input.baseUrl);
      const response = await fetchImpl(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(3e4)
      });
      const data = await checkedPayload(response);
      const models = Array.isArray(data?.data) ? data.data : [];
      return {
        valid: true,
        modelAvailable: models.some(
          (candidate) => candidate && typeof candidate === "object" && "id" in candidate && candidate.id === input.model
        )
      };
    },
    async editImage(input) {
      const apiKey = normalizeApiKey(input.apiKey);
      const baseUrl = normalizeBaseUrl(input.baseUrl);
      const form = new FormData();
      input.images.forEach((image, index) => {
        const extension = image.type === "image/jpeg" ? "jpg" : image.type === "image/webp" ? "webp" : "png";
        form.append("image", image, `reference-${index + 1}.${extension}`);
      });
      form.append("model", input.model.trim());
      form.append("prompt", input.prompt);
      form.append("input_fidelity", "high");
      form.append("size", input.size);
      form.append("quality", input.quality);
      form.append("output_format", "png");
      form.append("n", "1");
      const startedAt = Date.now();
      let response;
      try {
        response = await fetchImpl(`${baseUrl}/images/edits`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
          body: form,
          signal: AbortSignal.timeout(18e4)
        });
      } catch (error) {
        if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
          throw new ProviderError(504, "\u56FE\u7247\u751F\u6210\u8D85\u8FC7 3 \u5206\u949F\uFF0C\u8BF7\u7A0D\u540E\u624B\u52A8\u91CD\u8BD5\u3002");
        }
        throw new ProviderError(502, "\u65E0\u6CD5\u8FDE\u63A5 147 \u56FE\u7247\u670D\u52A1\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5\u3002");
      }
      const data = await checkedPayload(response);
      const items = Array.isArray(data?.data) ? data.data : [];
      const first = items[0];
      const imageB64 = first && typeof first === "object" && "b64_json" in first ? first.b64_json : void 0;
      if (typeof imageB64 !== "string" || !imageB64) {
        throw new ProviderError(502, "147 \u8FD4\u56DE\u6210\u529F\uFF0C\u4F46\u54CD\u5E94\u4E2D\u6CA1\u6709\u56FE\u7247\u6570\u636E\u3002");
      }
      return {
        imageB64,
        provider: "147",
        model: input.model.trim(),
        size: input.size,
        latencyMs: Date.now() - startedAt
      };
    }
  };
}

// shared/gugu.ts
var MODEL_CHANNELS = {
  "gpt-image-2.5-flare": "default",
  "gpt-image-2.5-sunburst": "default",
  "doubao-seedream-5-0-flash-260915": "volc",
  "doubao-seedream-5-0-pro-260628": "volc"
};
function validStoredSize(value) {
  const match2 = /^(\d+)x(\d+)$/.exec(String(value));
  return !!match2 && match2.slice(1).every((x) => Number(x) >= 256 && Number(x) <= 8192);
}
function validProvider(value) {
  return ["147", "default", "volc"].includes(String(value));
}

// shared/templates.ts
var CANONICAL_ROLES = [
  "face-front",
  "face-three-quarter",
  "body-front",
  "body-side",
  "body-back",
  "half-neutral"
];
var STRESS_TEST_ROLES = [
  "stress-lighting",
  "stress-angle",
  "stress-action"
];
var DERIVED_ASSET_ROLES = [
  "model-card-natural",
  "model-card-half",
  "model-card-full",
  "model-card-side-action",
  "expression",
  "wardrobe-state",
  "action-reference",
  "custom"
];
var ASSET_ROLES = [
  ...CANONICAL_ROLES,
  ...STRESS_TEST_ROLES,
  ...DERIVED_ASSET_ROLES
];
var CANONICAL_ROLE_LABELS = {
  "face-front": "\u8EAB\u4EFD\u57FA\u51C6\u7167",
  "face-three-quarter": "\u5FAE\u4FA7\u534A\u8EAB",
  "body-front": "\u6B63\u9762\u5168\u8EAB",
  "body-side": "\u4FA7\u9762\u5168\u8EAB",
  "body-back": "\u80CC\u9762\u5168\u8EAB",
  "half-neutral": "\u4E2D\u6027\u534A\u8EAB"
};
function isAssetRole(value) {
  return typeof value === "string" && ASSET_ROLES.includes(value);
}
function isCanonicalRole(value) {
  return typeof value === "string" && CANONICAL_ROLES.includes(value);
}
function isStressTestRole(value) {
  return typeof value === "string" && STRESS_TEST_ROLES.includes(value);
}

// server/routes/assets.ts
var ROOT_FIELDS = /* @__PURE__ */ new Set([
  "imageB64",
  "versionId",
  "assetRole",
  "stateId",
  "parentAssetId",
  "changeSet",
  "recipe"
]);
var RECIPE_FIELDS = /* @__PURE__ */ new Set([
  "compilerVersion",
  "templateId",
  "provider",
  "model",
  "size",
  "quality",
  "referenceAssetIds",
  "parentAssetId",
  "changeSet",
  "latencyMs",
  "completedAt"
]);
var CHANGE_CATEGORIES = /* @__PURE__ */ new Set([
  "identity",
  "expression",
  "wardrobe",
  "action",
  "condition",
  "background",
  "lighting",
  "camera"
]);
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function unknown(value, allowed) {
  return Object.keys(value).some((key) => !allowed.has(key));
}
function parseChangeSet(value) {
  if (!isRecord(value)) return void 0;
  if (typeof value.category !== "string" || !CHANGE_CATEGORIES.has(value.category) || typeof value.instruction !== "string" || typeof value.sourceStateId !== "string" || typeof value.targetStateId !== "string") return void 0;
  return value;
}
function registerAssetRoutes(app, registry) {
  app.post("/api/projects/:projectId/assets", async (context) => {
    let body;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "\u8D44\u4EA7\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
    }
    if (!isRecord(body) || unknown(body, ROOT_FIELDS)) {
      return context.json({ error: "\u8D44\u4EA7\u8BF7\u6C42\u5305\u542B\u672A\u5141\u8BB8\u5B57\u6BB5" }, 400);
    }
    const changeSet = parseChangeSet(body.changeSet);
    if (typeof body.imageB64 !== "string" || typeof body.versionId !== "string" || !isAssetRole(body.assetRole) || !changeSet || !isRecord(body.recipe) || unknown(body.recipe, RECIPE_FIELDS)) {
      return context.json({ error: "\u8D44\u4EA7\u8BF7\u6C42\u7F3A\u5C11\u6709\u6548\u5B57\u6BB5" }, 400);
    }
    const recipeBase = body.recipe;
    if (typeof recipeBase.compilerVersion !== "string" || typeof recipeBase.templateId !== "string" || !validProvider(recipeBase.provider) || typeof recipeBase.model !== "string" || !validStoredSize(recipeBase.size) || !["low", "medium", "high"].includes(String(recipeBase.quality)) || !Array.isArray(recipeBase.referenceAssetIds) || !recipeBase.referenceAssetIds.every((id) => typeof id === "string")) {
      return context.json({ error: "\u751F\u6210\u914D\u65B9\u65E0\u6548" }, 400);
    }
    const parentAssetId = typeof body.parentAssetId === "string" ? body.parentAssetId : void 0;
    const recipe = {
      ...recipeBase,
      ...parentAssetId ? { parentAssetId } : {},
      changeSet
    };
    try {
      const asset = await registry.saveApprovedAsset({
        projectId: context.req.param("projectId"),
        versionId: body.versionId,
        assetRole: body.assetRole,
        stateId: typeof body.stateId === "string" ? body.stateId : changeSet.targetStateId,
        imageB64: body.imageB64,
        ...parentAssetId ? { parentAssetId } : {},
        recipe
      });
      return context.json(asset, 201);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "\u8D44\u4EA7\u4FDD\u5B58\u5931\u8D25" }, 400);
    }
  });
  app.get("/api/projects/:projectId/assets/:assetId", async (context) => {
    try {
      const file = await registry.readApprovedAsset(
        context.req.param("projectId"),
        context.req.param("assetId")
      );
      const body = Uint8Array.from(file.bytes).buffer;
      return context.body(body, 200, {
        "Content-Type": file.contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Asset-Role": file.asset.role
      });
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "\u8D44\u4EA7\u8BFB\u53D6\u5931\u8D25" }, 404);
    }
  });
}

// server/routes/exports.ts
var import_node_path3 = require("node:path");

// server/export/model-pack.ts
var import_promises = require("node:fs/promises");
var import_node_path2 = require("node:path");

// shared/project-schema.ts
var ROOT_KEYS = /* @__PURE__ */ new Set([
  "schemaVersion",
  "id",
  "mode",
  "title",
  "displayName",
  "characterTag",
  "createdAt",
  "updatedAt",
  "optionalProfile",
  "currentVersionId",
  "versions",
  "assets",
  "boards"
]);
var VERSION_KEYS = /* @__PURE__ */ new Set([
  "id",
  "status",
  "immutableDescriptor",
  "canonicalAssetIds",
  "stressTests",
  "derivedStateIds",
  "createdFromVersionId",
  "lockedAt"
]);
var ASSET_KEYS = /* @__PURE__ */ new Set([
  "id",
  "versionId",
  "role",
  "stateId",
  "status",
  "parentAssetId",
  "changeSet",
  "fileName",
  "recipe"
]);
var RECIPE_KEYS = /* @__PURE__ */ new Set([
  "compilerVersion",
  "templateId",
  "provider",
  "model",
  "size",
  "quality",
  "referenceAssetIds",
  "parentAssetId",
  "changeSet",
  "latencyMs",
  "completedAt"
]);
var CHANGE_KEYS = /* @__PURE__ */ new Set(["category", "instruction", "sourceStateId", "targetStateId"]);
var VERSION_STATUSES = /* @__PURE__ */ new Set(["draft", "testing", "locked", "superseded"]);
var ASSET_STATUSES = /* @__PURE__ */ new Set(["queued", "generating", "ready", "rejected", "failed"]);
var CHANGE_CATEGORIES2 = /* @__PURE__ */ new Set([
  "identity",
  "expression",
  "wardrobe",
  "action",
  "condition",
  "background",
  "lighting",
  "camera"
]);
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function randomHex(length) {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, length);
}
function stableHex(value) {
  let hash = 2166136261;
  for (const character of value.normalize("NFKC")) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function createCharacterTag(displayName) {
  const asciiSlug = displayName.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return asciiSlug ? `@${asciiSlug}` : `@character-${stableHex(displayName)}`;
}
function clone(value) {
  return structuredClone(value);
}
function createDraftProject(input) {
  const title = input.title.trim();
  const displayName = input.displayName.trim();
  if (!title || !displayName) throw new Error("\u9879\u76EE\u540D\u548C\u89D2\u8272\u663E\u793A\u540D\u4E0D\u80FD\u4E3A\u7A7A");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    schemaVersion: 1,
    id: `project-${randomHex(12)}`,
    mode: input.mode,
    title,
    displayName,
    characterTag: createCharacterTag(displayName),
    createdAt: now,
    updatedAt: now,
    optionalProfile: { ...input.optionalProfile ?? {} },
    currentVersionId: "v1",
    versions: [
      {
        id: "v1",
        status: "draft",
        immutableDescriptor: { visibleNotes: [] },
        canonicalAssetIds: [],
        stressTests: [],
        derivedStateIds: []
      }
    ],
    assets: [],
    boards: []
  };
}
function createNextVersion(project) {
  const current = project.versions.find((version) => version.id === project.currentVersionId);
  if (!current) throw new Error("\u5F53\u524D\u89D2\u8272\u7248\u672C\u4E0D\u5B58\u5728");
  if (current.status !== "locked") throw new Error("\u53EA\u6709\u5DF2\u9501\u5B9A\u7248\u672C\u53EF\u4EE5\u521B\u5EFA\u8EAB\u4EFD\u65B0\u7248\u672C");
  const next = clone(project);
  const number = Math.max(
    0,
    ...next.versions.map((version) => Number(version.id.replace(/^v/, "")) || 0)
  ) + 1;
  const id = `v${number}`;
  next.versions.push({
    id,
    status: "draft",
    immutableDescriptor: clone(current.immutableDescriptor),
    canonicalAssetIds: [],
    stressTests: [],
    derivedStateIds: [],
    createdFromVersionId: current.id
  });
  next.currentVersionId = id;
  next.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  return next;
}
function canLockVersion(version, assets) {
  const canonicalAssets = version.canonicalAssetIds.map((id) => assets.find((asset) => asset.id === id)).filter((asset) => Boolean(asset));
  const roles = new Set(
    canonicalAssets.filter((asset) => asset.versionId === version.id && asset.status === "ready").map((asset) => asset.role)
  );
  const hasCanonicalSet = CANONICAL_ROLES.every((role) => roles.has(role));
  const passedStressTests = STRESS_TEST_ROLES.every((role) => {
    const result = version.stressTests.find((item) => item.role === role && item.passed === true);
    if (!result) return false;
    const stressAsset = assets.find((asset) => asset.id === result.assetId);
    return Boolean(
      stressAsset && stressAsset.versionId === version.id && stressAsset.role === role && stressAsset.status === "ready"
    );
  });
  return hasCanonicalSet && passedStressTests;
}
function pushUnknownKeys(errors, value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${path}: unknown key ${key}`);
  }
}
function validateCharacterProject(value) {
  const errors = [];
  if (!isRecord2(value)) return ["project must be an object"];
  pushUnknownKeys(errors, value, ROOT_KEYS, "project");
  if (value.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (typeof value.id !== "string" || !/^project-[a-f0-9]{12}$/.test(value.id)) {
    errors.push("id must be a safe project id");
  }
  if (value.mode !== "human-model-card" && value.mode !== "realistic-virtual-character") {
    errors.push("mode is invalid");
  }
  if (typeof value.title !== "string" || !value.title.trim()) errors.push("title is required");
  if (typeof value.displayName !== "string" || !value.displayName.trim()) {
    errors.push("displayName is required");
  }
  if (typeof value.characterTag !== "string" || !/^@[a-z0-9-]+$/.test(value.characterTag)) {
    errors.push("characterTag is invalid");
  }
  if (!Array.isArray(value.versions)) {
    errors.push("versions must be an array");
    return errors;
  }
  const versionIds = /* @__PURE__ */ new Set();
  for (const [index, rawVersion] of value.versions.entries()) {
    const path = `versions[${index}]`;
    if (!isRecord2(rawVersion)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, rawVersion, VERSION_KEYS, path);
    if (typeof rawVersion.id !== "string" || !/^v[1-9]\d*$/.test(rawVersion.id)) {
      errors.push(`${path}.id is invalid`);
    } else if (versionIds.has(rawVersion.id)) {
      errors.push(`${path}.id is duplicated`);
    } else {
      versionIds.add(rawVersion.id);
    }
    if (!VERSION_STATUSES.has(String(rawVersion.status))) errors.push(`${path}.status is invalid`);
    if (rawVersion.status === "locked" && typeof rawVersion.lockedAt !== "string") {
      errors.push(`${path}.lockedAt is required for locked versions`);
    }
    if (!isRecord2(rawVersion.immutableDescriptor) || !Array.isArray(rawVersion.immutableDescriptor.visibleNotes) || !rawVersion.immutableDescriptor.visibleNotes.every((note) => typeof note === "string")) {
      errors.push(`${path}.immutableDescriptor is invalid`);
    }
    if (!Array.isArray(rawVersion.canonicalAssetIds)) {
      errors.push(`${path}.canonicalAssetIds must be an array`);
    } else if (!rawVersion.canonicalAssetIds.every((id) => typeof id === "string")) {
      errors.push(`${path}.canonicalAssetIds must contain strings`);
    }
    if (!Array.isArray(rawVersion.derivedStateIds) || !rawVersion.derivedStateIds.every((id) => typeof id === "string")) {
      errors.push(`${path}.derivedStateIds must be an array of strings`);
    }
    if (!Array.isArray(rawVersion.stressTests)) {
      errors.push(`${path}.stressTests must be an array`);
    } else {
      for (const result of rawVersion.stressTests) {
        if (!isRecord2(result) || !isStressTestRole(result.role) || typeof result.assetId !== "string" || typeof result.passed !== "boolean") {
          errors.push(`${path}.stressTests contains an invalid role`);
        }
      }
    }
  }
  if (typeof value.currentVersionId !== "string" || !versionIds.has(value.currentVersionId)) {
    errors.push("currentVersionId does not resolve to a version");
  }
  for (const [index, rawVersion] of value.versions.entries()) {
    if (isRecord2(rawVersion) && rawVersion.createdFromVersionId !== void 0 && (typeof rawVersion.createdFromVersionId !== "string" || !versionIds.has(rawVersion.createdFromVersionId) || rawVersion.createdFromVersionId === rawVersion.id)) {
      errors.push(`versions[${index}].createdFromVersionId is invalid`);
    }
  }
  if (!Array.isArray(value.assets)) {
    errors.push("assets must be an array");
  } else {
    const assetIds = /* @__PURE__ */ new Set();
    for (const [index, rawAsset] of value.assets.entries()) {
      const path = `assets[${index}]`;
      if (!isRecord2(rawAsset)) {
        errors.push(`${path} must be an object`);
        continue;
      }
      pushUnknownKeys(errors, rawAsset, ASSET_KEYS, path);
      if (typeof rawAsset.id !== "string" || !/^asset-[a-f0-9]{12}$/.test(rawAsset.id)) {
        errors.push(`${path}.id is invalid`);
      } else if (assetIds.has(rawAsset.id)) {
        errors.push(`${path}.id is duplicated`);
      } else assetIds.add(rawAsset.id);
      if (!isAssetRole(rawAsset.role)) errors.push(`${path}.role is invalid`);
      if (typeof rawAsset.versionId !== "string" || !versionIds.has(rawAsset.versionId)) {
        errors.push(`${path}.versionId does not resolve to a version`);
      }
      const derived = !isCanonicalRole(rawAsset.role) || isRecord2(rawAsset.changeSet) && rawAsset.changeSet.category !== "identity" || rawAsset.stateId !== "base";
      if (derived && typeof rawAsset.parentAssetId !== "string") {
        errors.push(`${path}.parentAssetId is required for derived assets`);
      }
      if (typeof rawAsset.stateId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(rawAsset.stateId)) {
        errors.push(`${path}.stateId is invalid`);
      }
      if (!ASSET_STATUSES.has(String(rawAsset.status))) errors.push(`${path}.status is invalid`);
      if (!isRecord2(rawAsset.changeSet)) {
        errors.push(`${path}.changeSet is invalid`);
      } else {
        pushUnknownKeys(errors, rawAsset.changeSet, CHANGE_KEYS, `${path}.changeSet`);
        if (!CHANGE_CATEGORIES2.has(String(rawAsset.changeSet.category)) || typeof rawAsset.changeSet.instruction !== "string" || typeof rawAsset.changeSet.sourceStateId !== "string" || typeof rawAsset.changeSet.targetStateId !== "string") {
          errors.push(`${path}.changeSet is invalid`);
        }
      }
      if (!isRecord2(rawAsset.recipe)) {
        errors.push(`${path}.recipe is invalid`);
      } else {
        pushUnknownKeys(errors, rawAsset.recipe, RECIPE_KEYS, `${path}.recipe`);
        if (typeof rawAsset.recipe.compilerVersion !== "string" || typeof rawAsset.recipe.templateId !== "string" || !validProvider(rawAsset.recipe.provider) || typeof rawAsset.recipe.model !== "string" || !validStoredSize(rawAsset.recipe.size) || !["low", "medium", "high"].includes(String(rawAsset.recipe.quality)) || !Array.isArray(rawAsset.recipe.referenceAssetIds) || !rawAsset.recipe.referenceAssetIds.every((id) => typeof id === "string")) {
          errors.push(`${path}.recipe is invalid`);
        }
      }
    }
    for (const [index, rawAsset] of value.assets.entries()) {
      if (isRecord2(rawAsset) && typeof rawAsset.parentAssetId === "string" && !assetIds.has(rawAsset.parentAssetId)) {
        errors.push(`assets[${index}].parentAssetId does not resolve to an asset`);
      }
      if (isRecord2(rawAsset) && isRecord2(rawAsset.recipe)) {
        if (Array.isArray(rawAsset.recipe.referenceAssetIds) && rawAsset.recipe.referenceAssetIds.some((id) => typeof id !== "string" || !assetIds.has(id))) {
          errors.push(`assets[${index}].recipe.referenceAssetIds contains an unresolved asset`);
        }
        if (rawAsset.parentAssetId !== rawAsset.recipe.parentAssetId) {
          errors.push(`assets[${index}].recipe.parentAssetId does not match asset lineage`);
        }
      }
    }
  }
  if (!Array.isArray(value.boards)) errors.push("boards must be an array");
  if (!isRecord2(value.optionalProfile)) errors.push("optionalProfile must be an object");
  if (errors.length === 0 && Array.isArray(value.assets)) {
    const assets = value.assets;
    for (const version of value.versions) {
      if ((version.status === "locked" || version.status === "superseded") && !canLockVersion(version, assets)) {
        errors.push(`versions.${version.id} is locked without a complete verified asset set`);
      }
    }
  }
  return errors;
}

// server/export/model-pack.ts
function legacySquare(asset) {
  return /^(\d+)x\1$/.test(asset.recipe.size);
}
function exportFileName(role, asset) {
  if (role === "face-three-quarter") {
    return legacySquare(asset) ? "face-three-quarter-legacy.png" : "slight-side-half.png";
  }
  return `${role}.png`;
}
async function assembleModelPack(input, registry, rootDir) {
  if (input.includeBodyOnly) {
    throw new Error("\u5B9E\u9A8C\u6027\u8EAB\u4F53\u88C1\u5207\u9700\u5728\u753B\u677F\u4E2D\u624B\u52A8\u9009\u62E9\u88C1\u5207\u7EBF\u540E\u5355\u72EC\u5BFC\u51FA");
  }
  const project = await registry.readProject(input.projectId);
  const version = project.versions.find((item) => item.id === input.versionId);
  if (!version) throw new Error("\u89D2\u8272\u7248\u672C\u4E0D\u5B58\u5728");
  if (version.status !== "locked" || !canLockVersion(version, project.assets)) {
    throw new Error("\u6A21\u578B\u53C2\u8003\u5305\u53EA\u80FD\u4ECE\u901A\u8FC7\u771F\u5B9E\u538B\u529B\u6D4B\u8BD5\u7684\u9501\u5B9A\u7248\u672C\u5BFC\u51FA");
  }
  const files = await Promise.all(CANONICAL_ROLES.map(async (role) => {
    const asset = version.canonicalAssetIds.map((id) => project.assets.find((item) => item.id === id)).find((item) => item?.versionId === version.id && item.role === role && item.status === "ready");
    if (!asset) throw new Error(`\u6A21\u578B\u53C2\u8003\u5305\u7F3A\u5C11\u89C4\u8303\u8D44\u4EA7\uFF1A${role}`);
    const approved = await registry.readApprovedAsset(project.id, asset.id);
    if (approved.contentType !== "image/png") {
      throw new Error(`\u6A21\u578B\u53C2\u8003\u5305\u56FA\u5B9A PNG \u547D\u540D\u8981\u6C42 PNG \u6E90\u8D44\u4EA7\uFF1A${role}`);
    }
    return { role, asset, bytes: approved.bytes };
  }));
  const root = (0, import_node_path2.resolve)(rootDir);
  await (0, import_promises.mkdir)(root, { recursive: true });
  const safeTag = project.characterTag.replace(/^@/, "");
  const exportId = `${safeTag}-${version.id}-model-pack`;
  if (!/^[a-z0-9-]+-v[1-9]\d*-model-pack$/.test(exportId)) throw new Error("\u5BFC\u51FA\u6807\u8BC6\u65E0\u6548");
  const directory = (0, import_node_path2.join)(root, exportId);
  await (0, import_promises.mkdir)(directory, { recursive: false });
  const relativeFiles = [
    "character.json",
    "README.md",
    ...files.map(({ role, asset }) => exportFileName(role, asset))
  ];
  const manifest = {
    schemaVersion: 1,
    characterTag: project.characterTag,
    displayName: project.displayName,
    mode: project.mode,
    versionId: version.id,
    versionStatus: version.status,
    immutableDescriptor: { visibleNotes: [...version.immutableDescriptor.visibleNotes] },
    stressTests: version.stressTests.map((result) => ({
      role: result.role,
      assetId: result.assetId,
      passed: result.passed,
      ...result.reviewedAt ? { reviewedAt: result.reviewedAt } : {}
    })),
    canonicalAssets: files.map(({ role, asset }) => ({
      role,
      displayName: role === "face-three-quarter" && legacySquare(asset) ? "\u5FAE\u4FA7\u534A\u8EAB\uFF08\u65E7\u7248\u65B9\u56FE\uFF09" : CANONICAL_ROLE_LABELS[role],
      file: exportFileName(role, asset),
      assetId: asset.id,
      stateId: asset.stateId,
      provenance: {
        compilerVersion: asset.recipe.compilerVersion,
        templateId: asset.recipe.templateId,
        provider: asset.recipe.provider,
        model: asset.recipe.model
      }
    })),
    derivedStates: project.assets.filter((asset) => asset.versionId === version.id && asset.parentAssetId && !isCanonicalRole(asset.role) && !isStressTestRole(asset.role)).map((asset) => ({
      assetId: asset.id,
      parentAssetId: asset.parentAssetId,
      role: asset.role,
      stateId: asset.stateId,
      changeCategory: asset.changeSet.category,
      provenance: {
        compilerVersion: asset.recipe.compilerVersion,
        templateId: asset.recipe.templateId,
        provider: asset.recipe.provider,
        model: asset.recipe.model
      }
    }))
  };
  const readme = `# ${project.displayName} \u2014 Model Reference Pack

Character: ${project.characterTag}-${version.id}

## Reference order

` + files.map(({ role, asset }, index) => {
    const label = role === "face-three-quarter" && legacySquare(asset) ? "\u5FAE\u4FA7\u534A\u8EAB\uFF08\u65E7\u7248\u65B9\u56FE\uFF09" : CANONICAL_ROLE_LABELS[role];
    return `${index + 1}. ${exportFileName(role, asset)} \u2014 ${label}`;
  }).join("\n") + "\n\nFace anchors define facial identity; body views define proportion. Use the files in this order.\n\n## Boundary\n\nOnly saved, user-approved assets are included. Original references are not copied. The subject must be an adult or have an explicit adult appearance, and the operator must hold image/design rights.\n\n## Experimental files\n\nBody-only crops are manual, opt-in experiments and are not included in this pack.\n";
  try {
    await (0, import_promises.writeFile)((0, import_node_path2.join)(directory, "character.json"), `${JSON.stringify(manifest, null, 2)}
`, { flag: "wx" });
    await (0, import_promises.writeFile)((0, import_node_path2.join)(directory, "README.md"), readme, { flag: "wx" });
    for (const file of files) {
      await (0, import_promises.writeFile)((0, import_node_path2.join)(directory, exportFileName(file.role, file.asset)), file.bytes, { flag: "wx" });
    }
  } catch (error) {
    await (0, import_promises.rm)(directory, { recursive: true, force: true });
    throw error;
  }
  return { exportId, kind: "model-pack", directory, relativeFiles };
}

// server/routes/exports.ts
function registerExportRoutes(app, registry, projectRoot) {
  app.post("/api/projects/:projectId/exports", async (context) => {
    let body;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "\u5BFC\u51FA\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return context.json({ error: "\u5BFC\u51FA\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
    }
    const input = body;
    if (Object.keys(input).some((key) => !["kind", "versionId", "includeBodyOnly"].includes(key))) {
      return context.json({ error: "\u5BFC\u51FA\u8BF7\u6C42\u5305\u542B\u672A\u5141\u8BB8\u5B57\u6BB5" }, 400);
    }
    if (input.kind !== "model-pack") {
      return context.json({ error: "\u5C55\u793A\u677F\u7531\u6D4F\u89C8\u5668\u672C\u5730 Canvas \u76F4\u63A5\u5BFC\u51FA" }, 400);
    }
    if (typeof input.versionId !== "string") {
      return context.json({ error: "\u5BFC\u51FA\u7248\u672C\u65E0\u6548" }, 400);
    }
    try {
      const projectId = context.req.param("projectId");
      const result = await assembleModelPack({
        projectId,
        versionId: input.versionId,
        includeBodyOnly: input.includeBodyOnly === true
      }, registry, (0, import_node_path3.join)(projectRoot, projectId, "exports"));
      return context.json({
        exportId: result.exportId,
        kind: result.kind,
        relativeFiles: result.relativeFiles
      }, 201);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "\u6A21\u578B\u53C2\u8003\u5305\u5BFC\u51FA\u5931\u8D25" }, 400);
    }
  });
}

// server/prompt/identity-compiler.ts
var ROLE_INSTRUCTIONS = {
  "face-front": "\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u6B63\u9762\u8138\u90E8\u8EAB\u4EFD\u951A\u70B9\uFF1B\u4E2D\u6027\u8868\u60C5\u3001\u5E73\u89C6\u3001\u9762\u90E8\u7ED3\u6784\u6E05\u695A\u3002",
  "face-three-quarter": "\u5FAE\u4FA7\u534A\u8EAB\uFF1A\u4E0E\u4E2D\u6027\u534A\u8EAB\u76F8\u540C\u7684 2:3 \u7AD6\u5E45\u3001\u8170\u90E8\u4EE5\u4E0A\u666F\u522B\uFF1B\u5B8C\u6574\u5448\u73B0\u5934\u9876\u3001\u53D1\u578B\u3001\u80A9\u7EBF\u3001\u4E0A\u8EAB\u670D\u88C5\u548C\u8170\u7EBF\uFF0C\u4E0D\u88C1\u5207\u5934\u90E8\u4E0E\u5173\u952E\u8EAB\u4F53\u90E8\u4F4D\u3002\u8EAF\u5E72\u5FAE\u4FA7\u7EA6 20\u201330 \u5EA6\uFF0C\u8138\u90E8\u81EA\u7136\u5FAE\u4FA7\u3001\u53CC\u773C\u53EF\u8FA8\uFF1B\u590D\u5236\u6B63\u8138\u951A\u70B9\u7684\u8138\u578B\u4E0E\u4E94\u5B98\u6BD4\u4F8B\uFF0C\u4EE5\u53CA\u6B63\u9762\u5168\u8EAB\u951A\u70B9\u7684\u8EAB\u5F62\u4E0E\u57FA\u7840\u670D\u88C5\u3002\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\uFF0C\u4E0D\u751F\u6210\u8138\u90E8\u7279\u5199\u6216\u5168\u8EAB\u8FDC\u666F\u3002",
  "body-front": "\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u6B63\u9762\u5168\u8EAB\u8EAB\u6750\u4E0E\u57FA\u7840\u670D\u88C5\u951A\u70B9\uFF1B\u81EA\u7136\u7AD9\u59FF\uFF0C\u5B8C\u6574\u5448\u73B0\u5934\u9876\u81F3\u811A\u90E8\u3002",
  "body-side": "\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u4FA7\u9762\u5168\u8EAB\u53C2\u8003\uFF1B\u590D\u5236\u6B63\u9762\u5168\u8EAB\u951A\u70B9\u7684\u8EAB\u9AD8\u611F\u3001\u80A9\u80EF\u4E0E\u80A2\u4F53\u6BD4\u4F8B\u3002",
  "body-back": "\u4E13\u4E1A\u89D2\u8272\u670D\u88C5\u76EE\u5F55\u7684\u80CC\u9762\u8BBE\u8BA1\u53C2\u8003\uFF1B\u660E\u786E\u6210\u5E74\u89D2\u8272\u7AEF\u5E84\u76F4\u7ACB\u5E76\u7531\u5B8C\u6574\u670D\u88C5\u8986\u76D6\uFF0C\u6E05\u695A\u5448\u73B0\u53D1\u578B\u80CC\u9762\u3001\u80A9\u90E8\u670D\u88C5\u7ED3\u6784\u3001\u8896\u578B\u4E0E\u4E0B\u6446\uFF0C\u4F7F\u7528\u5BA2\u89C2\u5DE5\u4F5C\u5BA4\u6784\u56FE\u3002",
  "half-neutral": "\u4E13\u4E1A\u89D2\u8272\u8BBE\u5B9A\u7528\u8170\u90E8\u4EE5\u4E0A\u8096\u50CF\uFF1B\u660E\u786E\u6210\u5E74\u89D2\u8272\u4EE5\u5B8C\u6574\u670D\u88C5\u8986\u76D6\u80A9\u90E8\u4E0E\u4E0A\u8EAB\uFF0C\u7AEF\u5E84\u5E73\u89C6\uFF0C\u6E05\u695A\u5448\u73B0\u8138\u90E8\u3001\u53D1\u578B\u3001\u80A9\u90E8\u670D\u88C5\u7ED3\u6784\u4E0E\u914D\u9970\uFF0C\u4F7F\u7528\u5BA2\u89C2\u5DE5\u4F5C\u5BA4\u6784\u56FE\u3002",
  "stress-lighting": "\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u4E13\u4E1A\u5149\u7EBF\u4E00\u81F4\u6027\u6D4B\u8BD5\uFF1B\u4EC5\u5C06\u4E3B\u5149\u6539\u4E3A\u81EA\u7136\u4FA7\u5149\uFF0C\u4EBA\u7269\u7ED3\u6784\u4FDD\u6301\u7A33\u5B9A\u3002",
  "stress-angle": "\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u4E13\u4E1A\u673A\u4F4D\u4E00\u81F4\u6027\u6D4B\u8BD5\uFF1B\u4EC5\u6539\u53D8\u76F8\u673A\u9AD8\u5EA6\u4E0E\u65B9\u4F4D\uFF0C\u4EBA\u7269\u7ED3\u6784\u4FDD\u6301\u7A33\u5B9A\u3002",
  "stress-action": "\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u4E13\u4E1A\u52A8\u4F5C\u4E00\u81F4\u6027\u6D4B\u8BD5\uFF1B\u91C7\u7528\u81EA\u7136\u7AEF\u5E84\u7684\u7AD9\u59FF\u8F6C\u6362\u6216\u514B\u5236\u6B65\u884C\u3002",
  "model-card-natural": "\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u81EA\u7136\u8096\u50CF\u6A21\u5361\u7167\uFF1B\u5E72\u51C0\u80CC\u666F\u3001\u514B\u5236\u4FEE\u9970\u3001\u771F\u5B9E\u76AE\u80A4\u3002",
  "model-card-half": "\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u534A\u8EAB\u6A21\u5361\u7167\uFF1B\u6E05\u695A\u5448\u73B0\u9762\u90E8\u3001\u80A9\u7EBF\u4E0E\u4E0A\u8EAB\u6BD4\u4F8B\u3002",
  "model-card-full": "\u4E13\u4E1A\u4EBA\u7269\u6A21\u5361\u76EE\u5F55\u7684\u6B63\u9762\u5168\u8EAB\u53C2\u8003\uFF1B\u660E\u786E\u6210\u5E74\u4EBA\u7269\u4EE5\u5B8C\u6574\u65E5\u5E38\u670D\u88C5\u8986\u76D6\uFF0C\u7AEF\u5E84\u81EA\u7136\u7AD9\u7ACB\uFF0C\u5B8C\u6574\u5448\u73B0\u5934\u9876\u81F3\u811A\u90E8\uFF0C\u4F7F\u7528\u5BA2\u89C2\u5DE5\u4F5C\u5BA4\u6784\u56FE\u3002",
  "model-card-side-action": "\u4E13\u4E1A\u4EBA\u7269\u6A21\u5361\u76EE\u5F55\u7684\u4FA7\u9762\u52A8\u6001\u53C2\u8003\uFF1B\u660E\u786E\u6210\u5E74\u4EBA\u7269\u4EE5\u5B8C\u6574\u65E5\u5E38\u670D\u88C5\u8986\u76D6\uFF0C\u4F7F\u7528\u81EA\u7136\u7AEF\u5E84\u7684\u4FA7\u9762\u7AD9\u59FF\u6216\u514B\u5236\u6B65\u884C\u52A8\u4F5C\u548C\u5BA2\u89C2\u5DE5\u4F5C\u5BA4\u6784\u56FE\u3002",
  expression: "\u8868\u60C5\u6D3E\u751F\u8D44\u4EA7\uFF1B\u751F\u6210\u6B63\u9762\u80F8\u53E3\u4EE5\u4E0A\u8868\u60C5\u8096\u50CF\uFF0C\u5B8C\u6574\u5448\u73B0\u5934\u9876\u3001\u53D1\u578B\u8F6E\u5ED3\u3001\u8138\u90E8\u3001\u9888\u80A9\u548C\u5C11\u91CF\u4E0A\u8EAB\uFF1B\u8138\u90E8\u5C45\u4E2D\u4E14\u5360\u636E\u8DB3\u591F\u753B\u9762\uFF0C\u4EC5\u6539\u53D8\u6307\u5B9A\u8868\u60C5\u5F3A\u5EA6\uFF0C\u4E0D\u6539\u53D8\u4E94\u5B98\u7ED3\u6784\u3001\u673A\u4F4D\u3001\u80CC\u666F\u3001\u5149\u7EBF\u6216\u57FA\u7840\u670D\u88C5\u3002",
  "wardrobe-state": "\u670D\u88C5\u6D3E\u751F\u8D44\u4EA7\uFF1B\u4EC5\u6539\u53D8\u6307\u5B9A\u670D\u88C5\uFF0C\u4E0D\u6539\u53D8\u8EAB\u4F53\u7ED3\u6784\u3002",
  "action-reference": "\u52A8\u4F5C\u53C2\u8003\u8D44\u4EA7\uFF1B\u4EC5\u6539\u53D8\u59FF\u52BF\u548C\u52A8\u4F5C\uFF0C\u4E0D\u6539\u53D8\u8EAB\u4EFD\u3002",
  custom: "\u81EA\u5B9A\u4E49\u6D3E\u751F\u8D44\u4EA7\uFF1B\u4E25\u683C\u9650\u5B9A\u4E3A\u672C\u6B21\u58F0\u660E\u7684\u5355\u4E00\u53D8\u5316\u7C7B\u522B\u3002"
};
var FIXED_ROLE_CHANGE_INSTRUCTIONS = {
  "face-front": "\u5EFA\u7ACB\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u3001\u81EA\u7136\u5E73\u89C6\u7684\u4E13\u4E1A\u6B63\u8138\u8EAB\u4EFD\u951A\u70B9",
  "face-three-quarter": "\u5EFA\u7ACB\u4E0E\u4E2D\u6027\u534A\u8EAB\u540C\u5C3A\u5BF8\u7684\u5FAE\u4FA7\u534A\u8EAB\uFF1A\u8170\u90E8\u4EE5\u4E0A\u3001\u8EAF\u5E72\u81EA\u7136\u5FAE\u4FA7\u3001\u8138\u90E8\u8EAB\u4EFD\u6E05\u6670\uFF0C\u590D\u5236\u57FA\u7840\u670D\u88C5",
  "body-front": "\u5EFA\u7ACB\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u3001\u89E3\u5256\u6BD4\u4F8B\u81EA\u7136\u534F\u8C03\u7684\u6B63\u9762\u5168\u8EAB\u8EAB\u6750\u4E0E\u57FA\u7840\u670D\u88C5\u951A\u70B9",
  "body-side": "\u5EFA\u7ACB\u590D\u5236\u6B63\u9762\u5168\u8EAB\u8EAB\u6750\u6BD4\u4F8B\u4E0E\u57FA\u7840\u670D\u88C5\u7684\u4E13\u4E1A\u4FA7\u9762\u5168\u8EAB\u53C2\u8003",
  "body-back": "\u5EFA\u7ACB\u5B8C\u6574\u670D\u88C5\u8986\u76D6\u7684\u4E13\u4E1A\u89D2\u8272\u670D\u88C5\u80CC\u9762\u76EE\u5F55\u53C2\u8003",
  "half-neutral": "\u5EFA\u7ACB\u5B8C\u6574\u670D\u88C5\u8986\u76D6\u7684\u4E13\u4E1A\u89D2\u8272\u8BBE\u5B9A\u7528\u8170\u90E8\u4EE5\u4E0A\u8096\u50CF",
  "stress-lighting": "\u4EC5\u6539\u53D8\u81EA\u7136\u4E3B\u5149\u65B9\u5411\u4E0E\u660E\u6697\u5173\u7CFB\uFF0C\u8EAB\u4EFD\u3001\u8EAB\u4F53\u7ED3\u6784\u4E0E\u57FA\u7840\u670D\u88C5\u4FDD\u6301\u4E00\u81F4",
  "stress-angle": "\u4EC5\u6539\u53D8\u76F8\u673A\u9AD8\u5EA6\u3001\u65B9\u4F4D\u4E0E\u955C\u5934\u900F\u89C6\uFF0C\u8EAB\u4EFD\u3001\u8EAB\u4F53\u7ED3\u6784\u4E0E\u57FA\u7840\u670D\u88C5\u4FDD\u6301\u4E00\u81F4",
  "stress-action": "\u4EC5\u6539\u53D8\u81EA\u7136\u52A8\u4F5C\u7684\u5173\u8282\u89D2\u5EA6\u548C\u91CD\u5FC3\uFF0C\u8EAB\u4EFD\u3001\u8EAB\u4F53\u7ED3\u6784\u4E0E\u57FA\u7840\u670D\u88C5\u4FDD\u6301\u4E00\u81F4",
  "model-card-natural": "\u5EFA\u7ACB\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u4E13\u4E1A\u81EA\u7136\u8096\u50CF\u6A21\u5361\u53C2\u8003",
  "model-card-half": "\u5EFA\u7ACB\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u5E76\u590D\u5236\u8EAB\u6750\u4E0E\u57FA\u7840\u670D\u88C5\u7684\u4E13\u4E1A\u534A\u8EAB\u6A21\u5361\u53C2\u8003",
  "model-card-full": "\u5EFA\u7ACB\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u65E5\u5E38\u670D\u88C5\u8986\u76D6\u7684\u4E13\u4E1A\u4EBA\u7269\u6A21\u5361\u76EE\u5F55\u6B63\u9762\u5168\u8EAB\u53C2\u8003",
  "model-card-side-action": "\u5EFA\u7ACB\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u65E5\u5E38\u670D\u88C5\u8986\u76D6\u4E14\u52A8\u4F5C\u81EA\u7136\u7AEF\u5E84\u7684\u4E13\u4E1A\u4EBA\u7269\u6A21\u5361\u76EE\u5F55\u4FA7\u9762\u7AD9\u59FF\u6216\u514B\u5236\u6B65\u884C\u53C2\u8003"
};
var BODY_ANCHORED_ROLES = /* @__PURE__ */ new Set([
  "face-three-quarter",
  "body-side",
  "body-back",
  "half-neutral",
  "stress-lighting",
  "stress-angle",
  "stress-action",
  "model-card-natural",
  "model-card-half",
  "model-card-full",
  "model-card-side-action",
  "expression",
  "wardrobe-state",
  "action-reference"
]);
var WARDROBE_LOCKED_ROLES = /* @__PURE__ */ new Set([
  "face-three-quarter",
  "body-side",
  "body-back",
  "half-neutral",
  "stress-lighting",
  "stress-angle",
  "stress-action",
  "model-card-natural",
  "model-card-half",
  "model-card-full",
  "model-card-side-action",
  "expression",
  "action-reference"
]);
var STRESS_ROLES = /* @__PURE__ */ new Set([
  "stress-lighting",
  "stress-angle",
  "stress-action"
]);
var CHANGE_CATEGORIES3 = /* @__PURE__ */ new Set([
  "identity",
  "expression",
  "wardrobe",
  "action",
  "condition",
  "background",
  "lighting",
  "camera"
]);
function sanitize(value, limit = 500) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}
function assertSingleVariableChange(changeSet, versionStatus) {
  if (!CHANGE_CATEGORIES3.has(changeSet.category)) throw new Error("\u53D8\u5316\u7C7B\u522B\u65E0\u6548");
  if (!sanitize(changeSet.instruction)) throw new Error("\u53D8\u5316\u6307\u4EE4\u4E0D\u80FD\u4E3A\u7A7A");
  if (!sanitize(changeSet.sourceStateId) || !sanitize(changeSet.targetStateId)) {
    throw new Error("\u53D8\u5316\u5FC5\u987B\u58F0\u660E\u6765\u6E90\u72B6\u6001\u548C\u76EE\u6807\u72B6\u6001");
  }
  if (versionStatus === "locked" && changeSet.category === "identity") {
    throw new Error("\u8EAB\u4EFD\u53D8\u5316\u5FC5\u987B\u521B\u5EFA\u65B0\u7248\u672C");
  }
}
function orderReferenceSources(sources) {
  const priority = (source) => {
    if (source.kind === "session") return 3;
    if (source.role === "face-front" || source.role === "face-three-quarter") return 0;
    if (["body-front", "body-side", "body-back", "half-neutral"].includes(source.role)) return 1;
    return 2;
  };
  return sources.map((source, index) => ({ source, index, priority: priority(source) })).sort((left, right) => left.priority - right.priority || left.index - right.index).map(({ source }) => source);
}
function assertGenerationReferenceContract(assetRole, sources) {
  const approvedRoles = sources.filter((source) => source.kind === "asset").map((source) => source.role);
  const hasApproved = (role) => approvedRoles.includes(role);
  const sessionRoles = sources.filter((source) => source.kind === "session").map((source) => source.role);
  if (assetRole === "face-front") {
    if (sessionRoles.length > 2 || sessionRoles.some((role) => ![
      "face-front",
      "face-three-quarter",
      "body-front",
      "body-side",
      "body-back",
      "half-neutral"
    ].includes(role))) {
      throw new Error("face-front \u4F1A\u8BDD\u53C2\u8003\u6700\u591A\u4E24\u5F20\uFF0C\u4E14\u5FC5\u987B\u662F\u4EBA\u7269\u89C4\u8303\u53C2\u8003\u56FE");
    }
  }
  if (assetRole === "body-front" && !hasApproved("face-front")) {
    throw new Error("body-front \u89C4\u8303\u8D44\u4EA7\u5FC5\u987B\u5F15\u7528\u5DF2\u63A5\u53D7\u7684 face-front \u6B63\u8138\u951A\u70B9");
  }
  if (assetRole === "body-front") {
    const bodyReferences = sessionRoles.filter((role) => ["body-front", "body-side", "body-back", "half-neutral"].includes(role));
    const wardrobeReferences = sessionRoles.filter((role) => role === "wardrobe-state");
    if (sessionRoles.length > 2 || bodyReferences.length > 1 || wardrobeReferences.length > 1 || bodyReferences.length + wardrobeReferences.length !== sessionRoles.length) {
      throw new Error("body-front \u4F1A\u8BDD\u53C2\u8003\u6700\u591A\u5305\u542B\u4E00\u5F20\u8EAB\u4F53\u53C2\u8003\u548C\u4E00\u5F20\u57FA\u7840\u670D\u88C5\u53C2\u8003");
    }
  }
  if (["face-three-quarter", "body-side", "body-back", "half-neutral"].includes(assetRole) && (!hasApproved("face-front") || !hasApproved("body-front"))) {
    throw new Error(`${assetRole} \u89C4\u8303\u8D44\u4EA7\u5FC5\u987B\u540C\u65F6\u5F15\u7528\u5DF2\u63A5\u53D7\u7684 face-front \u4E0E body-front \u951A\u70B9`);
  }
  if (["face-three-quarter", "body-side", "body-back", "half-neutral"].includes(assetRole) && (sessionRoles.length > 1 || sessionRoles.some((role) => role !== assetRole))) {
    throw new Error(`${assetRole} \u6700\u591A\u53EA\u80FD\u9644\u52A0\u4E00\u5F20\u540C\u804C\u8D23\u4F1A\u8BDD\u53C2\u8003\u56FE`);
  }
  if (STRESS_ROLES.has(assetRole)) {
    const exactApprovedAnchors = approvedRoles.length === 2 && approvedRoles[0] === "face-front" && approvedRoles[1] === "body-front";
    if (!exactApprovedAnchors || sources.length !== 2) {
      throw new Error("\u538B\u529B\u6D4B\u8BD5\u53EA\u80FD\u5F15\u7528 face-front \u4E0E body-front \u4E24\u4E2A\u951A\u70B9\u8D44\u4EA7");
    }
  }
  if (BODY_ANCHORED_ROLES.has(assetRole) && !isCanonicalBodyAnchorRole(assetRole) && !STRESS_ROLES.has(assetRole) && (!hasApproved("face-front") || !hasApproved("body-front"))) {
    throw new Error(`${assetRole} \u5FC5\u987B\u540C\u65F6\u5F15\u7528 face-front \u4E0E body-front \u8EAB\u6750\u951A\u70B9`);
  }
  if (!isCanonicalBodyAnchorRole(assetRole) && !STRESS_ROLES.has(assetRole) && sessionRoles.length > 0) {
    throw new Error("\u6D3E\u751F\u8D44\u4EA7\u4E0D\u63A5\u53D7\u989D\u5916\u4F1A\u8BDD\u53C2\u8003\u56FE\uFF0C\u8BF7\u4F7F\u7528\u5DF2\u6279\u51C6\u7236\u8D44\u4EA7\u548C\u53CC\u951A\u70B9");
  }
}
function isCanonicalBodyAnchorRole(role) {
  return role === "face-front" || role === "body-front" || ["face-three-quarter", "body-side", "body-back", "half-neutral"].includes(role);
}
function section(title, lines) {
  return [`[${title}]`, ...lines.filter(Boolean).map((line) => `- ${line}`)].join("\n");
}
function referencePurpose(role) {
  if (role === "face-front") return "\u7528\u4E8E\u9762\u90E8\u8EAB\u4EFD";
  if (role === "face-three-quarter") return "\u7528\u4E8E\u9762\u90E8\u8EAB\u4EFD\u4E0E\u5FAE\u4FA7\u534A\u8EAB\u6784\u56FE";
  if (role === "body-front") return "\u7528\u4E8E\u4F53\u578B\u4E0E\u57FA\u7840\u670D\u88C5";
  if (role === "wardrobe-state") return "\u4EC5\u7528\u4E8E\u57FA\u7840\u670D\u88C5\u9020\u578B";
  if (["body-side", "body-back", "half-neutral"].includes(role)) return "\u7528\u4E8E\u8865\u5145\u8EAB\u4F53\u7ED3\u6784";
  return "\u7528\u4E8E\u5F53\u524D\u72B6\u6001\u53C2\u8003";
}
function compileIdentityPrompt(input) {
  assertSingleVariableChange(input.changeSet, "draft");
  const characterTag = sanitize(input.characterTag, 80);
  if (!/^@[a-z0-9-]+$/.test(characterTag)) throw new Error("\u89D2\u8272\u6807\u7B7E\u65E0\u6548");
  const visibleNotes = input.immutableDescriptor.visibleNotes.map((note) => sanitize(note)).filter(Boolean);
  const instruction = sanitize(
    FIXED_ROLE_CHANGE_INSTRUCTIONS[input.assetRole] ?? input.changeSet.instruction
  );
  const sourceStateId = sanitize(input.changeSet.sourceStateId, 80);
  const targetStateId = sanitize(input.changeSet.targetStateId, 80);
  const parentStateId = sanitize(input.parentStateId ?? sourceStateId, 80);
  const baseWardrobeBrief = sanitize(input.baseWardrobeBrief ?? "", 300);
  const hasWardrobeReference = (input.referenceRoles ?? []).includes("wardrobe-state");
  const outputContract = [
    "\u751F\u6210\u5355\u5F20\u5199\u5B9E\u4EBA\u7269\u8D44\u4EA7\uFF0C\u4EBA\u7269\u6E05\u6670\u3001\u6BD4\u4F8B\u53EF\u4FE1\u3001\u65E0\u6587\u5B57\u6C34\u5370\u3002",
    "\u672C\u6B21\u8F93\u51FA\u53EA\u670D\u52A1\u4E8E\u6307\u5B9A\u8D44\u4EA7\u89D2\u8272\uFF0C\u4E0D\u5408\u5E76\u5176\u4ED6\u955C\u5934\u6216\u53D8\u5316\u3002"
  ];
  const identityContract = [
    "\u6240\u6709\u53C2\u8003\u5171\u540C\u63CF\u8FF0\u540C\u4E00\u4E2A\u6210\u5E74\u4EBA\uFF1B\u8138\u90E8\u951A\u70B9\u51B3\u5B9A\u9762\u90E8\u8EAB\u4EFD\uFF0C\u8EAB\u4F53\u951A\u70B9\u51B3\u5B9A\u8EAB\u5F62\u6BD4\u4F8B\u3002",
    "\u4FDD\u6301\u8138\u578B\u6BD4\u4F8B\u3001\u5173\u952E\u4E94\u5B98\u3001\u5E74\u9F84\u611F\u3001\u80A4\u8272\u57FA\u8C03\u3001\u53D1\u9645\u7EBF\u3001\u53D1\u578B\u951A\u70B9\u3001\u53EF\u8FA8\u8BC6\u914D\u9970\u3001\u80A9\u80EF\u6BD4\u4F8B\u548C\u8EAB\u4F53\u8F6E\u5ED3\u3002",
    "\u4E0D\u6839\u636E\u5916\u89C2\u63A8\u65AD\u6027\u683C\u3001\u804C\u4E1A\u3001\u9636\u5C42\u6216\u5065\u5EB7\u72B6\u6001\u3002",
    ...visibleNotes.map((note) => `\u7528\u6237\u786E\u8BA4\u7684\u53EF\u89C1\u7279\u5F81\uFF1A${note}`)
  ];
  const referenceManifest = (input.referenceRoles ?? []).map(
    (role, index) => `\u7B2C ${index + 1} \u5F20\uFF1A${role}\uFF0C${referencePurpose(role)}\u3002`
  );
  const stateContract = [
    `\u7236\u72B6\u6001\uFF1A${parentStateId || "base"}\u3002`,
    `\u6765\u6E90\u72B6\u6001\uFF1A${sourceStateId}\uFF1B\u76EE\u6807\u72B6\u6001\uFF1A${targetStateId}\u3002`,
    "\u6D3E\u751F\u72B6\u6001\u4E0D\u5F97\u8986\u76D6\u57FA\u7840\u89D2\u8272\u6216\u5DF2\u9501\u5B9A\u7248\u672C\u3002"
  ];
  const changeContract = [
    `\u53D8\u5316\u7C7B\u522B\uFF1A${input.changeSet.category}\u3002`,
    `\u552F\u4E00\u5141\u8BB8\u53D8\u5316\uFF1A${instruction}\u3002`,
    "\u672A\u88AB\u58F0\u660E\u7684\u8EAB\u4EFD\u3001\u670D\u88C5\u3001\u8868\u60C5\u3001\u52A8\u4F5C\u3001\u72B6\u6001\u3001\u80CC\u666F\u3001\u5149\u7EBF\u4E0E\u673A\u4F4D\u5747\u4FDD\u6301\u4E0D\u53D8\u3002"
  ];
  const captureGrammar = [
    "\u771F\u5B9E\u6444\u5F71\u8D28\u611F\uFF0C\u81EA\u7136\u76AE\u80A4\u7EB9\u7406\uFF0C\u53EF\u4FE1\u955C\u5934\u900F\u89C6\uFF0C\u907F\u514D\u8FC7\u5EA6\u78E8\u76AE\u4E0E\u5851\u6599\u611F\u3002",
    "\u4F18\u5148\u4FDD\u8BC1\u8EAB\u4EFD\u53EF\u8BC6\u522B\u6027\u548C\u8DE8\u8D44\u4EA7\u4E00\u81F4\u6027\uFF0C\u518D\u6EE1\u8DB3\u9020\u578B\u53D8\u5316\u3002"
  ];
  const bodyContract = input.assetRole === "body-front" ? [
    "\u5EFA\u7ACB\u81EA\u7136\u534F\u8C03\u4E14\u53EF\u590D\u7528\u7684\u8EAB\u4F53\u7ED3\u6784\uFF1A\u5934\u8EAB\u6BD4\u3001\u80A9\u5BBD\u4E0E\u80EF\u5BBD\u3001\u8170\u7EBF\u4F4D\u7F6E\u3001\u8EAF\u5E72\u957F\u5EA6\u3001\u624B\u81C2\u4E0E\u817F\u957F\u3001\u8098\u819D\u5173\u8282\u4F4D\u7F6E\u3001\u5DE6\u53F3\u5E73\u8861\u548C\u7AD9\u7ACB\u91CD\u5FC3\u5747\u7B26\u5408\u53EF\u4FE1\u4EBA\u4F53\u7ED3\u6784\u3002",
    "\u57FA\u7840\u670D\u88C5\u5B8C\u6574\u7740\u88C5\uFF0C\u7248\u578B\u81EA\u7136\u5408\u4F53\uFF0C\u6E05\u695A\u5448\u73B0\u670D\u88C5\u5C42\u6B21\u3001\u4E0A\u88C5\u3001\u4E0B\u88C5\u3001\u978B\u5C65\u548C\u53EF\u89C1\u914D\u9970\u3002",
    "\u6B63\u8138\u53C2\u8003\u53EA\u51B3\u5B9A\u9762\u90E8\u8EAB\u4EFD\uFF0C\u4E0D\u6CBF\u7528\u5176\u4E2D\u7684\u670D\u88C5\u3002",
    ...baseWardrobeBrief ? ["\u57FA\u7840\u670D\u88C5\u4EE5\u672C\u6B21\u6587\u5B57\u8BF4\u660E\u4E3A\u51C6\u3002"] : hasWardrobeReference ? ["\u57FA\u7840\u670D\u88C5\u4EE5 wardrobe-state \u670D\u88C5\u53C2\u8003\u4E3A\u51C6\uFF0C\u53EA\u501F\u9274\u670D\u88C5\u9020\u578B\u3002"] : [
      "\u672A\u63D0\u4F9B\u670D\u88C5\u8BF4\u660E\u6216\u670D\u88C5\u53C2\u8003\u65F6\uFF0C\u4F7F\u7528\u5B8C\u6574\u8986\u76D6\u7684\u4E2D\u6027\u65E5\u5E38\u5DE5\u4F5C\u5BA4\u670D\u88C5\uFF1A\u4E0D\u900F\u660E\u7684\u5706\u9886\u957F\u8896\u4E0A\u8863\u3001\u81EA\u7136\u5408\u4F53\u7684\u76F4\u7B52\u957F\u88E4\u548C\u5305\u811A\u978B\uFF1B\u9886\u53E3\u5B8C\u6574\u8986\u76D6\uFF0C\u7248\u578B\u81EA\u7136\u4E0D\u8FC7\u7D27\u3002"
    ]
  ] : BODY_ANCHORED_ROLES.has(input.assetRole) ? [
    "\u4EE5 body-front \u53C2\u8003\u4E3A\u552F\u4E00\u8EAB\u4F53\u4E0E\u57FA\u7840\u670D\u88C5\u771F\u6E90\u3002",
    "\u590D\u5236\u5176\u5934\u8EAB\u6BD4\u3001\u80A9\u5BBD\u4E0E\u80EF\u5BBD\u3001\u8170\u7EBF\u4F4D\u7F6E\u3001\u8EAF\u5E72\u957F\u5EA6\u3001\u624B\u81C2\u4E0E\u817F\u957F\u3001\u8098\u819D\u5173\u8282\u4F4D\u7F6E\u548C\u6574\u4F53\u8EAB\u9AD8\u611F\u3002",
    ...WARDROBE_LOCKED_ROLES.has(input.assetRole) ? ["\u590D\u5236\u5176\u670D\u88C5\u7C7B\u522B\u3001\u989C\u8272\u3001\u6750\u8D28\u89C2\u611F\u3001\u9886\u53E3\u3001\u8896\u578B\u3001\u5C42\u6570\u3001\u4E0A\u88C5\u3001\u4E0B\u88C5\u3001\u978B\u5C65\u548C\u53EF\u89C1\u914D\u9970\u3002"] : ["\u8EAB\u4F53\u7ED3\u6784\u4FDD\u6301\u7A33\u5B9A\uFF0C\u670D\u88C5\u53EA\u6309\u672C\u6B21\u660E\u786E\u58F0\u660E\u7684\u6362\u88C5\u6307\u4EE4\u53D8\u5316\u3002"]
  ] : [];
  const stressContract = STRESS_ROLES.has(input.assetRole) ? [
    input.assetRole === "stress-lighting" ? "\u672C\u6D4B\u8BD5\u53EA\u6539\u53D8\u4E3B\u5149\u65B9\u5411\u4E0E\u660E\u6697\u5173\u7CFB\u3002" : input.assetRole === "stress-angle" ? "\u672C\u6D4B\u8BD5\u53EA\u6539\u53D8\u76F8\u673A\u9AD8\u5EA6\u3001\u65B9\u4F4D\u4E0E\u955C\u5934\u900F\u89C6\u3002" : "\u672C\u6D4B\u8BD5\u53EA\u6539\u53D8\u5173\u8282\u89D2\u5EA6\u548C\u91CD\u5FC3\u3002",
    "\u4EBA\u7269\u8EAB\u4EFD\u3001\u53D1\u578B\u3001\u8868\u60C5\u57FA\u8C03\u3001\u5934\u8EAB\u6BD4\u3001\u80A9\u80EF\u3001\u8170\u7EBF\u3001\u80A2\u4F53\u957F\u5EA6\u3001\u57FA\u7840\u670D\u88C5\u3001\u978B\u5C65\u4E0E\u914D\u9970\u4FDD\u6301\u4E00\u81F4\u3002"
  ] : [];
  const expressionContract = input.assetRole === "expression" ? [
    (input.referenceRoles ?? []).includes("half-neutral") ? "\u4EE5 half-neutral \u53C2\u8003\u4E3A\u4E3B\u8981\u6784\u56FE\u4E0E\u57FA\u7840\u670D\u88C5\u53C2\u8003\uFF0C\u4F7F\u7528\u6B63\u9762\u80F8\u53E3\u4EE5\u4E0A\u666F\u522B\u3002" : "\u4F7F\u7528\u6B63\u9762\u80F8\u53E3\u4EE5\u4E0A\u666F\u522B\uFF0C\u4E0D\u6CBF\u7528\u5168\u8EAB\u53C2\u8003\u7684\u8FDC\u666F\u6784\u56FE\u3002",
    "face-front \u53EA\u8D1F\u8D23\u9762\u90E8\u8EAB\u4EFD\uFF0Cbody-front \u53EA\u8D1F\u8D23\u8EAB\u6750\u4E0E\u57FA\u7840\u670D\u88C5\u4E00\u81F4\u6027\uFF0C\u4E0D\u6CBF\u7528\u5176\u5168\u8EAB\u666F\u522B\u3002",
    "\u5934\u9876\u3001\u5B8C\u6574\u53D1\u578B\u8F6E\u5ED3\u3001\u5B8C\u6574\u8138\u90E8\u3001\u9888\u80A9\u548C\u5C11\u91CF\u4E0A\u8EAB\u5747\u5728\u753B\u9762\u5185\uFF0C\u773C\u775B\u4F4D\u4E8E\u753B\u9762\u4E0A\u534A\u90E8\u3002"
  ] : [];
  const safetyContext = [
    input.mode === "human-model-card" ? "\u5185\u5BB9\u9650\u5B9A\u4E3A\u5DF2\u6388\u6743\u8096\u50CF\u3001\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u4EBA\u7269\u89D2\u8272\u53C2\u8003\u3002" : "\u5185\u5BB9\u9650\u5B9A\u4E3A\u62E5\u6709\u8BBE\u8BA1\u4F7F\u7528\u6743\u3001\u660E\u786E\u6210\u5E74\u3001\u5B8C\u6574\u7740\u88C5\u7684\u865A\u62DF\u89D2\u8272\u53C2\u8003\u3002",
    "\u573A\u666F\u4E3A\u666E\u901A\u4E13\u4E1A\u6444\u5F71\u68DA\u6216\u89D2\u8272\u8BBE\u5B9A\u76EE\u5F55\uFF0C\u59FF\u6001\u81EA\u7136\u7AEF\u5E84\uFF0C\u753B\u9762\u4FDD\u6301\u4E2D\u6027\u4E13\u4E1A\u3002"
  ];
  const qualityContract = [
    "\u753B\u9762\u4EC5\u5305\u542B\u4E00\u4F4D\u4EBA\u7269\uFF0C\u8EAB\u4EFD\u3001\u5E74\u9F84\u611F\u3001\u8138\u90E8\u7ED3\u6784\u3001\u8EAB\u4F53\u6BD4\u4F8B\u548C\u672A\u58F0\u660E\u72B6\u6001\u7A33\u5B9A\u3002",
    input.assetRole === "expression" ? "\u5934\u9876\u3001\u53D1\u578B\u8F6E\u5ED3\u3001\u9762\u90E8\u3001\u9888\u80A9\u548C\u5C11\u91CF\u4E0A\u8EAB\u5B8C\u6574\u5448\u73B0\uFF0C\u76AE\u80A4\u7EB9\u7406\u4E0E\u955C\u5934\u900F\u89C6\u81EA\u7136\u53EF\u4FE1\u3002" : "\u624B\u90E8\u3001\u80A2\u4F53\u3001\u76AE\u80A4\u7EB9\u7406\u4E0E\u955C\u5934\u900F\u89C6\u81EA\u7136\u53EF\u4FE1\uFF0C\u5173\u952E\u8EAB\u4F53\u90E8\u4F4D\u5B8C\u6574\u5448\u73B0\u3002"
  ];
  return [
    section("\u4EFB\u52A1\u4E0E\u8F93\u51FA\u5951\u7EA6", outputContract),
    section("\u89D2\u8272\u6807\u7B7E\u4E0E\u7248\u672C", [characterTag]),
    section("\u4E0D\u53EF\u53D8\u8EAB\u4EFD\u5408\u540C", identityContract),
    section("\u6709\u5E8F\u53C2\u8003\u804C\u8D23", referenceManifest),
    section("\u5F53\u524D\u8D44\u4EA7\u89D2\u8272", [ROLE_INSTRUCTIONS[input.assetRole]]),
    section("\u5F53\u524D\u72B6\u6001\u4E0E\u7236\u8D44\u4EA7", stateContract),
    section("\u672C\u6B21\u5355\u4E00\u53D8\u5316", changeContract),
    section("\u8EAB\u6750\u4E0E\u57FA\u7840\u670D\u88C5\u5408\u540C", bodyContract),
    section("\u538B\u529B\u6D4B\u8BD5\u5355\u53D8\u91CF\u5408\u540C", stressContract),
    section("\u8868\u60C5\u8096\u50CF\u6784\u56FE\u5408\u540C", expressionContract),
    section("\u57FA\u7840\u670D\u88C5\u8BF4\u660E", baseWardrobeBrief ? [baseWardrobeBrief] : []),
    section("\u6355\u83B7\u8BED\u6CD5", captureGrammar),
    section("\u6388\u6743\u4E0E\u5B89\u5168\u8FB9\u754C", safetyContext),
    section("\u6B63\u5411\u8D28\u91CF\u5408\u540C", qualityContract)
  ].join("\n\n");
}

// server/domain/asset-policy.ts
var STRESS_CATEGORY = {
  "stress-lighting": "lighting",
  "stress-angle": "camera",
  "stress-action": "action"
};
var LATER_CANONICAL_ROLES = /* @__PURE__ */ new Set([
  "face-three-quarter",
  "body-side",
  "body-back",
  "half-neutral"
]);
var BODY_ANCHORED_DERIVED_ROLES = /* @__PURE__ */ new Set([
  "model-card-natural",
  "model-card-half",
  "model-card-full",
  "model-card-side-action",
  "expression",
  "wardrobe-state",
  "action-reference"
]);
function hasExactRoles(references, roles) {
  return references.length === roles.length && roles.every((role) => references.filter((asset) => asset.role === role).length === 1);
}
function hasCompleteCanonicalSet(version, assets) {
  const roles = new Set(version.canonicalAssetIds.map((id) => assets.find((asset) => asset.id === id && asset.versionId === version.id && asset.status === "ready")?.role));
  return CANONICAL_ROLES.every((role) => roles.has(role));
}
function assertAssetOperation(input) {
  const { project, version, role, changeSet, parentAssetId, referenceAssetIds } = input;
  if (version.status === "superseded") throw new Error("\u4E0D\u80FD\u5411\u5DF2\u88AB\u66FF\u4EE3\u7684\u7248\u672C\u6DFB\u52A0\u8D44\u4EA7");
  const parent = parentAssetId ? project.assets.find((asset) => asset.id === parentAssetId && asset.status === "ready") : void 0;
  const references = referenceAssetIds.map((id) => project.assets.find((asset) => asset.id === id && asset.status === "ready"));
  if (references.some((asset) => !asset)) throw new Error("\u751F\u6210\u914D\u65B9\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u6279\u51C6\u8D44\u4EA7");
  if (new Set(referenceAssetIds).size !== referenceAssetIds.length) {
    throw new Error("\u751F\u6210\u914D\u65B9\u4E0D\u80FD\u91CD\u590D\u5F15\u7528\u540C\u4E00\u6279\u51C6\u8D44\u4EA7");
  }
  const approvedReferences = references;
  if (parentAssetId && !referenceAssetIds.includes(parentAssetId)) {
    throw new Error("\u751F\u6210\u914D\u65B9\u5FC5\u987B\u628A\u7236\u8D44\u4EA7\u5217\u5165\u6279\u51C6\u8D44\u4EA7\u5F15\u7528");
  }
  if (isCanonicalRole(role)) {
    if (!["draft", "testing"].includes(version.status)) throw new Error("\u9501\u5B9A\u7248\u672C\u4E0D\u80FD\u65B0\u589E\u8EAB\u4EFD\u89C4\u8303\u8D44\u4EA7");
    if (changeSet.category !== "identity" || changeSet.targetStateId !== "base") {
      throw new Error("\u89C4\u8303\u8D44\u4EA7\u5FC5\u987B\u5EFA\u7ACB base \u8EAB\u4EFD\u72B6\u6001");
    }
    if (role === "face-front") {
      if (approvedReferences.length > 1 || approvedReferences.some((asset) => asset.role !== "face-front")) {
        throw new Error("face-front \u6700\u591A\u53EA\u80FD\u7EE7\u627F\u4E00\u4E2A\u5DF2\u6279\u51C6\u7684\u6B63\u8138\u951A\u70B9");
      }
      if (approvedReferences.length === 1 && (!version.createdFromVersionId || approvedReferences[0].versionId !== version.createdFromVersionId)) {
        throw new Error(`face-front \u53EA\u80FD\u7EE7\u627F\u76F4\u63A5\u4E0A\u4E00\u7248\u672C ${version.createdFromVersionId ?? "\u65E0"} \u7684\u6B63\u8138\u951A\u70B9`);
      }
      return;
    }
    if (approvedReferences.some((asset) => asset.versionId !== version.id)) {
      throw new Error("\u89C4\u8303\u8D44\u4EA7\u53EA\u80FD\u5F15\u7528\u5F53\u524D\u540C\u7248\u672C\u6279\u51C6\u951A\u70B9");
    }
    if (role === "body-front" && !hasExactRoles(approvedReferences, ["face-front"])) {
      throw new Error("body-front \u5FC5\u987B\u4E14\u53EA\u80FD\u5F15\u7528\u5F53\u524D\u7248\u672C face-front \u951A\u70B9");
    }
    if (LATER_CANONICAL_ROLES.has(role) && !hasExactRoles(approvedReferences, ["face-front", "body-front"])) {
      throw new Error(`${role} \u5FC5\u987B\u4E14\u53EA\u80FD\u5F15\u7528\u5F53\u524D\u7248\u672C face-front \u4E0E body-front \u951A\u70B9`);
    }
    return;
  }
  if (isStressTestRole(role)) {
    if (version.status !== "testing" || !hasCompleteCanonicalSet(version, project.assets)) {
      throw new Error("\u538B\u529B\u6D4B\u8BD5\u53EA\u80FD\u5728\u89C4\u8303\u8D44\u4EA7\u5B8C\u6574\u7684 testing \u7248\u672C\u4E2D\u751F\u6210");
    }
    if (changeSet.category !== STRESS_CATEGORY[role]) throw new Error("\u538B\u529B\u6D4B\u8BD5\u53D8\u5316\u7C7B\u522B\u4E0E\u89D2\u8272\u4E0D\u5339\u914D");
  } else {
    if (version.status !== "locked") throw new Error("\u6D3E\u751F\u8D44\u4EA7\u53EA\u80FD\u4ECE\u5DF2\u9501\u5B9A\u7248\u672C\u521B\u5EFA");
    if (changeSet.category === "identity") throw new Error("\u8EAB\u4EFD\u53D8\u5316\u5FC5\u987B\u521B\u5EFA\u65B0\u7248\u672C");
    if (role === "expression" && changeSet.category !== "expression") {
      throw new Error("\u8868\u60C5\u8D44\u4EA7\u5FC5\u987B\u4F7F\u7528 expression \u53D8\u5316\u7C7B\u522B");
    }
    if (role === "wardrobe-state" && changeSet.category !== "wardrobe") {
      throw new Error("\u670D\u88C5\u8D44\u4EA7\u5FC5\u987B\u4F7F\u7528 wardrobe \u53D8\u5316\u7C7B\u522B");
    }
    if (role === "action-reference" && changeSet.category !== "action") {
      throw new Error("\u52A8\u4F5C\u8D44\u4EA7\u5FC5\u987B\u4F7F\u7528 action \u53D8\u5316\u7C7B\u522B");
    }
    if (role.startsWith("model-card-") && !["camera", "action"].includes(changeSet.category)) {
      throw new Error("\u6A21\u5361\u8D44\u4EA7\u53EA\u80FD\u58F0\u660E camera \u6216 action \u5355\u53D8\u91CF\u53D8\u5316");
    }
  }
  if (!parent || parent.versionId !== version.id) throw new Error("\u7236\u8D44\u4EA7\u5FC5\u987B\u662F\u540C\u7248\u672C\u7684\u53EF\u7528\u6279\u51C6\u8D44\u4EA7");
  if (approvedReferences.some((asset) => asset.versionId !== version.id)) {
    throw new Error("\u538B\u529B\u6D4B\u8BD5\u548C\u6D3E\u751F\u8D44\u4EA7\u53EA\u80FD\u5F15\u7528\u540C\u7248\u672C\u6279\u51C6\u8D44\u4EA7");
  }
  if (isStressTestRole(role) && !hasExactRoles(approvedReferences, ["face-front", "body-front"])) {
    throw new Error("\u538B\u529B\u6D4B\u8BD5\u5FC5\u987B\u4E14\u53EA\u80FD\u5F15\u7528\u5F53\u524D\u7248\u672C face-front \u4E0E body-front \u951A\u70B9");
  }
  if (!isStressTestRole(role)) {
    const faceReferences = approvedReferences.filter((asset) => asset.role === "face-front");
    const bodyReferences = approvedReferences.filter((asset) => asset.role === "body-front");
    if (faceReferences.length > 1 || bodyReferences.length > 1) {
      throw new Error("\u6D3E\u751F\u8D44\u4EA7\u6700\u591A\u53EA\u80FD\u5F15\u7528\u4E00\u4E2A face-front \u548C\u4E00\u4E2A body-front \u951A\u70B9");
    }
    const allowedIds = /* @__PURE__ */ new Set([
      parent.id,
      ...approvedReferences.filter((asset) => asset.role === "face-front" || asset.role === "body-front").map((asset) => asset.id)
    ]);
    if (approvedReferences.some((asset) => !allowedIds.has(asset.id))) {
      throw new Error("\u6D3E\u751F\u8D44\u4EA7\u53EA\u80FD\u5F15\u7528\u7236\u8D44\u4EA7\u4EE5\u53CA\u5F53\u524D\u7248\u672C face-front\u3001body-front \u951A\u70B9");
    }
    if (BODY_ANCHORED_DERIVED_ROLES.has(role) && (!approvedReferences.some((asset) => asset.role === "face-front") || !approvedReferences.some((asset) => asset.role === "body-front"))) {
      throw new Error(`${role} \u5FC5\u987B\u540C\u65F6\u5F15\u7528\u5F53\u524D\u7248\u672C face-front \u4E0E body-front \u8EAB\u6750\u951A\u70B9`);
    }
  }
}

// server/routes/generate.ts
var IMAGE_SIZES = /* @__PURE__ */ new Set(["1024x1024", "1024x1536", "1536x1024"]);
var IMAGE_QUALITIES = /* @__PURE__ */ new Set(["low", "medium", "high"]);
var CHANGE_CATEGORIES4 = /* @__PURE__ */ new Set([
  "identity",
  "expression",
  "wardrobe",
  "action",
  "condition",
  "background",
  "lighting",
  "camera"
]);
var RequestError2 = class extends Error {
};
function parseJson(value, fallback) {
  if (value === null && fallback !== void 0) return fallback;
  if (typeof value !== "string") throw new RequestError2("\u8BF7\u6C42\u5B57\u6BB5\u683C\u5F0F\u65E0\u6548");
  try {
    return JSON.parse(value);
  } catch {
    throw new RequestError2("\u8BF7\u6C42 JSON \u5B57\u6BB5\u65E0\u6548");
  }
}
function requiredText(form, key) {
  const value = form.get(key);
  if (typeof value !== "string" || !value.trim()) throw new RequestError2(`\u7F3A\u5C11\u5B57\u6BB5\uFF1A${key}`);
  return value.trim();
}
function optionalText(form, key, limit) {
  const value = form.get(key);
  if (value === null) return void 0;
  if (typeof value !== "string") throw new RequestError2(`${key} \u5B57\u6BB5\u683C\u5F0F\u65E0\u6548`);
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length > limit) throw new RequestError2(`${key} \u4E0D\u5F97\u8D85\u8FC7 ${limit} \u4E2A\u5B57\u7B26`);
  return cleaned || void 0;
}
function parseChangeSet2(form) {
  const value = parseJson(form.get("changeSet"));
  if (typeof value !== "object" || value === null || !("category" in value) || typeof value.category !== "string" || !CHANGE_CATEGORIES4.has(value.category) || !("instruction" in value) || typeof value.instruction !== "string" || !("sourceStateId" in value) || typeof value.sourceStateId !== "string" || !("targetStateId" in value) || typeof value.targetStateId !== "string") throw new RequestError2("\u53D8\u5316\u5B57\u6BB5\u65E0\u6548");
  return value;
}
function fileExtension(type) {
  return type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
}
function validateSessionFile(file) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new RequestError2("\u53C2\u8003\u56FE\u4EC5\u652F\u6301 PNG\u3001JPEG \u6216 WebP");
  }
  if (file.size > 15 * 1024 * 1024) throw new RequestError2("\u5355\u5F20\u53C2\u8003\u56FE\u4E0D\u5F97\u8D85\u8FC7 15 MB");
}
function registerGenerateRoute(app, provider, registry, integration) {
  app.post("/api/generate", async (context) => {
    try {
      const form = await context.req.formData();
      if (form.get("adultConsent") !== "true" || form.get("rightsConsent") !== "true") {
        return context.json({ error: "\u5FC5\u987B\u786E\u8BA4\u6210\u5E74\u4EBA\u548C\u4F7F\u7528\u6743" }, 400);
      }
      const projectId = requiredText(form, "projectId");
      const versionId = requiredText(form, "versionId");
      const rawRole = requiredText(form, "assetRole");
      if (!isAssetRole(rawRole)) throw new RequestError2("\u8D44\u4EA7\u89D2\u8272\u65E0\u6548");
      const assetRole = rawRole;
      const apiKey = integration ? "" : requiredText(form, "apiKey");
      const baseUrl = integration ? "" : requiredText(form, "baseUrl");
      const model = requiredText(form, "model");
      if (!integration && model !== "gpt-image-2") throw new RequestError2("\u5F53\u524D\u4EC5\u652F\u6301 gpt-image-2");
      const size = typeof form.get("size") === "string" ? form.get("size") : "1024x1536";
      const quality = typeof form.get("quality") === "string" ? form.get("quality") : "medium";
      if (!integration && !IMAGE_SIZES.has(size)) throw new RequestError2("\u56FE\u7247\u5C3A\u5BF8\u65E0\u6548");
      if (!IMAGE_QUALITIES.has(quality)) throw new RequestError2("\u56FE\u7247\u8D28\u91CF\u65E0\u6548");
      const resolved = integration?.resolve(form, assetRole);
      const generationSize = resolved?.size ?? (assetRole === "expression" ? "1024x1024" : size);
      const changeSet = parseChangeSet2(form);
      const baseWardrobeBrief = optionalText(form, "baseWardrobeBrief", 300);
      if (baseWardrobeBrief && assetRole !== "body-front") {
        throw new RequestError2("\u57FA\u7840\u670D\u88C5\u8BF4\u660E\u53EA\u80FD\u7528\u4E8E body-front \u8EAB\u6750\u4E0E\u670D\u88C5\u951A\u70B9");
      }
      const project = await registry.readProject(projectId);
      const version = project.versions.find((item) => item.id === versionId);
      if (!version) throw new RequestError2("\u89D2\u8272\u7248\u672C\u4E0D\u5B58\u5728");
      assertSingleVariableChange(changeSet, version.status);
      const referenceAssetIds = parseJson(form.get("referenceAssetIds"), []);
      if (!Array.isArray(referenceAssetIds) || !referenceAssetIds.every((id) => typeof id === "string")) {
        throw new RequestError2("\u6279\u51C6\u8D44\u4EA7\u5F15\u7528\u65E0\u6548");
      }
      const rawParentAssetId = form.get("parentAssetId");
      if (rawParentAssetId !== null && typeof rawParentAssetId !== "string") {
        throw new RequestError2("\u7236\u8D44\u4EA7\u5B57\u6BB5\u65E0\u6548");
      }
      const parentAssetId = typeof rawParentAssetId === "string" && rawParentAssetId.trim() ? rawParentAssetId.trim() : void 0;
      if (parentAssetId && !referenceAssetIds.includes(parentAssetId)) {
        throw new RequestError2("\u7236\u8D44\u4EA7\u5FC5\u987B\u5305\u542B\u5728\u6279\u51C6\u8D44\u4EA7\u5F15\u7528\u4E2D");
      }
      const sourceFiles = /* @__PURE__ */ new Map();
      const sources = [];
      for (const assetId of referenceAssetIds) {
        const approved = await registry.readApprovedAsset(projectId, assetId);
        const id = `asset:${assetId}`;
        const extension = fileExtension(approved.contentType);
        sourceFiles.set(id, new File(
          [Uint8Array.from(approved.bytes)],
          `${approved.asset.role}.${extension}`,
          { type: approved.contentType }
        ));
        sources.push({ id, kind: "asset", role: approved.asset.role });
      }
      const sessionImages = form.getAll("image").filter((value) => value instanceof File);
      const sessionRoles = form.getAll("imageRole");
      if (sessionImages.length > 4) throw new RequestError2("\u4F1A\u8BDD\u53C2\u8003\u56FE\u6700\u591A 4 \u5F20");
      if (sessionImages.length !== sessionRoles.length) throw new RequestError2("\u6BCF\u5F20\u53C2\u8003\u56FE\u5FC5\u987B\u58F0\u660E\u804C\u8D23");
      for (const [index, file] of sessionImages.entries()) {
        validateSessionFile(file);
        const role = sessionRoles[index];
        if (typeof role !== "string" || !isAssetRole(role)) throw new RequestError2("\u53C2\u8003\u56FE\u804C\u8D23\u65E0\u6548");
        const id = `session:${index}`;
        sourceFiles.set(id, file);
        sources.push({ id, kind: "session", role });
      }
      if (sources.length === 0) {
        return context.json({ error: "\u81F3\u5C11\u9700\u8981\u4E00\u5F20\u4F1A\u8BDD\u53C2\u8003\u56FE\u6216\u4E00\u4E2A\u5DF2\u6279\u51C6\u8D44\u4EA7" }, 400);
      }
      assertAssetOperation({
        project,
        version,
        role: assetRole,
        changeSet,
        ...parentAssetId ? { parentAssetId } : {},
        referenceAssetIds
      });
      const ordered = orderReferenceSources(sources);
      assertGenerationReferenceContract(assetRole, ordered);
      const prompt = compileIdentityPrompt({
        mode: project.mode,
        characterTag: `${project.characterTag}-${version.id}`,
        assetRole,
        immutableDescriptor: version.immutableDescriptor,
        parentStateId: changeSet.sourceStateId,
        referenceRoles: ordered.map((source) => source.role),
        ...baseWardrobeBrief ? { baseWardrobeBrief } : {},
        changeSet
      });
      const images = ordered.map((source) => {
        const file = sourceFiles.get(source.id);
        if (!file) throw new RequestError2("\u53C2\u8003\u8D44\u4EA7\u89E3\u6790\u5931\u8D25");
        return file;
      });
      const result = await provider.editImage({
        apiKey,
        baseUrl,
        model: resolved?.model ?? model,
        ...resolved ? { providerId: resolved.providerId, promptOptimization: resolved.promptOptimization } : {},
        prompt,
        size: generationSize,
        quality: resolved?.quality ?? quality,
        images
      });
      const recipeDraft = {
        compilerVersion: "1.0.0",
        templateId: `${assetRole}-${assetRole === "face-three-quarter" ? "v2" : "v1"}`,
        provider: result.provider,
        model: result.model,
        size: result.size,
        quality: resolved?.quality ?? quality,
        referenceAssetIds: [...referenceAssetIds],
        ...parentAssetId ? { parentAssetId } : {},
        changeSet,
        latencyMs: result.latencyMs,
        completedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      return context.json({ ...result, recipeDraft, promptPreview: prompt });
    } catch (error) {
      if (error instanceof ProviderError) {
        return context.json({ error: error.message }, error.status);
      }
      if (error instanceof RequestError2) return context.json({ error: error.message }, 400);
      if (error instanceof Error && /项目|版本|资产|父|身份|压力测试|配方|引用|状态|模卡|表情|服装|动作|无效/.test(error.message)) {
        return context.json({ error: error.message }, 400);
      }
      return context.json({ error: "\u56FE\u7247\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u53C2\u6570\u540E\u91CD\u8BD5" }, 400);
    }
  });
}

// server/routes/projects.ts
var PROJECT_FIELDS = /* @__PURE__ */ new Set(["mode", "title", "displayName", "optionalProfile"]);
var PROFILE_FIELDS = /* @__PURE__ */ new Set([
  "stageName",
  "heightCm",
  "bustCm",
  "waistCm",
  "hipsCm",
  "shoeSize",
  "contact"
]);
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasUnknownKeys(value, allowed) {
  return Object.keys(value).some((key) => !allowed.has(key));
}
function statusFor(error) {
  return error instanceof Error && /不存在/.test(error.message) ? 404 : 400;
}
function registerProjectRoutes(app, registry) {
  app.get("/api/projects", async (context) => context.json(await registry.listProjects()));
  app.post("/api/projects", async (context) => {
    let body;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "\u9879\u76EE\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
    }
    if (!isRecord3(body) || hasUnknownKeys(body, PROJECT_FIELDS)) {
      return context.json({ error: "\u9879\u76EE\u8BF7\u6C42\u5305\u542B\u672A\u5141\u8BB8\u5B57\u6BB5" }, 400);
    }
    if (body.mode !== "human-model-card" && body.mode !== "realistic-virtual-character") {
      return context.json({ error: "\u9879\u76EE\u6A21\u5F0F\u65E0\u6548" }, 400);
    }
    if (typeof body.title !== "string" || typeof body.displayName !== "string") {
      return context.json({ error: "\u9879\u76EE\u540D\u79F0\u548C\u89D2\u8272\u663E\u793A\u540D\u4E0D\u80FD\u4E3A\u7A7A" }, 400);
    }
    let optionalProfile;
    if (body.optionalProfile !== void 0) {
      if (!isRecord3(body.optionalProfile) || hasUnknownKeys(body.optionalProfile, PROFILE_FIELDS)) {
        return context.json({ error: "\u771F\u4EBA\u8D44\u6599\u5305\u542B\u672A\u5141\u8BB8\u5B57\u6BB5" }, 400);
      }
      if (body.mode !== "human-model-card" && Object.keys(body.optionalProfile).length > 0) {
        return context.json({ error: "\u865A\u62DF\u89D2\u8272\u6A21\u5F0F\u4E0D\u4FDD\u5B58\u771F\u4EBA\u8D44\u6599" }, 400);
      }
      optionalProfile = body.optionalProfile;
    }
    try {
      const project = await registry.createProject({
        mode: body.mode,
        title: body.title,
        displayName: body.displayName,
        ...optionalProfile ? { optionalProfile } : {}
      });
      return context.json(project, 201);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "\u9879\u76EE\u521B\u5EFA\u5931\u8D25" }, 400);
    }
  });
  app.get("/api/projects/:projectId", async (context) => {
    try {
      return context.json(await registry.readProject(context.req.param("projectId")));
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : "\u9879\u76EE\u8BFB\u53D6\u5931\u8D25" },
        statusFor(error)
      );
    }
  });
  app.post("/api/projects/:projectId/transitions", async (context) => {
    let body;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "\u72B6\u6001\u8F6C\u6362\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
    }
    if (!isRecord3(body) || typeof body.action !== "string") {
      return context.json({ error: "\u72B6\u6001\u8F6C\u6362\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
    }
    const projectId = context.req.param("projectId");
    try {
      if (body.action === "create-version" && Object.keys(body).length === 1) {
        return context.json(await registry.createIdentityVersion(projectId), 201);
      }
      if (body.action === "review-stress" && Object.keys(body).every((key) => ["action", "versionId", "role", "assetId", "passed"].includes(key)) && typeof body.versionId === "string" && isStressTestRole(body.role) && typeof body.passed === "boolean" && (body.assetId === void 0 || typeof body.assetId === "string")) {
        return context.json(await registry.recordStressReview({
          projectId,
          versionId: body.versionId,
          role: body.role,
          ...typeof body.assetId === "string" ? { assetId: body.assetId } : {},
          passed: body.passed
        }));
      }
      if (body.action === "lock-version" && Object.keys(body).every((key) => ["action", "versionId"].includes(key)) && typeof body.versionId === "string") {
        return context.json(await registry.lockVersion(projectId, body.versionId));
      }
      return context.json({ error: "\u72B6\u6001\u8F6C\u6362\u52A8\u4F5C\u6216\u5B57\u6BB5\u65E0\u6548" }, 400);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : "\u72B6\u6001\u8F6C\u6362\u5931\u8D25" }, 400);
    }
  });
}

// server/routes/validate-key.ts
function registerValidateKeyRoute(app, provider) {
  app.post("/api/validate-key", async (context) => {
    let body;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
    }
    const apiKey = typeof body.apiKey === "string" ? body.apiKey : "";
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl : "";
    const model = typeof body.model === "string" ? body.model : "";
    if (!apiKey || !baseUrl || !model) return context.json({ error: "\u8BF7\u586B\u5199 Key\u3001Base URL \u548C\u6A21\u578B" }, 400);
    if (model !== "gpt-image-2") return context.json({ error: "\u5F53\u524D\u4EC5\u652F\u6301 gpt-image-2" }, 400);
    try {
      return context.json(await provider.validateKey({ apiKey, baseUrl, model }));
    } catch (error) {
      if (error instanceof ProviderError) return context.json({ error: error.message }, error.status);
      return context.json({ error: error instanceof Error ? error.message : "Key \u68C0\u6D4B\u5931\u8D25" }, 400);
    }
  });
}

// server/storage/project-registry.ts
var import_promises2 = require("node:fs/promises");
var import_node_crypto = require("node:crypto");
var import_node_path4 = require("node:path");
var MAX_IMAGE_BYTES = 30 * 1024 * 1024;
var PROJECT_ID = /^project-[a-f0-9]{12}$/;
var ASSET_ID = /^asset-[a-f0-9]{12}$/;
function randomHex2(length) {
  return (0, import_node_crypto.randomBytes)(Math.ceil(length / 2)).toString("hex").slice(0, length);
}
function assertProjectId(id) {
  if (!PROJECT_ID.test(id)) throw new Error("\u9879\u76EE ID \u65E0\u6548");
}
function assertAssetId(id) {
  if (!ASSET_ID.test(id)) throw new Error("\u8D44\u4EA7 ID \u65E0\u6548");
}
function assertSafeStateId(value) {
  const stateId = value.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(stateId)) {
    throw new Error("\u72B6\u6001 ID \u65E0\u6548");
  }
  return stateId;
}
function detectImage(bytes) {
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("\u56FE\u7247\u89E3\u7801\u540E\u4E0D\u5F97\u8D85\u8FC7 30 MB");
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { extension: "png", contentType: "image/png" };
  }
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  throw new Error("\u6279\u51C6\u8D44\u4EA7\u5FC5\u987B\u662F PNG \u6216 JPEG \u56FE\u7247");
}
function decodeImage(imageB64) {
  if (!imageB64 || imageB64.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 16) {
    throw new Error("\u56FE\u7247\u6570\u636E\u4E3A\u7A7A\u6216\u8FC7\u5927");
  }
  const bytes = Buffer.from(imageB64, "base64");
  detectImage(bytes);
  return bytes;
}
function safeRecipe(recipe, parentAssetId) {
  return {
    compilerVersion: recipe.compilerVersion,
    templateId: recipe.templateId,
    provider: recipe.provider,
    model: recipe.model,
    size: recipe.size,
    quality: recipe.quality,
    referenceAssetIds: [...recipe.referenceAssetIds],
    ...parentAssetId ? { parentAssetId } : {},
    changeSet: { ...recipe.changeSet },
    ...typeof recipe.latencyMs === "number" ? { latencyMs: recipe.latencyMs } : {},
    ...recipe.completedAt ? { completedAt: recipe.completedAt } : {}
  };
}
async function atomicWrite(target, contents, rename2, verify) {
  const temporaryPath = `${target}.tmp-${randomHex2(12)}`;
  await (0, import_promises2.mkdir)((0, import_node_path4.dirname)(target), { recursive: true });
  try {
    await (0, import_promises2.writeFile)(temporaryPath, contents, { flag: "wx" });
    await verify(temporaryPath);
    await rename2(temporaryPath, target);
  } finally {
    await (0, import_promises2.rm)(temporaryPath, { force: true });
  }
}
function createProjectRegistry(rootDir, dependencies = {}) {
  const root = (0, import_node_path4.resolve)(rootDir);
  const rename2 = dependencies.rename ?? import_promises2.rename;
  const mutationTails = /* @__PURE__ */ new Map();
  async function withProjectMutation(projectId, operation) {
    const previous = mutationTails.get(projectId) ?? Promise.resolve();
    let release = () => {
    };
    const current = new Promise((resolveTail) => {
      release = resolveTail;
    });
    mutationTails.set(projectId, current);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (mutationTails.get(projectId) === current) mutationTails.delete(projectId);
    }
  }
  const projectDirectory = (projectId) => {
    assertProjectId(projectId);
    return (0, import_node_path4.join)(root, projectId);
  };
  const manifestPath = (projectId) => (0, import_node_path4.join)(projectDirectory(projectId), "project.json");
  async function saveProject(project) {
    const errors = validateCharacterProject(project);
    if (errors.length) throw new Error(`\u9879\u76EE\u6570\u636E\u65E0\u6548\uFF1A${errors.join("\uFF1B")}`);
    assertProjectId(project.id);
    const serialized = `${JSON.stringify(project, null, 2)}
`;
    await atomicWrite(manifestPath(project.id), serialized, rename2, async (temporaryPath) => {
      const parsed = JSON.parse(await (0, import_promises2.readFile)(temporaryPath, "utf8"));
      const temporaryErrors = validateCharacterProject(parsed);
      if (temporaryErrors.length) throw new Error(`\u4E34\u65F6\u9879\u76EE\u6821\u9A8C\u5931\u8D25\uFF1A${temporaryErrors.join("\uFF1B")}`);
    });
  }
  async function readProject(id) {
    assertProjectId(id);
    let parsed;
    try {
      parsed = JSON.parse(await (0, import_promises2.readFile)(manifestPath(id), "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") throw new Error("\u9879\u76EE\u4E0D\u5B58\u5728");
      throw error;
    }
    const errors = validateCharacterProject(parsed);
    if (errors.length) throw new Error(`\u9879\u76EE\u6570\u636E\u635F\u574F\uFF1A${errors.join("\uFF1B")}`);
    return parsed;
  }
  async function createProject(input) {
    await (0, import_promises2.mkdir)(root, { recursive: true });
    const project = createDraftProject(input);
    await saveProject(project);
    return project;
  }
  async function listProjects() {
    await (0, import_promises2.mkdir)(root, { recursive: true });
    const entries = await (0, import_promises2.readdir)(root, { withFileTypes: true });
    const projects = await Promise.all(entries.filter((entry) => entry.isDirectory() && PROJECT_ID.test(entry.name)).map(async (entry) => {
      try {
        return await readProject(entry.name);
      } catch {
        return void 0;
      }
    }));
    return projects.filter((project) => Boolean(project)).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }
  async function saveApprovedAssetUnlocked(input) {
    assertProjectId(input.projectId);
    if (!isAssetRole(input.assetRole)) throw new Error("\u8D44\u4EA7\u89D2\u8272\u65E0\u6548");
    const stateId = assertSafeStateId(input.stateId);
    const project = await readProject(input.projectId);
    const version = project.versions.find((item) => item.id === input.versionId);
    if (!version) throw new Error("\u89D2\u8272\u7248\u672C\u4E0D\u5B58\u5728");
    if (input.recipe.changeSet.targetStateId !== stateId) {
      throw new Error("\u8D44\u4EA7\u72B6\u6001 ID \u4E0E\u751F\u6210\u914D\u65B9\u76EE\u6807\u72B6\u6001\u4E0D\u4E00\u81F4");
    }
    const isDerived = !isCanonicalRole(input.assetRole) && !isStressTestRole(input.assetRole);
    let parentAsset;
    if (input.parentAssetId) {
      assertAssetId(input.parentAssetId);
      parentAsset = project.assets.find((asset2) => asset2.id === input.parentAssetId);
      if (!parentAsset || parentAsset.status !== "ready") throw new Error("\u7236\u8D44\u4EA7\u4E0D\u5B58\u5728\u6216\u4E0D\u53EF\u7528");
    }
    assertAssetOperation({
      project,
      version,
      role: input.assetRole,
      changeSet: input.recipe.changeSet,
      ...input.parentAssetId ? { parentAssetId: input.parentAssetId } : {},
      referenceAssetIds: input.recipe.referenceAssetIds
    });
    const bytes = decodeImage(input.imageB64);
    const image = detectImage(bytes);
    const assetId = `asset-${randomHex2(12)}`;
    const fileName = `assets/${assetId}.${image.extension}`;
    const target = (0, import_node_path4.join)(projectDirectory(input.projectId), ...fileName.split("/"));
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const recipe = safeRecipe({ ...input.recipe, completedAt: input.recipe.completedAt ?? now }, input.parentAssetId);
    const asset = {
      id: assetId,
      versionId: input.versionId,
      role: input.assetRole,
      stateId,
      status: "ready",
      ...input.parentAssetId ? { parentAssetId: input.parentAssetId } : {},
      changeSet: { ...recipe.changeSet },
      fileName,
      recipe
    };
    await atomicWrite(target, bytes, rename2, async (temporaryPath) => {
      detectImage(await (0, import_promises2.readFile)(temporaryPath));
    });
    try {
      project.assets.push(asset);
      if (isCanonicalRole(asset.role) && !version.canonicalAssetIds.includes(asset.id)) {
        version.canonicalAssetIds.push(asset.id);
        if (hasCompleteCanonicalSet(version, project.assets)) version.status = "testing";
      }
      if (isDerived && !version.derivedStateIds.includes(stateId)) {
        version.derivedStateIds.push(stateId);
      }
      project.updatedAt = now;
      await saveProject(project);
    } catch (error) {
      await (0, import_promises2.rm)(target, { force: true });
      throw error;
    }
    return asset;
  }
  async function saveApprovedAsset(input) {
    return withProjectMutation(input.projectId, () => saveApprovedAssetUnlocked(input));
  }
  async function createIdentityVersion(projectId) {
    assertProjectId(projectId);
    return withProjectMutation(projectId, async () => {
      const next = createNextVersion(await readProject(projectId));
      await saveProject(next);
      return next;
    });
  }
  async function recordStressReview(input) {
    assertProjectId(input.projectId);
    return withProjectMutation(input.projectId, async () => {
      const project = await readProject(input.projectId);
      const version = project.versions.find((item) => item.id === input.versionId);
      if (!version || version.id !== project.currentVersionId) throw new Error("\u53EA\u80FD\u5BA1\u6838\u5F53\u524D\u89D2\u8272\u7248\u672C");
      if (version.status !== "testing") throw new Error("\u53EA\u6709 testing \u7248\u672C\u53EF\u4EE5\u8BB0\u5F55\u538B\u529B\u6D4B\u8BD5");
      version.stressTests = version.stressTests.filter((result) => result.role !== input.role);
      if (input.passed) {
        const asset = project.assets.find((item) => item.id === input.assetId);
        if (!asset || asset.versionId !== version.id || asset.role !== input.role || asset.status !== "ready") {
          throw new Error("\u538B\u529B\u6D4B\u8BD5\u5FC5\u987B\u5F15\u7528\u540C\u7248\u672C\u3001\u540C\u89D2\u8272\u7684\u53EF\u7528\u6279\u51C6\u8D44\u4EA7");
        }
        version.stressTests.push({
          role: input.role,
          assetId: asset.id,
          passed: true,
          reviewedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      project.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await saveProject(project);
      return project;
    });
  }
  async function lockVersion(projectId, versionId) {
    assertProjectId(projectId);
    return withProjectMutation(projectId, async () => {
      const project = await readProject(projectId);
      const version = project.versions.find((item) => item.id === versionId);
      if (!version || version.id !== project.currentVersionId) throw new Error("\u53EA\u80FD\u9501\u5B9A\u5F53\u524D\u89D2\u8272\u7248\u672C");
      if (version.status !== "testing" || !canLockVersion(version, project.assets)) {
        throw new Error("\u89C4\u8303\u8D44\u4EA7\u548C\u771F\u5B9E\u538B\u529B\u6D4B\u8BD5\u672A\u5168\u90E8\u901A\u8FC7\uFF0C\u4E0D\u80FD\u9501\u5B9A\u7248\u672C");
      }
      version.status = "locked";
      version.lockedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (version.createdFromVersionId) {
        const previous = project.versions.find((item) => item.id === version.createdFromVersionId);
        if (previous?.status === "locked") previous.status = "superseded";
      }
      project.updatedAt = version.lockedAt;
      await saveProject(project);
      return project;
    });
  }
  async function readApprovedAsset(projectId, assetId) {
    assertProjectId(projectId);
    assertAssetId(assetId);
    const project = await readProject(projectId);
    const asset = project.assets.find((item) => item.id === assetId && item.status === "ready");
    if (!asset?.fileName) throw new Error("\u6279\u51C6\u8D44\u4EA7\u4E0D\u5B58\u5728");
    const expectedPrefix = `assets/${assetId}.`;
    if (!asset.fileName.startsWith(expectedPrefix) || !/\.(png|jpg)$/.test(asset.fileName)) {
      throw new Error("\u8D44\u4EA7\u6587\u4EF6\u8DEF\u5F84\u65E0\u6548");
    }
    const bytes = await (0, import_promises2.readFile)((0, import_node_path4.join)(projectDirectory(projectId), ...asset.fileName.split("/")));
    const image = detectImage(bytes);
    return { asset, bytes, contentType: image.contentType };
  }
  return {
    createProject,
    saveProject,
    readProject,
    listProjects,
    saveApprovedAsset,
    readApprovedAsset,
    createIdentityVersion,
    recordStressReview,
    lockVersion
  };
}

// server/app.ts
function createApp(dependencies = {}) {
  const app = new Hono3();
  const provider = dependencies.provider ?? create147Provider();
  const projectRoot = dependencies.projectRoot ?? (0, import_node_path5.join)(process.cwd(), "projects");
  const projectRegistry = dependencies.projectRegistry ?? createProjectRegistry(projectRoot);
  app.get(
    "/api/health",
    (context) => context.json({ ok: true, app: "character-model-card-studio" })
  );
  app.use("/api/*", async (context, next) => {
    if (!(/* @__PURE__ */ new Set(["POST", "PUT", "PATCH", "DELETE"])).has(context.req.method)) return next();
    if (context.req.header("Sec-Fetch-Site") === "cross-site") {
      return context.json({ error: "\u62D2\u7EDD\u8DE8\u7AD9\u8BF7\u6C42" }, 403);
    }
    const origin = context.req.header("Origin");
    if (origin) {
      let allowed = false;
      try {
        const parsed = new URL(origin);
        allowed = parsed.protocol === "http:" && (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") && (dependencies.integration ? parsed.origin === new URL(context.req.url).origin : parsed.port === "4810");
      } catch {
        allowed = false;
      }
      if (!allowed) return context.json({ error: "\u8BF7\u6C42\u6765\u6E90\u65E0\u6548" }, 403);
    }
    return next();
  });
  const tooLarge = (context) => context.json({ error: "\u8BF7\u6C42\u4F53\u8FC7\u5927" }, 413);
  app.use("/api/validate-key", bodyLimit({ maxSize: 16 * 1024, onError: tooLarge }));
  app.use("/api/generate", bodyLimit({ maxSize: 64 * 1024 * 1024, onError: tooLarge }));
  app.use("/api/projects", bodyLimit({ maxSize: 256 * 1024, onError: tooLarge }));
  app.use("/api/projects/:projectId", bodyLimit({ maxSize: 256 * 1024, onError: tooLarge }));
  app.use(
    "/api/projects/:projectId/transitions",
    bodyLimit({ maxSize: 16 * 1024, onError: tooLarge })
  );
  app.use(
    "/api/projects/:projectId/assets",
    bodyLimit({ maxSize: 41 * 1024 * 1024, onError: tooLarge })
  );
  app.use(
    "/api/projects/:projectId/exports",
    bodyLimit({ maxSize: 41 * 1024 * 1024, onError: tooLarge })
  );
  if (!dependencies.integration) registerValidateKeyRoute(app, provider);
  registerProjectRoutes(app, projectRegistry);
  registerGenerateRoute(app, provider, projectRegistry, dependencies.integration);
  registerAssetRoutes(app, projectRegistry);
  registerExportRoutes(app, projectRegistry, projectRoot);
  const unknownApiRoute = (context) => context.json({ error: "API \u8DEF\u7531\u4E0D\u5B58\u5728" }, 404);
  app.all("/api", unknownApiRoute);
  app.all("/api/*", unknownApiRoute);
  if (dependencies.staticRoot) {
    app.use("/assets/*", serveStatic({ root: dependencies.staticRoot }));
    app.get("*", async (context, next) => serveStatic({ root: dependencies.staticRoot, path: "index.html" })(context, next));
  }
  return app;
}

// server/embedded.ts
var json2 = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
async function limitedForm(request, limit) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("\u8BF7\u6C42\u4F53\u4E3A\u7A7A");
  const chunks = [];
  let size = 0;
  for (; ; ) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error("\u8BF7\u6C42\u4F53\u8FC7\u5927");
    }
    chunks.push(part.value);
  }
  return new Response(Buffer.concat(chunks), { headers: { "content-type": request.headers.get("content-type") || "" } }).formData();
}
function createCharacterService(deps) {
  const registry = createProjectRegistry(deps.projectRoot);
  const tasks = /* @__PURE__ */ new Map();
  const requestIds = /* @__PURE__ */ new Map();
  const provider = { validateKey: async () => ({ valid: true, modelAvailable: true }), editImage: deps.generate };
  const app = createApp({ projectRoot: deps.projectRoot, projectRegistry: registry, provider, integration: { resolve(form, role) {
    const providerId = String(form.get("providerId"));
    const model = String(form.get("model"));
    const resolution = String(form.get("resolution"));
    const quality = String(form.get("quality") ?? "medium");
    if (!["default", "volc"].includes(providerId) || MODEL_CHANNELS[model] !== providerId) throw new Error("\u56FE\u7247\u6E20\u9053\u6216\u6A21\u578B\u65E0\u6548");
    const configured = deps.getOptions().providers[providerId];
    if (!configured?.configured || !configured.models.some((m) => m.id === model)) throw new Error("\u6240\u9009\u6E20\u9053\u5C1A\u672A\u914D\u7F6E\u6216\u6A21\u578B\u4E0D\u53EF\u7528");
    if (!(providerId === "volc" ? ["1K", "1.5K", "2K"] : ["1K", "2K", "4K"]).includes(resolution)) throw new Error("\u5206\u8FA8\u7387\u65E0\u6548");
    if (!["medium", "high"].includes(quality)) throw new Error("\u753B\u8D28\u65E0\u6548");
    const ratio = ["expression", "face-front"].includes(role) ? "1:1" : "2:3";
    return { providerId, model, size: deps.sizeFor(model, ratio, resolution), quality: providerId === "volc" ? "medium" : quality, promptOptimization: form.get("promptOptimization") === "fast" ? "fast" : "standard" };
  } } });
  async function fetchHandler(request) {
    const url = new URL(request.url);
    const route = url.pathname.replace(/^\/api\/character(?=\/)/, "/api");
    if (request.headers.get("sec-fetch-site") === "cross-site") return json2({ error: "\u62D2\u7EDD\u8DE8\u7AD9\u8BF7\u6C42" }, 403);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json2({ error: "\u8BF7\u6C42\u6765\u6E90\u65E0\u6548" }, 403);
    try {
      if (route === "/api/options" && request.method === "GET") return json2(deps.getOptions());
      if (route === "/api/validate-key") return json2({ error: "\u8BF7\u4F7F\u7528 Gugu \u63A5\u53E3\u8BBE\u7F6E" }, 404);
      for (const [id, t] of tasks) if (t.status !== "running" && Date.now() - t.created > 2 * 60 * 60 * 1e3) tasks.delete(id);
      for (const [key, id] of requestIds) if (!tasks.has(id)) requestIds.delete(key);
      const taskMatch = /^\/api\/tasks\/([\da-f-]+)$/.exec(route);
      if (taskMatch && request.method === "DELETE") {
        const task = tasks.get(taskMatch[1]);
        if (task?.status === "running") return json2({ error: "\u751F\u6210\u4E2D\u7684\u4EFB\u52A1\u4E0D\u80FD\u4E22\u5F03" }, 409);
        tasks.delete(taskMatch[1]);
        return json2({ discarded: true });
      }
      if (taskMatch && request.method === "GET") {
        const task = tasks.get(taskMatch[1]);
        return task ? json2({ id: task.id, status: task.status, result: task.result, error: task.error }) : json2({ error: "\u5019\u9009\u4EFB\u52A1\u5DF2\u8FC7\u671F\u6216\u670D\u52A1\u5DF2\u91CD\u542F\u3002\u8BF7\u5148\u6838\u5BF9\u4E0A\u6E38\u4EFB\u52A1\uFF0C\u518D\u624B\u52A8\u751F\u6210\u3002" }, 404);
      }
      if (route === "/api/generate" && request.method === "POST") {
        if (Number(request.headers.get("content-length")) > 64 * 1024 * 1024) return json2({ error: "\u8BF7\u6C42\u4F53\u8FC7\u5927" }, 413);
        const form = await limitedForm(request, 64 * 1024 * 1024);
        const key = String(form.get("clientRequestId") || "");
        if (!/^[\da-f-]{36}$/.test(key)) return json2({ error: "\u8BF7\u6C42\u6807\u8BC6\u65E0\u6548" }, 400);
        const existing = requestIds.get(key);
        if (existing) return json2({ id: existing }, 202);
        const pending = [...tasks.values()].filter((t) => !t.accepted && t.status !== "failed");
        if (pending.filter((t) => t.status === "running").length >= 8 || pending.reduce((n, t) => n + (t.result?.imageB64?.length || 0), 0) > 192 * 1024 * 1024) return json2({ error: "\u5F85\u5BA1\u6838\u56FE\u7247\u8FC7\u591A\uFF0C\u8BF7\u5148\u63A5\u53D7\u5DF2\u6709\u7ED3\u679C\u6216\u91CD\u65B0\u6253\u5F00\u5DE5\u4F5C\u533A" }, 429);
        const task = { id: (0, import_node_crypto2.randomUUID)(), status: "running", created: Date.now(), projectId: String(form.get("projectId")), versionId: String(form.get("versionId")), role: String(form.get("assetRole")), parentAssetId: String(form.get("parentAssetId") || "") || void 0 };
        tasks.set(task.id, task);
        requestIds.set(key, task.id);
        const upstreamUrl = new URL(request.url);
        upstreamUrl.pathname = "/api/generate";
        const internal = new Request(upstreamUrl, { method: "POST", body: form });
        void Promise.resolve(app.fetch(internal)).then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "\u56FE\u7247\u751F\u6210\u5931\u8D25");
          task.result = payload;
          task.status = "succeeded";
        }).catch((error) => {
          task.status = "failed";
          task.error = error instanceof Error ? error.message : "\u56FE\u7247\u751F\u6210\u5931\u8D25";
        });
        return json2({ id: task.id }, 202);
      }
      const accept = /^\/api\/projects\/(project-[a-f0-9]{12})\/assets$/.exec(route);
      if (accept && request.method === "POST") {
        const body = await request.json();
        if (Object.keys(body).some((k) => k !== "candidateId")) return json2({ error: "\u4EC5\u80FD\u63A5\u53D7\u670D\u52A1\u7AEF\u751F\u6210\u7684\u5019\u9009\u56FE" }, 400);
        const task = tasks.get(String(body.candidateId));
        if (!task || task.projectId !== accept[1] || task.status !== "succeeded") return json2({ error: "\u5019\u9009\u56FE\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F" }, 400);
        if (task.accepted) return json2(task.accepted, 201);
        if (!task.accepting) task.accepting = (async () => {
          const recipe = task.result.recipeDraft;
          const asset = await registry.saveApprovedAsset({ projectId: task.projectId, versionId: task.versionId, assetRole: task.role, stateId: recipe.changeSet.targetStateId, parentAssetId: task.parentAssetId, imageB64: task.result.imageB64, recipe });
          task.accepted = asset;
          task.result = void 0;
          return asset;
        })().catch((error) => {
          task.accepting = void 0;
          throw error;
        });
        return json2(await task.accepting, 201);
      }
      const exportMatch = /^\/api\/projects\/(project-[a-f0-9]{12})\/exports$/.exec(route);
      if (exportMatch && request.method === "POST") {
        const body = await request.json();
        if (body.kind !== "model-pack" || typeof body.versionId !== "string") return json2({ error: "\u5BFC\u51FA\u53C2\u6570\u65E0\u6548" }, 400);
        const batch = "export-" + (0, import_node_crypto2.randomUUID)();
        const pack = await assembleModelPack({ projectId: exportMatch[1], versionId: body.versionId, includeBodyOnly: false }, registry, (0, import_node_path6.join)(deps.projectRoot, exportMatch[1], "exports", batch));
        const entries = {};
        for (const file of pack.relativeFiles) entries[file] = new Uint8Array(await (0, import_promises3.readFile)((0, import_node_path6.join)(pack.directory, file)));
        const filename = batch + ".zip";
        await (0, import_promises3.writeFile)((0, import_node_path6.join)(deps.projectRoot, exportMatch[1], "exports", filename), zipSync(entries));
        return json2({ exportId: pack.exportId, kind: pack.kind, relativeFiles: pack.relativeFiles, downloadUrl: `/api/character/projects/${exportMatch[1]}/exports/${filename}` }, 201);
      }
      const download = /^\/api\/projects\/(project-[a-f0-9]{12})\/exports\/(export-[a-f0-9-]+\.zip)$/.exec(route);
      if (download && request.method === "GET") return new Response(new Uint8Array(await (0, import_promises3.readFile)((0, import_node_path6.join)(deps.projectRoot, download[1], "exports", download[2]))), { headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${download[2]}"`, "cache-control": "no-store" } });
      if (route === "/api/import" && request.method === "POST") {
        const form = await limitedForm(request, 128 * 1024 * 1024);
        const files = form.getAll("files").filter((f) => f instanceof File);
        const manifest = files.find((f) => f.name === "project.json");
        if (!manifest || manifest.size > 8 * 1024 * 1024 || files.length > 500) return json2({ error: "\u8BF7\u9009\u62E9\u5305\u542B project.json \u548C assets \u7684\u5355\u4E2A\u9879\u76EE\u76EE\u5F55" }, 400);
        const project = JSON.parse(await manifest.text());
        const checked = validateCharacterProject(project);
        if (checked.length || !/^project-[a-f0-9]{12}$/.test(project.id)) return json2({ error: "\u9879\u76EE\u7ED3\u6784\u65E0\u6548\uFF0C\u65E0\u6CD5\u5BFC\u5165" }, 400);
        const target = (0, import_node_path6.join)(deps.projectRoot, project.id);
        try {
          await (0, import_promises3.readFile)((0, import_node_path6.join)(target, "project.json"));
          return json2({ error: "\u8BE5\u9879\u76EE\u5DF2\u5B58\u5728\uFF0C\u4E0D\u4F1A\u8986\u76D6" }, 409);
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
        const staging = (0, import_node_path6.join)(deps.projectRoot, ".import-" + (0, import_node_crypto2.randomUUID)());
        await (0, import_promises3.mkdir)((0, import_node_path6.join)(staging, "assets"), { recursive: true });
        try {
          for (const asset of project.assets) {
            if (!asset.fileName || !new RegExp(`^assets/${asset.id}\\.(png|jpg)$`).test(asset.fileName)) throw new Error("\u8D44\u4EA7\u6587\u4EF6\u540D\u65E0\u6548");
            const file = files.find((f) => f.name === (0, import_node_path6.basename)(asset.fileName));
            if (!file || file.size > 30 * 1024 * 1024) throw new Error("\u7F3A\u5C11\u8D44\u4EA7\u6587\u4EF6\u6216\u8D44\u4EA7\u8FC7\u5927");
            const bytes = Buffer.from(await file.arrayBuffer());
            const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
            const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
            if (!png && !jpg) throw new Error("\u8D44\u4EA7\u56FE\u7247\u683C\u5F0F\u65E0\u6548");
            await (0, import_promises3.writeFile)((0, import_node_path6.join)(staging, "assets", (0, import_node_path6.basename)(asset.fileName)), bytes, { flag: "wx" });
          }
          await (0, import_promises3.writeFile)((0, import_node_path6.join)(staging, "project.json"), JSON.stringify(project, null, 2));
          await (0, import_promises3.rename)(staging, target);
          return json2(await registry.readProject(project.id), 201);
        } catch (error) {
          await (0, import_promises3.rm)(staging, { recursive: true, force: true });
          throw error;
        }
      }
      url.pathname = route;
      return await app.fetch(new Request(url, request));
    } catch (error) {
      return json2({ error: error.code === "ENOENT" ? "\u6587\u4EF6\u4E0D\u5B58\u5728" : error.message || "\u89D2\u8272\u5DE5\u4F5C\u5BA4\u8BF7\u6C42\u5931\u8D25" }, 400);
    }
  }
  return { fetch: fetchHandler, listener: getRequestListener(fetchHandler), registry };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCharacterService
});
