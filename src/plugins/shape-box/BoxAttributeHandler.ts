import type {
  AttributeHandler,
  AttributeRequest
} from "../../kernel/plugin/AttributeHandler.js";
import { BoxShape } from "./BoxShape.js";

/**
 * Maps box-level domain attributes to required child parts. The handler never
 * touches private fields: BoxShape.setFill / setLabel are public operations.
 */
export class BoxAttributeHandler implements AttributeHandler {
  public readonly name = "box-attributes";
  public readonly priority = 100;

  public handles(request: AttributeRequest): boolean {
    return (
      request.shape instanceof BoxShape &&
      (request.attribute === "fill" || request.attribute === "label")
    );
  }

  public apply(request: AttributeRequest): void {
    const box = request.shape;
    if (!(box instanceof BoxShape)) {
      throw new Error("BoxAttributeHandler received a non-box shape");
    }
    if (request.attribute === "fill") {
      box.setFill(request.value);
      return;
    }
    if (request.attribute === "label") {
      box.setLabel(request.value);
      return;
    }
    throw new Error(`BoxAttributeHandler cannot apply ${request.attribute}`);
  }
}
