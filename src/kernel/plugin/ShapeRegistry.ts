import type { Shape } from "../../domain/model/Shape.js";
import { UserError } from "../../shared/UserError.js";
import { PluginError } from "./PluginError.js";
import type { ShapeCreateRequest, ShapeProvider, SvgShapeRequest } from "./ShapeProvider.js";

/** Registry for the ShapeProvider extension point. */
export class ShapeRegistry {
  private readonly providers: ShapeProvider[] = [];

  public register(provider: ShapeProvider): void {
    this.assertAvailable(provider.shapeType);
    this.providers.push(provider);
  }

  public assertAvailable(shapeType: string): void {
    if (this.providers.some((provider) => provider.shapeType === shapeType)) {
      throw new PluginError(
        "duplicate-registration",
        `duplicate registration: shapes/${shapeType}`
      );
    }
  }

  public findByType(type: string): ShapeProvider | undefined {
    return this.providers.find((provider) => provider.shapeType === type);
  }

  public createFromCli(request: ShapeCreateRequest): Shape {
    const provider = this.findByType(request.type);
    if (provider === undefined) {
      throw new UserError(`unknown shape type: ${request.type} (is the plugin loaded?)`);
    }
    return provider.createFromCli(request);
  }

  public resolveSvg(
    tag: string,
    attributes: ReadonlyMap<string, string>
  ): ShapeProvider | undefined {
    const matches = this.providers
      .map((provider, index) => ({ provider, index }))
      .filter(({ provider }) => {
        if (!provider.svgTags.includes(tag)) {
          return false;
        }
        return provider.matchesSvg?.(tag, attributes) ?? true;
      })
      .sort((left, right) => {
        const priority = (right.provider.svgPriority ?? 0) - (left.provider.svgPriority ?? 0);
        return priority === 0 ? left.index - right.index : priority;
      });
    return matches[0]?.provider;
  }

  public createFromSvg(request: SvgShapeRequest): Shape {
    const provider = this.resolveSvg(request.tag, request.attributes);
    if (provider === undefined) {
      throw new UserError(`unsupported SVG element: ${request.tag}`);
    }
    return provider.createFromSvg(request);
  }

  public isSupportedSvgTag(tag: string): boolean {
    return this.providers.some((provider) => provider.svgTags.includes(tag));
  }

  public isContainerTag(tag: string): boolean {
    return this.providers.some(
      (provider) => provider.isContainer && provider.svgTags.includes(tag)
    );
  }

  public all(): readonly ShapeProvider[] {
    return this.providers;
  }

  public helpUsages(): readonly string[] {
    return this.providers
      .map((provider) => provider.helpUsage)
      .filter((line): line is string => line !== undefined);
  }
}
