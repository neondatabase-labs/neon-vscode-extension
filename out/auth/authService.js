"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.refreshToken = exports.TokenSet = exports.defaultClientID = void 0;
const openid_client_1 = require("openid-client");
Object.defineProperty(exports, "TokenSet", { enumerable: true, get: function () { return openid_client_1.TokenSet; } });
const http_1 = require("http");
const fs_1 = require("fs");
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
// oauth server timeouts
const SERVER_TIMEOUT = 10000;
// where to wait for incoming redirect request from oauth server to arrive
const REDIRECT_URI = (port) => `http://127.0.0.1:${port}/callback`;
// These scopes cannot be cancelled, they are always needed.
const ALWAYS_PRESENT_SCOPES = ['openid', 'offline', 'offline_access'];
const NEONCTL_SCOPES = [
    ...ALWAYS_PRESENT_SCOPES,
    'urn:neoncloud:projects:create',
    'urn:neoncloud:projects:read',
    'urn:neoncloud:projects:update',
    'urn:neoncloud:projects:delete',
    'urn:neoncloud:orgs:create',
    'urn:neoncloud:orgs:read',
    'urn:neoncloud:orgs:update',
    'urn:neoncloud:orgs:delete',
    'urn:neoncloud:orgs:permission',
];
const AUTH_TIMEOUT_SECONDS = 60;
exports.defaultClientID = 'neonctl';
openid_client_1.custom.setHttpOptionsDefaults({
    timeout: SERVER_TIMEOUT,
});
const refreshToken = async ({ oauthHost, clientId }, tokenSet) => {
    console.debug('Discovering oauth server');
    const issuer = await openid_client_1.Issuer.discover(oauthHost);
    const neonOAuthClient = new issuer.Client({
        token_endpoint_auth_method: 'none',
        client_id: clientId,
        response_types: ['code'],
    });
    return await neonOAuthClient.refresh(tokenSet);
};
exports.refreshToken = refreshToken;
const auth = async ({ oauthHost, clientId }) => {
    console.debug('Discovering oauth server');
    const issuer = await openid_client_1.Issuer.discover(oauthHost);
    //
    // Start HTTP server and wait till /callback is hit
    //
    console.debug('Starting HTTP Server for callback');
    const server = (0, http_1.createServer)();
    server.listen(0, '127.0.0.1', function () {
        console.debug(`Listening on port ${this.address().port}`);
    });
    await new Promise((resolve) => server.once('listening', resolve));
    const listen_port = server.address().port;
    const neonOAuthClient = new issuer.Client({
        token_endpoint_auth_method: 'none',
        client_id: clientId,
        redirect_uris: [REDIRECT_URI(listen_port)],
        response_types: ['code'],
    });
    // https://datatracker.ietf.org/doc/html/rfc6819#section-4.4.1.8
    const state = openid_client_1.generators.state();
    // we store the code_verifier in memory
    const codeVerifier = openid_client_1.generators.codeVerifier();
    const codeChallenge = openid_client_1.generators.codeChallenge(codeVerifier);
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Authentication timed out after ${AUTH_TIMEOUT_SECONDS} seconds`));
        }, AUTH_TIMEOUT_SECONDS * 1000);
        const onRequest = async (request, response) => {
            //
            // Wait for callback and follow oauth flow.
            //
            if (!request.url?.startsWith('/callback')) {
                response.writeHead(404);
                response.end();
                return;
            }
            // process the CORS preflight OPTIONS request
            if (request.method === 'OPTIONS') {
                response.writeHead(200, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST',
                    'Access-Control-Allow-Headers': 'Content-Type',
                });
                response.end();
                return;
            }
            console.debug(`Callback received: ${request.url}`);
            const params = neonOAuthClient.callbackParams(request);
            const tokenSet = await neonOAuthClient.callback(REDIRECT_URI(listen_port), params, {
                code_verifier: codeVerifier,
                state,
            });
            response.writeHead(200, { 'Content-Type': 'text/html' });
            const callbackHtmlPath = path.join(__dirname, 'callback.html');
            (0, fs_1.createReadStream)(callbackHtmlPath).pipe(response);
            clearTimeout(timer);
            resolve(tokenSet);
            server.close();
        };
        server.on('request', (req, res) => {
            void onRequest(req, res);
        });
        //
        // Open browser to let user authenticate
        //
        const scopes = clientId == exports.defaultClientID ? NEONCTL_SCOPES : ALWAYS_PRESENT_SCOPES;
        const authUrl = neonOAuthClient.authorizationUrl({
            scope: scopes.join(' '),
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });
        vscode.window.showInformationMessage('Awaiting authentication in web browser.');
        console.log(`Auth Url: ${authUrl}`);
        vscode.env.openExternal(vscode.Uri.parse(authUrl));
    });
};
exports.auth = auth;
//# sourceMappingURL=authService.js.map