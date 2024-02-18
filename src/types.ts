import type { IncomingMessage, ServerResponse } from 'http';

export type HandlerFunction<
  T1 extends Request<Path>,
  T2 extends Response,
  Path,
> = (req: T1, res: T2) => Promise<void> | void;

export type MiddlewareFunction<
  T1 extends Request = Request,
  T2 extends Response = Response,
> = (req: T1, Response: T2, next: () => void) => Promise<void> | void;

export type Request<Path = string> = IncomingMessage & {
  method: string;
  params: RequestParams<Path>;
  route: string;
  splat: string | null;
};

export type Response = ServerResponse;

type RequestParams<Path> = {
  [Key in FilteredParts<Path>]: string;
};

type Param<Part> = Part extends `:${infer ParamName}` ? ParamName : never;

type FilteredParts<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? Param<PartA> | FilteredParts<PartB>
  : Param<Path>;
