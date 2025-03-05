export * from './api.gen';

import { Api, type ApiConfig } from './api.gen';

export const createApiClient = <SecurityDataType = unknown>(
  config: ApiConfig<SecurityDataType> & {
    apiKey: string | null;
  },
) =>
  new Api<SecurityDataType>({
    ...config,
    // this is will fix the issue with passing arrays as search params
    // before: ?project_ids[]=1&project_ids[]=2
    // after: ?project_ids=1,2
    paramsSerializer: (params) => {
      if (!params) return '';

      const parseValue = (val: unknown): string => {
        if (Array.isArray(val)) {
          return val.map((v) => parseValue(v)).join(',');
        }
        if (val instanceof Date) {
          return val.toISOString();
        }
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return String(val);
      };

      const entries = Object.entries(params);
      const transformedEntries = entries
        .filter(([_, val]) => val !== null && typeof val !== 'undefined')
        .map(([key, val]) => [key, parseValue(val)]);

      const searchParams = new URLSearchParams(transformedEntries);
      return searchParams.toString();
    },
    headers: {
      ...config.headers,
      ...(config.apiKey && {
        Authorization: `Bearer ${config.apiKey}`,
      }),
    },
  });
