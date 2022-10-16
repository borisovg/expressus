declare module 'http-hash' {
  type Route<Handler, Path> =
    | {
        handler: Handler;
        params: Record<string, string>;
        splat: string | null;
        src: Path;
      }
    | {
        handler: null;
        params: {};
        splat: null;
        src: null;
      };

  function httpHash<Handler, Path = string>(): {
    get(path: Path): Route<Handler, Path>;
    set(path: string, handler: Handler): void;
  };

  export = httpHash;
}
