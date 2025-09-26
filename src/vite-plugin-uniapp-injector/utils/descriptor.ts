import { MagicString, parse, SFCDescriptor } from '@vue/compiler-sfc';
import {
  generateHtmlCode,
  generateScriptCode,
  generateStyleCode,
  getInsertLabelDom,
  getTemplatePageMeta,
} from './index';

// 定义转换结果类型
interface TransformResult {
  code: string;
  map: object | null;
  errors?: string[];
}

// 定义页面配置接口
interface PageConfig {
  label: string[];
  package?: {
    name: string;
    version?: string;
  };
}

/**
 * 转换 Vue SFC 文件的核心处理器
 * @param id 文件唯一标识符
 * @param content 文件原始内容
 * @param curPage 当前页面配置
 * @returns 转换后的代码、SourceMap和可能的错误信息
 */
export const transformSfc = (id: string, content: string, curPage: PageConfig): TransformResult => {
  // 1. 安全解析 SFC（带错误处理）
  const { descriptor, error } = parseSfcDescriptor(id, content);

  // 如果解析出错，返回原始内容和错误信息
  if (error || !descriptor) {
    return {
      code: content,
      map: null,
      errors: error ? [error] : ['无法解析 SFC 文件'],
    };
  }

  try {
    // 2. 生成 SFC 各部分内容
    const { template, pageMeta, style, scriptSetup, script } = generateSfcParts(descriptor, curPage);

    // 3. 构建转换后的内容（保留特殊 script 标签）
    const transformedContent = buildTransformedContent({
      template,
      pageMeta,
      descriptor,
      style,
      scriptSetup,
      script,
    });

    // 4. 生成 SourceMap
    return generateSourceMap(id, content, transformedContent);
  } catch (err) {
    return {
      code: content,
      map: null,
      errors: [`转换过程出错: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
};

// --- 内部辅助函数 ---

/**
 * 安全解析 SFC 描述符
 */
/**
 * 安全解析 SFC 描述符
 * @param id 文件标识符
 * @param content SFC 文件内容
 * @returns 解析后的描述符或错误信息
 */
const parseSfcDescriptor = (id: string, content: string): { descriptor: SFCDescriptor | null; error?: string } => {
  try {
    return { descriptor: parse(content).descriptor };
  } catch (err) {
    const errorMessage = `[SFC解析错误] ${id}\n错误信息: ${err instanceof Error ? err.message : String(err)}`;
    return { descriptor: null, error: errorMessage };
  }
};

interface SfcParts {
  template: string;
  pageMeta: string;
  style: string | null;
  scriptSetup: string | null;
  script: string | null;
}

/**
 * 生成 SFC 各部分内容
 * @param descriptor SFC 描述符
 * @param curPage 页面配置
 * @returns 处理后的 SFC 各部分内容
 */
const generateSfcParts = (descriptor: SFCDescriptor, curPage: PageConfig): SfcParts => {
  // 提取模板内容
  const templateContent = descriptor.template?.content || '';
  const labelCode = getInsertLabelDom(curPage.label);

  // 并行处理各个部分
  const template = generateHtmlCode(templateContent, labelCode);
  const pageMeta = getTemplatePageMeta(templateContent);
  const style = generateStyleCode(descriptor.styles || []);
  const scriptSetup = descriptor.scriptSetup ? generateScriptCode(descriptor.scriptSetup) : null;
  const script = descriptor.script ? generateScriptCode(descriptor.script) : null;

  return {
    template,
    pageMeta,
    style,
    scriptSetup,
    script,
  };
};

/**
 * 构建最终转换后的内容
 */
interface TransformedContentParams {
  template: string;
  pageMeta: string;
  descriptor: SFCDescriptor;
  style: string | null;
  scriptSetup: string | null;
  script: string | null;
}

const buildTransformedContent = ({
  template,
  pageMeta,
  descriptor,
  style,
  scriptSetup,
  script,
}: TransformedContentParams): string => {
  // 保留特殊 script 标签（wxs/sjs 等）
  const specialScripts = extractSpecialScripts(descriptor);

  // 使用模板字符串数组以提高性能
  const parts = [
    '<template>',
    pageMeta,
    template,
    '</template>',
    specialScripts,
    scriptSetup || '',
    script || '',
    style || '',
  ];

  return parts.join('\n').trim();
};

/**
 * 提取特殊 script 标签（wxs/sjs 等）
 */
const extractSpecialScripts = (descriptor: SFCDescriptor): string => {
  // 从原始内容中提取（因为 descriptor 不会包含这些特殊标签）
  const content = descriptor.source;
  const specialScriptRegex =
    /<script\s+module="[^"]*"\s+lang="(?:wxs|sjs|filter\.js)"(?:\s+src="[^"]*")?\s*(?:\/>|>([\s\S]*?)<\/script>)/g;

  let match;
  const scripts: string[] = [];

  while ((match = specialScriptRegex.exec(content)) !== null) {
    scripts.push(match[0]);
  }

  return scripts.join('\n');
};

/**
 * 生成 SourceMap
 */
const generateSourceMap = (id: string, originalContent: string, transformedContent: string) => {
  const magicString = new MagicString(originalContent);
  magicString.overwrite(0, originalContent.length, transformedContent);

  return {
    code: magicString.toString(),
    map: magicString.generateMap({
      source: id,
      hires: true,
      includeContent: false,
    }),
  };
};
