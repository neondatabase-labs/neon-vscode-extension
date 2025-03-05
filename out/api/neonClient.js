"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNeonApiClient = createNeonApiClient;
const api_client_1 = require("@neondatabase/api-client");
/**
 * Creates a Neon API client using the provided token set
 * @param tokenSet The OAuth token set
 * @returns A configured Neon API client
 */
function createNeonApiClient(tokenSet) {
    if (!tokenSet.access_token) {
        throw new Error('No access token available');
    }
    return (0, api_client_1.createApiClient)({
        apiKey: tokenSet.access_token
    });
}
//# sourceMappingURL=neonClient.js.map