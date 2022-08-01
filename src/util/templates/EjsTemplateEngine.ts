/* eslint-disable tsdoc/syntax */
// tsdoc/syntax cannot handle `@range`
import type { TemplateFunction } from 'ejs';
import { compile, render } from 'ejs';
import type { PathResolver } from '../path/PathResolver';
import type { TemplateEngine, Template } from './TemplateEngine';
import { getTemplateFilePath, readTemplate } from './TemplateEngine';
import Dict = NodeJS.Dict;

/**
 * Fills in EJS templates.
 */
export class EjsTemplateEngine<T extends Dict<any> = Dict<any>> implements TemplateEngine<T> {
  private readonly applyTemplate: Promise<TemplateFunction>;
  private readonly pathResolver: PathResolver;

  /**
   * @param template - The default template @range {json}
   */
  public constructor(pathResolver: PathResolver, template?: Template) {
    this.pathResolver = pathResolver;
    // EJS requires the `filename` parameter to be able to include partial templates
    const filename = getTemplateFilePath(pathResolver, template);
    this.applyTemplate = readTemplate(pathResolver, template)
      .then((templateString: string): TemplateFunction => compile(templateString, { filename }));
  }

  public async render(contents: T): Promise<string>;
  public async render<TCustom = T>(contents: TCustom, template: Template): Promise<string>;
  public async render<TCustom = T>(contents: TCustom, template?: Template): Promise<string> {
    const options = { ...contents, filename: getTemplateFilePath(this.pathResolver, template) };
    return template
      ? render(await readTemplate(this.pathResolver, template), options)
      : (await this.applyTemplate)(options);
  }
}
