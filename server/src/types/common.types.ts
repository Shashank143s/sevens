export type Next = () => Promise<void>;

export type JsonBodyContext = {
  request: {
    body?: unknown;
    req: NodeJS.ReadableStream;
  };
};
