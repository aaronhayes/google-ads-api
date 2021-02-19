// Core library client
export { Client as GoogleAdsApi, ClientOptions } from "./client";

// Compiled proto types
export {
  common,
  enums,
  errors,
  resources,
  services,
  longrunning,
  protobuf,
} from "./protos/index";

// Util functions
export { fromMicros, toMicros } from "./utils";
export * as ResourceNames from "./protos/autogen/resourceNames";

// Util types
export {
  CustomerOptions,
  ReportOptions,
  MutateOperation,
  Constraint,
  Constraints,
} from "./types";
export { Resource, Attribute, Metric, Segment } from "./protos/autogen/fields";
export {
  Hooks,
  OnQueryStart,
  OnQueryError,
  OnQueryEnd,
  OnMutationStart,
  OnMutationError,
  OnMutationEnd,
} from "./hooks";
export { Customer } from "./customer";
