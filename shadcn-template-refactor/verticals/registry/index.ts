// Vertical registry — schema consumption, vertical definitions, caching
export { fetchVerticals, fetchVertical, fetchVerticalSchema } from "./api";
export { verticalKeys } from "./keys";
export { useVerticals, useVertical, useVerticalSchema } from "./queries";
export { VerticalRegistry } from "./cache";
export { generateZodSchema } from "./zod";
export {
  groupAttributes,
  getRequiredAttributes,
  getCardDisplayAttributes,
  getDetailDisplayAttributes,
  buildDefaultValues,
  getFilterGroups,
} from "./mappers";
