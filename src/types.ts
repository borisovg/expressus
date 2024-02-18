import type { IncomingMessage, ServerResponse } from 'http';

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
