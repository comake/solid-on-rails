import { OkResponseDescription } from '../../http/output/response/OkResponseDescription';
import type { ResponseDescription } from '../../http/output/response/ResponseDescription';
import { guardedStreamFrom } from '../../util/StreamUtil';
import type { TemplateEngine } from '../../util/templates/TemplateEngine';
import { ParsedRequestHandler } from '../ParsedRequestHandler';

/**
 * Renders a template within a spcified template engine.
 * The template should be a file path.
 */
export class IndexViewHandler extends ParsedRequestHandler {
  private readonly template: string;
  private readonly templateEngine: TemplateEngine;

  public constructor(template: string, templateEngine: TemplateEngine) {
    super();
    this.template = template;
    this.templateEngine = templateEngine;
  }

  public async handle(): Promise<ResponseDescription> {
    const result = await this.templateEngine.render({}, { templateFile: this.template });
    const data = guardedStreamFrom(result);
    return new OkResponseDescription(data);
  }
}
