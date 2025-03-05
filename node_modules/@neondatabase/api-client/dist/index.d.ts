export * from './api.gen';
import { Api, type ApiConfig } from './api.gen';
export declare const createApiClient: <SecurityDataType = unknown>(config: ApiConfig<SecurityDataType> & {
    apiKey: string | null;
}) => Api<SecurityDataType>;
